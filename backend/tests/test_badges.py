import pytest
import json
import tempfile
import os
from unittest.mock import patch, MagicMock
from src.app import create_app
from src.models import db, User, Role, Badge, UserBadge
from werkzeug.security import generate_password_hash


class TestBadgesAPI:
    """Test badge endpoints for all roles"""
    
    @pytest.fixture
    def app(self):
        """Create and configure a new app instance for each test"""
        db_fd, db_path = tempfile.mkstemp()
        
        app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
            'SQLALCHEMY_TRACK_MODIFICATIONS': False,
            'SECRET_KEY': 'test-secret-key',
            'JWT_SECRET_KEY': 'test-jwt-secret-key',
            'MAIL_SUPPRESS_SEND': True,
            'WTF_CSRF_ENABLED': False
        })
        
        with app.app_context():
            db.create_all()
            yield app
            
        os.close(db_fd)
        os.unlink(db_path)
    
    @pytest.fixture
    def client(self, app):
        """Create a test client"""
        return app.test_client()
    
    @pytest.fixture
    def admin_token(self, client, app):
        """Create admin user and return token"""
        with app.app_context():
            # Create admin role
            admin_role = Role(name='admin')
            db.session.add(admin_role)
            
            # Create admin user
            admin_user = User(
                email='admin@test.com',
                password=generate_password_hash('admin123'),
                role='admin',
                is_verified=True,
                is_active=True,
                first_name='Test',
                last_name='Admin'
            )
            db.session.add(admin_user)
            db.session.commit()
        
        # Login to get token
        response = client.post('/api/auth/login', json={
            'email': 'admin@test.com',
            'password': 'admin123'
        })
        
        return json.loads(response.data)['access_token']
    
    @pytest.fixture
    def agency_token(self, client, app):
        """Create agency user and return token"""
        with app.app_context():
            # Create agency role
            agency_role = Role(name='agency')
            db.session.add(agency_role)
            
            # Create agency user
            agency_user = User(
                email='agency@test.com',
                password=generate_password_hash('agency123'),
                role='agency',
                is_verified=True,
                is_active=True,
                first_name='Test',
                last_name='Agency'
            )
            db.session.add(agency_user)
            db.session.commit()
        
        # Login to get token
        response = client.post('/api/auth/login', json={
            'email': 'agency@test.com',
            'password': 'agency123'
        })
        
        return json.loads(response.data)['access_token']
    
    @pytest.fixture
    def donor_token(self, client, app):
        """Create donor user and return token"""
        with app.app_context():
            # Create donor role
            donor_role = Role(name='donor')
            db.session.add(donor_role)
            
            # Create donor user
            donor_user = User(
                email='donor@test.com',
                password=generate_password_hash('donor123'),
                role='donor',
                is_verified=True,
                is_active=True,
                first_name='Test',
                last_name='Donor'
            )
            db.session.add(donor_user)
            db.session.commit()
        
        # Login to get token
        response = client.post('/api/auth/login', json={
            'email': 'donor@test.com',
            'password': 'donor123'
        })
        
        return json.loads(response.data)['access_token']
    
    @pytest.fixture
    def surrogate_token(self, client, app):
        """Create surrogate user and return token"""
        with app.app_context():
            # Create surrogate role
            surrogate_role = Role(name='surrogate')
            db.session.add(surrogate_role)
            
            # Create surrogate user
            surrogate_user = User(
                email='surrogate@test.com',
                password=generate_password_hash('surrogate123'),
                role='surrogate',
                is_verified=True,
                is_active=True,
                first_name='Test',
                last_name='Surrogate'
            )
            db.session.add(surrogate_user)
            db.session.commit()
        
        # Login to get token
        response = client.post('/api/auth/login', json={
            'email': 'surrogate@test.com',
            'password': 'surrogate123'
        })
        
        return json.loads(response.data)['access_token']
    
    @pytest.fixture
    def ip_token(self, client, app):
        """Create intending parent user and return token"""
        with app.app_context():
            # Create intending parent role
            ip_role = Role(name='intending_parent')
            db.session.add(ip_role)
            
            # Create intending parent user
            ip_user = User(
                email='ip@test.com',
                password=generate_password_hash('ip123'),
                role='intending_parent',
                is_verified=True,
                is_active=True,
                first_name='Test',
                last_name='IntendingParent'
            )
            db.session.add(ip_user)
            db.session.commit()
        
        # Login to get token
        response = client.post('/api/auth/login', json={
            'email': 'ip@test.com',
            'password': 'ip123'
        })
        
        return json.loads(response.data)['access_token']
    
    def test_admin_get_badges(self, client, admin_token, app):
        """Test admin getting badges"""
        with app.app_context():
            # Create some badges
            for i in range(3):
                badge = Badge(
                    name=f'Test Badge {i}',
                    description=f'This is test badge {i}',
                    badge_type='achievement',
                    criteria=f'Complete {i+1} tasks'
                )
                db.session.add(badge)
            db.session.commit()
        
        response = client.get('/api/admin/badges', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'badges' in data
        assert len(data['badges']) >= 3
    
    def test_admin_get_badge_by_id(self, client, admin_token, app):
        """Test admin getting badge by ID"""
        with app.app_context():
            # Create a badge
            badge = Badge(
                name='Test Badge',
                description='This is a test badge',
                badge_type='achievement',
                criteria='Complete 1 task'
            )
            db.session.add(badge)
            db.session.commit()
            badge_id = badge.id
        
        response = client.get(f'/api/admin/badges/{badge_id}', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['badge']['id'] == badge_id
    
    def test_admin_get_badge_by_id_not_found(self, client, admin_token):
        """Test admin getting badge by non-existent ID"""
        response = client.get('/api/admin/badges/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Badge not found' in data['error']
    
    def test_admin_create_badge(self, client, admin_token):
        """Test admin creating badge"""
        response = client.post('/api/admin/badges', 
                             headers={'Authorization': f'Bearer {admin_token}'},
                             json={
                                 'name': 'New Test Badge',
                                 'description': 'This is a new test badge',
                                 'badge_type': 'achievement',
                                 'criteria': 'Complete 5 tasks'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Badge created successfully'
    
    def test_admin_update_badge(self, client, admin_token, app):
        """Test admin updating badge"""
        with app.app_context():
            # Create a badge
            badge = Badge(
                name='Test Badge',
                description='This is a test badge',
                badge_type='achievement',
                criteria='Complete 1 task'
            )
            db.session.add(badge)
            db.session.commit()
            badge_id = badge.id
        
        response = client.put(f'/api/admin/badges/{badge_id}', 
                            headers={'Authorization': f'Bearer {admin_token}'},
                            json={
                                'name': 'Updated Test Badge',
                                'description': 'This is an updated test badge',
                                'badge_type': 'achievement',
                                'criteria': 'Complete 10 tasks'
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Badge updated successfully'
    
    def test_admin_delete_badge(self, client, admin_token, app):
        """Test admin deleting badge"""
        with app.app_context():
            # Create a badge
            badge = Badge(
                name='Test Badge',
                description='This is a test badge',
                badge_type='achievement',
                criteria='Complete 1 task'
            )
            db.session.add(badge)
            db.session.commit()
            badge_id = badge.id
        
        response = client.delete(f'/api/admin/badges/{badge_id}', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Badge deleted successfully'
    
    def test_admin_delete_badge_not_found(self, client, admin_token):
        """Test admin deleting non-existent badge"""
        response = client.delete('/api/admin/badges/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Badge not found' in data['error']
    
    def test_agency_get_badges(self, client, agency_token, app):
        """Test agency getting badges"""
        with app.app_context():
            # Create agency user
            agency_user = User.query.filter_by(email='agency@test.com').first()
            
            # Create some badges for the agency
            for i in range(3):
                badge = Badge(
                    name=f'Agency Badge {i}',
                    description=f'This is agency badge {i}',
                    badge_type='achievement',
                    criteria=f'Complete {i+1} agency tasks',
                    agency_id=agency_user.id
                )
                db.session.add(badge)
            db.session.commit()
        
        response = client.get('/api/agency/badges', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'badges' in data
        assert len(data['badges']) >= 3
    
    def test_agency_create_badge(self, client, agency_token):
        """Test agency creating badge"""
        response = client.post('/api/agency/badges', 
                             headers={'Authorization': f'Bearer {agency_token}'},
                             json={
                                 'name': 'New Agency Badge',
                                 'description': 'This is a new agency badge',
                                 'badge_type': 'achievement',
                                 'criteria': 'Complete 5 agency tasks'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Badge created successfully'
    
    def test_donor_get_badges(self, client, donor_token, app):
        """Test donor getting badges"""
        with app.app_context():
            # Create donor user
            donor_user = User.query.filter_by(email='donor@test.com').first()
            
            # Create some badges
            for i in range(3):
                badge = Badge(
                    name=f'Donor Badge {i}',
                    description=f'This is donor badge {i}',
                    badge_type='achievement',
                    criteria=f'Complete {i+1} donation tasks'
                )
                db.session.add(badge)
            db.session.commit()
            
            # Create some user badges for the donor
            badges = Badge.query.all()
            for badge in badges[:2]:  # Give the donor 2 badges
                user_badge = UserBadge(
                    user_id=donor_user.id,
                    badge_id=badge.id,
                    awarded_date='2024-01-01'
                )
                db.session.add(user_badge)
            db.session.commit()
        
        response = client.get('/api/donor/badges', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'badges' in data
        assert 'user_badges' in data
        assert len(data['user_badges']) >= 2
    
    def test_donor_get_badge_progress(self, client, donor_token, app):
        """Test donor getting badge progress"""
        with app.app_context():
            # Create donor user
            donor_user = User.query.filter_by(email='donor@test.com').first()
            
            # Create a badge
            badge = Badge(
                name='Donation Progress Badge',
                description='Complete 5 donations',
                badge_type='progress',
                criteria='Complete 5 donations'
            )
            db.session.add(badge)
            db.session.commit()
            badge_id = badge.id
        
        response = client.get(f'/api/donor/badges/{badge_id}/progress', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'progress' in data
        assert 'total_required' in data
    
    def test_surrogate_get_badges(self, client, surrogate_token, app):
        """Test surrogate getting badges"""
        with app.app_context():
            # Create surrogate user
            surrogate_user = User.query.filter_by(email='surrogate@test.com').first()
            
            # Create some badges
            for i in range(3):
                badge = Badge(
                    name=f'Surrogate Badge {i}',
                    description=f'This is surrogate badge {i}',
                    badge_type='achievement',
                    criteria=f'Complete {i+1} surrogacy tasks'
                )
                db.session.add(badge)
            db.session.commit()
            
            # Create some user badges for the surrogate
            badges = Badge.query.all()
            for badge in badges[:2]:  # Give the surrogate 2 badges
                user_badge = UserBadge(
                    user_id=surrogate_user.id,
                    badge_id=badge.id,
                    awarded_date='2024-01-01'
                )
                db.session.add(user_badge)
            db.session.commit()
        
        response = client.get('/api/surrogate/badges', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'badges' in data
        assert 'user_badges' in data
        assert len(data['user_badges']) >= 2
    
    def test_surrogate_get_badge_progress(self, client, surrogate_token, app):
        """Test surrogate getting badge progress"""
        with app.app_context():
            # Create surrogate user
            surrogate_user = User.query.filter_by(email='surrogate@test.com').first()
            
            # Create a badge
            badge = Badge(
                name='Surrogacy Progress Badge',
                description='Complete 3 surrogacy journeys',
                badge_type='progress',
                criteria='Complete 3 surrogacy journeys'
            )
            db.session.add(badge)
            db.session.commit()
            badge_id = badge.id
        
        response = client.get(f'/api/surrogate/badges/{badge_id}/progress', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'progress' in data
        assert 'total_required' in data
    
    def test_ip_get_badges(self, client, ip_token, app):
        """Test intending parent getting badges"""
        with app.app_context():
            # Create intending parent user
            ip_user = User.query.filter_by(email='ip@test.com').first()
            
            # Create some badges
            for i in range(3):
                badge = Badge(
                    name=f'IP Badge {i}',
                    description=f'This is IP badge {i}',
                    badge_type='achievement',
                    criteria=f'Complete {i+1} IP tasks'
                )
                db.session.add(badge)
            db.session.commit()
            
            # Create some user badges for the IP
            badges = Badge.query.all()
            for badge in badges[:2]:  # Give the IP 2 badges
                user_badge = UserBadge(
                    user_id=ip_user.id,
                    badge_id=badge.id,
                    awarded_date='2024-01-01'
                )
                db.session.add(user_badge)
            db.session.commit()
        
        response = client.get('/api/intending-parent/badges', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'badges' in data
        assert 'user_badges' in data
        assert len(data['user_badges']) >= 2
    
    def test_ip_get_badge_progress(self, client, ip_token, app):
        """Test intending parent getting badge progress"""
        with app.app_context():
            # Create intending parent user
            ip_user = User.query.filter_by(email='ip@test.com').first()
            
            # Create a badge
            badge = Badge(
                name='Journey Progress Badge',
                description='Complete 3 journeys',
                badge_type='progress',
                criteria='Complete 3 journeys'
            )
            db.session.add(badge)
            db.session.commit()
            badge_id = badge.id
        
        response = client.get(f'/api/intending-parent/badges/{badge_id}/progress', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'progress' in data
        assert 'total_required' in data
    
    def test_get_badge_by_id(self, client, admin_token, app):
        """Test getting badge by ID"""
        with app.app_context():
            # Create a badge
            badge = Badge(
                name='Test Badge',
                description='This is a test badge',
                badge_type='achievement',
                criteria='Complete 1 task'
            )
            db.session.add(badge)
            db.session.commit()
            badge_id = badge.id
        
        response = client.get(f'/api/badges/{badge_id}', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['badge']['id'] == badge_id
    
    def test_get_badge_by_id_not_found(self, client, admin_token):
        """Test getting badge by non-existent ID"""
        response = client.get('/api/badges/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Badge not found' in data['error']
    
    def test_award_badge_to_user(self, client, admin_token, app):
        """Test awarding badge to user"""
        with app.app_context():
            # Create a user
            user = User(
                email='badgeuser@test.com',
                password=generate_password_hash('password123'),
                role='donor',
                is_verified=True,
                is_active=True,
                first_name='Badge',
                last_name='User'
            )
            db.session.add(user)
            db.session.commit()
            user_id = user.id
            
            # Create a badge
            badge = Badge(
                name='Awarded Badge',
                description='This badge was awarded',
                badge_type='achievement',
                criteria='Complete 1 task'
            )
            db.session.add(badge)
            db.session.commit()
            badge_id = badge.id
        
        response = client.post(f'/api/badges/{badge_id}/award/{user_id}', 
                             headers={'Authorization': f'Bearer {admin_token}'})
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Badge awarded successfully'
    
    def test_award_badge_to_user_not_found(self, client, admin_token):
        """Test awarding badge to non-existent user"""
        response = client.post('/api/badges/1/award/99999', 
                             headers={'Authorization': f'Bearer {admin_token}'})
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'User not found' in data['error']
    
    def test_search_badges(self, client, admin_token, app):
        """Test searching badges"""
        with app.app_context():
            # Create some badges with different names
            badge_names = ['Donation Hero', 'Surrogacy Champion', 'Parent Journey']
            for i, name in enumerate(badge_names):
                badge = Badge(
                    name=name,
                    description=f'This is {name} badge',
                    badge_type='achievement',
                    criteria=f'Complete {i+1} tasks'
                )
                db.session.add(badge)
            db.session.commit()
        
        # Search for donation badges
        response = client.get('/api/badges/search?query=Donation', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'badges' in data
        assert len(data['badges']) >= 1
    
    def test_filter_badges(self, client, admin_token, app):
        """Test filtering badges"""
        with app.app_context():
            # Create some badges with different types
            badge_types = ['achievement', 'progress', 'milestone']
            for i, badge_type in enumerate(badge_types):
                badge = Badge(
                    name=f'Test Badge {i}',
                    description=f'This is test badge {i}',
                    badge_type=badge_type,
                    criteria=f'Complete {i+1} tasks'
                )
                db.session.add(badge)
            db.session.commit()
        
        # Filter for achievement badges
        response = client.get('/api/badges/filter?badge_type=achievement', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'badges' in data
        assert len(data['badges']) >= 1
    
    def test_get_badge_statistics(self, client, admin_token, app):
        """Test getting badge statistics"""
        with app.app_context():
            # Create some badges and user badges
            for i in range(3):
                badge = Badge(
                    name=f'Test Badge {i}',
                    description=f'This is test badge {i}',
                    badge_type='achievement',
                    criteria=f'Complete {i+1} tasks'
                )
                db.session.add(badge)
            db.session.commit()
            
            # Create some users and award them badges
            for j in range(2):
                user = User(
                    email=f'statuser{j}@test.com',
                    password=generate_password_hash('password123'),
                    role='donor',
                    is_verified=True,
                    is_active=True,
                    first_name=f'StatUser{j}',
                    last_name='Test'
                )
                db.session.add(user)
                db.session.commit()
                
                # Award some badges to the user
                badges = Badge.query.all()
                for badge in badges[:j+1]:
                    user_badge = UserBadge(
                        user_id=user.id,
                        badge_id=badge.id,
                        awarded_date='2024-01-01'
                    )
                    db.session.add(user_badge)
            db.session.commit()
        
        response = client.get('/api/badges/statistics', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'statistics' in data