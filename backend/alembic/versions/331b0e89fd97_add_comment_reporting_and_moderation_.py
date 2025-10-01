"""Add comment reporting and moderation system

Revision ID: 331b0e89fd97
Revises: e82c513a1115
Create Date: 2025-09-30 16:14:10.918951

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '331b0e89fd97'
down_revision: Union[str, Sequence[str], None] = 'e82c513a1115'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create moderation_logs table
    op.create_table('moderation_logs',
        sa.Column('moderator_id', sa.String(length=36), nullable=False),
        sa.Column('action', sa.Enum('DELETE_COMMENT', 'RESTORE_COMMENT', 'DISMISS_REPORT', 'WARN_USER', 'SUSPEND_USER', name='moderationaction'), nullable=False),
        sa.Column('target_type', sa.String(length=50), nullable=False),
        sa.Column('target_id', sa.String(length=36), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['moderator_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create comment_reports table
    op.create_table('comment_reports',
        sa.Column('comment_id', sa.String(length=36), nullable=False),
        sa.Column('reporter_id', sa.String(length=36), nullable=False),
        sa.Column('reason', sa.Enum('SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'HATE_SPEECH', 'VIOLENCE', 'COPYRIGHT', 'OTHER', name='reportreason'), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED', name='reportstatus'), nullable=True),
        sa.Column('reviewed_by', sa.String(length=36), nullable=True),
        sa.Column('reviewed_at', sa.String(length=50), nullable=True),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['comment_id'], ['comments.id'], ),
        sa.ForeignKeyConstraint(['reporter_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('comment_id', 'reporter_id', name='_comment_reporter_uc')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('comment_reports')
    op.drop_table('moderation_logs')