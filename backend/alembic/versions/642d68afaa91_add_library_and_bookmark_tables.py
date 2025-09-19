"""add_library_and_bookmark_tables

Revision ID: 642d68afaa91
Revises: 4b34fb20ca9c
Create Date: 2025-09-18 21:16:07.734521

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '642d68afaa91'
down_revision: Union[str, Sequence[str], None] = '4b34fb20ca9c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create user_library table
    op.create_table(
        'user_library',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('book_id', sa.String(), nullable=False),
        sa.Column('is_in_vault', sa.Boolean(), nullable=True, default=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=True, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['book_id'], ['books.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'book_id', name='_user_book_uc')
    )
    
    # Create bookmarks table
    op.create_table(
        'bookmarks',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('chapter_id', sa.String(), nullable=False),
        sa.Column('position_percentage', sa.DECIMAL(precision=5, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['chapter_id'], ['chapters.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'chapter_id', name='_user_chapter_bookmark_uc')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('bookmarks')
    op.drop_table('user_library')
