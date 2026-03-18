#!/usr/bin/env python
"""
Script to verify all existing users in the database
Run this to allow existing users to login
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from src.models import db, User

def verify_all_users():
    """Verify all existing users"""
    with app.app_context():
        # Get all users
        users = User.query.all()
        
        print(f"Found {len(users)} users in the database")
        
        verified_count = 0
        for user in users:
            if not user.is_verified:
                user.is_verified = True
                verified_count += 1
                print(f"  Verified: {user.email} ({user.role})")
            else:
                print(f"  Already verified: {user.email} ({user.role})")
        
        if verified_count > 0:
            db.session.commit()
            print(f"\nSuccessfully verified {verified_count} users!")
        else:
            print("\nAll users are already verified!")

if __name__ == "__main__":
    verify_all_users()
