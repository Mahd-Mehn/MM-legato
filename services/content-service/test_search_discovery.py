"""
Tests for content search and discovery functionality
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid
from datetime import datetime, timedelta

from main import app
from database import get_db, Base
from models import Story, Chapter, StoryStatus, ChapterStatus, ContentRating, MonetizationType
from search_service import ContentSearchService, ContentRecommendationService
from schemas import ContentSearchRequest, ContentFilterRequest

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_search.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def setup_database():
    """Set up test database with sample data"""
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    
    # Create sample stories for testing
    sample_stories = [
        {
            "id": uuid.uuid4(),
            "author_id": uuid.uuid4(),
            "title": "The Dragon's Quest",
            "description": "An epic fantasy adventure about a young hero",
            "synopsis": "A detailed story about dragons and magic in a medieval world",
            "genre": "fantasy",
            "subgenres": ["adventure", "magic"],
            "tags": ["dragon", "hero", "medieval", "magic"],
            "language": "en",
            "status": StoryStatus.PUBLISHED,
            "content_rating": ContentRating.TEEN,
            "monetization_type": MonetizationType.FREE,
            "total_chapters": 15,
            "total_words": 45000,
            "view_count": 1500,
            "like_count": 120,
            "bookmark_count": 80,
            "first_published_at": datetime.utcnow() - timedelta(days=30),
            "last_updated_at": datetime.utcnow() - timedelta(days=2)
        },
        {
            "id": uuid.uuid4(),
            "author_id": uuid.uuid4(),
            "title": "Love in Paris",
            "description": "A romantic story set in the city of love",
            "synopsis": "Two strangers meet in Paris and fall in love",
            "genre": "romance",
            "subgenres": ["contemporary", "travel"],
            "tags": ["love", "paris", "travel", "contemporary"],
            "language": "en",
            "status": StoryStatus.PUBLISHED,
            "content_rating": ContentRating.MATURE,
            "monetization_type": MonetizationType.COINS,
            "coin_price_per_chapter": 5,
            "total_chapters": 8,
            "total_words": 24000,
            "view_count": 800,
            "like_count": 95,
            "bookmark_count": 60,
            "first_published_at": datetime.utcnow() - timedelta(days=15),
            "last_updated_at": datetime.utcnow() - timedelta(days=1)
        },
        {
            "id": uuid.uuid4(),
            "author_id": uuid.uuid4(),
            "title": "Space Odyssey 2024",
            "description": "A science fiction thriller in space",
            "synopsis": "Humanity's first mission to Mars encounters unexpected challenges",
            "genre": "science-fiction",
            "subgenres": ["space", "thriller"],
            "tags": ["space", "mars", "future", "technology"],
            "language": "en",
            "status": StoryStatus.PUBLISHED,
            "content_rating": ContentRating.GENERAL,
            "monetization_type": MonetizationType.SUBSCRIPTION,
            "total_chapters": 20,
            "total_words": 60000,
            "view_count": 2200,
            "like_count": 180,
            "bookmark_count": 150,
            "first_published_at": datetime.utcnow() - timedelta(days=45),
            "last_updated_at": datetime.utcnow() - timedelta(days=5)
        },
        {
            "id": uuid.uuid4(),
            "author_id": uuid.uuid4(),
            "title": "El Misterio del Castillo",
            "description": "Una historia de misterio en español",
            "synopsis": "Un detective investiga extraños eventos en un castillo antiguo",
            "genre": "mystery",
            "subgenres": ["detective", "historical"],
            "tags": ["misterio", "castillo", "detective", "español"],
            "language": "es",
            "status": StoryStatus.PUBLISHED,
            "content_rating": ContentRating.TEEN,
            "monetization_type": MonetizationType.FREE,
            "total_chapters": 12,
            "total_words": 36000,
            "view_count": 600,
            "like_count": 45,
            "bookmark_count": 30,
            "first_published_at": datetime.utcnow() - timedelta(days=20),
            "last_updated_at": datetime.utcnow() - timedelta(days=3)
        }
    ]
    
    for story_data in sample_stories:
        story = Story(**story_data)
        db.add(story)
    
    db.commit()
    
    yield db
    
    db.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    """Test client fixture"""
    return TestClient(app)

class TestContentSearch:
    """Test content search functionality"""
    
    def test_search_by_title(self, setup_database, client):
        """Test searching by story title"""
        response = client.get("/discovery/search?q=Dragon")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] >= 1
        assert any("Dragon" in result["story"]["title"] for result in data["results"])
    
    def test_search_by_description(self, setup_database, client):
        """Test searching by story description"""
        response = client.get("/discovery/search?q=romantic&search_in=description")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] >= 1
        assert any("romantic" in result["story"]["description"].lower() for result in data["results"])
    
    def test_search_with_genre_filter(self, setup_database, client):
        """Test searching with genre filter"""
        response = client.get("/discovery/search?q=story&genre=fantasy")
        assert response.status_code == 200
        
        data = response.json()
        for result in data["results"]:
            assert result["story"]["genre"] == "fantasy"
    
    def test_search_with_language_filter(self, setup_database, client):
        """Test searching with language filter"""
        response = client.get("/discovery/search?q=historia&language=es")
        assert response.status_code == 200
        
        data = response.json()
        for result in data["results"]:
            assert result["story"]["language"] == "es"
    
    def test_search_with_content_rating_filter(self, setup_database, client):
        """Test searching with content rating filter"""
        response = client.get("/discovery/search?q=story&content_rating=general")
        assert response.status_code == 200
        
        data = response.json()
        for result in data["results"]:
            assert result["story"]["content_rating"] == "general"
    
    def test_search_with_chapter_count_filter(self, setup_database, client):
        """Test searching with chapter count filter"""
        response = client.get("/discovery/search?q=story&min_chapters=10&max_chapters=20")
        assert response.status_code == 200
        
        data = response.json()
        for result in data["results"]:
            chapters = result["story"]["total_chapters"]
            assert 10 <= chapters <= 20
    
    def test_search_pagination(self, setup_database, client):
        """Test search pagination"""
        response = client.get("/discovery/search?q=story&page=1&per_page=2")
        assert response.status_code == 200
        
        data = response.json()
        assert data["page"] == 1
        assert data["per_page"] == 2
        assert len(data["results"]) <= 2
    
    def test_search_sorting(self, setup_database, client):
        """Test search result sorting"""
        response = client.get("/discovery/search?q=story&sort_by=view_count&sort_order=desc")
        assert response.status_code == 200
        
        data = response.json()
        if len(data["results"]) > 1:
            # Check that results are sorted by view count in descending order
            view_counts = [result["story"]["view_count"] for result in data["results"]]
            assert view_counts == sorted(view_counts, reverse=True)
    
    def test_search_post_endpoint(self, setup_database, client):
        """Test POST search endpoint"""
        search_request = {
            "query": "Dragon",
            "search_in": ["title", "description"],
            "filters": {
                "genre": "fantasy",
                "page": 1,
                "per_page": 10
            }
        }
        
        response = client.post("/discovery/search", json=search_request)
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] >= 1
        assert data["query"] == "Dragon"

class TestContentRecommendations:
    """Test content recommendation functionality"""
    
    def test_get_personalized_recommendations(self, setup_database, client):
        """Test personalized recommendations"""
        response = client.get("/discovery/recommendations?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert "recommendations" in data
        assert len(data["recommendations"]) <= 5
        assert "user_id" in data
        
        # Check that each recommendation has required fields
        for rec in data["recommendations"]:
            assert "story" in rec
            assert "recommendation_score" in rec
            assert "reason" in rec
    
    def test_recommendations_with_exclusions(self, setup_database, client):
        """Test recommendations with excluded stories"""
        # First get a story ID to exclude
        search_response = client.get("/discovery/search?q=Dragon")
        search_data = search_response.json()
        
        if search_data["results"]:
            story_id = search_data["results"][0]["story"]["id"]
            
            response = client.get(f"/discovery/recommendations?exclude_stories={story_id}")
            assert response.status_code == 200
            
            data = response.json()
            # Verify the excluded story is not in recommendations
            for rec in data["recommendations"]:
                assert rec["story"]["id"] != story_id
    
    def test_get_trending_content(self, setup_database, client):
        """Test trending content endpoint"""
        response = client.get("/discovery/trending?limit=5&period_days=7")
        assert response.status_code == 200
        
        data = response.json()
        assert "trending" in data
        assert len(data["trending"]) <= 5
        assert data["period_days"] == 7
    
    def test_get_featured_content(self, setup_database, client):
        """Test featured content endpoint"""
        response = client.get("/discovery/featured?limit=3")
        assert response.status_code == 200
        
        data = response.json()
        assert "featured" in data
        assert len(data["featured"]) <= 3
    
    def test_get_similar_stories(self, setup_database, client):
        """Test similar stories endpoint"""
        # First get a story ID
        search_response = client.get("/discovery/search?q=Dragon")
        search_data = search_response.json()
        
        if search_data["results"]:
            story_id = search_data["results"][0]["story"]["id"]
            
            response = client.get(f"/discovery/similar/{story_id}?limit=3")
            assert response.status_code == 200
            
            data = response.json()
            assert "similar_stories" in data
            assert data["reference_story_id"] == story_id
            assert len(data["similar_stories"]) <= 3
            
            # Verify the reference story is not in similar stories
            for story in data["similar_stories"]:
                assert story["id"] != story_id

class TestDiscoveryFilters:
    """Test discovery filter endpoints"""
    
    def test_get_available_genres(self, setup_database, client):
        """Test getting available genres"""
        response = client.get("/discovery/filters/genres")
        assert response.status_code == 200
        
        data = response.json()
        assert "genres" in data
        assert "total" in data
        assert isinstance(data["genres"], list)
    
    def test_get_available_languages(self, setup_database, client):
        """Test getting available languages"""
        response = client.get("/discovery/filters/languages")
        assert response.status_code == 200
        
        data = response.json()
        assert "languages" in data
        assert "total" in data
        assert isinstance(data["languages"], list)
    
    def test_get_popular_tags(self, setup_database, client):
        """Test getting popular tags"""
        response = client.get("/discovery/filters/tags?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "tags" in data
        assert "total" in data
        assert isinstance(data["tags"], list)
    
    def test_get_discovery_stats(self, setup_database, client):
        """Test getting discovery statistics"""
        response = client.get("/discovery/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "content_stats" in data
        assert "engagement_stats" in data
        
        content_stats = data["content_stats"]
        assert "total_stories" in content_stats
        assert "total_genres" in content_stats
        assert "total_languages" in content_stats
        
        engagement_stats = data["engagement_stats"]
        assert "total_views" in engagement_stats
        assert "total_likes" in engagement_stats
        assert "total_bookmarks" in engagement_stats

class TestSearchService:
    """Test search service directly"""
    
    def test_search_service_initialization(self, setup_database):
        """Test search service initialization"""
        db = setup_database
        search_service = ContentSearchService(db)
        assert search_service.db == db
    
    def test_content_search_with_filters(self, setup_database):
        """Test content search with various filters"""
        db = setup_database
        search_service = ContentSearchService(db)
        
        # Create search request
        filters = ContentFilterRequest(
            genre="fantasy",
            language="en",
            page=1,
            per_page=10
        )
        
        search_request = ContentSearchRequest(
            query="dragon",
            search_in=["title", "description"],
            filters=filters
        )
        
        results, total_count = search_service.search_content(search_request)
        
        assert isinstance(results, list)
        assert isinstance(total_count, int)
        assert total_count >= 0
        
        # Verify filtering worked
        for result in results:
            assert result.story.genre == "fantasy"
            assert result.story.language == "en"
    
    def test_recommendation_service_initialization(self, setup_database):
        """Test recommendation service initialization"""
        db = setup_database
        rec_service = ContentRecommendationService(db)
        assert rec_service.db == db
    
    def test_personalized_recommendations(self, setup_database):
        """Test personalized recommendations"""
        db = setup_database
        rec_service = ContentRecommendationService(db)
        
        user_id = str(uuid.uuid4())
        recommendations = rec_service.get_personalized_recommendations(user_id, limit=5)
        
        assert isinstance(recommendations, list)
        assert len(recommendations) <= 5
        
        for rec in recommendations:
            assert hasattr(rec, 'story')
            assert hasattr(rec, 'recommendation_score')
            assert hasattr(rec, 'reason')
    
    def test_trending_content(self, setup_database):
        """Test trending content"""
        db = setup_database
        rec_service = ContentRecommendationService(db)
        
        trending = rec_service.get_trending_content(limit=5, time_period=7)
        
        assert isinstance(trending, list)
        assert len(trending) <= 5
    
    def test_featured_content(self, setup_database):
        """Test featured content"""
        db = setup_database
        rec_service = ContentRecommendationService(db)
        
        featured = rec_service.get_featured_content(limit=3)
        
        assert isinstance(featured, list)
        assert len(featured) <= 3
    
    def test_similar_stories(self, setup_database):
        """Test similar stories"""
        db = setup_database
        rec_service = ContentRecommendationService(db)
        
        # Get a story ID from the database
        story = db.query(Story).first()
        if story:
            similar = rec_service.get_similar_stories(str(story.id), limit=3)
            
            assert isinstance(similar, list)
            assert len(similar) <= 3
            
            # Verify the reference story is not in results
            for similar_story in similar:
                assert similar_story.id != str(story.id)

if __name__ == "__main__":
    pytest.main([__file__, "-v"])