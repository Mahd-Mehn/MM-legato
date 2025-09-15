"""
Content search and discovery service with ElasticSearch integration
"""
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, asc
from datetime import datetime, timedelta
import json
import logging
from dataclasses import dataclass

from models import Story, Chapter, StoryStatus, ContentRating, MonetizationType
from schemas import ContentFilterRequest, ContentSearchRequest, StoryResponse
from publishing_service import story_to_response

logger = logging.getLogger(__name__)

@dataclass
class SearchResult:
    """Search result with relevance scoring"""
    story: StoryResponse
    relevance_score: float
    match_fields: List[str]

@dataclass
class RecommendationResult:
    """Recommendation result with reasoning"""
    story: StoryResponse
    recommendation_score: float
    reason: str

class ContentSearchService:
    """Content search service with advanced filtering and ranking"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def search_content(
        self, 
        search_request: ContentSearchRequest,
        user_id: Optional[str] = None
    ) -> Tuple[List[SearchResult], int]:
        """
        Search content with full-text search and filtering
        Returns (results, total_count)
        """
        try:
            # Start with base query
            query = self.db.query(Story).filter(Story.status == StoryStatus.PUBLISHED)
            
            # Apply text search
            if search_request.query:
                search_conditions = []
                query_lower = search_request.query.lower()
                
                for field in search_request.search_in:
                    if field == "title":
                        search_conditions.append(func.lower(Story.title).contains(query_lower))
                    elif field == "description":
                        search_conditions.append(func.lower(Story.description).contains(query_lower))
                    elif field == "synopsis":
                        search_conditions.append(func.lower(Story.synopsis).contains(query_lower))
                    elif field == "tags":
                        # Search in JSON tags array
                        search_conditions.append(
                            func.lower(func.cast(Story.tags, db.String)).contains(query_lower)
                        )
                
                if search_conditions:
                    query = query.filter(or_(*search_conditions))
            
            # Apply filters if provided
            if search_request.filters:
                query = self._apply_filters(query, search_request.filters)
            
            # Get total count before pagination
            total_count = query.count()
            
            # Apply sorting
            if search_request.filters and search_request.filters.sort_by:
                query = self._apply_sorting(query, search_request.filters)
            else:
                # Default sort by relevance (view_count + like_count)
                query = query.order_by(desc(Story.view_count + Story.like_count))
            
            # Apply pagination
            if search_request.filters:
                offset = (search_request.filters.page - 1) * search_request.filters.per_page
                query = query.offset(offset).limit(search_request.filters.per_page)
            
            # Execute query
            stories = query.all()
            
            # Convert to search results with relevance scoring
            results = []
            for story in stories:
                relevance_score = self._calculate_relevance_score(
                    story, search_request.query, search_request.search_in
                )
                match_fields = self._identify_match_fields(
                    story, search_request.query, search_request.search_in
                )
                
                results.append(SearchResult(
                    story=story_to_response(story),
                    relevance_score=relevance_score,
                    match_fields=match_fields
                ))
            
            # Sort by relevance score if no explicit sorting
            if not (search_request.filters and search_request.filters.sort_by):
                results.sort(key=lambda x: x.relevance_score, reverse=True)
            
            return results, total_count
            
        except Exception as e:
            logger.error(f"Error in content search: {str(e)}")
            raise
    
    def _apply_filters(self, query, filters: ContentFilterRequest):
        """Apply content filters to query"""
        if filters.genre:
            query = query.filter(Story.genre == filters.genre.lower())
        
        if filters.subgenres:
            # Filter by subgenres (JSON array contains)
            for subgenre in filters.subgenres:
                query = query.filter(
                    func.json_extract(Story.subgenres, '$').contains(f'"{subgenre.lower()}"')
                )
        
        if filters.tags:
            # Filter by tags (JSON array contains)
            for tag in filters.tags:
                query = query.filter(
                    func.json_extract(Story.tags, '$').contains(f'"{tag.lower()}"')
                )
        
        if filters.language:
            query = query.filter(Story.language == filters.language)
        
        if filters.content_rating:
            query = query.filter(Story.content_rating == filters.content_rating)
        
        if filters.status:
            query = query.filter(Story.status == filters.status)
        
        if filters.monetization_type:
            query = query.filter(Story.monetization_type == filters.monetization_type)
        
        if filters.min_chapters is not None:
            query = query.filter(Story.total_chapters >= filters.min_chapters)
        
        if filters.max_chapters is not None:
            query = query.filter(Story.total_chapters <= filters.max_chapters)
        
        return query
    
    def _apply_sorting(self, query, filters: ContentFilterRequest):
        """Apply sorting to query"""
        sort_field = filters.sort_by
        sort_order = filters.sort_order or "desc"
        
        # Map sort fields to model attributes
        sort_mapping = {
            "created_at": Story.created_at,
            "updated_at": Story.updated_at,
            "title": Story.title,
            "view_count": Story.view_count,
            "like_count": Story.like_count,
            "bookmark_count": Story.bookmark_count,
            "total_chapters": Story.total_chapters,
            "total_words": Story.total_words,
            "first_published_at": Story.first_published_at,
            "last_updated_at": Story.last_updated_at
        }
        
        if sort_field in sort_mapping:
            sort_column = sort_mapping[sort_field]
            if sort_order.lower() == "asc":
                query = query.order_by(asc(sort_column))
            else:
                query = query.order_by(desc(sort_column))
        
        return query
    
    def _calculate_relevance_score(
        self, 
        story: Story, 
        query: str, 
        search_fields: List[str]
    ) -> float:
        """Calculate relevance score for search result"""
        if not query:
            # Base score on popularity metrics
            return (story.view_count * 0.4 + 
                   story.like_count * 0.3 + 
                   story.bookmark_count * 0.3)
        
        score = 0.0
        query_lower = query.lower()
        
        # Title match (highest weight)
        if "title" in search_fields and story.title:
            if query_lower in story.title.lower():
                score += 10.0
                if story.title.lower().startswith(query_lower):
                    score += 5.0  # Bonus for prefix match
        
        # Description match
        if "description" in search_fields and story.description:
            if query_lower in story.description.lower():
                score += 5.0
        
        # Synopsis match
        if "synopsis" in search_fields and story.synopsis:
            if query_lower in story.synopsis.lower():
                score += 3.0
        
        # Tags match
        if "tags" in search_fields and story.tags:
            for tag in story.tags:
                if query_lower in tag.lower():
                    score += 2.0
        
        # Boost score based on story popularity
        popularity_boost = (
            story.view_count * 0.001 + 
            story.like_count * 0.01 + 
            story.bookmark_count * 0.02
        )
        score += popularity_boost
        
        # Boost recent content
        if story.last_updated_at:
            days_since_update = (datetime.utcnow() - story.last_updated_at).days
            if days_since_update < 30:
                score += (30 - days_since_update) * 0.1
        
        return score
    
    def _identify_match_fields(
        self, 
        story: Story, 
        query: str, 
        search_fields: List[str]
    ) -> List[str]:
        """Identify which fields matched the search query"""
        if not query:
            return []
        
        match_fields = []
        query_lower = query.lower()
        
        if "title" in search_fields and story.title and query_lower in story.title.lower():
            match_fields.append("title")
        
        if "description" in search_fields and story.description and query_lower in story.description.lower():
            match_fields.append("description")
        
        if "synopsis" in search_fields and story.synopsis and query_lower in story.synopsis.lower():
            match_fields.append("synopsis")
        
        if "tags" in search_fields and story.tags:
            for tag in story.tags:
                if query_lower in tag.lower():
                    match_fields.append("tags")
                    break
        
        return match_fields

class ContentRecommendationService:
    """Content recommendation service based on user preferences and behavior"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_personalized_recommendations(
        self, 
        user_id: str, 
        limit: int = 20,
        exclude_story_ids: Optional[List[str]] = None
    ) -> List[RecommendationResult]:
        """Get personalized content recommendations for a user"""
        try:
            # Get user reading history and preferences (placeholder - integrate with user service)
            user_preferences = self._get_user_preferences(user_id)
            
            # Start with published stories
            query = self.db.query(Story).filter(Story.status == StoryStatus.PUBLISHED)
            
            # Exclude stories user has already read/bookmarked
            if exclude_story_ids:
                query = query.filter(~Story.id.in_(exclude_story_ids))
            
            # Apply preference-based filtering
            if user_preferences.get("preferred_genres"):
                query = query.filter(Story.genre.in_(user_preferences["preferred_genres"]))
            
            if user_preferences.get("preferred_languages"):
                query = query.filter(Story.language.in_(user_preferences["preferred_languages"]))
            
            if user_preferences.get("max_content_rating"):
                query = query.filter(Story.content_rating <= user_preferences["max_content_rating"])
            
            # Get candidate stories
            stories = query.limit(limit * 3).all()  # Get more candidates for better filtering
            
            # Score and rank recommendations
            recommendations = []
            for story in stories:
                score = self._calculate_recommendation_score(story, user_preferences)
                reason = self._generate_recommendation_reason(story, user_preferences)
                
                recommendations.append(RecommendationResult(
                    story=story_to_response(story),
                    recommendation_score=score,
                    reason=reason
                ))
            
            # Sort by recommendation score and return top results
            recommendations.sort(key=lambda x: x.recommendation_score, reverse=True)
            return recommendations[:limit]
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            return []
    
    def get_trending_content(self, limit: int = 20, time_period: int = 7) -> List[StoryResponse]:
        """Get trending content based on recent activity"""
        try:
            # Calculate trending score based on recent views, likes, and bookmarks
            cutoff_date = datetime.utcnow() - timedelta(days=time_period)
            
            query = self.db.query(Story).filter(
                and_(
                    Story.status == StoryStatus.PUBLISHED,
                    Story.last_updated_at >= cutoff_date
                )
            )
            
            # Order by trending score (combination of metrics)
            trending_stories = query.order_by(
                desc(Story.view_count + Story.like_count * 2 + Story.bookmark_count * 3)
            ).limit(limit).all()
            
            return [story_to_response(story) for story in trending_stories]
            
        except Exception as e:
            logger.error(f"Error getting trending content: {str(e)}")
            return []
    
    def get_featured_content(self, limit: int = 10) -> List[StoryResponse]:
        """Get featured content (high-quality, popular stories)"""
        try:
            # Featured content criteria:
            # - High engagement (likes + bookmarks)
            # - Good completion rate (multiple chapters)
            # - Recent activity
            
            query = self.db.query(Story).filter(
                and_(
                    Story.status == StoryStatus.PUBLISHED,
                    Story.total_chapters >= 3,  # At least 3 chapters
                    Story.like_count >= 10,     # Minimum engagement
                    Story.view_count >= 100     # Minimum visibility
                )
            )
            
            # Calculate featured score
            featured_stories = query.order_by(
                desc(
                    Story.like_count * 0.4 + 
                    Story.bookmark_count * 0.3 + 
                    Story.view_count * 0.2 + 
                    Story.total_chapters * 0.1
                )
            ).limit(limit).all()
            
            return [story_to_response(story) for story in featured_stories]
            
        except Exception as e:
            logger.error(f"Error getting featured content: {str(e)}")
            return []
    
    def get_similar_stories(self, story_id: str, limit: int = 10) -> List[StoryResponse]:
        """Get stories similar to a given story"""
        try:
            # Get the reference story
            reference_story = self.db.query(Story).filter(Story.id == story_id).first()
            if not reference_story:
                return []
            
            # Find similar stories based on genre, tags, and subgenres
            query = self.db.query(Story).filter(
                and_(
                    Story.status == StoryStatus.PUBLISHED,
                    Story.id != story_id
                )
            )
            
            # Filter by same genre
            similar_stories = query.filter(Story.genre == reference_story.genre)
            
            # Get all candidates
            candidates = similar_stories.all()
            
            # Score similarity
            scored_stories = []
            for story in candidates:
                similarity_score = self._calculate_similarity_score(reference_story, story)
                if similarity_score > 0:
                    scored_stories.append((story, similarity_score))
            
            # Sort by similarity and return top results
            scored_stories.sort(key=lambda x: x[1], reverse=True)
            similar_stories = [story for story, _ in scored_stories[:limit]]
            
            return [story_to_response(story) for story in similar_stories]
            
        except Exception as e:
            logger.error(f"Error getting similar stories: {str(e)}")
            return []
    
    def _get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """Get user preferences (placeholder - integrate with user service)"""
        # This should integrate with the user service to get actual preferences
        return {
            "preferred_genres": ["fantasy", "romance", "adventure"],
            "preferred_languages": ["en", "es"],
            "max_content_rating": ContentRating.MATURE,
            "preferred_length": "medium",  # short, medium, long
            "reading_history": []
        }
    
    def _calculate_recommendation_score(self, story: Story, user_preferences: Dict[str, Any]) -> float:
        """Calculate recommendation score based on user preferences"""
        score = 0.0
        
        # Genre preference match
        if story.genre in user_preferences.get("preferred_genres", []):
            score += 10.0
        
        # Language preference match
        if story.language in user_preferences.get("preferred_languages", []):
            score += 5.0
        
        # Content rating appropriateness
        max_rating = user_preferences.get("max_content_rating", ContentRating.ADULT)
        if story.content_rating.value <= max_rating.value:
            score += 3.0
        
        # Popularity boost
        popularity_score = (
            story.view_count * 0.001 + 
            story.like_count * 0.01 + 
            story.bookmark_count * 0.02
        )
        score += popularity_score
        
        # Recency boost
        if story.last_updated_at:
            days_since_update = (datetime.utcnow() - story.last_updated_at).days
            if days_since_update < 7:
                score += 2.0
            elif days_since_update < 30:
                score += 1.0
        
        # Length preference
        preferred_length = user_preferences.get("preferred_length", "medium")
        if preferred_length == "short" and story.total_chapters <= 10:
            score += 2.0
        elif preferred_length == "medium" and 10 < story.total_chapters <= 50:
            score += 2.0
        elif preferred_length == "long" and story.total_chapters > 50:
            score += 2.0
        
        return score
    
    def _generate_recommendation_reason(self, story: Story, user_preferences: Dict[str, Any]) -> str:
        """Generate human-readable reason for recommendation"""
        reasons = []
        
        if story.genre in user_preferences.get("preferred_genres", []):
            reasons.append(f"matches your interest in {story.genre}")
        
        if story.like_count > 100:
            reasons.append("highly rated by readers")
        
        if story.total_chapters > 20:
            reasons.append("long-form story with rich content")
        
        if story.last_updated_at and (datetime.utcnow() - story.last_updated_at).days < 7:
            reasons.append("recently updated")
        
        if not reasons:
            reasons.append("popular in your preferred genres")
        
        return "Recommended because it " + " and ".join(reasons)
    
    def _calculate_similarity_score(self, story1: Story, story2: Story) -> float:
        """Calculate similarity score between two stories"""
        score = 0.0
        
        # Same genre
        if story1.genre == story2.genre:
            score += 5.0
        
        # Overlapping subgenres
        if story1.subgenres and story2.subgenres:
            common_subgenres = set(story1.subgenres) & set(story2.subgenres)
            score += len(common_subgenres) * 2.0
        
        # Overlapping tags
        if story1.tags and story2.tags:
            common_tags = set(story1.tags) & set(story2.tags)
            score += len(common_tags) * 1.0
        
        # Similar content rating
        if story1.content_rating == story2.content_rating:
            score += 1.0
        
        # Similar length
        chapter_diff = abs(story1.total_chapters - story2.total_chapters)
        if chapter_diff <= 5:
            score += 2.0
        elif chapter_diff <= 10:
            score += 1.0
        
        return score