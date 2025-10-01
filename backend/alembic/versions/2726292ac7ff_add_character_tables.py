"""add_character_tables

Revision ID: 2726292ac7ff
Revises: e6a84cde0647
Create Date: 2025-09-21 18:59:00.929887

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2726292ac7ff'
down_revision: Union[str, Sequence[str], None] = 'e6a84cde0647'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create characters table
    op.create_table('characters',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('gender', sa.String(length=50), nullable=True),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('relationships', sa.Text(), nullable=True),
        sa.Column('author_id', sa.String(36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create character_books association table
    op.create_table('character_books',
        sa.Column('character_id', sa.String(36), nullable=False),
        sa.Column('book_id', sa.String(36), nullable=False),
        sa.ForeignKeyConstraint(['book_id'], ['books.id'], ),
        sa.ForeignKeyConstraint(['character_id'], ['characters.id'], ),
        sa.PrimaryKeyConstraint('character_id', 'book_id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('character_books')
    op.drop_table('characters')