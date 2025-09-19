"""Add reading preferences table simple

Revision ID: c1d2e3f4g5h6
Revises: 642d68afaa91
Create Date: 2025-09-18 22:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4g5h6'
down_revision: Union[str, Sequence[str], None] = '642d68afaa91'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('reading_preferences',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('font_family', sa.String(length=50), nullable=True, default='serif'),
        sa.Column('font_size', sa.Integer(), nullable=True, default=16),
        sa.Column('line_height', sa.Float(), nullable=True, default=1.6),
        sa.Column('background_color', sa.String(length=7), nullable=True, default='#ffffff'),
        sa.Column('text_color', sa.String(length=7), nullable=True, default='#000000'),
        sa.Column('page_width', sa.Integer(), nullable=True, default=800),
        sa.Column('brightness', sa.Integer(), nullable=True, default=100),
        sa.Column('wallpaper_url', sa.String(length=500), nullable=True),
        sa.Column('theme_preset', sa.String(length=20), nullable=True, default='light'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('reading_preferences')