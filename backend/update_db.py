import sys
import os

# Add parent to path to import src
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from src.app import create_app
from src.models import db

app = create_app()
with app.app_context():
    print("Creating database tables...")
    db.create_all()
    print("Done!")
