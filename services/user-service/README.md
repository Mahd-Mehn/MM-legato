# User Management Service

The User Management Service handles user profiles, relationships, preferences, and subscription management for the Legato Platform.

## Features

### User Profile Management
- **Profile CRUD Operations**: Create, read, update user profiles with validation
- **User Preferences**: Language, genre, content rating, and reading preferences
- **Privacy Settings**: Profile visibility, activity sharing, direct message controls
- **Profile Statistics**: Follower/following counts, story counts

### User Relationships
- **Following System**: Users can follow/unfollow other users
- **Blocking System**: Users can block other users to prevent interactions
- **Relationship Management**: Track follower/following relationships with counts
- **Social Features**: Get followers and following lists with pagination

### Subscription Management
- **Multiple Plans**: FREE, BASIC, PREMIUM, CREATOR subscription tiers
- **Subscription Benefits**: Ad-free experience, early access, exclusive content, etc.
- **Status Tracking**: Active, expired, cancelled, pending subscription states
- **Fan Club Memberships**: Users can join creator fan clubs
- **Upgrade/Downgrade**: Seamless subscription plan changes

## API Endpoints

### Profile Management
- `GET /api/v1/users/{user_id}/profile` - Get user profile
- `POST /api/v1/users/{user_id}/profile` - Create user profile
- `PUT /api/v1/users/{user_id}/profile` - Update user profile
- `GET /api/v1/users/{user_id}/preferences` - Get user preferences
- `PUT /api/v1/users/{user_id}/preferences` - Update user preferences

### User Relationships
- `POST /api/v1/users/{user_id}/follow` - Follow a user
- `POST /api/v1/users/{user_id}/unfollow` - Unfollow a user
- `POST /api/v1/users/{user_id}/block` - Block a user
- `GET /api/v1/users/{user_id}/followers` - Get user followers
- `GET /api/v1/users/{user_id}/following` - Get users being followed

### Subscription Management
- `GET /api/v1/users/{user_id}/subscription` - Get user subscription
- `POST /api/v1/users/{user_id}/subscription` - Create/upgrade subscription
- `POST /api/v1/users/{user_id}/fan-club/{creator_id}` - Join fan club
- `DELETE /api/v1/users/{user_id}/fan-club/{creator_id}` - Leave fan club

### Search and Discovery
- `GET /api/v1/users/search` - Search users by name or bio
- `GET /api/v1/users/{user_id}/stats` - Get user statistics

## Data Models

### UserProfile
- Basic profile information (display name, bio, avatar, etc.)
- Privacy and notification preferences
- Content preferences (genres, rating, language)
- Social statistics (followers, following, stories count)

### UserRelationship
- Tracks following, blocking, and muting relationships
- Supports different relationship types
- Maintains referential integrity with user profiles

### UserSubscription
- Subscription plan and status management
- Benefit tracking per subscription tier
- Fan club membership management
- Payment and billing information

### UserPreference
- Detailed reading and content preferences
- Language and localization settings
- Monetization preferences for writers

## Subscription Plans

### FREE
- Basic platform access
- Standard features

### BASIC ($4.99/month)
- Ad-free reading experience
- All FREE features

### PREMIUM ($9.99/month)
- Early access to new stories
- Exclusive content access
- Priority support
- All BASIC features

### CREATOR ($19.99/month)
- Advanced analytics
- Enhanced creator tools
- All PREMIUM features

## Technology Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Caching**: Redis for profile and relationship caching
- **Validation**: Pydantic schemas
- **Testing**: pytest with comprehensive test coverage

## Database Schema

The service uses the following main tables:
- `user_profiles` - Core user profile data
- `user_relationships` - User following/blocking relationships
- `user_subscriptions` - Subscription and membership data
- `user_preferences` - Detailed user preferences

## Caching Strategy

- User profiles are cached in Redis for 1 hour
- Relationship data is cached to improve performance
- Cache invalidation on profile/relationship updates
- Graceful fallback to database on cache misses

## Testing

The service includes comprehensive tests:
- Unit tests for models and business logic
- Integration tests for API endpoints
- Subscription system tests
- Relationship management tests

Run tests with:
```bash
python -m pytest test_basic.py -v
python -m pytest test_subscription_system.py -v
```

## Configuration

Environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `SQL_DEBUG` - Enable SQL query logging

## Health Checks

The service provides health check endpoints:
- `GET /health` - Overall service health
- Database connectivity check
- Redis connectivity check

## Requirements

See `requirements.txt` for Python dependencies:
- FastAPI
- SQLAlchemy
- PostgreSQL driver
- Redis client
- Pydantic
- pytest (for testing)

## Future Enhancements

- Real-time notifications for relationship changes
- Advanced user analytics
- Social media integration
- Enhanced privacy controls
- Subscription analytics and reporting