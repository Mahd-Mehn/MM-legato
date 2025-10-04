"""add_comment_tables

Revision ID: e6a84cde0647
Revises: 88aba9d5df64
Create Date: 2025-09-21 18:24:33.569757

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = 'e6a84cde0647'
down_revision: Union[str, Sequence[str], None] = '88aba9d5df64'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create comments table
    op.create_table(
        'comments',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('chapter_id', sa.String(), sa.ForeignKey('chapters.id'), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('parent_id', sa.String(), sa.ForeignKey('comments.id'), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('like_count', sa.Integer(), default=0),
        sa.Column('is_reported', sa.Boolean(), default=False),
        sa.Column('is_deleted', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Create comment_likes table
    op.create_table(
        'comment_likes',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('comment_id', sa.String(), sa.ForeignKey('comments.id'), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint('comment_id', 'user_id', name='_comment_user_like_uc'),
    )
    
    # Create indexes for better performance
    op.create_index('ix_comments_chapter_id', 'comments', ['chapter_id'])
    op.create_index('ix_comments_user_id', 'comments', ['user_id'])
    op.create_index('ix_comments_parent_id', 'comments', ['parent_id'])
    op.create_index('ix_comment_likes_comment_id', 'comment_likes', ['comment_id'])
    op.create_index('ix_comment_likes_user_id', 'comment_likes', ['user_id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop indexes
    op.drop_index('ix_comment_likes_user_id')
    op.drop_index('ix_comment_likes_comment_id')
    op.drop_index('ix_comments_parent_id')
    op.drop_index('ix_comments_user_id')
    op.drop_index('ix_comments_chapter_id')
    
    # Drop tables
    op.drop_table('comment_likes')
    op.drop_table('comments')