"""add_multi_tenancy_school_isolation_final

Revision ID: 42853ae5ee0e
Revises: 579436368d5b
Create Date: 2026-02-26 14:28:40.996927

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '42853ae5ee0e'
down_revision: Union[str, Sequence[str], None] = '579436368d5b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 0. Create schools table explicitly
    op.execute('''
    CREATE TABLE IF NOT EXISTS schools (
        id SERIAL PRIMARY KEY,
        name VARCHAR NOT NULL,
        subscription_start TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        subscription_end TIMESTAMP WITH TIME ZONE NOT NULL,
        max_teachers INTEGER DEFAULT 10 NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
    )
    ''')
    
    op.execute('''
    CREATE UNIQUE INDEX IF NOT EXISTS ix_schools_name ON schools (name)
    ''')
    
    # 1. Populate basic school (Only Default School)
    op.execute("INSERT INTO schools (id, name, subscription_end) VALUES (1, 'Default School', now() + interval '1 year') ON CONFLICT DO NOTHING")

    # 2. Add school_id to all relevant tables first as nullable using raw SQL
    tables_to_update = [
        'student_course', 'teacher_course', 'activity_logs', 
        'course', 'learning_material', 'notifications', 
        'signup_requests', 'submissions', 'users'
    ]
    
    for table in tables_to_update:
        op.execute(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS school_id INTEGER")
        
        # Default existing rows to school_id = 1
        # For tables that MUST belong to a school (courses, materials, students, etc.)
        if table in ['student_course', 'teacher_course', 'course', 'learning_material', 'submissions']:
            op.execute(f"UPDATE {table} SET school_id = 1 WHERE school_id IS NULL")
            op.execute(f"ALTER TABLE {table} ALTER COLUMN school_id SET NOT NULL")
        elif table == 'users':
            # For users, only set school_id=1 for non-super_admins
            op.execute(f"UPDATE {table} SET school_id = 1 WHERE school_id IS NULL AND role != 'super_admin'")
        else:
            # For activity_logs, notifications, signup_requests, keep it nullable
            pass
        
        op.execute(f"CREATE INDEX IF NOT EXISTS ix_{table}_school_id ON {table} (school_id)")
        
        if table not in ['activity_logs', 'notifications', 'signup_requests']:
            op.execute(f'''
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.table_constraints
                    WHERE constraint_name = '{table}_school_id_fkey'
                ) THEN
                    ALTER TABLE {table} ADD CONSTRAINT {table}_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);
                END IF;
            END
            $$;
            ''')


def downgrade() -> None:
    pass
