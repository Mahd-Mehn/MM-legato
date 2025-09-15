# Content Discovery and Search System

## Overview

The Content Discovery and Search system provides comprehensive functionality for users to find and discover stories on the Legato platform. It includes full-text search, advanced filtering, personalized recommendations, trending content, and similar story suggestions.

## Features

### 1. Content Search
- **Full-text search** across story titles, descriptions, synopsis, and tags
- **Advanced filtering** by genre, language, content rating, monetization type, and chapter count
- **Flexible sorting** by relevance, popularity, recency, and other metrics
- **Pagination support** for large result sets
- **Relevance scoring** based on match quality and story popularity

### 2. Personalized Recommendations
- **User preference-based** recommendations using reading history and preferences
- **Collaborative filtering** based on similar user behavior patterns
- **Content-based filtering** using story attributes and metadata
- **Configurable exclusions** to avoid recommending already-read content

### 3. Trending Content
- **Time-based trending** algorithms considering recent engagement
- **Configurable time periods** (daily, weekly, monthly trends)
- **Multi-metric scoring** combining views, likes, bookmarks, and comments
- **Real-time updates** based on user activity

### 4. Featured Content
- **Editorial curation** of high-quality stories
- **Algorithm-driven selection** based on engagement and completion rates
- **Quality thresholds** ensuring minimum standards for featured content
- **Balanced representation** across genres and languages

### 5. Similar Stories
- **Content similarity** based on genre, tags, and attributes
- **Collaborative similarity** using user behavior patterns
- **Metadata matching** for stories with similar characteristics
- **Relevance ranking** to surface the most similar content

## API Endpoints

### Search Endpoints

#### POST /discovery/search
Search content with full request body control.

```json
{
  "query": "dragon fantasy",
  "search_in": ["title", "description", "tags"],
  "filters": {
    "genre": "fantasy",
    "language": "en",
    "content_rating": "teen",
    "min_chapters": 5,
    "max_chapters": 50,
    "sort_by": "relevance",
    "sort_order": "desc",
    "page": 1,
    "per_page": 20
  }
}
```

#### GET /discovery/search
Search content via URL parameters for easy sharing.

```
GET /discovery/search?q=dragon&genre=fantasy&language=en&page=1&per_page=20
```

### Recommendation Endpoints

#### GET /discovery/recommendations
Get personalized recommendations for the current user.

```
GET /discovery/recommendations?limit=20&exclude_stories=story-id-1,story-id-2
```

#### GET /discovery/trending
Get trending content based on recent activity.

```
GET /discovery/trending?limit=20&period_days=7
```

#### GET /discovery/featured
Get featured/curated content.

```
GET /discovery/featured?limit=10
```

#### GET /discovery/similar/{story_id}
Get stories similar to a specific story.

```
GET /discovery/similar/550e8400-e29b-41d4-a716-446655440000?limit=10
```

### Filter Information Endpoints

#### GET /discovery/filters/genres
Get available genres for filtering.

#### GET /discovery/filters/languages
Get available languages for filtering.

#### GET /discovery/filters/tags
Get popular tags for filtering.

#### GET /discovery/stats
Get overall discovery and engagement statistics.

## Search Features

### Full-Text Search
The search system supports searching across multiple fields:

- **Title**: Exact and partial matches with highest relevance weight
- **Description**: Content matches in story descriptions
- **Synopsis**: Detailed story synopsis search
- **Tags**: Tag-based discovery and filtering

### Advanced Filtering
Comprehensive filtering options:

- **Genre**: Primary story genre (fantasy, romance, sci-fi, etc.)
- **Subgenres**: Secondary genre classifications
- **Language**: Content language (en, es, fr, etc.)
- **Content Rating**: Age appropriateness (general, teen, mature, adult)
- **Status**: Publication status (published, completed, ongoing)
- **Monetization**: Free, coins, subscription, premium
- **Chapter Count**: Minimum and maximum chapter ranges
- **Word Count**: Story length filtering

### Relevance Scoring
The search relevance algorithm considers:

1. **Text Match Quality** (40% weight)
   - Exact title matches: +10 points
   - Title prefix matches: +5 bonus points
   - Description matches: +5 points
   - Synopsis matches: +3 points
   - Tag matches: +2 points per tag

2. **Popularity Metrics** (35% weight)
   - View count: 0.001 points per view
   - Like count: 0.01 points per like
   - Bookmark count: 0.02 points per bookmark

3. **Recency Boost** (25% weight)
   - Stories updated within 30 days get recency bonus
   - Linear decay: (30 - days_since_update) × 0.1

## Recommendation System

### Personalized Recommendations
The recommendation engine uses multiple signals:

1. **User Preferences**
   - Preferred genres and subgenres
   - Language preferences
   - Content rating limits
   - Reading length preferences

2. **Reading History**
   - Previously read stories
   - Liked and bookmarked content
   - Reading completion patterns
   - Time spent reading

3. **Content Attributes**
   - Genre similarity
   - Tag overlap
   - Author preferences
   - Story length preferences

### Recommendation Scoring
Recommendations are scored based on:

- **Genre Match**: +10 points for preferred genres
- **Language Match**: +5 points for preferred languages
- **Content Rating**: +3 points for appropriate ratings
- **Popularity Boost**: Based on engagement metrics
- **Recency Boost**: +2 points for recently updated stories
- **Length Preference**: +2 points for preferred story lengths

### Trending Algorithm
Trending content is determined by:

1. **Recent Activity Window**: Configurable time period (default 7 days)
2. **Engagement Metrics**: Views, likes, bookmarks, comments
3. **Weighted Scoring**: 
   - Views: 1× weight
   - Likes: 2× weight  
   - Bookmarks: 3× weight
   - Comments: 1.5× weight
4. **Minimum Thresholds**: Stories must meet minimum engagement levels

### Featured Content Selection
Featured stories are selected based on:

- **Quality Metrics**: High engagement rates and positive feedback
- **Completion Rates**: Stories with good reader retention
- **Editorial Guidelines**: Manual curation for quality assurance
- **Diversity**: Balanced representation across genres and languages
- **Minimum Standards**: At least 3 chapters, 10+ likes, 100+ views

## Implementation Details

### Database Optimization
- **Indexed Fields**: Genre, language, status, view_count, like_count
- **JSON Field Queries**: Efficient subgenre and tag filtering
- **Composite Indexes**: Multi-field filtering optimization
- **Query Optimization**: Pagination and sorting performance

### Caching Strategy
- **Search Results**: Cache frequent search queries
- **Recommendation Cache**: User-specific recommendation caching
- **Trending Cache**: Periodic trending content updates
- **Filter Cache**: Available genres, languages, and tags

### Performance Considerations
- **Pagination**: Efficient offset-based pagination
- **Query Limits**: Maximum result set limits to prevent performance issues
- **Background Processing**: Trending and featured content calculated asynchronously
- **Database Connection Pooling**: Optimized database access

## Usage Examples

### Basic Search
```python
# Search for fantasy stories
search_request = ContentSearchRequest(
    query="dragon",
    search_in=["title", "description"],
    filters=ContentFilterRequest(
        genre="fantasy",
        language="en",
        page=1,
        per_page=20
    )
)

results, total = search_service.search_content(search_request)
```

### Get Recommendations
```python
# Get personalized recommendations
recommendations = recommendation_service.get_personalized_recommendations(
    user_id="user-123",
    limit=10,
    exclude_story_ids=["story-1", "story-2"]
)
```

### Get Trending Content
```python
# Get weekly trending stories
trending = recommendation_service.get_trending_content(
    limit=20,
    time_period=7
)
```

## Testing

The search and discovery system includes comprehensive tests:

- **Unit Tests**: Individual service method testing
- **Integration Tests**: API endpoint testing
- **Performance Tests**: Search and recommendation performance
- **Data Quality Tests**: Result relevance and accuracy

Run tests with:
```bash
python -m pytest test_search_discovery.py -v
```

## Future Enhancements

### Planned Features
1. **ElasticSearch Integration**: Full-text search with advanced indexing
2. **Machine Learning**: AI-powered recommendation improvements
3. **Real-time Updates**: Live trending and recommendation updates
4. **A/B Testing**: Recommendation algorithm optimization
5. **Analytics**: Detailed search and discovery analytics
6. **Personalization**: Enhanced user preference learning

### Performance Improvements
1. **Search Index Optimization**: Dedicated search indexes
2. **Caching Layer**: Redis-based result caching
3. **Background Jobs**: Asynchronous recommendation updates
4. **CDN Integration**: Cached search results distribution

## Configuration

### Environment Variables
```bash
# Search configuration
SEARCH_MAX_RESULTS=1000
SEARCH_DEFAULT_PAGE_SIZE=20
SEARCH_CACHE_TTL=300

# Recommendation configuration
RECOMMENDATION_CACHE_TTL=3600
TRENDING_UPDATE_INTERVAL=1800
FEATURED_UPDATE_INTERVAL=86400

# Performance settings
MAX_CONCURRENT_SEARCHES=100
SEARCH_TIMEOUT=30
```

### Database Configuration
Ensure proper indexes are created for optimal performance:

```sql
-- Search optimization indexes
CREATE INDEX idx_stories_search ON stories(status, genre, language);
CREATE INDEX idx_stories_popularity ON stories(view_count DESC, like_count DESC);
CREATE INDEX idx_stories_updated ON stories(last_updated_at DESC);

-- Recommendation indexes
CREATE INDEX idx_stories_engagement ON stories(like_count + bookmark_count DESC);
CREATE INDEX idx_stories_trending ON stories(view_count + like_count * 2 + bookmark_count * 3 DESC);
```

## Monitoring and Analytics

### Key Metrics
- **Search Performance**: Query response times and success rates
- **Recommendation Quality**: Click-through rates and user engagement
- **Content Discovery**: Popular search terms and filter usage
- **User Behavior**: Search patterns and recommendation interactions

### Logging
The system logs important events:
- Search queries and results
- Recommendation generations
- Performance metrics
- Error conditions

### Health Checks
Regular health checks monitor:
- Database connectivity
- Search service availability
- Recommendation engine status
- Cache system health