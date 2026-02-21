from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

# Import all models for Alembic autogenerate
from app.features.users import models, models_student, models_teacher
from app.features.courses import (
    models as list_models,
    models_materials,
    models_assignment,
    models_mcq,
    models_notes,
    models_question,
    models_answer,
    models_student_assignment
)
from app.features.auth import models as auth_models
from app.features.enrollments import models_student as enrollment_student, models_teacher as enrollment_teacher, models_consent
from app.features.submissions import models as models_submissions
from app.features.notifications import models as models_notifications
from app.features.activity_logs import models as models_activity_logs
from app.features.signup_requests import models as models_signup_requests