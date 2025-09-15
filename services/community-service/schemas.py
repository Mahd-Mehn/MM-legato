"""
Pydantic schemas for community service API
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from models import CommentStatus, ReportReason, ReportStatus, ModerationAction
import re

# Comment schemas
class CommentCreateRequest(BaseModel):
    """Comment creation request"""
    story_id: str = Field(..., description="Story ID")
    chapter_id: str = Field(..., description="Chapter ID")
    content: str = Field(..., min_length=1, max_length=2000, description="Comment content")
    parent_comment_id: Optional[str] = Field(None, description="Parent comment ID for replies")
    is_spoiler: bool = Field(default=False, description="Mark as spoiler")
    
    @validator('content')
    def validate_content(cls, v):
        """Validate comment content"""
        content = v.strip()
        if not content:
            raise ValueError('Comment content cannot be empty')
        if len(content) < 1:
            raise ValueError('Comment must be at least 1 character')
        return content

class CommentUpdateRequest(BaseModel):
    """Comment update request"""
    content: Optional[str] = Field(None, min_length=1, max_length=2000, description="Updated comment content")
    is_spoiler: Optional[bool] = Field(None, description="Update spoiler flag")

class CommentResponse(BaseModel):
    """Comment response schema"""
    id: str = Field(..., description="Comment ID")
    story_id: str = Field(..., description="Story ID")
    chapter_id: str = Field(..., description="Chapter ID")
    user_id: str = Field(..., description="User ID")
    parent_comment_id: Optional[str] = Field(None, description="Parent comment ID")
    thread_root_id: Optional[str] = Field(None, description="Thread root ID")
    reply_depth: int = Field(..., description="Reply depth")
    content: str = Field(..., description="Comment content")
    content_html: Optional[str] = Field(None, description="Processed HTML content")
    status: CommentStatus = Field(..., description="Comment status")
    is_spoiler: bool = Field(..., description="Spoiler flag")
    is_pinned: bool = Field(..., description="Pinned flag")
    like_count: int = Field(..., description="Like count")
    dislike_count: int = Field(..., description="Dislike count")
    reply_count: int = Field(..., description="Reply count")
    user_reaction: Optional[bool] = Field(None, description="Current user's reaction (true=like, false=dislike, null=none)")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Update timestamp")
    
    model_config = {"from_attributes": True}

class CommentListResponse(BaseModel):
    """Comment list response with pagination"""
    comments: List[CommentResponse] = Field(..., description="List of comments")
    total: int = Field(..., description="Total comment count")
    page: int = Field(..., description="Current page")
    per_page: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total pages")

class CommentThreadResponse(BaseModel):
    """Comment thread response with nested replies"""
    comment: CommentResponse = Field(..., description="Root comment")
    replies: List["CommentThreadResponse"] = Field(default=[], description="Nested replies")
    total_replies: int = Field(..., description="Total replies in thread")

# Rating schemas
class RatingCreateRequest(BaseModel):
    """Rating creation request"""
    story_id: str = Field(..., description="Story ID")
    rating: int = Field(..., ge=1, le=5, description="Rating (1-5 stars)")
    review_title: Optional[str] = Field(None, max_length=200, description="Review title")
    review_content: Optional[str] = Field(None, max_length=5000, description="Review content")
    
    @validator('review_title')
    def validate_review_title(cls, v):
        """Validate review title"""
        if v:
            v = v.strip()
            if not v:
                return None
        return v
    
    @validator('review_content')
    def validate_review_content(cls, v):
        """Validate review content"""
        if v:
            v = v.strip()
            if not v:
                return None
        return v

class RatingUpdateRequest(BaseModel):
    """Rating update request"""
    rating: Optional[int] = Field(None, ge=1, le=5, description="Updated rating")
    review_title: Optional[str] = Field(None, max_length=200, description="Updated review title")
    review_content: Optional[str] = Field(None, max_length=5000, description="Updated review content")

class RatingResponse(BaseModel):
    """Rating response schema"""
    id: str = Field(..., description="Rating ID")
    story_id: str = Field(..., description="Story ID")
    user_id: str = Field(..., description="User ID")
    rating: int = Field(..., description="Rating (1-5 stars)")
    review_title: Optional[str] = Field(None, description="Review title")
    review_content: Optional[str] = Field(None, description="Review content")
    helpful_count: int = Field(..., description="Helpful votes")
    not_helpful_count: int = Field(..., description="Not helpful votes")
    status: CommentStatus = Field(..., description="Review status")
    is_verified_reader: bool = Field(..., description="Verified reader flag")
    user_helpfulness_vote: Optional[bool] = Field(None, description="Current user's helpfulness vote")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Update timestamp")
    
    model_config = {"from_attributes": True}

class RatingListResponse(BaseModel):
    """Rating list response with pagination"""
    ratings: List[RatingResponse] = Field(..., description="List of ratings")
    total: int = Field(..., description="Total rating count")
    page: int = Field(..., description="Current page")
    per_page: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total pages")
    average_rating: Optional[float] = Field(None, description="Average rating")
    rating_distribution: Dict[int, int] = Field(default={}, description="Rating distribution (1-5 stars)")

class RatingStatsResponse(BaseModel):
    """Rating statistics response"""
    story_id: str = Field(..., description="Story ID")
    total_ratings: int = Field(..., description="Total number of ratings")
    average_rating: float = Field(..., description="Average rating")
    rating_distribution: Dict[int, int] = Field(..., description="Rating distribution")
    total_reviews: int = Field(..., description="Total number of reviews with content")

# Reaction schemas
class ReactionRequest(BaseModel):
    """Reaction request (like/dislike)"""
    is_like: bool = Field(..., description="True for like, False for dislike")

class ReactionResponse(BaseModel):
    """Reaction response"""
    comment_id: str = Field(..., description="Comment ID")
    user_id: str = Field(..., description="User ID")
    is_like: bool = Field(..., description="Reaction type")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    model_config = {"from_attributes": True}

class HelpfulnessVoteRequest(BaseModel):
    """Helpfulness vote request"""
    is_helpful: bool = Field(..., description="True for helpful, False for not helpful")

# Report schemas
class ReportCreateRequest(BaseModel):
    """Report creation request"""
    reason: ReportReason = Field(..., description="Report reason")
    description: Optional[str] = Field(None, max_length=1000, description="Additional description")
    
    @validator('description')
    def validate_description(cls, v):
        """Validate report description"""
        if v:
            v = v.strip()
            if not v:
                return None
        return v

class ReportResponse(BaseModel):
    """Report response schema"""
    id: str = Field(..., description="Report ID")
    target_type: str = Field(..., description="Target type (comment/rating)")
    target_id: str = Field(..., description="Target ID")
    reporter_user_id: str = Field(..., description="Reporter user ID")
    reason: ReportReason = Field(..., description="Report reason")
    description: Optional[str] = Field(None, description="Report description")
    status: ReportStatus = Field(..., description="Report status")
    reviewed_by: Optional[str] = Field(None, description="Reviewer ID")
    reviewed_at: Optional[datetime] = Field(None, description="Review timestamp")
    resolution_notes: Optional[str] = Field(None, description="Resolution notes")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    model_config = {"from_attributes": True}

class ReportListResponse(BaseModel):
    """Report list response with pagination"""
    reports: List[ReportResponse] = Field(..., description="List of reports")
    total: int = Field(..., description="Total report count")
    page: int = Field(..., description="Current page")
    per_page: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total pages")

# Moderation schemas
class ModerationActionRequest(BaseModel):
    """Moderation action request"""
    action: ModerationAction = Field(..., description="Moderation action")
    reason: Optional[str] = Field(None, max_length=500, description="Action reason")
    notes: Optional[str] = Field(None, max_length=2000, description="Additional notes")

class ModerationLogResponse(BaseModel):
    """Moderation log response"""
    id: str = Field(..., description="Log ID")
    target_type: str = Field(..., description="Target type")
    target_id: str = Field(..., description="Target ID")
    moderator_id: str = Field(..., description="Moderator ID")
    action: ModerationAction = Field(..., description="Action taken")
    reason: Optional[str] = Field(None, description="Action reason")
    notes: Optional[str] = Field(None, description="Additional notes")
    related_report_id: Optional[str] = Field(None, description="Related report ID")
    created_at: datetime = Field(..., description="Action timestamp")
    
    model_config = {"from_attributes": True}

class UserModerationStatusResponse(BaseModel):
    """User moderation status response"""
    user_id: str = Field(..., description="User ID")
    warning_count: int = Field(..., description="Warning count")
    comment_violations: int = Field(..., description="Comment violations")
    rating_violations: int = Field(..., description="Rating violations")
    is_suspended: bool = Field(..., description="Suspension status")
    suspension_expires_at: Optional[datetime] = Field(None, description="Suspension expiry")
    is_banned: bool = Field(..., description="Ban status")
    
    model_config = {"from_attributes": True}

# Filter and search schemas
class CommentFilterRequest(BaseModel):
    """Comment filtering request"""
    story_id: Optional[str] = Field(None, description="Filter by story")
    chapter_id: Optional[str] = Field(None, description="Filter by chapter")
    user_id: Optional[str] = Field(None, description="Filter by user")
    status: Optional[CommentStatus] = Field(None, description="Filter by status")
    is_spoiler: Optional[bool] = Field(None, description="Filter by spoiler flag")
    parent_comment_id: Optional[str] = Field(None, description="Filter by parent comment")
    sort_by: str = Field(default="created_at", description="Sort field")
    sort_order: str = Field(default="desc", description="Sort order (asc/desc)")
    page: int = Field(1, ge=1, description="Page number")
    per_page: int = Field(20, ge=1, le=100, description="Items per page")

class RatingFilterRequest(BaseModel):
    """Rating filtering request"""
    story_id: Optional[str] = Field(None, description="Filter by story")
    user_id: Optional[str] = Field(None, description="Filter by user")
    min_rating: Optional[int] = Field(None, ge=1, le=5, description="Minimum rating")
    max_rating: Optional[int] = Field(None, ge=1, le=5, description="Maximum rating")
    has_review: Optional[bool] = Field(None, description="Filter by review presence")
    status: Optional[CommentStatus] = Field(None, description="Filter by status")
    sort_by: str = Field(default="created_at", description="Sort field")
    sort_order: str = Field(default="desc", description="Sort order (asc/desc)")
    page: int = Field(1, ge=1, description="Page number")
    per_page: int = Field(20, ge=1, le=100, description="Items per page")

# Response schemas
class ErrorResponse(BaseModel):
    """Error response schema"""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")

class SuccessResponse(BaseModel):
    """Success response schema"""
    success: bool = Field(default=True, description="Success status")
    message: str = Field(..., description="Success message")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional data")

# Social Engagement Schemas

# User Following schemas
class FollowUserRequest(BaseModel):
    """Follow user request"""
    following_id: str = Field(..., description="User ID to follow")
    notification_enabled: bool = Field(default=True, description="Enable notifications from this user")

class UnfollowUserRequest(BaseModel):
    """Unfollow user request"""
    following_id: str = Field(..., description="User ID to unfollow")

class FollowResponse(BaseModel):
    """Follow relationship response"""
    id: str = Field(..., description="Follow relationship ID")
    follower_id: str = Field(..., description="Follower user ID")
    following_id: str = Field(..., description="Following user ID")
    is_active: bool = Field(..., description="Follow status")
    notification_enabled: bool = Field(..., description="Notification status")
    created_at: datetime = Field(..., description="Follow timestamp")
    
    model_config = {"from_attributes": True}

class UserFollowStats(BaseModel):
    """User follow statistics"""
    user_id: str = Field(..., description="User ID")
    followers_count: int = Field(..., description="Number of followers")
    following_count: int = Field(..., description="Number of users following")
    is_following: Optional[bool] = Field(None, description="Current user follows this user")
    is_followed_by: Optional[bool] = Field(None, description="This user follows current user")

# Notification schemas
class NotificationResponse(BaseModel):
    """Notification response"""
    id: str = Field(..., description="Notification ID")
    user_id: str = Field(..., description="Recipient user ID")
    type: str = Field(..., description="Notification type")
    title: str = Field(..., description="Notification title")
    message: str = Field(..., description="Notification message")
    related_user_id: Optional[str] = Field(None, description="Related user ID")
    related_story_id: Optional[str] = Field(None, description="Related story ID")
    related_chapter_id: Optional[str] = Field(None, description="Related chapter ID")
    related_comment_id: Optional[str] = Field(None, description="Related comment ID")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional data")
    action_url: Optional[str] = Field(None, description="Action URL")
    is_read: bool = Field(..., description="Read status")
    is_dismissed: bool = Field(..., description="Dismissed status")
    created_at: datetime = Field(..., description="Creation timestamp")
    read_at: Optional[datetime] = Field(None, description="Read timestamp")
    
    model_config = {"from_attributes": True}

class NotificationListResponse(BaseModel):
    """Notification list response"""
    notifications: List[NotificationResponse] = Field(..., description="List of notifications")
    total: int = Field(..., description="Total notification count")
    unread_count: int = Field(..., description="Unread notification count")
    page: int = Field(..., description="Current page")
    per_page: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total pages")

class MarkNotificationRequest(BaseModel):
    """Mark notification request"""
    is_read: Optional[bool] = Field(None, description="Mark as read/unread")
    is_dismissed: Optional[bool] = Field(None, description="Mark as dismissed")

# Achievement schemas
class AchievementResponse(BaseModel):
    """Achievement response"""
    id: str = Field(..., description="Achievement ID")
    name: str = Field(..., description="Achievement name")
    description: str = Field(..., description="Achievement description")
    type: str = Field(..., description="Achievement type")
    criteria: Dict[str, Any] = Field(..., description="Achievement criteria")
    points: int = Field(..., description="Points awarded")
    icon_url: Optional[str] = Field(None, description="Icon URL")
    badge_color: Optional[str] = Field(None, description="Badge color")
    rarity: str = Field(..., description="Achievement rarity")
    is_hidden: bool = Field(..., description="Hidden until earned")
    
    model_config = {"from_attributes": True}

class UserAchievementResponse(BaseModel):
    """User achievement response"""
    id: str = Field(..., description="User achievement ID")
    user_id: str = Field(..., description="User ID")
    achievement: AchievementResponse = Field(..., description="Achievement details")
    progress: Optional[Dict[str, Any]] = Field(None, description="Progress data")
    earned_at: Optional[datetime] = Field(None, description="Earned timestamp")
    is_displayed: bool = Field(..., description="Display on profile")
    is_featured: bool = Field(..., description="Featured achievement")
    
    model_config = {"from_attributes": True}

class UserAchievementListResponse(BaseModel):
    """User achievement list response"""
    achievements: List[UserAchievementResponse] = Field(..., description="User achievements")
    total_earned: int = Field(..., description="Total achievements earned")
    total_points: int = Field(..., description="Total points from achievements")
    featured_achievement: Optional[UserAchievementResponse] = Field(None, description="Featured achievement")

# User Statistics schemas
class UserStatsResponse(BaseModel):
    """User statistics response"""
    user_id: str = Field(..., description="User ID")
    
    # Writing stats
    stories_published: int = Field(..., description="Stories published")
    chapters_published: int = Field(..., description="Chapters published")
    total_words_written: int = Field(..., description="Total words written")
    
    # Reading stats
    stories_read: int = Field(..., description="Stories read")
    chapters_read: int = Field(..., description="Chapters read")
    total_reading_time: int = Field(..., description="Total reading time (minutes)")
    
    # Community stats
    comments_posted: int = Field(..., description="Comments posted")
    ratings_given: int = Field(..., description="Ratings given")
    likes_received: int = Field(..., description="Likes received")
    followers_count: int = Field(..., description="Followers count")
    following_count: int = Field(..., description="Following count")
    
    # Engagement stats
    total_points: int = Field(..., description="Total points")
    achievements_earned: int = Field(..., description="Achievements earned")
    contests_participated: int = Field(..., description="Contests participated")
    contests_won: int = Field(..., description="Contests won")
    
    # Streaks
    daily_login_streak: int = Field(..., description="Daily login streak")
    writing_streak: int = Field(..., description="Writing streak")
    reading_streak: int = Field(..., description="Reading streak")
    
    # Last activity
    last_login_at: Optional[datetime] = Field(None, description="Last login")
    last_story_published_at: Optional[datetime] = Field(None, description="Last story published")
    last_chapter_read_at: Optional[datetime] = Field(None, description="Last chapter read")
    
    model_config = {"from_attributes": True}

# Contest schemas
class ContestCreateRequest(BaseModel):
    """Contest creation request"""
    title: str = Field(..., min_length=1, max_length=200, description="Contest title")
    description: str = Field(..., min_length=1, description="Contest description")
    rules: str = Field(..., min_length=1, description="Contest rules")
    theme: Optional[str] = Field(None, max_length=100, description="Contest theme")
    genre_restrictions: Optional[List[str]] = Field(None, description="Allowed genres")
    word_limit_min: Optional[int] = Field(None, ge=1, description="Minimum word count")
    word_limit_max: Optional[int] = Field(None, ge=1, description="Maximum word count")
    registration_starts_at: datetime = Field(..., description="Registration start time")
    registration_ends_at: datetime = Field(..., description="Registration end time")
    contest_starts_at: datetime = Field(..., description="Contest start time")
    contest_ends_at: datetime = Field(..., description="Contest end time")
    judging_ends_at: Optional[datetime] = Field(None, description="Judging end time")
    max_participants: Optional[int] = Field(None, ge=1, description="Maximum participants")
    entry_fee: Optional[float] = Field(0, ge=0, description="Entry fee")
    prize_pool: Optional[float] = Field(0, ge=0, description="Prize pool")
    prize_distribution: Optional[Dict[str, Any]] = Field(None, description="Prize distribution")
    judges: Optional[List[str]] = Field(None, description="Judge user IDs")
    banner_url: Optional[str] = Field(None, description="Banner image URL")
    
    @validator('registration_ends_at')
    def validate_registration_end(cls, v, values):
        if 'registration_starts_at' in values and v <= values['registration_starts_at']:
            raise ValueError('Registration end must be after registration start')
        return v
    
    @validator('contest_starts_at')
    def validate_contest_start(cls, v, values):
        if 'registration_ends_at' in values and v < values['registration_ends_at']:
            raise ValueError('Contest start must be after registration end')
        return v
    
    @validator('contest_ends_at')
    def validate_contest_end(cls, v, values):
        if 'contest_starts_at' in values and v <= values['contest_starts_at']:
            raise ValueError('Contest end must be after contest start')
        return v

class ContestResponse(BaseModel):
    """Contest response"""
    id: str = Field(..., description="Contest ID")
    title: str = Field(..., description="Contest title")
    description: str = Field(..., description="Contest description")
    rules: str = Field(..., description="Contest rules")
    theme: Optional[str] = Field(None, description="Contest theme")
    genre_restrictions: Optional[List[str]] = Field(None, description="Genre restrictions")
    word_limit_min: Optional[int] = Field(None, description="Minimum word count")
    word_limit_max: Optional[int] = Field(None, description="Maximum word count")
    registration_starts_at: datetime = Field(..., description="Registration start")
    registration_ends_at: datetime = Field(..., description="Registration end")
    contest_starts_at: datetime = Field(..., description="Contest start")
    contest_ends_at: datetime = Field(..., description="Contest end")
    judging_ends_at: Optional[datetime] = Field(None, description="Judging end")
    status: str = Field(..., description="Contest status")
    max_participants: Optional[int] = Field(None, description="Max participants")
    current_participants: int = Field(0, description="Current participant count")
    entry_fee: float = Field(..., description="Entry fee")
    prize_pool: float = Field(..., description="Prize pool")
    prize_distribution: Optional[Dict[str, Any]] = Field(None, description="Prize distribution")
    organizer_id: str = Field(..., description="Organizer user ID")
    judges: Optional[List[str]] = Field(None, description="Judge user IDs")
    banner_url: Optional[str] = Field(None, description="Banner URL")
    is_featured: bool = Field(..., description="Featured status")
    user_participation: Optional[Dict[str, Any]] = Field(None, description="Current user participation")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    model_config = {"from_attributes": True}

class ContestListResponse(BaseModel):
    """Contest list response"""
    contests: List[ContestResponse] = Field(..., description="List of contests")
    total: int = Field(..., description="Total contest count")
    page: int = Field(..., description="Current page")
    per_page: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total pages")

class ContestParticipationRequest(BaseModel):
    """Contest participation request"""
    contest_id: str = Field(..., description="Contest ID")

class ContestSubmissionRequest(BaseModel):
    """Contest submission request"""
    story_id: str = Field(..., description="Story ID to submit")
    title: str = Field(..., min_length=1, max_length=200, description="Submission title")
    description: Optional[str] = Field(None, description="Submission description")
    is_final: bool = Field(default=False, description="Mark as final submission")

class ContestSubmissionResponse(BaseModel):
    """Contest submission response"""
    id: str = Field(..., description="Submission ID")
    contest_id: str = Field(..., description="Contest ID")
    participant_id: str = Field(..., description="Participant ID")
    story_id: str = Field(..., description="Story ID")
    title: str = Field(..., description="Submission title")
    description: Optional[str] = Field(None, description="Submission description")
    word_count: int = Field(..., description="Word count")
    submitted_at: datetime = Field(..., description="Submission timestamp")
    is_final: bool = Field(..., description="Final submission flag")
    total_score: Optional[float] = Field(None, description="Total score")
    rank: Optional[int] = Field(None, description="Submission rank")
    public_votes: int = Field(..., description="Public votes")
    public_score: Optional[float] = Field(None, description="Public score")
    
    model_config = {"from_attributes": True}

# Social Sharing schemas
class SocialShareRequest(BaseModel):
    """Social share request"""
    content_type: str = Field(..., description="Content type (story, chapter, achievement, contest)")
    content_id: str = Field(..., description="Content ID")
    platform: str = Field(..., description="Social platform")
    share_text: Optional[str] = Field(None, description="Custom share text")

class SocialShareResponse(BaseModel):
    """Social share response"""
    id: str = Field(..., description="Share ID")
    share_url: str = Field(..., description="Generated share URL")
    share_text: str = Field(..., description="Share text")
    platform: str = Field(..., description="Social platform")
    
    model_config = {"from_attributes": True}

# Leaderboard schemas
class LeaderboardEntry(BaseModel):
    """Leaderboard entry"""
    user_id: str = Field(..., description="User ID")
    rank: int = Field(..., description="User rank")
    score: float = Field(..., description="User score")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional data")
    
    model_config = {"from_attributes": True}

class LeaderboardResponse(BaseModel):
    """Leaderboard response"""
    category: str = Field(..., description="Leaderboard category")
    period: str = Field(..., description="Time period")
    entries: List[LeaderboardEntry] = Field(..., description="Leaderboard entries")
    total_entries: int = Field(..., description="Total entries")
    current_user_rank: Optional[int] = Field(None, description="Current user rank")
    period_start: datetime = Field(..., description="Period start")
    period_end: datetime = Field(..., description="Period end")
    last_updated: datetime = Field(..., description="Last update timestamp")

# Fan Club and Exclusive Content Schemas

class FanClubCreateRequest(BaseModel):
    """Fan club creation request"""
    name: str = Field(..., min_length=1, max_length=100, description="Fan club name")
    description: Optional[str] = Field(None, description="Fan club description")
    banner_url: Optional[str] = Field(None, description="Banner image URL")
    tiers: Dict[str, Any] = Field(..., description="Tier configurations with pricing and benefits")
    auto_accept_members: bool = Field(default=True, description="Auto-accept new members")
    welcome_message: Optional[str] = Field(None, description="Welcome message for new members")

class FanClubUpdateRequest(BaseModel):
    """Fan club update request"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Updated name")
    description: Optional[str] = Field(None, description="Updated description")
    banner_url: Optional[str] = Field(None, description="Updated banner URL")
    tiers: Optional[Dict[str, Any]] = Field(None, description="Updated tier configurations")
    auto_accept_members: Optional[bool] = Field(None, description="Auto-accept setting")
    welcome_message: Optional[str] = Field(None, description="Updated welcome message")
    is_active: Optional[bool] = Field(None, description="Active status")

class FanClubResponse(BaseModel):
    """Fan club response"""
    id: str = Field(..., description="Fan club ID")
    writer_id: str = Field(..., description="Writer ID")
    name: str = Field(..., description="Fan club name")
    description: Optional[str] = Field(None, description="Fan club description")
    banner_url: Optional[str] = Field(None, description="Banner image URL")
    tiers: Dict[str, Any] = Field(..., description="Tier configurations")
    is_active: bool = Field(..., description="Active status")
    auto_accept_members: bool = Field(..., description="Auto-accept members")
    welcome_message: Optional[str] = Field(None, description="Welcome message")
    total_members: int = Field(..., description="Total member count")
    total_revenue: float = Field(..., description="Total revenue generated")
    user_membership: Optional[Dict[str, Any]] = Field(None, description="Current user's membership")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    model_config = {"from_attributes": True}

class FanClubMembershipRequest(BaseModel):
    """Fan club membership request"""
    tier: str = Field(..., description="Membership tier")
    payment_method_id: Optional[str] = Field(None, description="Payment method ID")
    auto_renew: bool = Field(default=True, description="Auto-renewal setting")

class FanClubMembershipResponse(BaseModel):
    """Fan club membership response"""
    id: str = Field(..., description="Membership ID")
    fan_club_id: str = Field(..., description="Fan club ID")
    user_id: str = Field(..., description="User ID")
    tier: str = Field(..., description="Membership tier")
    status: str = Field(..., description="Membership status")
    monthly_fee: float = Field(..., description="Monthly fee")
    next_billing_date: datetime = Field(..., description="Next billing date")
    auto_renew: bool = Field(..., description="Auto-renewal status")
    total_paid: float = Field(..., description="Total amount paid")
    exclusive_content_access: bool = Field(..., description="Exclusive content access")
    early_access_enabled: bool = Field(..., description="Early access enabled")
    direct_messaging_enabled: bool = Field(..., description="Direct messaging enabled")
    joined_at: datetime = Field(..., description="Join timestamp")
    expires_at: Optional[datetime] = Field(None, description="Expiry timestamp")
    
    model_config = {"from_attributes": True}

class ExclusiveContentCreateRequest(BaseModel):
    """Exclusive content creation request"""
    title: str = Field(..., min_length=1, max_length=200, description="Content title")
    description: Optional[str] = Field(None, description="Content description")
    content_type: str = Field(..., description="Content type")
    content_url: Optional[str] = Field(None, description="Content URL")
    content_text: Optional[str] = Field(None, description="Text content")
    content_data: Optional[Dict[str, Any]] = Field(None, description="Structured content data")
    required_tier: str = Field(default="bronze", description="Required membership tier")
    is_early_access: bool = Field(default=False, description="Early access content")
    early_access_hours: int = Field(default=0, description="Early access duration in hours")
    story_id: Optional[str] = Field(None, description="Related story ID")
    chapter_id: Optional[str] = Field(None, description="Related chapter ID")
    is_featured: bool = Field(default=False, description="Featured content")

class ExclusiveContentResponse(BaseModel):
    """Exclusive content response"""
    id: str = Field(..., description="Content ID")
    fan_club_id: str = Field(..., description="Fan club ID")
    title: str = Field(..., description="Content title")
    description: Optional[str] = Field(None, description="Content description")
    content_type: str = Field(..., description="Content type")
    content_url: Optional[str] = Field(None, description="Content URL")
    content_text: Optional[str] = Field(None, description="Text content")
    content_data: Optional[Dict[str, Any]] = Field(None, description="Structured content")
    required_tier: str = Field(..., description="Required tier")
    is_early_access: bool = Field(..., description="Early access flag")
    early_access_hours: int = Field(..., description="Early access hours")
    story_id: Optional[str] = Field(None, description="Related story ID")
    chapter_id: Optional[str] = Field(None, description="Related chapter ID")
    is_published: bool = Field(..., description="Published status")
    is_featured: bool = Field(..., description="Featured status")
    view_count: int = Field(..., description="View count")
    like_count: int = Field(..., description="Like count")
    comment_count: int = Field(..., description="Comment count")
    user_interaction: Optional[Dict[str, Any]] = Field(None, description="User interaction data")
    created_at: datetime = Field(..., description="Creation timestamp")
    published_at: Optional[datetime] = Field(None, description="Publication timestamp")
    public_release_at: Optional[datetime] = Field(None, description="Public release timestamp")
    
    model_config = {"from_attributes": True}

class DirectMessageCreateRequest(BaseModel):
    """Direct message creation request"""
    recipient_id: str = Field(..., description="Recipient user ID")
    subject: Optional[str] = Field(None, max_length=200, description="Message subject")
    content: str = Field(..., min_length=1, description="Message content")
    message_type: str = Field(default="text", description="Message type")
    attachment_url: Optional[str] = Field(None, description="Attachment URL")
    attachment_type: Optional[str] = Field(None, description="Attachment type")
    thread_id: Optional[str] = Field(None, description="Thread ID")
    reply_to_id: Optional[str] = Field(None, description="Reply to message ID")
    is_fan_club_exclusive: bool = Field(default=False, description="Fan club exclusive message")

class DirectMessageResponse(BaseModel):
    """Direct message response"""
    id: str = Field(..., description="Message ID")
    sender_id: str = Field(..., description="Sender user ID")
    recipient_id: str = Field(..., description="Recipient user ID")
    fan_club_id: Optional[str] = Field(None, description="Fan club ID")
    subject: Optional[str] = Field(None, description="Message subject")
    content: str = Field(..., description="Message content")
    message_type: str = Field(..., description="Message type")
    attachment_url: Optional[str] = Field(None, description="Attachment URL")
    attachment_type: Optional[str] = Field(None, description="Attachment type")
    attachment_size: Optional[int] = Field(None, description="Attachment size")
    status: str = Field(..., description="Message status")
    is_fan_club_exclusive: bool = Field(..., description="Fan club exclusive")
    thread_id: Optional[str] = Field(None, description="Thread ID")
    reply_to_id: Optional[str] = Field(None, description="Reply to message ID")
    sent_at: datetime = Field(..., description="Sent timestamp")
    delivered_at: Optional[datetime] = Field(None, description="Delivered timestamp")
    read_at: Optional[datetime] = Field(None, description="Read timestamp")
    
    model_config = {"from_attributes": True}

class ExclusiveEventCreateRequest(BaseModel):
    """Exclusive event creation request"""
    title: str = Field(..., min_length=1, max_length=200, description="Event title")
    description: str = Field(..., min_length=1, description="Event description")
    event_type: str = Field(..., description="Event type")
    required_tier: str = Field(default="bronze", description="Required membership tier")
    max_participants: Optional[int] = Field(None, ge=1, description="Maximum participants")
    starts_at: datetime = Field(..., description="Event start time")
    ends_at: datetime = Field(..., description="Event end time")
    timezone: str = Field(default="UTC", description="Event timezone")
    location_type: str = Field(default="online", description="Location type")
    access_url: Optional[str] = Field(None, description="Access URL for online events")
    location_details: Optional[str] = Field(None, description="Location details")
    is_recurring: bool = Field(default=False, description="Recurring event")
    recurrence_pattern: Optional[Dict[str, Any]] = Field(None, description="Recurrence pattern")
    requires_registration: bool = Field(default=True, description="Registration required")
    registration_deadline: Optional[datetime] = Field(None, description="Registration deadline")
    event_data: Optional[Dict[str, Any]] = Field(None, description="Event-specific data")
    
    @validator('ends_at')
    def validate_end_time(cls, v, values):
        if 'starts_at' in values and v <= values['starts_at']:
            raise ValueError('Event end time must be after start time')
        return v

class ExclusiveEventResponse(BaseModel):
    """Exclusive event response"""
    id: str = Field(..., description="Event ID")
    fan_club_id: str = Field(..., description="Fan club ID")
    title: str = Field(..., description="Event title")
    description: str = Field(..., description="Event description")
    event_type: str = Field(..., description="Event type")
    required_tier: str = Field(..., description="Required tier")
    max_participants: Optional[int] = Field(None, description="Max participants")
    current_participants: int = Field(0, description="Current participant count")
    starts_at: datetime = Field(..., description="Start time")
    ends_at: datetime = Field(..., description="End time")
    timezone: str = Field(..., description="Timezone")
    location_type: str = Field(..., description="Location type")
    access_url: Optional[str] = Field(None, description="Access URL")
    location_details: Optional[str] = Field(None, description="Location details")
    status: str = Field(..., description="Event status")
    is_recurring: bool = Field(..., description="Recurring event")
    recurrence_pattern: Optional[Dict[str, Any]] = Field(None, description="Recurrence pattern")
    requires_registration: bool = Field(..., description="Registration required")
    registration_deadline: Optional[datetime] = Field(None, description="Registration deadline")
    event_data: Optional[Dict[str, Any]] = Field(None, description="Event data")
    recording_url: Optional[str] = Field(None, description="Recording URL")
    user_registration: Optional[Dict[str, Any]] = Field(None, description="User registration status")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    model_config = {"from_attributes": True}

class EventRegistrationRequest(BaseModel):
    """Event registration request"""
    registration_data: Optional[Dict[str, Any]] = Field(None, description="Additional registration data")

class EventRegistrationResponse(BaseModel):
    """Event registration response"""
    id: str = Field(..., description="Registration ID")
    event_id: str = Field(..., description="Event ID")
    user_id: str = Field(..., description="User ID")
    status: str = Field(..., description="Registration status")
    registration_data: Optional[Dict[str, Any]] = Field(None, description="Registration data")
    joined_at: Optional[datetime] = Field(None, description="Join timestamp")
    left_at: Optional[datetime] = Field(None, description="Leave timestamp")
    attendance_duration: Optional[int] = Field(None, description="Attendance duration")
    registered_at: datetime = Field(..., description="Registration timestamp")
    
    model_config = {"from_attributes": True}

class EarlyAccessContentRequest(BaseModel):
    """Early access content request"""
    content_type: str = Field(..., description="Content type")
    content_id: str = Field(..., description="Content ID")
    early_access_hours: int = Field(default=24, ge=1, le=168, description="Early access hours")
    required_tier: str = Field(default="bronze", description="Required tier")
    early_release_at: datetime = Field(..., description="Early release time")
    public_release_at: datetime = Field(..., description="Public release time")
    
    @validator('public_release_at')
    def validate_public_release(cls, v, values):
        if 'early_release_at' in values and v <= values['early_release_at']:
            raise ValueError('Public release must be after early release')
        return v

class EarlyAccessContentResponse(BaseModel):
    """Early access content response"""
    id: str = Field(..., description="Early access ID")
    content_type: str = Field(..., description="Content type")
    content_id: str = Field(..., description="Content ID")
    writer_id: str = Field(..., description="Writer ID")
    early_access_hours: int = Field(..., description="Early access hours")
    required_tier: str = Field(..., description="Required tier")
    early_release_at: datetime = Field(..., description="Early release time")
    public_release_at: datetime = Field(..., description="Public release time")
    is_active: bool = Field(..., description="Active status")
    early_access_granted: int = Field(..., description="Users granted early access")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    model_config = {"from_attributes": True}

# List responses for fan engagement features
class FanClubListResponse(BaseModel):
    """Fan club list response"""
    fan_clubs: List[FanClubResponse] = Field(..., description="List of fan clubs")
    total: int = Field(..., description="Total fan club count")
    page: int = Field(..., description="Current page")
    per_page: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total pages")

class ExclusiveContentListResponse(BaseModel):
    """Exclusive content list response"""
    content: List[ExclusiveContentResponse] = Field(..., description="List of exclusive content")
    total: int = Field(..., description="Total content count")
    page: int = Field(..., description="Current page")
    per_page: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total pages")

class DirectMessageListResponse(BaseModel):
    """Direct message list response"""
    messages: List[DirectMessageResponse] = Field(..., description="List of messages")
    total: int = Field(..., description="Total message count")
    unread_count: int = Field(..., description="Unread message count")
    page: int = Field(..., description="Current page")
    per_page: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total pages")

class ExclusiveEventListResponse(BaseModel):
    """Exclusive event list response"""
    events: List[ExclusiveEventResponse] = Field(..., description="List of events")
    total: int = Field(..., description="Total event count")
    page: int = Field(..., description="Current page")
    per_page: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total pages")

# Filter schemas for fan engagement features
class FanClubFilterRequest(BaseModel):
    """Fan club filtering request"""
    writer_id: Optional[str] = Field(None, description="Filter by writer")
    is_active: Optional[bool] = Field(None, description="Filter by active status")
    min_members: Optional[int] = Field(None, description="Minimum member count")
    sort_by: str = Field(default="created_at", description="Sort field")
    sort_order: str = Field(default="desc", description="Sort order")
    page: int = Field(1, ge=1, description="Page number")
    per_page: int = Field(20, ge=1, le=100, description="Items per page")

class ExclusiveContentFilterRequest(BaseModel):
    """Exclusive content filtering request"""
    fan_club_id: Optional[str] = Field(None, description="Filter by fan club")
    content_type: Optional[str] = Field(None, description="Filter by content type")
    required_tier: Optional[str] = Field(None, description="Filter by required tier")
    is_published: Optional[bool] = Field(None, description="Filter by published status")
    is_early_access: Optional[bool] = Field(None, description="Filter by early access")
    is_featured: Optional[bool] = Field(None, description="Filter by featured status")
    sort_by: str = Field(default="created_at", description="Sort field")
    sort_order: str = Field(default="desc", description="Sort order")
    page: int = Field(1, ge=1, description="Page number")
    per_page: int = Field(20, ge=1, le=100, description="Items per page")

class DirectMessageFilterRequest(BaseModel):
    """Direct message filtering request"""
    thread_id: Optional[str] = Field(None, description="Filter by thread")
    sender_id: Optional[str] = Field(None, description="Filter by sender")
    recipient_id: Optional[str] = Field(None, description="Filter by recipient")
    status: Optional[str] = Field(None, description="Filter by status")
    is_fan_club_exclusive: Optional[bool] = Field(None, description="Filter by fan club exclusive")
    sort_by: str = Field(default="sent_at", description="Sort field")
    sort_order: str = Field(default="desc", description="Sort order")
    page: int = Field(1, ge=1, description="Page number")
    per_page: int = Field(20, ge=1, le=100, description="Items per page")

class ExclusiveEventFilterRequest(BaseModel):
    """Exclusive event filtering request"""
    fan_club_id: Optional[str] = Field(None, description="Filter by fan club")
    event_type: Optional[str] = Field(None, description="Filter by event type")
    status: Optional[str] = Field(None, description="Filter by status")
    required_tier: Optional[str] = Field(None, description="Filter by required tier")
    upcoming_only: Optional[bool] = Field(None, description="Show only upcoming events")
    sort_by: str = Field(default="starts_at", description="Sort field")
    sort_order: str = Field(default="asc", description="Sort order")
    page: int = Field(1, ge=1, description="Page number")
    per_page: int = Field(20, ge=1, le=100, description="Items per page")

# Filter schemas for social features
class NotificationFilterRequest(BaseModel):
    """Notification filtering request"""
    type: Optional[str] = Field(None, description="Filter by notification type")
    is_read: Optional[bool] = Field(None, description="Filter by read status")
    is_dismissed: Optional[bool] = Field(None, description="Filter by dismissed status")
    page: int = Field(1, ge=1, description="Page number")
    per_page: int = Field(20, ge=1, le=100, description="Items per page")

class ContestFilterRequest(BaseModel):
    """Contest filtering request"""
    status: Optional[str] = Field(None, description="Filter by contest status")
    category: Optional[str] = Field(None, description="Filter by category")
    is_featured: Optional[bool] = Field(None, description="Filter by featured status")
    organizer_id: Optional[str] = Field(None, description="Filter by organizer")
    sort_by: str = Field(default="created_at", description="Sort field")
    sort_order: str = Field(default="desc", description="Sort order")
    page: int = Field(1, ge=1, description="Page number")
    per_page: int = Field(20, ge=1, le=100, description="Items per page")

# Update forward references
CommentThreadResponse.model_rebuild()