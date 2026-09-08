"""Add soft delete and updated_at

Revision ID: 4db0ad6b9af6
Revises: dbc3c06f7edd
Create Date: 2026-01-22 11:51:20.843693

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4db0ad6b9af6'
down_revision: Union[str, Sequence[str], None] = 'dbc3c06f7edd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---------- course ----------
    op.add_column(
        'course',
        sa.Column('is_deleted', sa.Boolean(), nullable=True)
    )
    op.add_column(
        'course',
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=True
        )
    )

    op.execute("UPDATE course SET is_deleted = false")
    op.execute("UPDATE course SET updated_at = now()")

    op.alter_column('course', 'is_deleted', nullable=False)
    op.alter_column('course', 'updated_at', nullable=False)

    # ---------- learning_material ----------
    op.add_column(
        'learning_material',
        sa.Column('is_deleted', sa.Boolean(), nullable=True)
    )
    op.add_column(
        'learning_material',
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=True
        )
    )

    op.execute("UPDATE learning_material SET is_deleted = false")
    op.execute("UPDATE learning_material SET updated_at = now()")

    op.alter_column('learning_material', 'is_deleted', nullable=False)
    op.alter_column('learning_material', 'updated_at', nullable=False)

    # ---------- student_assignments ----------
    op.add_column(
        'student_assignments',
        sa.Column('is_deleted', sa.Boolean(), nullable=True)
    )
    op.add_column(
        'student_assignments',
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=True
        )
    )

    op.execute("UPDATE student_assignments SET is_deleted = false")
    op.execute("UPDATE student_assignments SET updated_at = now()")

    op.alter_column('student_assignments', 'is_deleted', nullable=False)
    op.alter_column('student_assignments', 'updated_at', nullable=False)

    # ---------- users ----------
    op.add_column(
        'users',
        sa.Column('is_deleted', sa.Boolean(), nullable=True)
    )
    op.add_column(
        'users',
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=True
        )
    )

    op.execute("UPDATE users SET is_deleted = false")
    op.execute("UPDATE users SET updated_at = now()")

    op.alter_column('users', 'is_deleted', nullable=False)
    op.alter_column('users', 'updated_at', nullable=False)

    # ---------- constraints ----------
    op.create_unique_constraint(
        'uq_student_course',
        'student_course',
        ['student_id', 'course_id']
    )
    op.create_unique_constraint(
        'uq_teacher_course',
        'teacher_course',
        ['teacher_id', 'course_id']
    )
    op.create_unique_constraint(
        'uq_teacher_principal_consent',
        'teacher_principal_consent',
        ['teacher_id', 'principal_id']
    )


def downgrade() -> None:
    op.drop_constraint('uq_teacher_principal_consent', 'teacher_principal_consent', type_='unique')
    op.drop_constraint('uq_teacher_course', 'teacher_course', type_='unique')
    op.drop_constraint('uq_student_course', 'student_course', type_='unique')

    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'is_deleted')

    op.drop_column('student_assignments', 'updated_at')
    op.drop_column('student_assignments', 'is_deleted')

    op.drop_column('learning_material', 'updated_at')
    op.drop_column('learning_material', 'is_deleted')

    op.drop_column('course', 'updated_at')
    op.drop_column('course', 'is_deleted')
