#!/usr/bin/env python
"""
Database initialization script
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from app import app  # Import the app instance directly
from src.models import db

def init_db():
    """Initialize the database"""
    with app.app_context():
        print("Creating all tables in the database...")
        db.create_all()
        print("Tables created successfully!")
        print("\nAvailable tables:")
        for table in db.metadata.tables.keys():
            print(f"  - {table}")

if __name__ == "__main__":
    init_db()