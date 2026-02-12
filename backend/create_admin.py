#!/usr/bin/env python
"""
Script to create an admin user in the database
"""
import sys
import os

# Add backend folder to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from src.models import db, User
import bcrypt

def create_admin_user():
    """Create an admin user"""
    with app.app_context():
        # Check if admin already exists
        admin = User.query.filter_by(email='admin@sdc.com').first()
        if admin:
            print("Admin user already exists!")
            return
        
        # Create admin user
        password = 'admin123'
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        admin_user = User(
            email='admin@sdc.com',
            username='admin',
            password_hash=hashed_pw,
            role='ADMIN',
            first_name='Admin',
            last_name='User',
            is_verified=True,
            is_active=True
        )
        
        db.session.add(admin_user)
        db.session.commit()
        
        print("Admin user created successfully!")
        print(f"Email: admin@sdc.com")
        print(f"Password: {password}")
        print(f"Role: {admin_user.role}")

if __name__ == "__main__":
    create_admin_user()