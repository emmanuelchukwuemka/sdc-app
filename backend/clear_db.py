#!/usr/bin/env python
"""
Script to clear the entire database (drop all tables and recreate them)
"""
import sys
import os

# Add backend folder to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from src.models import db

def clear_db():
    """Drop all tables and recreate them"""
    with app.app_context():
        print("WARNING: This will delete ALL data in the database.")
        confirm = input("Are you sure you want to proceed? (y/N): ")
        
        if confirm.lower() == 'y':
            print("Dropping all tables...")
            db.drop_all()
            print("Recreating all tables...")
            db.create_all()
            print("Database cleared and schema recreated successfully!")
            
            print("\nAvailable tables:")
            for table in db.metadata.tables.keys():
                print(f"  - {table}")
        else:
            print("Operation cancelled.")

if __name__ == "__main__":
    clear_db()
