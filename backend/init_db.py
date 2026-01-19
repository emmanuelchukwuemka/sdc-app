#!/usr/bin/env python
"""
Database initialization script
"""
from app import create_app
from models import db

def init_db():
    """Initialize the database"""
    app = create_app()
    with app.app_context():
        print("Creating all tables in the database...")
        db.create_all()
        print("Tables created successfully!")
        print("\nAvailable tables:")
        for table in db.metadata.tables.keys():
            print(f"  - {table}")

if __name__ == "__main__":
    init_db()