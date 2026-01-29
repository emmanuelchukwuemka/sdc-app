#!/usr/bin/env python
"""
Script to verify and reset admin user password
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from app import app
from src.models import db, User
import bcrypt

def verify_and_reset_admin():
    """Verify admin user and reset password"""
    with app.app_context():
        # Check if admin exists
        admin = User.query.filter_by(email='admin@sdc.com').first()
        if not admin:
            print("Admin user not found!")
            return
        
        print("Admin user found:")
        print(f"  Email: {admin.email}")
        print(f"  Role: {admin.role}")
        print(f"  First Name: {admin.first_name}")
        print(f"  Last Name: {admin.last_name}")
        
        # Reset password
        new_password = 'admin123'
        hashed_pw = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin.password_hash = hashed_pw
        
        db.session.commit()
        
        print(f"\nPassword reset successfully!")
        print(f"New password: {new_password}")

if __name__ == "__main__":
    verify_and_reset_admin()