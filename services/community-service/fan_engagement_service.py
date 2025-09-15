"""
Fan engagement service for fan clubs, exclusive content, and direct messaging
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, asc, func
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
import uuid
import logging

from database import SessionLocal
from models import (
    FanClub, FanClubMembership, ExclusiveContent, ExclusiveContentInteraction,
    DirectMessage, ExclusiveEvent, EventRegistration, EarlyAccessContent,
    FanClubTier, ExclusiveContentType, DirectMessageStatus, ExclusiveEventType
)
from schemas import (
    FanClubCreateRequest, FanClubUpdateRequest, FanClubMembershipRequest,
    ExclusiveContentCreateRequest, DirectMessageCreateRequest,
    ExclusiveEventCreateRequest, EventRegistrationRequest,
    EarlyAccessContentRequest
)

logger = logging.getLogger(__name__)

class FanEngagementService:
    """Service for managing fan clubs and exclusive content"""
    
    def __init__(self):
        self.db = SessionLocal()
    
    # Fan Club Management
    
    def create_fan_club(self, writer_id: str, request: FanClubCreateRequest) -> FanClub:
        """Create a new fan club for a writer"""
        try:
            # Check if writer already has a fan club
            existing_club = self.db.query(FanClub).filter(
                FanClub.writer_id == writer_id
            ).first()
            
            if existing_club:
                raise ValueError("Writer already has a fan club")
            
            fan_club = FanClub(
                writer_id=writer_id,
                name=request.name,
                description=request.description,
                banner_url=request.banner_url,
                tiers=request.tiers,
                auto_accept_members=request.auto_accept_members,
                welcome_message=request.welcome_message
            )
            
            self.db.add(fan_club)
            self.db.commit()
            self.db.refresh(fan_club)
            
            logger.info(f"Created fan club {fan_club.id} for writer {writer_id}")
            return fan_club
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating fan club: {e}")
            raise
    
    def update_fan_club(self, fan_club_id: str, writer_id: str, request: FanClubUpdateRequest) -> FanClub:
        """Update fan club details"""
        try:
            fan_club = self.db.query(FanClub).filter(
                and_(FanClub.id == fan_club_id, FanClub.writer_id == writer_id)
            ).first()
            
            if not fan_club:
                raise ValueError("Fan club not found or access denied")
            
            # Update fields if provided
            if request.name is not None:
                fan_club.name = request.name
            if request.description is not None:
                fan_club.description = request.description
            if request.banner_url is not None:
                fan_club.banner_url = request.banner_url
            if request.tiers is not None:
                fan_club.tiers = request.tiers
            if request.auto_accept_members is not None:
                fan_club.auto_accept_members = request.auto_accept_members
            if request.welcome_message is not None:
                fan_club.welcome_message = request.welcome_message
            if request.is_active is not None:
                fan_club.is_active = request.is_active
            
            self.db.commit()
            self.db.refresh(fan_club)
            
            logger.info(f"Updated fan club {fan_club_id}")
            return fan_club
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating fan club: {e}")
            raise
    
    def get_fan_club(self, fan_club_id: str, user_id: Optional[str] = None) -> Optional[FanClub]:
        """Get fan club details with optional user membership info"""
        try:
            query = self.db.query(FanClub).filter(FanClub.id == fan_club_id)
            
            if user_id:
                query = query.options(
                    joinedload(FanClub.memberships).filter(
                        FanClubMembership.user_id == user_id
                    )
                )
            
            return query.first()
            
        except Exception as e:
            logger.error(f"Error getting fan club: {e}")
            raise
    
    def get_writer_fan_club(self, writer_id: str) -> Optional[FanClub]:
        """Get fan club for a specific writer"""
        try:
            return self.db.query(FanClub).filter(
                FanClub.writer_id == writer_id
            ).first()
            
        except Exception as e:
            logger.error(f"Error getting writer fan club: {e}")
            raise
    
    def list_fan_clubs(self, page: int = 1, per_page: int = 20, 
                      writer_id: Optional[str] = None, is_active: Optional[bool] = None,
                      min_members: Optional[int] = None, sort_by: str = "created_at",
                      sort_order: str = "desc") -> Tuple[List[FanClub], int]:
        """List fan clubs with filtering and pagination"""
        try:
            query = self.db.query(FanClub)
            
            # Apply filters
            if writer_id:
                query = query.filter(FanClub.writer_id == writer_id)
            if is_active is not None:
                query = query.filter(FanClub.is_active == is_active)
            if min_members:
                query = query.filter(FanClub.total_members >= min_members)
            
            # Apply sorting
            sort_column = getattr(FanClub, sort_by, FanClub.created_at)
            if sort_order == "desc":
                query = query.order_by(desc(sort_column))
            else:
                query = query.order_by(asc(sort_column))
            
            # Get total count
            total = query.count()
            
            # Apply pagination
            offset = (page - 1) * per_page
            fan_clubs = query.offset(offset).limit(per_page).all()
            
            return fan_clubs, total
            
        except Exception as e:
            logger.error(f"Error listing fan clubs: {e}")
            raise
    
    # Fan Club Membership Management
    
    def join_fan_club(self, fan_club_id: str, user_id: str, request: FanClubMembershipRequest) -> FanClubMembership:
        """Join a fan club with specified tier"""
        try:
            # Check if user is already a member
            existing_membership = self.db.query(FanClubMembership).filter(
                and_(
                    FanClubMembership.fan_club_id == fan_club_id,
                    FanClubMembership.user_id == user_id,
                    FanClubMembership.status == "active"
                )
            ).first()
            
            if existing_membership:
                raise ValueError("User is already a member of this fan club")
            
            # Get fan club and validate tier
            fan_club = self.db.query(FanClub).filter(FanClub.id == fan_club_id).first()
            if not fan_club or not fan_club.is_active:
                raise ValueError("Fan club not found or inactive")
            
            # Validate tier exists in fan club configuration
            if request.tier not in fan_club.tiers:
                raise ValueError("Invalid membership tier")
            
            tier_config = fan_club.tiers[request.tier]
            monthly_fee = tier_config.get("monthly_fee", 0)
            
            # Create membership
            membership = FanClubMembership(
                fan_club_id=fan_club_id,
                user_id=user_id,
                tier=FanClubTier(request.tier),
                monthly_fee=monthly_fee,
                next_billing_date=datetime.utcnow() + timedelta(days=30),
                auto_renew=request.auto_renew,
                payment_method_id=request.payment_method_id
            )
            
            self.db.add(membership)
            
            # Update fan club member count
            fan_club.total_members += 1
            
            self.db.commit()
            self.db.refresh(membership)
            
            logger.info(f"User {user_id} joined fan club {fan_club_id} with tier {request.tier}")
            return membership
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error joining fan club: {e}")
            raise
    
    def update_membership(self, membership_id: str, user_id: str, **updates) -> FanClubMembership:
        """Update fan club membership"""
        try:
            membership = self.db.query(FanClubMembership).filter(
                and_(
                    FanClubMembership.id == membership_id,
                    FanClubMembership.user_id == user_id
                )
            ).first()
            
            if not membership:
                raise ValueError("Membership not found")
            
            # Update allowed fields
            for field, value in updates.items():
                if hasattr(membership, field):
                    setattr(membership, field, value)
            
            self.db.commit()
            self.db.refresh(membership)
            
            return membership
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating membership: {e}")
            raise
    
    def cancel_membership(self, membership_id: str, user_id: str) -> FanClubMembership:
        """Cancel fan club membership"""
        try:
            membership = self.db.query(FanClubMembership).filter(
                and_(
                    FanClubMembership.id == membership_id,
                    FanClubMembership.user_id == user_id
                )
            ).first()
            
            if not membership:
                raise ValueError("Membership not found")
            
            membership.status = "cancelled"
            membership.cancelled_at = datetime.utcnow()
            membership.auto_renew = False
            
            # Update fan club member count
            fan_club = self.db.query(FanClub).filter(FanClub.id == membership.fan_club_id).first()
            if fan_club:
                fan_club.total_members = max(0, fan_club.total_members - 1)
            
            self.db.commit()
            self.db.refresh(membership)
            
            logger.info(f"Cancelled membership {membership_id}")
            return membership
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error cancelling membership: {e}")
            raise
    
    def get_user_memberships(self, user_id: str) -> List[FanClubMembership]:
        """Get all fan club memberships for a user"""
        try:
            return self.db.query(FanClubMembership).filter(
                FanClubMembership.user_id == user_id
            ).options(joinedload(FanClubMembership.fan_club)).all()
            
        except Exception as e:
            logger.error(f"Error getting user memberships: {e}")
            raise
    
    def check_membership_access(self, user_id: str, fan_club_id: str, required_tier: str = "bronze") -> bool:
        """Check if user has required membership tier access"""
        try:
            membership = self.db.query(FanClubMembership).filter(
                and_(
                    FanClubMembership.user_id == user_id,
                    FanClubMembership.fan_club_id == fan_club_id,
                    FanClubMembership.status == "active"
                )
            ).first()
            
            if not membership:
                return False
            
            # Define tier hierarchy
            tier_levels = {
                "bronze": 1,
                "silver": 2,
                "gold": 3,
                "platinum": 4,
                "diamond": 5
            }
            
            user_tier_level = tier_levels.get(membership.tier.value, 0)
            required_tier_level = tier_levels.get(required_tier, 1)
            
            return user_tier_level >= required_tier_level
            
        except Exception as e:
            logger.error(f"Error checking membership access: {e}")
            return False    

    # Exclusive Content Management
    
    def create_exclusive_content(self, fan_club_id: str, writer_id: str, request: ExclusiveContentCreateRequest) -> ExclusiveContent:
        """Create exclusive content for fan club members"""
        try:
            # Verify writer owns the fan club
            fan_club = self.db.query(FanClub).filter(
                and_(FanClub.id == fan_club_id, FanClub.writer_id == writer_id)
            ).first()
            
            if not fan_club:
                raise ValueError("Fan club not found or access denied")
            
            content = ExclusiveContent(
                fan_club_id=fan_club_id,
                title=request.title,
                description=request.description,
                content_type=ExclusiveContentType(request.content_type),
                content_url=request.content_url,
                content_text=request.content_text,
                content_data=request.content_data,
                required_tier=FanClubTier(request.required_tier),
                is_early_access=request.is_early_access,
                early_access_hours=request.early_access_hours,
                story_id=request.story_id,
                chapter_id=request.chapter_id,
                is_featured=request.is_featured
            )
            
            # Set publication timing for early access
            if request.is_early_access and request.early_access_hours > 0:
                content.published_at = datetime.utcnow()
                content.public_release_at = datetime.utcnow() + timedelta(hours=request.early_access_hours)
                content.is_published = True
            
            self.db.add(content)
            self.db.commit()
            self.db.refresh(content)
            
            logger.info(f"Created exclusive content {content.id} for fan club {fan_club_id}")
            return content
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating exclusive content: {e}")
            raise
    
    def publish_exclusive_content(self, content_id: str, writer_id: str) -> ExclusiveContent:
        """Publish exclusive content"""
        try:
            content = self.db.query(ExclusiveContent).join(FanClub).filter(
                and_(
                    ExclusiveContent.id == content_id,
                    FanClub.writer_id == writer_id
                )
            ).first()
            
            if not content:
                raise ValueError("Content not found or access denied")
            
            content.is_published = True
            content.published_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(content)
            
            logger.info(f"Published exclusive content {content_id}")
            return content
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error publishing exclusive content: {e}")
            raise
    
    def get_exclusive_content(self, content_id: str, user_id: Optional[str] = None) -> Optional[ExclusiveContent]:
        """Get exclusive content with user interaction data"""
        try:
            query = self.db.query(ExclusiveContent).filter(ExclusiveContent.id == content_id)
            
            if user_id:
                query = query.options(
                    joinedload(ExclusiveContent.interactions).filter(
                        ExclusiveContentInteraction.user_id == user_id
                    )
                )
            
            return query.first()
            
        except Exception as e:
            logger.error(f"Error getting exclusive content: {e}")
            raise
    
    def list_exclusive_content(self, fan_club_id: str, user_id: Optional[str] = None,
                             page: int = 1, per_page: int = 20, **filters) -> Tuple[List[ExclusiveContent], int]:
        """List exclusive content with access control"""
        try:
            query = self.db.query(ExclusiveContent).filter(
                ExclusiveContent.fan_club_id == fan_club_id
            )
            
            # Apply filters
            if filters.get("content_type"):
                query = query.filter(ExclusiveContent.content_type == filters["content_type"])
            if filters.get("required_tier"):
                query = query.filter(ExclusiveContent.required_tier == filters["required_tier"])
            if filters.get("is_published") is not None:
                query = query.filter(ExclusiveContent.is_published == filters["is_published"])
            if filters.get("is_early_access") is not None:
                query = query.filter(ExclusiveContent.is_early_access == filters["is_early_access"])
            if filters.get("is_featured") is not None:
                query = query.filter(ExclusiveContent.is_featured == filters["is_featured"])
            
            # Check user access if provided
            if user_id:
                # Filter content based on user's membership tier
                membership = self.db.query(FanClubMembership).filter(
                    and_(
                        FanClubMembership.user_id == user_id,
                        FanClubMembership.fan_club_id == fan_club_id,
                        FanClubMembership.status == "active"
                    )
                ).first()
                
                if membership:
                    tier_levels = {"bronze": 1, "silver": 2, "gold": 3, "platinum": 4, "diamond": 5}
                    user_tier_level = tier_levels.get(membership.tier.value, 0)
                    
                    # Filter content user can access
                    accessible_tiers = [tier for tier, level in tier_levels.items() if level <= user_tier_level]
                    query = query.filter(ExclusiveContent.required_tier.in_(accessible_tiers))
                else:
                    # User is not a member, return empty result
                    return [], 0
            
            # Apply sorting
            sort_by = filters.get("sort_by", "created_at")
            sort_order = filters.get("sort_order", "desc")
            sort_column = getattr(ExclusiveContent, sort_by, ExclusiveContent.created_at)
            
            if sort_order == "desc":
                query = query.order_by(desc(sort_column))
            else:
                query = query.order_by(asc(sort_column))
            
            # Get total count
            total = query.count()
            
            # Apply pagination
            offset = (page - 1) * per_page
            content = query.offset(offset).limit(per_page).all()
            
            return content, total
            
        except Exception as e:
            logger.error(f"Error listing exclusive content: {e}")
            raise
    
    def interact_with_content(self, content_id: str, user_id: str, interaction_type: str) -> ExclusiveContentInteraction:
        """Record user interaction with exclusive content"""
        try:
            # Get or create interaction record
            interaction = self.db.query(ExclusiveContentInteraction).filter(
                and_(
                    ExclusiveContentInteraction.content_id == content_id,
                    ExclusiveContentInteraction.user_id == user_id
                )
            ).first()
            
            if not interaction:
                interaction = ExclusiveContentInteraction(
                    content_id=content_id,
                    user_id=user_id
                )
                self.db.add(interaction)
            
            # Update interaction based on type
            if interaction_type == "view":
                if not interaction.has_viewed:
                    interaction.has_viewed = True
                    interaction.first_viewed_at = datetime.utcnow()
                interaction.last_viewed_at = datetime.utcnow()
                
                # Update content view count
                content = self.db.query(ExclusiveContent).filter(ExclusiveContent.id == content_id).first()
                if content:
                    content.view_count += 1
                    
            elif interaction_type == "like":
                if not interaction.has_liked:
                    interaction.has_liked = True
                    interaction.liked_at = datetime.utcnow()
                    
                    # Update content like count
                    content = self.db.query(ExclusiveContent).filter(ExclusiveContent.id == content_id).first()
                    if content:
                        content.like_count += 1
                        
            elif interaction_type == "unlike":
                if interaction.has_liked:
                    interaction.has_liked = False
                    interaction.liked_at = None
                    
                    # Update content like count
                    content = self.db.query(ExclusiveContent).filter(ExclusiveContent.id == content_id).first()
                    if content:
                        content.like_count = max(0, content.like_count - 1)
            
            self.db.commit()
            self.db.refresh(interaction)
            
            return interaction
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error recording content interaction: {e}")
            raise
    
    # Direct Messaging
    
    def send_direct_message(self, sender_id: str, request: DirectMessageCreateRequest) -> DirectMessage:
        """Send direct message between writer and fan club member"""
        try:
            # Verify sender has permission to send messages
            if request.is_fan_club_exclusive:
                # Check if sender is writer or recipient is fan club member
                fan_club = self.db.query(FanClub).filter(FanClub.writer_id == sender_id).first()
                if fan_club:
                    # Sender is writer, verify recipient is member
                    membership = self.db.query(FanClubMembership).filter(
                        and_(
                            FanClubMembership.fan_club_id == fan_club.id,
                            FanClubMembership.user_id == request.recipient_id,
                            FanClubMembership.status == "active",
                            FanClubMembership.direct_messaging_enabled == True
                        )
                    ).first()
                    
                    if not membership:
                        raise ValueError("Recipient is not an eligible fan club member")
                else:
                    # Sender is not writer, check if they're a member who can message writer
                    membership = self.db.query(FanClubMembership).join(FanClub).filter(
                        and_(
                            FanClub.writer_id == request.recipient_id,
                            FanClubMembership.user_id == sender_id,
                            FanClubMembership.status == "active",
                            FanClubMembership.direct_messaging_enabled == True
                        )
                    ).first()
                    
                    if not membership:
                        raise ValueError("Sender does not have messaging privileges")
            
            # Generate thread ID if not provided
            thread_id = request.thread_id
            if not thread_id and request.reply_to_id:
                parent_message = self.db.query(DirectMessage).filter(
                    DirectMessage.id == request.reply_to_id
                ).first()
                if parent_message:
                    thread_id = parent_message.thread_id or parent_message.id
            elif not thread_id:
                thread_id = str(uuid.uuid4())
            
            message = DirectMessage(
                sender_id=sender_id,
                recipient_id=request.recipient_id,
                subject=request.subject,
                content=request.content,
                message_type=request.message_type,
                attachment_url=request.attachment_url,
                attachment_type=request.attachment_type,
                thread_id=thread_id,
                reply_to_id=request.reply_to_id,
                is_fan_club_exclusive=request.is_fan_club_exclusive
            )
            
            self.db.add(message)
            self.db.commit()
            self.db.refresh(message)
            
            logger.info(f"Sent direct message from {sender_id} to {request.recipient_id}")
            return message
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error sending direct message: {e}")
            raise
    
    def get_user_messages(self, user_id: str, page: int = 1, per_page: int = 20,
                         thread_id: Optional[str] = None, **filters) -> Tuple[List[DirectMessage], int]:
        """Get messages for a user with filtering"""
        try:
            query = self.db.query(DirectMessage).filter(
                or_(
                    DirectMessage.sender_id == user_id,
                    DirectMessage.recipient_id == user_id
                )
            )
            
            # Apply filters
            if thread_id:
                query = query.filter(DirectMessage.thread_id == thread_id)
            if filters.get("sender_id"):
                query = query.filter(DirectMessage.sender_id == filters["sender_id"])
            if filters.get("recipient_id"):
                query = query.filter(DirectMessage.recipient_id == filters["recipient_id"])
            if filters.get("status"):
                query = query.filter(DirectMessage.status == filters["status"])
            if filters.get("is_fan_club_exclusive") is not None:
                query = query.filter(DirectMessage.is_fan_club_exclusive == filters["is_fan_club_exclusive"])
            
            # Apply sorting
            sort_by = filters.get("sort_by", "sent_at")
            sort_order = filters.get("sort_order", "desc")
            sort_column = getattr(DirectMessage, sort_by, DirectMessage.sent_at)
            
            if sort_order == "desc":
                query = query.order_by(desc(sort_column))
            else:
                query = query.order_by(asc(sort_column))
            
            # Get total count
            total = query.count()
            
            # Apply pagination
            offset = (page - 1) * per_page
            messages = query.offset(offset).limit(per_page).all()
            
            return messages, total
            
        except Exception as e:
            logger.error(f"Error getting user messages: {e}")
            raise
    
    def mark_message_read(self, message_id: str, user_id: str) -> DirectMessage:
        """Mark message as read"""
        try:
            message = self.db.query(DirectMessage).filter(
                and_(
                    DirectMessage.id == message_id,
                    DirectMessage.recipient_id == user_id
                )
            ).first()
            
            if not message:
                raise ValueError("Message not found or access denied")
            
            if message.status == DirectMessageStatus.SENT:
                message.status = DirectMessageStatus.READ
                message.read_at = datetime.utcnow()
                
                self.db.commit()
                self.db.refresh(message)
            
            return message
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error marking message as read: {e}")
            raise   
 
    # Exclusive Events Management
    
    def create_exclusive_event(self, fan_club_id: str, writer_id: str, request: ExclusiveEventCreateRequest) -> ExclusiveEvent:
        """Create exclusive event for fan club members"""
        try:
            # Verify writer owns the fan club
            fan_club = self.db.query(FanClub).filter(
                and_(FanClub.id == fan_club_id, FanClub.writer_id == writer_id)
            ).first()
            
            if not fan_club:
                raise ValueError("Fan club not found or access denied")
            
            event = ExclusiveEvent(
                fan_club_id=fan_club_id,
                title=request.title,
                description=request.description,
                event_type=ExclusiveEventType(request.event_type),
                required_tier=FanClubTier(request.required_tier),
                max_participants=request.max_participants,
                starts_at=request.starts_at,
                ends_at=request.ends_at,
                timezone=request.timezone,
                location_type=request.location_type,
                access_url=request.access_url,
                location_details=request.location_details,
                is_recurring=request.is_recurring,
                recurrence_pattern=request.recurrence_pattern,
                requires_registration=request.requires_registration,
                registration_deadline=request.registration_deadline,
                event_data=request.event_data
            )
            
            self.db.add(event)
            self.db.commit()
            self.db.refresh(event)
            
            logger.info(f"Created exclusive event {event.id} for fan club {fan_club_id}")
            return event
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating exclusive event: {e}")
            raise
    
    def register_for_event(self, event_id: str, user_id: str, request: EventRegistrationRequest) -> EventRegistration:
        """Register user for exclusive event"""
        try:
            # Get event and verify access
            event = self.db.query(ExclusiveEvent).join(FanClub).filter(
                ExclusiveEvent.id == event_id
            ).first()
            
            if not event:
                raise ValueError("Event not found")
            
            # Check if user has required membership tier
            if not self.check_membership_access(user_id, event.fan_club_id, event.required_tier.value):
                raise ValueError("Insufficient membership tier for this event")
            
            # Check registration deadline
            if event.registration_deadline and datetime.utcnow() > event.registration_deadline:
                raise ValueError("Registration deadline has passed")
            
            # Check if event is full
            if event.max_participants:
                current_registrations = self.db.query(EventRegistration).filter(
                    and_(
                        EventRegistration.event_id == event_id,
                        EventRegistration.status == "registered"
                    )
                ).count()
                
                if current_registrations >= event.max_participants:
                    raise ValueError("Event is full")
            
            # Check if user is already registered
            existing_registration = self.db.query(EventRegistration).filter(
                and_(
                    EventRegistration.event_id == event_id,
                    EventRegistration.user_id == user_id
                )
            ).first()
            
            if existing_registration:
                if existing_registration.status == "registered":
                    raise ValueError("User is already registered for this event")
                else:
                    # Reactivate cancelled registration
                    existing_registration.status = "registered"
                    existing_registration.registration_data = request.registration_data
                    self.db.commit()
                    self.db.refresh(existing_registration)
                    return existing_registration
            
            # Create new registration
            registration = EventRegistration(
                event_id=event_id,
                user_id=user_id,
                registration_data=request.registration_data
            )
            
            self.db.add(registration)
            self.db.commit()
            self.db.refresh(registration)
            
            logger.info(f"User {user_id} registered for event {event_id}")
            return registration
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error registering for event: {e}")
            raise
    
    def cancel_event_registration(self, event_id: str, user_id: str) -> EventRegistration:
        """Cancel event registration"""
        try:
            registration = self.db.query(EventRegistration).filter(
                and_(
                    EventRegistration.event_id == event_id,
                    EventRegistration.user_id == user_id
                )
            ).first()
            
            if not registration:
                raise ValueError("Registration not found")
            
            registration.status = "cancelled"
            
            self.db.commit()
            self.db.refresh(registration)
            
            logger.info(f"Cancelled event registration for user {user_id}, event {event_id}")
            return registration
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error cancelling event registration: {e}")
            raise
    
    def list_exclusive_events(self, fan_club_id: str, user_id: Optional[str] = None,
                            page: int = 1, per_page: int = 20, **filters) -> Tuple[List[ExclusiveEvent], int]:
        """List exclusive events with access control"""
        try:
            query = self.db.query(ExclusiveEvent).filter(
                ExclusiveEvent.fan_club_id == fan_club_id
            )
            
            # Apply filters
            if filters.get("event_type"):
                query = query.filter(ExclusiveEvent.event_type == filters["event_type"])
            if filters.get("status"):
                query = query.filter(ExclusiveEvent.status == filters["status"])
            if filters.get("required_tier"):
                query = query.filter(ExclusiveEvent.required_tier == filters["required_tier"])
            if filters.get("upcoming_only"):
                query = query.filter(ExclusiveEvent.starts_at > datetime.utcnow())
            
            # Check user access if provided
            if user_id:
                membership = self.db.query(FanClubMembership).filter(
                    and_(
                        FanClubMembership.user_id == user_id,
                        FanClubMembership.fan_club_id == fan_club_id,
                        FanClubMembership.status == "active"
                    )
                ).first()
                
                if membership:
                    tier_levels = {"bronze": 1, "silver": 2, "gold": 3, "platinum": 4, "diamond": 5}
                    user_tier_level = tier_levels.get(membership.tier.value, 0)
                    
                    # Filter events user can access
                    accessible_tiers = [tier for tier, level in tier_levels.items() if level <= user_tier_level]
                    query = query.filter(ExclusiveEvent.required_tier.in_(accessible_tiers))
                else:
                    # User is not a member, return empty result
                    return [], 0
            
            # Apply sorting
            sort_by = filters.get("sort_by", "starts_at")
            sort_order = filters.get("sort_order", "asc")
            sort_column = getattr(ExclusiveEvent, sort_by, ExclusiveEvent.starts_at)
            
            if sort_order == "desc":
                query = query.order_by(desc(sort_column))
            else:
                query = query.order_by(asc(sort_column))
            
            # Get total count
            total = query.count()
            
            # Apply pagination
            offset = (page - 1) * per_page
            events = query.offset(offset).limit(per_page).all()
            
            return events, total
            
        except Exception as e:
            logger.error(f"Error listing exclusive events: {e}")
            raise
    
    def get_user_event_registrations(self, user_id: str) -> List[EventRegistration]:
        """Get all event registrations for a user"""
        try:
            return self.db.query(EventRegistration).filter(
                EventRegistration.user_id == user_id
            ).options(joinedload(EventRegistration.event)).all()
            
        except Exception as e:
            logger.error(f"Error getting user event registrations: {e}")
            raise
    
    # Early Access Content Management
    
    def create_early_access(self, writer_id: str, request: EarlyAccessContentRequest) -> EarlyAccessContent:
        """Create early access configuration for content"""
        try:
            early_access = EarlyAccessContent(
                content_type=request.content_type,
                content_id=request.content_id,
                writer_id=writer_id,
                early_access_hours=request.early_access_hours,
                required_tier=FanClubTier(request.required_tier),
                early_release_at=request.early_release_at,
                public_release_at=request.public_release_at
            )
            
            self.db.add(early_access)
            self.db.commit()
            self.db.refresh(early_access)
            
            logger.info(f"Created early access for {request.content_type} {request.content_id}")
            return early_access
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating early access: {e}")
            raise
    
    def check_early_access(self, user_id: str, content_type: str, content_id: str) -> bool:
        """Check if user has early access to content"""
        try:
            early_access = self.db.query(EarlyAccessContent).filter(
                and_(
                    EarlyAccessContent.content_type == content_type,
                    EarlyAccessContent.content_id == content_id,
                    EarlyAccessContent.is_active == True
                )
            ).first()
            
            if not early_access:
                return False
            
            # Check if still in early access period
            if datetime.utcnow() >= early_access.public_release_at:
                return True  # Content is now public
            
            # Check if user has required membership
            fan_club = self.db.query(FanClub).filter(
                FanClub.writer_id == early_access.writer_id
            ).first()
            
            if not fan_club:
                return False
            
            return self.check_membership_access(user_id, fan_club.id, early_access.required_tier.value)
            
        except Exception as e:
            logger.error(f"Error checking early access: {e}")
            return False
    
    def grant_early_access(self, user_id: str, content_type: str, content_id: str) -> bool:
        """Grant early access to a user and update count"""
        try:
            if self.check_early_access(user_id, content_type, content_id):
                # Update early access granted count
                early_access = self.db.query(EarlyAccessContent).filter(
                    and_(
                        EarlyAccessContent.content_type == content_type,
                        EarlyAccessContent.content_id == content_id,
                        EarlyAccessContent.is_active == True
                    )
                ).first()
                
                if early_access:
                    early_access.early_access_granted += 1
                    self.db.commit()
                
                return True
            
            return False
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error granting early access: {e}")
            return False
    
    def get_writer_early_access_content(self, writer_id: str) -> List[EarlyAccessContent]:
        """Get all early access content for a writer"""
        try:
            return self.db.query(EarlyAccessContent).filter(
                EarlyAccessContent.writer_id == writer_id
            ).order_by(desc(EarlyAccessContent.created_at)).all()
            
        except Exception as e:
            logger.error(f"Error getting writer early access content: {e}")
            raise
    
    def __del__(self):
        """Cleanup database session"""
        if hasattr(self, 'db'):
            self.db.close()