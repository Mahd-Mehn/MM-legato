"""
Content discovery and search API routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import status as http_status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from database import get_db
from schemas import (
    ContentSearchRequest, ContentFilterRequest, StoryResponse, 
    StoryListResponse, ErrorResponse
)
from search_service import ContentSearchService, ContentRecommendationService, SearchResult, RecommendationResult
from pydantic import BaseModel, Field

router = APIRouter(prefix="/discovery", tags=["discovery"])

# Dependency to get current user (placeholder - integrate with auth service)
async def get_current_user():
    """Get current authenticated user - integrate with auth service"""
    return {"user_id": "550e8400-e29b-41d4-a716-446655440000"}  # Placeholder

class SearchResponse(BaseModel):
    """Search response with results and metadata"""
    results: List[Dict[str, Any]] = Field(..., description="Search results")
    total: int = Field(..., description="Total number of results")
    page: int = Field(..., description="Current page")
    per_page: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total pages")
    query: str = Field(..., description="Search query")

class RecommendationResponse(BaseModel):
    """Recommendation response"""
    recommendations: List[Dict[str, Any]] = Field(..., description="Personalized recommendations")
    total: int = Field(..., description="Total recommendations")
    user_id: str = Field(..., description="User ID")

class TrendingResponse(BaseModel):
    """Trending content response"""
    trending: List[StoryResponse] = Field(..., description="Trending stories")
    period_days: int = Field(..., description="Time period in days")
    total: int = Field(..., description="Total trending stories")

class FeaturedResponse(BaseModel):
    """Featured content response"""
    featured: List[StoryResponse] = Field(..., description="Featured stories")
    total: int = Field(..., description="Total featured stories")

class SimilarStoriesResponse(BaseModel):
    """Similar stories response"""
    similar_stories: List[StoryResponse] = Field(..., description="Similar stories")
    reference_story_id: str = Field(..., description="Reference story ID")
    total: int = Field(..., description="Total similar stories")

@router.post("/search", response_model=SearchResponse)
async def search_content(
    search_request: ContentSearchRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Search content with full-text search and advanced filtering
    
    Supports searching in:
    - Story titles
    - Descriptions
    - Synopsis
    - Tags
    
    With filtering by:
    - Genre and subgenres
    - Language
    - Content rating
    - Story status
    - Monetization type
    - Chapter count range
    """
    try:
        search_service = ContentSearchService(db)
        results, total_count = search_service.search_content(
            search_request, 
            current_user.get("user_id")
        )
        
        # Convert results to response format
        search_results = []
        for result in results:
            search_results.append({
                "story": result.story.model_dump(),
                "relevance_score": result.relevance_score,
                "match_fields": result.match_fields
            })
        
        # Calculate pagination info
        page = search_request.filters.page if search_request.filters else 1
        per_page = search_request.filters.per_page if search_request.filters else 20
        total_pages = (total_count + per_page - 1) // per_page
        
        return SearchResponse(
            results=search_results,
            total=total_count,
            page=page,
            per_page=per_page,
            total_pages=total_pages,
            query=search_request.query
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )

@router.get("/search", response_model=SearchResponse)
async def search_content_get(
    q: str = Query(..., description="Search query"),
    search_in: Optional[str] = Query("title,description", description="Comma-separated fields to search in"),
    genre: Optional[str] = Query(None, description="Filter by genre"),
    language: Optional[str] = Query(None, description="Filter by language"),
    content_rating: Optional[str] = Query(None, description="Filter by content rating"),
    min_chapters: Optional[int] = Query(None, description="Minimum chapter count"),
    max_chapters: Optional[int] = Query(None, description="Maximum chapter count"),
    sort_by: Optional[str] = Query("relevance", description="Sort field"),
    sort_order: Optional[str] = Query("desc", description="Sort order"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Search content via GET request (for easy URL sharing)
    """
    try:
        # Parse search_in parameter
        search_fields = [field.strip() for field in search_in.split(",")]
        
        # Create search request
        filters = ContentFilterRequest(
            genre=genre,
            language=language,
            content_rating=content_rating,
            min_chapters=min_chapters,
            max_chapters=max_chapters,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            per_page=per_page
        )
        
        search_request = ContentSearchRequest(
            query=q,
            search_in=search_fields,
            filters=filters
        )
        
        # Use the POST endpoint logic
        return await search_content(search_request, db, current_user)
        
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )

@router.get("/recommendations", response_model=RecommendationResponse)
async def get_personalized_recommendations(
    limit: int = Query(20, ge=1, le=50, description="Number of recommendations"),
    exclude_stories: Optional[str] = Query(None, description="Comma-separated story IDs to exclude"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get personalized content recommendations based on user preferences and reading history
    """
    try:
        recommendation_service = ContentRecommendationService(db)
        
        # Parse excluded story IDs
        exclude_story_ids = None
        if exclude_stories:
            exclude_story_ids = [story_id.strip() for story_id in exclude_stories.split(",")]
        
        recommendations = recommendation_service.get_personalized_recommendations(
            current_user["user_id"],
            limit=limit,
            exclude_story_ids=exclude_story_ids
        )
        
        # Convert to response format
        recommendation_results = []
        for rec in recommendations:
            recommendation_results.append({
                "story": rec.story.model_dump(),
                "recommendation_score": rec.recommendation_score,
                "reason": rec.reason
            })
        
        return RecommendationResponse(
            recommendations=recommendation_results,
            total=len(recommendation_results),
            user_id=current_user["user_id"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get recommendations: {str(e)}"
        )

@router.get("/trending", response_model=TrendingResponse)
async def get_trending_content(
    limit: int = Query(20, ge=1, le=50, description="Number of trending stories"),
    period_days: int = Query(7, ge=1, le=30, description="Time period in days"),
    db: Session = Depends(get_db)
):
    """
    Get trending content based on recent activity and engagement
    """
    try:
        recommendation_service = ContentRecommendationService(db)
        trending_stories = recommendation_service.get_trending_content(
            limit=limit,
            time_period=period_days
        )
        
        return TrendingResponse(
            trending=trending_stories,
            period_days=period_days,
            total=len(trending_stories)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get trending content: {str(e)}"
        )

@router.get("/featured", response_model=FeaturedResponse)
async def get_featured_content(
    limit: int = Query(10, ge=1, le=20, description="Number of featured stories"),
    db: Session = Depends(get_db)
):
    """
    Get featured content (high-quality, popular stories selected by algorithm)
    """
    try:
        recommendation_service = ContentRecommendationService(db)
        featured_stories = recommendation_service.get_featured_content(limit=limit)
        
        return FeaturedResponse(
            featured=featured_stories,
            total=len(featured_stories)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get featured content: {str(e)}"
        )

@router.get("/similar/{story_id}", response_model=SimilarStoriesResponse)
async def get_similar_stories(
    story_id: str,
    limit: int = Query(10, ge=1, le=20, description="Number of similar stories"),
    db: Session = Depends(get_db)
):
    """
    Get stories similar to a given story based on genre, tags, and other attributes
    """
    try:
        recommendation_service = ContentRecommendationService(db)
        similar_stories = recommendation_service.get_similar_stories(
            story_id=story_id,
            limit=limit
        )
        
        return SimilarStoriesResponse(
            similar_stories=similar_stories,
            reference_story_id=story_id,
            total=len(similar_stories)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get similar stories: {str(e)}"
        )

@router.get("/filters/genres")
async def get_available_genres(db: Session = Depends(get_db)):
    """Get list of available genres for filtering"""
    try:
        from sqlalchemy import distinct
        from models import Story
        
        genres = db.query(distinct(Story.genre)).filter(
            Story.status == "published"
        ).all()
        
        return {
            "genres": [genre[0] for genre in genres if genre[0]],
            "total": len(genres)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get genres: {str(e)}"
        )

@router.get("/filters/languages")
async def get_available_languages(db: Session = Depends(get_db)):
    """Get list of available languages for filtering"""
    try:
        from sqlalchemy import distinct
        from models import Story
        
        languages = db.query(distinct(Story.language)).filter(
            Story.status == "published"
        ).all()
        
        return {
            "languages": [lang[0] for lang in languages if lang[0]],
            "total": len(languages)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get languages: {str(e)}"
        )

@router.get("/filters/tags")
async def get_popular_tags(
    limit: int = Query(50, ge=1, le=100, description="Number of popular tags"),
    db: Session = Depends(get_db)
):
    """Get list of popular tags for filtering"""
    try:
        from sqlalchemy import func
        from models import Story
        
        # This is a simplified version - in production, you'd want to properly
        # extract and count tags from the JSON field
        stories_with_tags = db.query(Story.tags).filter(
            Story.status == "published",
            Story.tags.isnot(None)
        ).all()
        
        # Count tag occurrences
        tag_counts = {}
        for story_tags in stories_with_tags:
            if story_tags[0]:  # story_tags is a tuple
                for tag in story_tags[0]:
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        # Sort by popularity and return top tags
        popular_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
        
        return {
            "tags": [{"tag": tag, "count": count} for tag, count in popular_tags],
            "total": len(popular_tags)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get tags: {str(e)}"
        )

@router.get("/stats")
async def get_discovery_stats(db: Session = Depends(get_db)):
    """Get overall content discovery statistics"""
    try:
        from sqlalchemy import func
        from models import Story, StoryStatus
        
        # Get basic statistics
        total_stories = db.query(Story).filter(Story.status == StoryStatus.PUBLISHED).count()
        total_genres = db.query(func.count(func.distinct(Story.genre))).filter(
            Story.status == StoryStatus.PUBLISHED
        ).scalar()
        total_languages = db.query(func.count(func.distinct(Story.language))).filter(
            Story.status == StoryStatus.PUBLISHED
        ).scalar()
        
        # Get engagement statistics
        total_views = db.query(func.sum(Story.view_count)).filter(
            Story.status == StoryStatus.PUBLISHED
        ).scalar() or 0
        total_likes = db.query(func.sum(Story.like_count)).filter(
            Story.status == StoryStatus.PUBLISHED
        ).scalar() or 0
        total_bookmarks = db.query(func.sum(Story.bookmark_count)).filter(
            Story.status == StoryStatus.PUBLISHED
        ).scalar() or 0
        
        return {
            "content_stats": {
                "total_stories": total_stories,
                "total_genres": total_genres,
                "total_languages": total_languages
            },
            "engagement_stats": {
                "total_views": total_views,
                "total_likes": total_likes,
                "total_bookmarks": total_bookmarks,
                "average_views_per_story": total_views / total_stories if total_stories > 0 else 0
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get discovery stats: {str(e)}"
        )