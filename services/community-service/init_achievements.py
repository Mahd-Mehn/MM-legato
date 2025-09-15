"""
Initialize sample achievements in the database
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Achievement, AchievementType
import os

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./community.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_sample_achievements():
    """Initialize sample achievements"""
    print("Initializing sample achievements...")
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if achievements already exist
        existing_count = db.query(Achievement).count()
        if existing_count > 0:
            print(f"Found {existing_count} existing achievements. Skipping initialization.")
            return
        
        # Writing achievements
        achievements = [
            Achievement(
                name="First Story",
                description="Publish your first story",
                type=AchievementType.WRITING,
                criteria={"stories_published": 1},
                points=100,
                rarity="common"
            ),
            Achievement(
                name="Prolific Writer",
                description="Publish 10 stories",
                type=AchievementType.WRITING,
                criteria={"stories_published": 10},
                points=500,
                rarity="rare"
            ),
            Achievement(
                name="Chapter Master",
                description="Publish 100 chapters",
                type=AchievementType.WRITING,
                criteria={"chapters_published": 100},
                points=1000,
                rarity="epic"
            ),
            Achievement(
                name="Wordsmith",
                description="Write 100,000 words",
                type=AchievementType.WRITING,
                criteria={"words_written": 100000},
                points=750,
                rarity="rare"
            ),
            
            # Reading achievements
            Achievement(
                name="Bookworm",
                description="Read 50 stories",
                type=AchievementType.READING,
                criteria={"stories_read": 50},
                points=300,
                rarity="common"
            ),
            Achievement(
                name="Speed Reader",
                description="Read for 100 hours",
                type=AchievementType.READING,
                criteria={"reading_time": 6000},  # 100 hours in minutes
                points=400,
                rarity="rare"
            ),
            
            # Community achievements
            Achievement(
                name="Commentator",
                description="Post 100 comments",
                type=AchievementType.COMMUNITY,
                criteria={"comments_posted": 100},
                points=200,
                rarity="common"
            ),
            Achievement(
                name="Popular Author",
                description="Get 1000 likes on your content",
                type=AchievementType.COMMUNITY,
                criteria={"likes_received": 1000},
                points=600,
                rarity="rare"
            ),
            Achievement(
                name="Influencer",
                description="Get 100 followers",
                type=AchievementType.COMMUNITY,
                criteria={"followers": 100},
                points=800,
                rarity="epic"
            ),
            
            # Engagement achievements
            Achievement(
                name="Dedicated Reader",
                description="Maintain a 30-day reading streak",
                type=AchievementType.ENGAGEMENT,
                criteria={"reading_streak": 30},
                points=400,
                rarity="rare"
            ),
            Achievement(
                name="Daily Writer",
                description="Maintain a 7-day writing streak",
                type=AchievementType.ENGAGEMENT,
                criteria={"writing_streak": 7},
                points=300,
                rarity="common"
            ),
            Achievement(
                name="Loyal User",
                description="Login for 100 consecutive days",
                type=AchievementType.ENGAGEMENT,
                criteria={"login_streak": 100},
                points=1000,
                rarity="legendary"
            ),
            
            # Milestone achievements
            Achievement(
                name="Rising Star",
                description="Earn 1000 points",
                type=AchievementType.MILESTONE,
                criteria={"total_points": 1000},
                points=100,
                rarity="common"
            ),
            Achievement(
                name="Community Champion",
                description="Earn 10000 points",
                type=AchievementType.MILESTONE,
                criteria={"total_points": 10000},
                points=500,
                rarity="epic"
            ),
            
            # Special achievements
            Achievement(
                name="Contest Winner",
                description="Win a writing contest",
                type=AchievementType.SPECIAL,
                criteria={"contests_won": 1},
                points=1500,
                rarity="legendary"
            ),
            Achievement(
                name="Contest Participant",
                description="Participate in 5 contests",
                type=AchievementType.SPECIAL,
                criteria={"contests_participated": 5},
                points=400,
                rarity="rare"
            )
        ]
        
        # Add achievements to database
        for achievement in achievements:
            db.add(achievement)
        
        db.commit()
        print(f"✅ Successfully created {len(achievements)} achievements!")
        
        # Print summary
        for achievement in achievements:
            print(f"   - {achievement.name} ({achievement.rarity}): {achievement.points} points")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating achievements: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_sample_achievements()