"""add_book_reviews_tables

Revision ID: e82c513a1115
Revises: 2726292ac7ff
Create Date: 2025-09-30 14:55:47.939188

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e82c513a1115'
down_revision: Union[str, Sequence[str], None] = '2726292ac7ff'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create book_reviews table
    op.create_table(
        'book_reviews',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('book_id', sa.String(36), sa.ForeignKey('books.id'), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('rating', sa.Integer, nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('is_spoiler', sa.Boolean, default=False),
        sa.Column('like_count', sa.Integer, default=0),
        sa.Column('is_reported', sa.Boolean, default=False),
        sa.Column('is_deleted', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint('book_id', 'user_id', name='_book_user_review_uc')
    )
    
    # Create review_likes table
    op.create_table(
        'review_likes',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('review_id', sa.String(36), sa.ForeignKey('book_reviews.id'), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint('review_id', 'user_id', name='_review_user_like_uc')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('review_likes')
    op.drop_table('book_reviews')
