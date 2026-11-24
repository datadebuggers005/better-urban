"""Reset and seed the local SQLite database."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.models import init_db, SessionLocal, User, Incident, Notification
from db.local_store import LocalStore

# Delete existing DB
db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "betterurban.db")
if os.path.exists(db_path):
    os.remove(db_path)
    print("Removed old DB")

init_db()
store = LocalStore()
from db.models import SessionLocal
db = SessionLocal()
print("Seeded. Users:", db.query(User).count())
print("incidents:", db.query(Incident).count())
print("notifications:", db.query(Notification).count())
from db.models import Feedback
print("feedback:", db.query(Feedback).count())
db.close()