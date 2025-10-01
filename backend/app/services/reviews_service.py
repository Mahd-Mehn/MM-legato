from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc

from app.models.community import BookReview, ReviewLike
from app.models.book import Book
from app.models.user import User
from app.models.library import ReadingProgress
from app.schemas.reviews import ReviewCreate, ReviewUpdate, ReviewResponse, BookReviewsResponse
from app.core.exceptions import HTTPException

class ReviewsService:
    def __init__(self, db: Session):
        self.db = db

    def has_user_started_reading(self, user_id: UUID, book_id: UUID) -> bool:
        """Check if user has started reading the book"""
        progress = self.db.query(ReadingProgress).filter(
            and_(
                ReadingProgress.user_id == str(user_id),
                ReadingProgress.book_id == str(book_id)
            )
        ).first()
        return progress is not None

    def get_user_review(self, user_id: UUID, book_id: UUID) -> Optional[BookReview]:
        """Get user's existing review for a book"""
        return self.db.query(BookReview).filter(
            and_(
                BookReview.user_id == str(user_id),
                BookReview.book_id == str(book_id),
                BookReview.is_deleted == False
            )
        ).first()

    def create_review(self, user_id: UUID, review_data: ReviewCreate) -> ReviewResponse:
        """Create a new book review"""
        # Check if book exists
        book = self.db.query(Book).filter(Book.id == str(review_data.book_id)).first()
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")

        # Check if user has started reading the book
        if not self.has_user_started_reading(user_id, review_data.book_id):
            raise HTTPException(
                status_code=403, 
                detail="You must start reading the book before you can review it"
            )

        # Check if user already has a review for this book
        existing_review = self.get_user_review(user_id, review_data.book_id)
        if existing_review:
            raise HTTPException(
                status_code=409, 
                detail="You have already reviewed this book. Use update instead."
            )

        # Get current user info
        current_user = self.db.query(User).filter(User.id == str(user_id)).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Create the review
        review = BookReview(
            book_id=str(review_data.book_id),
            user_id=str(user_id),
            rating=review_data.rating,
            title=review_data.title,
            content=review_data.content,
            is_spoiler=review_data.is_spoiler
        )

        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)

        # Create notification for book author (if reviewer is not the author)
        if book.author_id != str(user_id):
            from app.services.notification_service import NotificationService
            notification_service = NotificationService(self.db)
            notification_service.create_review_notification(
                user_id=book.author_id,
                reviewer_name=current_user.username,
                book_title=book.title,
                book_id=book.id,
                review_id=review.id,
                rating=review_data.rating
            )

        return self._build_review_response(review, user_id)

    def update_review(self, user_id: UUID, review_id: UUID, review_data: ReviewUpdate) -> ReviewResponse:
        """Update an existing review"""
        review = self.db.query(BookReview).filter(
            and_(
                BookReview.id == str(review_id),
                BookReview.user_id == str(user_id),
                BookReview.is_deleted == False
            )
        ).first()

        if not review:
            raise HTTPException(status_code=404, detail="Review not found")

        # Update fields
        if review_data.rating is not None:
            review.rating = review_data.rating
        if review_data.title is not None:
            review.title = review_data.title
        if review_data.content is not None:
            review.content = review_data.content
        if review_data.is_spoiler is not None:
            review.is_spoiler = review_data.is_spoiler

        self.db.commit()
        self.db.refresh(review)

        return self._build_review_response(review, user_id)

    def delete_review(self, user_id: UUID, review_id: UUID) -> bool:
        """Soft delete a review"""
        review = self.db.query(BookReview).filter(
            and_(
                BookReview.id == str(review_id),
                BookReview.user_id == str(user_id),
                BookReview.is_deleted == False
            )
        ).first()

        if not review:
            raise HTTPException(status_code=404, detail="Review not found")

        review.is_deleted = True
        self.db.commit()
        return True

    def get_book_reviews(self, book_id: UUID, current_user_id: Optional[UUID] = None, 
                        page: int = 1, limit: int = 20) -> BookReviewsResponse:
        """Get all reviews for a book with pagination"""
        offset = (page - 1) * limit

        # Get reviews with user info
        reviews_query = self.db.query(BookReview).filter(
            and_(
                BookReview.book_id == str(book_id),
                BookReview.is_deleted == False
            )
        ).order_by(desc(BookReview.created_at))

        total_count = reviews_query.count()
        reviews = reviews_query.offset(offset).limit(limit).all()

        # Build response objects
        review_responses = []
        for review in reviews:
            review_responses.append(self._build_review_response(review, current_user_id))

        # Calculate average rating and distribution
        all_reviews = self.db.query(BookReview).filter(
            and_(
                BookReview.book_id == str(book_id),
                BookReview.is_deleted == False
            )
        ).all()

        average_rating = None
        rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        
        if all_reviews:
            total_rating = sum(r.rating for r in all_reviews)
            average_rating = round(total_rating / len(all_reviews), 1)
            
            for review in all_reviews:
                rating_distribution[review.rating] += 1

        return BookReviewsResponse(
            reviews=review_responses,
            total_count=total_count,
            average_rating=average_rating,
            rating_distribution=rating_distribution
        )

    def like_review(self, user_id: UUID, review_id: UUID) -> bool:
        """Like or unlike a review"""
        review = self.db.query(BookReview).filter(
            and_(
                BookReview.id == str(review_id),
                BookReview.is_deleted == False
            )
        ).first()

        if not review:
            raise HTTPException(status_code=404, detail="Review not found")

        # Get current user info
        current_user = self.db.query(User).filter(User.id == str(user_id)).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get book info for notification
        book = self.db.query(Book).filter(Book.id == review.book_id).first()

        # Check if already liked
        existing_like = self.db.query(ReviewLike).filter(
            and_(
                ReviewLike.review_id == str(review_id),
                ReviewLike.user_id == str(user_id)
            )
        ).first()

        if existing_like:
            # Unlike - remove the like
            self.db.delete(existing_like)
            review.like_count = max(0, review.like_count - 1)
            self.db.commit()
            return False
        else:
            # Like - add the like
            like = ReviewLike(
                review_id=str(review_id),
                user_id=str(user_id)
            )
            self.db.add(like)
            review.like_count += 1
            
            # Create notification for review author (only if liking, not unliking, and not liking own review)
            if review.user_id != str(user_id) and book:
                from app.services.notification_service import NotificationService
                notification_service = NotificationService(self.db)
                notification_service.create_review_like_notification(
                    user_id=review.user_id,
                    liker_name=current_user.username,
                    book_title=book.title,
                    review_id=str(review_id)
                )
            
            self.db.commit()
            return True

    def _build_review_response(self, review: BookReview, current_user_id: Optional[UUID] = None) -> ReviewResponse:
        """Build a review response with additional info"""
        # Get user info
        user = self.db.query(User).filter(User.id == review.user_id).first()
        
        # Check if current user has liked this review
        is_liked = False
        if current_user_id:
            like = self.db.query(ReviewLike).filter(
                and_(
                    ReviewLike.review_id == review.id,
                    ReviewLike.user_id == str(current_user_id)
                )
            ).first()
            is_liked = like is not None

        # Check if review author is the book author
        book = self.db.query(Book).filter(Book.id == review.book_id).first()
        is_author_review = book and book.author_id == review.user_id

        return ReviewResponse(
            id=review.id,
            book_id=review.book_id,
            user_id=review.user_id,
            rating=review.rating,
            title=review.title,
            content=review.content,
            is_spoiler=review.is_spoiler,
            like_count=review.like_count,
            is_reported=review.is_reported,
            is_deleted=review.is_deleted,
            created_at=review.created_at,
            updated_at=review.updated_at,
            user_username=user.username if user else None,
            user_profile_picture=user.profile_picture_url if user else None,
            is_liked_by_current_user=is_liked,
            is_author_review=is_author_review
        )