# Content Management Service

The Content Management Service handles story and chapter creation, management, and validation for the Legato platform.

## Features Implemented

### Data Models
- **Story Model**: Complete story metadata with categorization, monetization, and statistics
- **Chapter Model**: Chapter content with versioning, IP protection hashing, and publishing status
- **Translation Models**: Support for multilingual content (stories and chapters)
- **Version History**: Automatic chapter version tracking for content changes
- **Validation Rules**: Configurable content validation and moderation rules

### Content Validation & Security
- **Content Validator**: Comprehensive validation for stories and chapters
- **Sanitization**: HTML content cleaning and text sanitization
- **Encryption**: Content encryption utilities for secure storage
- **Backup**: Content backup and integrity verification
- **IP Protection**: SHA-256 content hashing for proof of authorship

### Key Features
- Automatic content fingerprinting for IP protection
- Version history tracking for all content changes
- Content validation with configurable rules
- Multilingual support with translation tracking
- Monetization configuration (free, coins, subscription)
- Content statistics and analytics tracking
- Secure content storage with encryption and backup
- **Advanced Content Discovery**: Full-text search with relevance scoring
- **Personalized Recommendations**: AI-powered content suggestions
- **Trending Content**: Real-time trending stories based on engagement
- **Content Filtering**: Advanced filtering by genre, language, rating, and more

## Database Schema

### Core Tables
- `stories` - Story metadata and configuration
- `chapters` - Chapter content and publishing information
- `chapter_versions` - Version history for content changes
- `story_translations` - Story metadata translations
- `chapter_translations` - Chapter content translations
- `content_validation_rules` - Configurable validation rules

### Key Relationships
- Stories have many chapters (1:N)
- Chapters have many versions (1:N)
- Stories and chapters have many translations (1:N)

## Content Validation Rules

### Default Validation Rules
- **Title Length**: 1-200 characters
- **Content Length**: 100-50,000 characters for chapters
- **Description Length**: Max 2,000 characters
- **Synopsis Length**: Max 5,000 characters
- **Profanity Filter**: Basic inappropriate content detection
- **Spam Detection**: Repeated characters and excessive capitalization

### Content Security
- HTML sanitization with allowed tags only
- XSS prevention through content cleaning
- Content encryption for sensitive storage
- Backup integrity verification with hashing

## API Schemas

### Request Schemas
- `StoryCreateRequest` - Story creation with validation
- `StoryUpdateRequest` - Story updates
- `ChapterCreateRequest` - Chapter creation with content validation
- `ChapterUpdateRequest` - Chapter updates with version tracking

### Response Schemas
- `StoryResponse` - Complete story information
- `ChapterResponse` - Full chapter data including content
- `ChapterSummaryResponse` - Chapter metadata without content
- `ContentValidationResponse` - Validation results with errors/warnings
- `SearchResponse` - Search results with relevance scoring
- `RecommendationResponse` - Personalized content recommendations
- `TrendingResponse` - Trending content based on engagement
- `SimilarStoriesResponse` - Similar story recommendations

## API Endpoints

### Content Management
- `POST /content/stories` - Create new story
- `GET /content/stories` - List stories with filtering
- `GET /content/stories/{id}` - Get specific story
- `PUT /content/stories/{id}` - Update story
- `POST /content/stories/{id}/publish` - Publish story

### Chapter Management  
- `POST /content/stories/{id}/chapters` - Create chapter
- `GET /content/stories/{id}/chapters` - List chapters
- `GET /content/chapters/{id}` - Get specific chapter
- `PUT /content/chapters/{id}` - Update chapter
- `POST /content/chapters/{id}/publish` - Publish chapter

### Content Discovery
- `POST /discovery/search` - Advanced content search
- `GET /discovery/search` - Simple search via URL parameters
- `GET /discovery/recommendations` - Personalized recommendations
- `GET /discovery/trending` - Trending content
- `GET /discovery/featured` - Featured/curated content
- `GET /discovery/similar/{story_id}` - Similar stories
- `GET /discovery/filters/genres` - Available genres
- `GET /discovery/filters/languages` - Available languages
- `GET /discovery/filters/tags` - Popular tags
- `GET /discovery/stats` - Discovery statistics

For detailed API documentation, see [SEARCH_DISCOVERY.md](./SEARCH_DISCOVERY.md)

## Testing

The service includes comprehensive tests covering:
- Model creation and relationships
- Content hashing and IP protection
- Version tracking and history
- Content validation and sanitization
- Encryption and backup utilities
- Content search and discovery functionality
- Recommendation algorithms and trending content
- API endpoints for search and recommendations

Run tests with:
```bash
# Run all tests
python -m pytest -v

# Run specific test suites
python -m pytest test_models.py -v          # Data models and validation
python -m pytest test_search_discovery.py -v  # Search and discovery features
```

## Requirements Addressed

This implementation addresses the following requirements from the specification:

### Requirement 2.1 (Story Publishing and Management)
- ✅ Story creation with unique digital fingerprint and timestamp
- ✅ Automatic copyright protection and licensing terms
- ✅ Monetization configuration (free, coins, subscription)
- ✅ Content validation and secure storage with backup

### Requirement 2.4 (Content Storage and Security)
- ✅ Content validation rules and sanitization
- ✅ Secure content storage with encryption
- ✅ Backup and integrity verification
- ✅ Version history for content changes

## Next Steps

The data models and validation system are now complete. The next subtask will implement the content publishing workflow with IP fingerprinting and moderation systems.

## Configuration

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection for caching

### Database Setup
The service automatically creates database tables on startup. Ensure PostgreSQL is running and accessible.