"""
User Management Service - Business Logic Layer
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timezone
import uuid
import logging

from models import (
    UserProfile, UserRelationship, UserSubscription, UserPreference,
    RelationshipType, SubscriptionPlan, SubscriptionStatus
)
from schemas import (
    UserProfileUpdateRequest, UserPreferencesUpdateRequest,
    CreateSubscriptionRequest, UpdateSubscriptionRequest
)
from database import cache_manager

logger = logging.getLogger(__name__)

class UserProfileService:
    """Service for managing user profiles"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_profile_by_user_id(self, user_id: str) -> Optional[UserProfile]:
        """Get user profile by user ID"""
        try:
            # Try cache first
            cached_profile = cache_manager.get_user_profile(user_id)
            if cached_profile:
                return self._dict_to_profile(cached_profile)
            
            # Query database
            profile = self.db.query(UserProfile).filter(
                UserProfile.user_id == user_id
            ).first()
            
            if profile:
                # Cache the result
                profile_dict = self._profile_to_dict(profile)
                cache_manager.set_user_profile(user_id, profile_dict)
            
            return profile
        except Exception as e:
            logger.error(f"Error getting profile for user {user_id}: {e}")
            return None
    
    def create_profile(self, user_id: str, profile_data: Dict[str, Any]) -> UserProfile:
        """Create a new user profile"""
        try:
            profile = UserProfile(
                user_id=user_id,
                **profile_data
            )
            
            self.db.add(profile)
            self.db.commit()
            self.db.refresh(profile)
            
            # Cache the new profile
            profile_dict = self._profile_to_dict(profile)
            cache_manager.set_user_profile(user_id, profile_dict)
            
            logger.info(f"Created profile for user {user_id}")
            return profile
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating profile for user {user_id}: {e}")
            raise
    
    def update_profile(self, user_id: str, update_data: UserProfileUpdateRequest) -> Optional[UserProfile]:
        """Update user profile"""
        try:
            profile = self.get_profile_by_user_id(user_id)
            if not profile:
                return None
            
            # Update fields
            update_dict = update_data.dict(exclude_unset=True)
            for field, value in update_dict.items():
                if hasattr(profile, field):
                    setattr(profile, field, value)
            
            profile.updated_at = datetime.now(timezone.utc)
            
            self.db.commit()
            self.db.refresh(profile)
            
            # Invalidate cache
            cache_manager.invalidate_user_profile(user_id)
            
            logger.info(f"Updated profile for user {user_id}")
            return profile
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating profile for user {user_id}: {e}")
            raise
    
    def update_preferences(self, user_id: str, preferences_data: UserPreferencesUpdateRequest) -> bool:
        """Update user preferences"""
        try:
            profile = self.get_profile_by_user_id(user_id)
            if not profile:
                return False
            
            # Update profile preferences
            update_dict = preferences_data.dict(exclude_unset=True)
            profile.update_preferences(update_dict)
            
            # Update or create UserPreference record
            user_pref = self.db.query(UserPreference).filter(
                UserPreference.user_id == user_id
            ).first()
            
            if not user_pref:
                user_pref = UserPreference(user_id=user_id)
                self.db.add(user_pref)
            
            # Update preference fields
            pref_fields = [
                'reading_speed', 'font_size', 'font_family', 'line_spacing',
                'discovery_algorithm', 'show_mature_content', 'preferred_story_length',
                'preferred_languages', 'auto_translate', 'translation_quality'
            ]
            
            for field in pref_fields:
                if field in update_dict:
                    setattr(user_pref, field, update_dict[field])
            
            user_pref.updated_at = datetime.now(timezone.utc)
            
            self.db.commit()
            
            # Invalidate cache
            cache_manager.invalidate_user_profile(user_id)
            
            logger.info(f"Updated preferences for user {user_id}")
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating preferences for user {user_id}: {e}")
            return False
    
    def search_profiles(self, query: str, page: int = 1, per_page: int = 20) -> Tuple[List[UserProfile], int]:
        """Search user profiles"""
        try:
            offset = (page - 1) * per_page
            
            # Build search query
            search_filter = or_(
                UserProfile.display_name.ilike(f"%{query}%"),
                UserProfile.bio.ilike(f"%{query}%")
            )
            
            # Get total count
            total = self.db.query(UserProfile).filter(search_filter).count()
            
            # Get profiles
            profiles = self.db.query(UserProfile).filter(search_filter)\
                .offset(offset).limit(per_page).all()
            
            return profiles, total
        except Exception as e:
            logger.error(f"Error searching profiles: {e}")
            return [], 0
    
    def _profile_to_dict(self, profile: UserProfile) -> Dict[str, Any]:
        """Convert profile to dictionary for caching"""
        return {
            'id': str(profile.id),
            'user_id': str(profile.user_id),
            'display_name': profile.display_name,
            'bio': profile.bio,
            'avatar_url': profile.avatar_url,
            'cover_image_url': profile.cover_image_url,
            'location': profile.location,
            'website_url': profile.website_url,
            'language_preference': profile.language_preference,
            'timezone': profile.timezone,
            'theme_preference': profile.theme_preference,
            'profile_visibility': profile.profile_visibility,
            'notification_preferences': profile.notification_preferences,
            'preferred_genres': profile.preferred_genres,
            'content_rating_preference': profile.content_rating_preference,
            'followers_count': profile.followers_count,
            'following_count': profile.following_count,
            'stories_count': profile.stories_count,
            'created_at': profile.created_at.isoformat(),
            'updated_at': profile.updated_at.isoformat()
        }
    
    def _dict_to_profile(self, profile_dict: Dict[str, Any]) -> UserProfile:
        """Convert dictionary to profile object (for cache retrieval)"""
        # This is a simplified version - in production, you might want to use a proper ORM mapping
        profile = UserProfile()
        for key, value in profile_dict.items():
            if key in ['created_at', 'updated_at']:
                setattr(profile, key, datetime.fromisoformat(value))
            else:
                setattr(profile, key, value)
        return profile

class UserRelationshipService:
    """Service for managing user relationships"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def follow_user(self, follower_id: str, following_id: str) -> bool:
        """Follow a user"""
        try:
            if follower_id == following_id:
                return False  # Can't follow yourself
            
            # Check if relationship already exists
            existing = self.db.query(UserRelationship).filter(
                and_(
                    UserRelationship.follower_id == follower_id,
                    UserRelationship.following_id == following_id
                )
            ).first()
            
            if existing:
                if existing.relationship_type == RelationshipType.FOLLOWING:
                    return True  # Already following
                else:
                    # Update existing relationship
                    existing.relationship_type = RelationshipType.FOLLOWING
                    existing.updated_at = datetime.now(timezone.utc)
            else:
                # Create new relationship
                relationship = UserRelationship(
                    follower_id=follower_id,
                    following_id=following_id,
                    relationship_type=RelationshipType.FOLLOWING
                )
                self.db.add(relationship)
            
            # Update follower counts
            self._update_follower_counts(follower_id, following_id, 1)
            
            self.db.commit()
            
            # Invalidate cache
            cache_manager.invalidate_user_relationships(follower_id)
            cache_manager.invalidate_user_relationships(following_id)
            
            logger.info(f"User {follower_id} followed user {following_id}")
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error following user: {e}")
            return False
    
    def unfollow_user(self, follower_id: str, following_id: str) -> bool:
        """Unfollow a user"""
        try:
            relationship = self.db.query(UserRelationship).filter(
                and_(
                    UserRelationship.follower_id == follower_id,
                    UserRelationship.following_id == following_id,
                    UserRelationship.relationship_type == RelationshipType.FOLLOWING
                )
            ).first()
            
            if relationship:
                self.db.delete(relationship)
                
                # Update follower counts
                self._update_follower_counts(follower_id, following_id, -1)
                
                self.db.commit()
                
                # Invalidate cache
                cache_manager.invalidate_user_relationships(follower_id)
                cache_manager.invalidate_user_relationships(following_id)
                
                logger.info(f"User {follower_id} unfollowed user {following_id}")
                return True
            
            return False
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error unfollowing user: {e}")
            return False
    
    def block_user(self, blocker_id: str, blocked_id: str) -> bool:
        """Block a user"""
        try:
            if blocker_id == blocked_id:
                return False  # Can't block yourself
            
            # Remove any existing following relationship
            self.unfollow_user(blocker_id, blocked_id)
            self.unfollow_user(blocked_id, blocker_id)
            
            # Check if block relationship already exists
            existing = self.db.query(UserRelationship).filter(
                and_(
                    UserRelationship.follower_id == blocker_id,
                    UserRelationship.following_id == blocked_id
                )
            ).first()
            
            if existing:
                existing.relationship_type = RelationshipType.BLOCKED
                existing.updated_at = datetime.now(timezone.utc)
            else:
                relationship = UserRelationship(
                    follower_id=blocker_id,
                    following_id=blocked_id,
                    relationship_type=RelationshipType.BLOCKED
                )
                self.db.add(relationship)
            
            self.db.commit()
            
            # Invalidate cache
            cache_manager.invalidate_user_relationships(blocker_id)
            cache_manager.invalidate_user_relationships(blocked_id)
            
            logger.info(f"User {blocker_id} blocked user {blocked_id}")
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error blocking user: {e}")
            return False
    
    def get_followers(self, user_id: str, page: int = 1, per_page: int = 20) -> Tuple[List[UserProfile], int]:
        """Get user followers"""
        try:
            offset = (page - 1) * per_page
            
            # Get follower relationships
            query = self.db.query(UserRelationship).filter(
                and_(
                    UserRelationship.following_id == user_id,
                    UserRelationship.relationship_type == RelationshipType.FOLLOWING
                )
            )
            
            total = query.count()
            relationships = query.offset(offset).limit(per_page).all()
            
            # Get follower profiles
            follower_ids = [rel.follower_id for rel in relationships]
            profiles = self.db.query(UserProfile).filter(
                UserProfile.user_id.in_(follower_ids)
            ).all()
            
            return profiles, total
        except Exception as e:
            logger.error(f"Error getting followers for user {user_id}: {e}")
            return [], 0
    
    def get_following(self, user_id: str, page: int = 1, per_page: int = 20) -> Tuple[List[UserProfile], int]:
        """Get users that this user is following"""
        try:
            offset = (page - 1) * per_page
            
            # Get following relationships
            query = self.db.query(UserRelationship).filter(
                and_(
                    UserRelationship.follower_id == user_id,
                    UserRelationship.relationship_type == RelationshipType.FOLLOWING
                )
            )
            
            total = query.count()
            relationships = query.offset(offset).limit(per_page).all()
            
            # Get following profiles
            following_ids = [rel.following_id for rel in relationships]
            profiles = self.db.query(UserProfile).filter(
                UserProfile.user_id.in_(following_ids)
            ).all()
            
            return profiles, total
        except Exception as e:
            logger.error(f"Error getting following for user {user_id}: {e}")
            return [], 0
    
    def _update_follower_counts(self, follower_id: str, following_id: str, delta: int):
        """Update follower/following counts"""
        try:
            # Update follower's following count
            follower_profile = self.db.query(UserProfile).filter(
                UserProfile.user_id == follower_id
            ).first()
            if follower_profile:
                follower_profile.following_count = max(0, follower_profile.following_count + delta)
            
            # Update following user's followers count
            following_profile = self.db.query(UserProfile).filter(
                UserProfile.user_id == following_id
            ).first()
            if following_profile:
                following_profile.followers_count = max(0, following_profile.followers_count + delta)
        except Exception as e:
            logger.error(f"Error updating follower counts: {e}")

class UserSubscriptionService:
    """Service for managing user subscriptions"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_subscription(self, user_id: str) -> Optional[UserSubscription]:
        """Get user's current subscription"""
        try:
            return self.db.query(UserSubscription).filter(
                UserSubscription.user_id == user_id
            ).order_by(UserSubscription.created_at.desc()).first()
        except Exception as e:
            logger.error(f"Error getting subscription for user {user_id}: {e}")
            return None
    
    def create_subscription(self, user_id: str, subscription_data: CreateSubscriptionRequest) -> Optional[UserSubscription]:
        """Create a new subscription"""
        try:
            # Cancel any existing active subscription
            existing = self.get_subscription(user_id)
            if existing and existing.status in [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING]:
                existing.status = SubscriptionStatus.CANCELLED
                existing.cancelled_at = datetime.now(timezone.utc)
            
            # Create new subscription
            subscription = UserSubscription(
                user_id=user_id,
                plan_type=subscription_data.plan_type,
                status=SubscriptionStatus.PENDING
            )
            
            # Set benefits based on plan type
            subscription.benefits = self._get_plan_benefits(subscription_data.plan_type)
            
            self.db.add(subscription)
            self.db.commit()
            self.db.refresh(subscription)
            
            logger.info(f"Created subscription for user {user_id}")
            return subscription
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating subscription for user {user_id}: {e}")
            return None
    
    def _get_plan_benefits(self, plan_type: SubscriptionPlan) -> Dict[str, bool]:
        """Get benefits for subscription plan"""
        benefits_map = {
            SubscriptionPlan.FREE: {
                "ad_free": False,
                "early_access": False,
                "exclusive_content": False,
                "priority_support": False,
                "advanced_analytics": False
            },
            SubscriptionPlan.BASIC: {
                "ad_free": True,
                "early_access": False,
                "exclusive_content": False,
                "priority_support": False,
                "advanced_analytics": False
            },
            SubscriptionPlan.PREMIUM: {
                "ad_free": True,
                "early_access": True,
                "exclusive_content": True,
                "priority_support": True,
                "advanced_analytics": False
            },
            SubscriptionPlan.CREATOR: {
                "ad_free": True,
                "early_access": True,
                "exclusive_content": True,
                "priority_support": True,
                "advanced_analytics": True
            }
        }
        return benefits_map.get(plan_type, benefits_map[SubscriptionPlan.FREE])