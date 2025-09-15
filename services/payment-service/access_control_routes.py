from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import uuid
import logging

from database import get_db
from access_control_service import AccessControlService, ContentAccessType, SubscriptionTier
from schemas import SpendCoinsRequest, TipRequest

logger = logging.getLogger(__name__)
router = APIRouter()

# Dependency to get access control service
def get_access_control_service(db: Session = Depends(get_db)) -> AccessControlService:
    return AccessControlService(db)

# Content Access Control Endpoints
@router.get("/users/{user_id}/content/{content_id}/access")
async def check_content_access(
    user_id: uuid.UUID,
    content_id: uuid.UUID,
    content_type: str = Query("chapter", description="Type of content (chapter, story, exclusive_content)"),
    access_service: AccessControlService = Depends(get_access_control_service)
):
    """Check if user has access to premium content"""
    try:
        access_result = access_service.check_content_access(user_id, content_id, content_type)
        return access_result
    except Exception as e:
        logger.error(f"Error checking content access: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{user_id}/content/{content_id}/purchase")
async def purchase_content_access(
    user_id: uuid.UUID,
    content_id: uuid.UUID,
    content_type: str = Query("chapter", description="Type of content (chapter, story, exclusive_content)"),
    access_service: AccessControlService = Depends(get_access_control_service)
):
    """Purchase access to premium content using coins"""
    try:
        purchase_result = access_service.purchase_content_access(user_id, content_id, content_type)
        
        if not purchase_result["success"]:
            if purchase_result.get("error") == "insufficient_coins":
                raise HTTPException(
                    status_code=400, 
                    detail={
                        "error": "insufficient_coins",
                        "message": purchase_result["message"],
                        "required_coins": purchase_result["required_coins"],
                        "user_balance": purchase_result["user_balance"],
                        "coins_needed": purchase_result["coins_needed"]
                    }
                )
            else:
                raise HTTPException(status_code=400, detail=purchase_result)
        
        return purchase_result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error purchasing content access: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{user_id}/content/{content_id}/subscription-access")
async def validate_subscription_access(
    user_id: uuid.UUID,
    content_id: uuid.UUID,
    required_tier: SubscriptionTier,
    access_service: AccessControlService = Depends(get_access_control_service)
):
    """Validate subscription-based content access"""
    try:
        validation_result = access_service.validate_subscription_access(user_id, content_id, required_tier)
        
        if not validation_result["has_access"]:
            error_detail = {
                "error": validation_result.get("error", "access_denied"),
                "message": validation_result.get("message", "Access denied"),
                "required_tier": validation_result["required_tier"],
                "user_tier": validation_result["user_tier"],
                "subscription_active": validation_result["subscription_active"]
            }
            raise HTTPException(status_code=403, detail=error_detail)
        
        return validation_result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating subscription access: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Tipping and Gift-Giving Endpoints
@router.post("/users/{sender_id}/tip")
async def send_tip(
    sender_id: uuid.UUID,
    tip_request: TipRequest,
    access_service: AccessControlService = Depends(get_access_control_service)
):
    """Send tip to another user"""
    try:
        tip_result = access_service.process_tip_transaction(sender_id, tip_request.recipient_user_id, tip_request)
        
        if not tip_result["success"]:
            if tip_result.get("error") == "insufficient_coins":
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "insufficient_coins",
                        "message": tip_result["message"],
                        "sender_balance": tip_result["sender_balance"],
                        "tip_amount": tip_result["tip_amount"]
                    }
                )
            else:
                raise HTTPException(status_code=400, detail=tip_result)
        
        return tip_result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending tip: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# User Purchase History and Analytics
@router.get("/users/{user_id}/purchases")
async def get_user_content_purchases(
    user_id: uuid.UUID,
    limit: int = Query(50, ge=1, le=100, description="Maximum number of purchases to return"),
    access_service: AccessControlService = Depends(get_access_control_service)
):
    """Get user's content purchase history"""
    try:
        purchases = access_service.get_user_content_purchases(user_id, limit)
        return {
            "user_id": user_id,
            "purchases_count": len(purchases),
            "purchases": purchases
        }
    except Exception as e:
        logger.error(f"Error getting user content purchases: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Content Revenue Analytics
@router.get("/content/{content_id}/analytics")
async def get_content_revenue_analytics(
    content_id: uuid.UUID,
    period_days: int = Query(30, ge=1, le=365, description="Number of days for analytics period"),
    access_service: AccessControlService = Depends(get_access_control_service)
):
    """Get revenue analytics for specific content"""
    try:
        analytics = access_service.get_content_revenue_analytics(content_id, period_days)
        return analytics
    except Exception as e:
        logger.error(f"Error getting content revenue analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Bulk Content Access Check
@router.post("/users/{user_id}/content/bulk-access-check")
async def bulk_content_access_check(
    user_id: uuid.UUID,
    content_ids: List[uuid.UUID],
    content_type: str = Query("chapter", description="Type of content"),
    access_service: AccessControlService = Depends(get_access_control_service)
):
    """Check access to multiple content items at once"""
    try:
        if len(content_ids) > 100:
            raise HTTPException(status_code=400, detail="Maximum 100 content items per request")
        
        access_results = []
        for content_id in content_ids:
            try:
                access_result = access_service.check_content_access(user_id, content_id, content_type)
                access_results.append(access_result)
            except Exception as e:
                logger.error(f"Error checking access for content {content_id}: {e}")
                access_results.append({
                    "content_id": content_id,
                    "error": "check_failed",
                    "message": str(e)
                })
        
        return {
            "user_id": user_id,
            "content_type": content_type,
            "results": access_results,
            "summary": {
                "total_checked": len(content_ids),
                "accessible": len([r for r in access_results if r.get("has_access", False)]),
                "requires_purchase": len([r for r in access_results if not r.get("has_access", False) and not r.get("error")])
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in bulk content access check: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Content Access Gates Configuration
@router.get("/content-pricing")
async def get_content_pricing_config(
    access_service: AccessControlService = Depends(get_access_control_service)
):
    """Get content pricing configuration"""
    try:
        return {
            "pricing_config": access_service.DEFAULT_PRICING,
            "subscription_tiers": {
                "basic": {
                    "name": "Basic",
                    "price_usd": 9.99,
                    "features": ["Access to basic content", "No ads"]
                },
                "premium": {
                    "name": "Premium", 
                    "price_usd": 19.99,
                    "features": ["Access to all content", "Exclusive stories", "Early access", "No ads"]
                },
                "vip": {
                    "name": "VIP",
                    "price_usd": 39.99,
                    "features": ["All Premium features", "VIP-only content", "Direct author access", "Priority support"]
                }
            },
            "coin_value": {
                "usd_per_coin": 0.01,
                "description": "1 coin = $0.01 USD"
            }
        }
    except Exception as e:
        logger.error(f"Error getting content pricing config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Revenue Tracking per Content
@router.get("/content/{content_id}/revenue-summary")
async def get_content_revenue_summary(
    content_id: uuid.UUID,
    access_service: AccessControlService = Depends(get_access_control_service)
):
    """Get revenue summary for content across different time periods"""
    try:
        # Get analytics for different periods
        periods = [7, 30, 90, 365]
        revenue_summary = {}
        
        for period in periods:
            analytics = access_service.get_content_revenue_analytics(content_id, period)
            revenue_summary[f"last_{period}_days"] = {
                "total_purchases": analytics["total_purchases"],
                "total_coins_earned": analytics["total_coins_earned"],
                "total_revenue_usd": analytics["total_revenue_usd"],
                "unique_purchasers": analytics["unique_purchasers"]
            }
        
        return {
            "content_id": content_id,
            "revenue_by_period": revenue_summary,
            "generated_at": access_service.db.execute("SELECT datetime('now')").scalar()
        }
    except Exception as e:
        logger.error(f"Error getting content revenue summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Access Control Statistics
@router.get("/statistics/access-control")
async def get_access_control_statistics(
    period_days: int = Query(30, ge=1, le=365),
    access_service: AccessControlService = Depends(get_access_control_service)
):
    """Get access control statistics for the platform"""
    try:
        from datetime import datetime, timedelta
        from models import Transaction, TransactionType, TransactionStatus
        
        period_start = datetime.utcnow() - timedelta(days=period_days)
        
        # Get content purchase statistics
        content_purchases = (
            access_service.db.query(Transaction)
            .filter(Transaction.transaction_type == TransactionType.COIN_SPEND)
            .filter(Transaction.status == TransactionStatus.COMPLETED)
            .filter(Transaction.related_content_id.isnot(None))
            .filter(Transaction.completed_at >= period_start)
            .all()
        )
        
        # Get tip statistics
        tips = (
            access_service.db.query(Transaction)
            .filter(Transaction.transaction_type == TransactionType.TIP)
            .filter(Transaction.status == TransactionStatus.COMPLETED)
            .filter(Transaction.completed_at >= period_start)
            .all()
        )
        
        # Calculate statistics
        total_content_purchases = len(content_purchases)
        total_coins_spent_on_content = sum(abs(t.coin_amount) for t in content_purchases)
        unique_content_buyers = len(set(t.user_id for t in content_purchases))
        unique_content_items = len(set(t.related_content_id for t in content_purchases))
        
        total_tips = len([t for t in tips if t.coin_amount > 0])  # Only count positive tips (sent)
        total_coins_tipped = sum(t.coin_amount for t in tips if t.coin_amount > 0)
        unique_tippers = len(set(t.user_id for t in tips if t.coin_amount > 0))
        unique_tip_recipients = len(set(t.user_id for t in tips if t.coin_amount < 0))
        
        return {
            "period_days": period_days,
            "period_start": period_start,
            "content_purchases": {
                "total_purchases": total_content_purchases,
                "total_coins_spent": total_coins_spent_on_content,
                "total_revenue_usd": total_coins_spent_on_content * 0.01,
                "unique_buyers": unique_content_buyers,
                "unique_content_items": unique_content_items,
                "average_coins_per_purchase": total_coins_spent_on_content / total_content_purchases if total_content_purchases > 0 else 0
            },
            "tipping": {
                "total_tips": total_tips,
                "total_coins_tipped": total_coins_tipped,
                "total_tip_value_usd": total_coins_tipped * 0.01,
                "unique_tippers": unique_tippers,
                "unique_recipients": unique_tip_recipients,
                "average_tip_size": total_coins_tipped / total_tips if total_tips > 0 else 0
            },
            "engagement": {
                "content_purchase_rate": unique_content_buyers / max(unique_content_buyers + unique_tippers, 1),
                "tipping_rate": unique_tippers / max(unique_content_buyers + unique_tippers, 1),
                "repeat_purchase_rate": (total_content_purchases - unique_content_buyers) / max(unique_content_buyers, 1)
            }
        }
    except Exception as e:
        logger.error(f"Error getting access control statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))