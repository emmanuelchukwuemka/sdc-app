
import pytest
import json
import tempfile
import os
import sys
from unittest.mock import patch, MagicMock
import bcrypt

# Add backend to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.app import create_app
from src.models import db, User, Agency


class TestAuthAPI:
    """Test authentication endpoints for all roles"""
    
    @pytest.fixture
    def app(self):
        """Create and configure a new app instance for each test"""
        db_fd, db_path = tempfile.mkstemp(suffix='.db')
        
        app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
            'SQLALCHEMY_TRACK_MODIFICATIONS': False,
            'SECRET_KEY': 'test-secret-key',
            'JWT_SECRET_KEY': 'test-jwt-secret-key-change-this-32-chars',
            'MAIL_SUPPRESS_SEND': True,
            'WTF_CSRF_ENABLED': False
        })
        
        with app.app_context():
            db.create_all()
            yield app
        
        # Close database connections before deleting
        try:
            with app.app_context():
                db.session.remove()
                db.engine.dispose()
        except:
            pass
        
        try:
            os.close(db_fd)
        except:
            pass
        try:
            os.unlink(db_path)
        except:
            pass
    
    @pytest.fixture
    def client(self, app):
        """Create a test client"""
        return app.test_client()
    
    @pytest.fixture
    def init_data(self, app):
        """Initialize test data"""
        with app.app_context():
            # Create test users for each role
            test_users = {
                'admin': {
                    'email': 'admin@test.com',
                    'password': 'admin123',
                    'role': 'admin'
                },
                'agency': {
                    'email': 'agency@test.com',
                    'password': 'agency123',
                    'role': 'agency'
                },
                'donor': {
                    'email': 'donor@test.com',
                    'password': 'donor123',
                    'role': 'donor'
                },
                'surrogate': {
                    'email': 'surrogate@test.com',
                    'password': 'surrogate123',
                    'role': 'surrogate'
                },
                'intending_parent': {
                    'email': 'ip@test.com',
                    'password': 'ip123',
                    'role': 'intending_parent'
                }
            }

            for user_key, user_data in test_users.items():
                hashed_pw = bcrypt.hashpw(user_data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                user = User(
                    email=user_data['email'],
                    username=user_data['email'].split('@')[0],
                    password_hash=hashed_pw,
                    role=user_data['role'],
                    is_verified=True,
                    is_active=True
                )
                db.session.add(user)

            db.session.commit()
    
    def test_register_admin(self, client):
        """Test admin registration"""
        response = client.post('/api/auth/register', json={
            'email': 'newadmin@test.com',
            'password': 'newadmin123',
            'role': 'admin'
        })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert 'access_token' in data
        assert data['role'] == 'admin'
        assert data['email'] == 'newadmin@test.com'
    
    def test_register_agency(self, client):
        """Test agency registration"""
        response = client.post('/api/auth/register', json={
            'email': 'newagency@test.com',
            'password': 'newagency123',
            'role': 'agency'
        })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert 'access_token' in data
        assert data['role'] == 'agency'
    
    def test_register_donor(self, client):
        """Test donor registration"""
        response = client.post('/api/auth/register', json={
            'email': 'newdonor@test.com',
            'password': 'newdonor123',
            'role': 'donor'
        })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert 'access_token' in data
        assert data['role'] == 'donor'
    
    def test_register_surrogate(self, client):
        """Test surrogate registration"""
        response = client.post('/api/auth/register', json={
            'email': 'newsurrogate@test.com',
            'password': 'newsurrogate123',
            'role': 'surrogate'
        })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert 'access_token' in data
        assert data['role'] == 'surrogate'
    
    def test_register_intending_parent(self, client):
        """Test intending parent registration"""
        response = client.post('/api/auth/register', json={
            'email': 'newip@test.com',
            'password': 'newip123',
            'role': 'intending_parent'
        })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert 'access_token' in data
        assert data['role'] == 'intending_parent'
    
    def test_register_invalid_role(self, client):
        """Test registration with invalid role"""
        response = client.post('/api/auth/register', json={
            'email': 'invalid@test.com',
            'password': 'invalid123',
            'role': 'invalid_role'
        })
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Invalid role' in data['msg']
    
    def test_register_missing_fields(self, client):
        """Test registration with missing required fields"""
        response = client.post('/api/auth/register', json={
            'email': 'test@test.com'
            # Missing password and role
        })
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Missing required fields' in data['msg']
    
    def test_login_admin(self, client, init_data):
        """Test admin login"""
        response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'admin123'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'access_token' in data
        assert data['role'] == 'admin'
        assert data['email'] == 'admin@test.com'
    
    def test_login_agency(self, client, init_data):
        """Test agency login"""
        response = client.post('/api/auth/login', json={
            'email': 'agency@test.com',
            'password': 'agency123'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'access_token' in data
        assert data['role'] == 'agency'
        assert data['email'] == 'agency@test.com'
    
    def test_login_donor(self, client, init_data):
        """Test donor login"""
        response = client.post('/api/auth/login', json={
            'email': 'donor@test.com',
            'password': 'donor123'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'access_token' in data
        assert data['role'] == 'donor'
        assert data['email'] == 'donor@test.com'
    
    def test_login_surrogate(self, client, init_data):
        """Test surrogate login"""
        response = client.post('/api/auth/login', json={
            'email': 'surrogate@test.com',
            'password': 'surrogate123'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'access_token' in data
        assert data['role'] == 'surrogate'
        assert data['email'] == 'surrogate@test.com'
    
    def test_login_intending_parent(self, client, init_data):
        """Test intending parent login"""
        response = client.post('/api/auth/login', json={
            'email': 'ip@test.com',
            'password': 'ip123'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'access_token' in data
        assert data['role'] == 'intending_parent'
        assert data['email'] == 'ip@test.com'
    
    def test_login_invalid_credentials(self, client, init_data):
        """Test login with invalid credentials"""
        response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'wrongpassword'
        })
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'Invalid credentials' in data['msg']
    
    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user"""
        response = client.post('/api/auth/login', json={
            'email': 'nonexistent@test.com',
            'password': 'password123'
        })
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'Invalid credentials' in data['msg']
    
    def test_login_unverified_user(self, client):
        """Test login with unverified user"""
        with client.application.app_context():
            user = User(
                email='unverified@test.com',
                username='unverified',
                password_hash=bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                role='donor',
                is_verified=False,
                is_active=True
            )
            db.session.add(user)
            db.session.commit()
        
        response = client.post('/api/auth/login', json={
            'email': 'unverified@test.com',
            'password': 'password123'
        })
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'Please verify your email first' in data['msg']
    
    def test_login_inactive_user(self, client):
        """Test login with inactive user"""
        with client.application.app_context():
            user = User(
                email='inactive@test.com',
                username='inactive',
                password_hash=bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                role='donor',
                is_verified=True,
                is_active=False
            )
            db.session.add(user)
            db.session.commit()
        
        response = client.post('/api/auth/login', json={
            'email': 'inactive@test.com',
            'password': 'password123'
        })
        
        assert response.status_code == 401
        data = json.loads(response.data)
        assert 'Account is inactive' in data['msg']
    
    def test_logout(self, client, init_data):
        """Test logout"""
        # First login
        login_response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'admin123'
        })
        
        token = json.loads(login_response.data)['access_token']
        
        # Then logout
        response = client.post('/api/auth/logout', headers={
            'Authorization': f'Bearer {token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['msg'] == 'Successfully logged out'
    
    def test_logout_without_token(self, client):
        """Test logout without token"""
        response = client.post('/api/auth/logout')
        
        assert response.status_code == 401
    
    def test_refresh_token(self, client, init_data):
        """Test token refresh"""
        # First login
        login_response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'admin123'
        })
        
        token = json.loads(login_response.data)['access_token']
        
        # Then refresh
        response = client.post('/api/auth/refresh', headers={
            'Authorization': f'Bearer {token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'access_token' in data
    
    def test_refresh_token_without_token(self, client):
        """Test token refresh without token"""
        response = client.post('/api/auth/refresh')
        
        assert response.status_code == 401
    
    def test_forgot_password(self, client, init_data):
        """Test forgot password"""
        response = client.post('/api/auth/forgot-password', json={
            'email': 'admin@test.com'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['msg'] == 'Password reset email sent'
    
    def test_forgot_password_nonexistent_user(self, client):
        """Test forgot password with non-existent user"""
        response = client.post('/api/auth/forgot-password', json={
            'email': 'nonexistent@test.com'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        # For security, return same message whether user exists or not
        assert 'reset' in data['msg'].lower() or 'email' in data['msg'].lower()
    
    def test_reset_password(self, client, init_data):
        """Test password reset"""
        # First request password reset
        forgot_response = client.post('/api/auth/forgot-password', json={
            'email': 'admin@test.com'
        })
        
        # Get the reset token from the database
        with client.application.app_context():
            user = User.query.filter_by(email='admin@test.com').first()
            token = user.get_reset_token()
        
        # Then reset password
        response = client.post('/api/auth/reset-password', json={
            'token': token,
            'password': 'newpassword123'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['msg'] == 'Password has been reset successfully'
    
    def test_reset_password_invalid_token(self, client):
        """Test password reset with invalid token"""
        response = client.post('/api/auth/reset-password', json={
            'token': 'invalid_token',
            'password': 'newpassword123'
        })
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Invalid or expired token' in data['msg']
    
    def test_verify_email(self, client, init_data):
        """Test email verification"""
        # Create an unverified user
        with client.application.app_context():
            user = User(
                email='verify@test.com',
                username='verify',
                password_hash=bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                role='donor',
                is_verified=False,
                is_active=True
            )
            db.session.add(user)
            db.session.commit()
            token = user.get_verification_token()
        
        response = client.get(f'/api/auth/verify-email/{token}')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['msg'] == 'Email verified successfully'
    
    def test_verify_email_invalid_token(self, client):
        """Test email verification with invalid token"""
        response = client.get('/api/auth/verify-email/invalid_token')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Invalid or expired token' in data['msg']
    
    def test_verify_email_already_verified(self, client, init_data):
        """Test email verification for already verified user"""
        with client.application.app_context():
            user = User.query.filter_by(email='admin@test.com').first()
            token = user.get_verification_token()
        
        response = client.get(f'/api/auth/verify-email/{token}')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'already verified' in data['msg'].lower()
    
    def test_change_password(self, client, init_data):
        """Test password change"""
        # Login first
        login_response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'admin123'
        })
        
        token = json.loads(login_response.data)['access_token']
        
        # Change password
        response = client.post('/api/auth/change-password', 
                             headers={'Authorization': f'Bearer {token}'},
                             json={
                                 'current_password': 'admin123',
                                 'new_password': 'newadmin123'
                             })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['msg'] == 'Password changed successfully'
    
    def test_change_password_wrong_current(self, client, init_data):
        """Test password change with wrong current password"""
        # Login first
        login_response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'admin123'
        })
        
        token = json.loads(login_response.data)['access_token']
        
        # Try to change password with wrong current password
        response = client.post('/api/auth/change-password', 
                             headers={'Authorization': f'Bearer {token}'},
                             json={
                                 'current_password': 'wrongpassword',
                                 'new_password': 'newadmin123'
                             })
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Current password is incorrect' in data['msg']
    
    def test_change_password_without_token(self, client):
        """Test password change without token"""
        response = client.post('/api/auth/change-password', json={
            'current_password': 'admin123',
            'new_password': 'newadmin123'
        })
        
        assert response.status_code == 401
    
    def test_get_profile(self, client, init_data):
        """Test getting user profile"""
        # Login first
        login_response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'admin123'
        })
        
        token = json.loads(login_response.data)['access_token']
        
        # Get profile
        response = client.get('/api/auth/profile', 
                            headers={'Authorization': f'Bearer {token}'})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['email'] == 'admin@test.com'
        assert data['role'] == 'admin'
    
    def test_get_profile_without_token(self, client):
        """Test getting profile without token"""
        response = client.get('/api/auth/profile')
        
        assert response.status_code == 401
    
    def test_update_profile(self, client, init_data):
        """Test updating user profile"""
        # Login first
        login_response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'admin123'
        })
        
        token = json.loads(login_response.data)['access_token']
        
        # Update profile
        response = client.put('/api/auth/profile', 
                            headers={'Authorization': f'Bearer {token}'},
                            json={
                                'first_name': 'Updated',
                                'last_name': 'Name',
                                'phone': '+1234567890'
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['msg'] == 'Profile updated successfully'
    
    def test_update_profile_without_token(self, client):
        """Test updating profile without token"""
        response = client.put('/api/auth/profile', json={
            'first_name': 'Updated',
            'last_name': 'Name'
        })
        
        assert response.status_code == 401
    
    def test_delete_account(self, client, init_data):
        """Test deleting user account"""
        # Login first
        login_response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'admin123'
        })
        
        token = json.loads(login_response.data)['access_token']
        
        # Delete account
        response = client.delete('/api/auth/profile', 
                               headers={'Authorization': f'Bearer {token}'})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['msg'] == 'Account deleted successfully'
    
    def test_delete_account_without_token(self, client):
        """Test deleting account without token"""
        response = client.delete('/api/auth/profile')
        
        assert response.status_code == 401