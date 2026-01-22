from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.models.user import User
from app.crud.user import hash_password

db: Session = SessionLocal()

user = db.query(User).filter(User.email == "principal@example.com").first()

user.password_hash = hash_password("Principal123")
db.commit()

print("Password reset successful")

# uv run python