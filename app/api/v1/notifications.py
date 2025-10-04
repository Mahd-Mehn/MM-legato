from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import json
import asyncio
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.notification_service import NotificationService
from app.schemas.notification import NotificationListResponse, NotificationUpdate

router = APIRouter()

# In-memory store for SSE connections (in production, use Redis)
sse_connections = {}

@router.get("/", response_model=NotificationListResponse)
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user notifications with pagination"""
    notification_service = NotificationService(db)
    return notification_service.get_user_notifications(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        unread_only=unread_only
    )

@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications"""
    notification_service = NotificationService(db)
    count = notification_service.get_unread_count(current_user.id)
    return {"unread_count": count}

@router.put("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a specific notification as read"""
    notification_service = NotificationService(db)
    notification = notification_service.mark_as_read(notification_id, current_user.id)
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Send SSE update
    await send_sse_update(current_user.id, {
        "type": "notification_read",
        "notification_id": notification_id
    })
    
    return {"message": "Notification marked as read"}

@router.put("/mark-all-read")
async def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    notification_service = NotificationService(db)
    updated_count = notification_service.mark_all_as_read(current_user.id)
    
    # Send SSE update
    await send_sse_update(current_user.id, {
        "type": "all_notifications_read",
        "updated_count": updated_count
    })
    
    return {"message": f"Marked {updated_count} notifications as read"}

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    notification_service = NotificationService(db)
    deleted = notification_service.delete_notification(notification_id, current_user.id)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Send SSE update
    await send_sse_update(current_user.id, {
        "type": "notification_deleted",
        "notification_id": notification_id
    })
    
    return {"message": "Notification deleted"}

@router.get("/stream")
async def notification_stream(
    token: str = Query(None),
    db: Session = Depends(get_db)
):
    """Server-Sent Events stream for real-time notifications"""
    
    # Authenticate user via token
    if not token:
        raise HTTPException(status_code=401, detail="Token required for SSE")
    
    try:
        from app.core.security import verify_token
        from app.services.auth_service import AuthService
        
        payload = verify_token(token)
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        current_user = AuthService.get_user_by_email(db, email)
        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")
            
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")
    
    async def event_generator():
        # Add connection to store
        user_id = current_user.id
        if user_id not in sse_connections:
            sse_connections[user_id] = []
        
        # Create a queue for this connection
        queue = asyncio.Queue()
        sse_connections[user_id].append(queue)
        
        try:
            # Send initial connection message
            yield f"data: {json.dumps({'type': 'connected', 'message': 'Connected to notification stream'})}\n\n"
            
            # Listen for events
            while True:
                try:
                    # Wait for new events with timeout
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    # Send heartbeat to keep connection alive
                    yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
                    
        except asyncio.CancelledError:
            # Clean up connection
            if user_id in sse_connections and queue in sse_connections[user_id]:
                sse_connections[user_id].remove(queue)
                if not sse_connections[user_id]:
                    del sse_connections[user_id]
            raise
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )

async def send_sse_update(user_id: str, event_data: dict):
    """Send SSE update to all connections for a user"""
    if user_id in sse_connections:
        for queue in sse_connections[user_id]:
            try:
                await queue.put(event_data)
            except:
                # Remove broken connections
                sse_connections[user_id].remove(queue)

# Helper function to send new notification via SSE
async def send_new_notification_sse(user_id: str, notification_data: dict):
    """Send new notification via SSE"""
    await send_sse_update(user_id, {
        "type": "new_notification",
        "notification": notification_data
    })