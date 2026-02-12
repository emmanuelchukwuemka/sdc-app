#!/usr/bin/env python
"""
Database initialization script
"""
import sys
import os

# Add backend folder to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app  # Import from root app.py
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