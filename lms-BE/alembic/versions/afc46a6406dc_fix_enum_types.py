"""fix_enum_types

Revision ID: afc46a6406dc
Revises: 180818ee4335
Create Date: 2026-03-20 16:47:12.614036

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'afc46a6406dc'
down_revision: Union[str, Sequence[str], None] = '180818ee4335'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    connection = op.get_bind()
    result = connection.execute(sa.text("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE typname = 'assignment_type'"))
    existing_assignment_types = [r[0] for r in result.fetchall()]
    
    result_q = connection.execute(sa.text("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE typname = 'question_type'"))
    existing_question_types = [r[0] for r in result_q.fetchall()]

    with op.get_context().autocommit_block():
        if 'FILE_UPLOAD' not in existing_assignment_types:
            op.execute("ALTER TYPE assignment_type ADD VALUE 'FILE_UPLOAD'")
        if 'MCQ' not in existing_assignment_types:
            op.execute("ALTER TYPE assignment_type ADD VALUE 'MCQ'")
        if 'TEXT' not in existing_assignment_types:
            op.execute("ALTER TYPE assignment_type ADD VALUE 'TEXT'")

        if 'MCQ' not in existing_question_types:
            op.execute("ALTER TYPE question_type ADD VALUE 'MCQ'")
        if 'TEXT' not in existing_question_types:
            op.execute("ALTER TYPE question_type ADD VALUE 'TEXT'")


def downgrade() -> None:
    """Downgrade schema."""
    pass
