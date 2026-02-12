import pytest
import json
import tempfile
import os
from unittest.mock import patch, MagicMock
from src.app import create_app
from src.models import db, User, Role, Favorite
from werkzeug.security import generate_password_hash


class TestFavoritesAPI:
    """Test favorite endpoints for all roles"""
    
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
    
    def test_admin_get_favorites(self, client, admin_token, app):
        """Test admin getting favorites"""
        with app.app_context():
            # Create admin user
            admin_user = User.query.filter_by(email='admin@test.com').first()
            
            # Create some favorites for the admin
            for i in range(3):
                favorite = Favorite(
                    user_id=admin_user.id,
                    favorite_type='donor',
                    favorite_id=i + 1,
                    notes=f'Admin favorite {i}'
                )
                db.session.add(favorite)
            db.session.commit()
        
        response = client.get('/api/admin/favorites', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'favorites' in data
        assert len(data['favorites']) >= 3
    
    def test_admin_add_favorite(self, client, admin_token, app):
        """Test admin adding favorite"""
        with app.app_context():
            # Create a target user
            target_user = User(
                email='target@test.com',
                password=generate_password_hash('password123'),
                role='donor',
                is_verified=True,
                is_active=True,
                first_name='Target',
                last_name='User'
            )
            db.session.add(target_user)
            db.session.commit()
            target_id = target_user.id
        
        response = client.post('/api/admin/favorites', 
                             headers={'Authorization': f'Bearer {admin_token}'},
                             json={
                                 'favorite_type': 'user',
                                 'favorite_id': target_id,
                                 'notes': 'Admin favorite user'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Favorite added successfully'
    
    def test_admin_remove_favorite(self, client, admin_token, app):
        """Test admin removing favorite"""
        with app.app_context():
            # Create admin user
            admin_user = User.query.filter_by(email='admin@test.com').first()
            
            # Create a favorite for the admin
            favorite = Favorite(
                user_id=admin_user.id,
                favorite_type='donor',
                favorite_id=1,
                notes='Admin favorite'
            )
            db.session.add(favorite)
            db.session.commit()
            favorite_id = favorite.id
        
        response = client.delete(f'/api/admin/favorites/{favorite_id}', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Favorite removed successfully'
    
    def test_admin_remove_favorite_not_found(self, client, admin_token):
        """Test admin removing non-existent favorite"""
        response = client.delete('/api/admin/favorites/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Favorite not found' in data['error']
    
    def test_agency_get_favorites(self, client, agency_token, app):
        """Test agency getting favorites"""
        with app.app_context():
            # Create agency user
            agency_user = User.query.filter_by(email='agency@test.com').first()
            
            # Create some favorites for the agency
            for i in range(3):
                favorite = Favorite(
                    user_id=agency_user.id,
                    favorite_type='donor',
                    favorite_id=i + 1,
                    notes=f'Agency favorite {i}'
                )
                db.session.add(favorite)
            db.session.commit()
        
        response = client.get('/api/agency/favorites', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'favorites' in data
        assert len(data['favorites']) >= 3
    
    def test_agency_add_favorite(self, client, agency_token, app):
        """Test agency adding favorite"""
        with app.app_context():
            # Create a target user
            target_user = User(
                email='target2@test.com',
                password=generate_password_hash('password123'),
                role='donor',
                is_verified=True,
                is_active=True,
                first_name='Target',
                last_name='User2'
            )
            db.session.add(target_user)
            db.session.commit()
            target_id = target_user.id
        
        response = client.post('/api/agency/favorites', 
                             headers={'Authorization': f'Bearer {agency_token}'},
                             json={
                                 'favorite_type': 'user',
                                 'favorite_id': target_id,
                                 'notes': 'Agency favorite user'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Favorite added successfully'
    
    def test_donor_get_favorites(self, client, donor_token, app):
        """Test donor getting favorites"""
        with app.app_context():
            # Create donor user
            donor_user = User.query.filter_by(email='donor@test.com').first()
            
            # Create some favorites for the donor
            for i in range(3):
                favorite = Favorite(
                    user_id=donor_user.id,
                    favorite_type='agency',
                    favorite_id=i + 1,
                    notes=f'Donor favorite {i}'
                )
                db.session.add(favorite)
            db.session.commit()
        
        response = client.get('/api/donor/favorites', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'favorites' in data
        assert len(data['favorites']) >= 3
    
    def test_donor_add_favorite(self, client, donor_token, app):
        """Test donor adding favorite"""
        with app.app_context():
            # Create a target user
            target_user = User(
                email='target3@test.com',
                password=generate_password_hash('password123'),
                role='agency',
                is_verified=True,
                is_active=True,
                first_name='Target',
                last_name='User3'
            )
            db.session.add(target_user)
            db.session.commit()
            target_id = target_user.id
        
        response = client.post('/api/donor/favorites', 
                             headers={'Authorization': f'Bearer {donor_token}'},
                             json={
                                 'favorite_type': 'user',
                                 'favorite_id': target_id,
                                 'notes': 'Donor favorite user'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Favorite added successfully'
    
    def test_surrogate_get_favorites(self, client, surrogate_token, app):
        """Test surrogate getting favorites"""
        with app.app_context():
            # Create surrogate user
            surrogate_user = User.query.filter_by(email='surrogate@test.com').first()
            
            # Create some favorites for the surrogate
            for i in range(3):
                favorite = Favorite(
                    user_id=surrogate_user.id,
                    favorite_type='agency',
                    favorite_id=i + 1,
                    notes=f'Surrogate favorite {i}'
                )
                db.session.add(favorite)
            db.session.commit()
        
        response = client.get('/api/surrogate/favorites', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'favorites' in data
        assert len(data['favorites']) >= 3
    
    def test_surrogate_add_favorite(self, client, surrogate_token, app):
        """Test surrogate adding favorite"""
        with app.app_context():
            # Create a target user
            target_user = User(
                email='target4@test.com',
                password=generate_password_hash('password123'),
                role='agency',
                is_verified=True,
                is_active=True,
                first_name='Target',
                last_name='User4'
            )
            db.session.add(target_user)
            db.session.commit()
            target_id = target_user.id
        
        response = client.post('/api/surrogate/favorites', 
                             headers={'Authorization': f'Bearer {surrogate_token}'},
                             json={
                                 'favorite_type': 'user',
                                 'favorite_id': target_id,
                                 'notes': 'Surrogate favorite user'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Favorite added successfully'
    
    def test_ip_get_favorites(self, client, ip_token, app):
        """Test intending parent getting favorites"""
        with app.app_context():
            # Create intending parent user
            ip_user = User.query.filter_by(email='ip@test.com').first()
            
            # Create some favorites for the intending parent
            for i in range(3):
                favorite = Favorite(
                    user_id=ip_user.id,
                    favorite_type='donor',
                    favorite_id=i + 1,
                    notes=f'IP favorite {i}'
                )
                db.session.add(favorite)
            db.session.commit()
        
        response = client.get('/api/intending-parent/favorites', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'favorites' in data
        assert len(data['favorites']) >= 3
    
    def test_ip_add_favorite(self, client, ip_token, app):
        """Test intending parent adding favorite"""
        with app.app_context():
            # Create a target user
            target_user = User(
                email='target5@test.com',
                password=generate_password_hash('password123'),
                role='donor',
                is_verified=True,
                is_active=True,
                first_name='Target',
                last_name='User5'
            )
            db.session.add(target_user)
            db.session.commit()
            target_id = target_user.id
        
        response = client.post('/api/intending-parent/favorites', 
                             headers={'Authorization': f'Bearer {ip_token}'},
                             json={
                                 'favorite_type': 'user',
                                 'favorite_id': target_id,
                                 'notes': 'IP favorite user'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Favorite added successfully'
    
    def test_get_favorite_by_id(self, client, admin_token, app):
        """Test getting favorite by ID"""
        with app.app_context():
            # Create admin user
            admin_user = User.query.filter_by(email='admin@test.com').first()
            
            # Create a favorite
            favorite = Favorite(
                user_id=admin_user.id,
                favorite_type='donor',
                favorite_id=1,
                notes='Admin favorite'
            )
            db.session.add(favorite)
            db.session.commit()
            favorite_id = favorite.id
        
        response = client.get(f'/api/favorites/{favorite_id}', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['favorite']['id'] == favorite_id
    
    def test_get_favorite_by_id_not_found(self, client, admin_token):
        """Test getting favorite by non-existent ID"""
        response = client.get('/api/favorites/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Favorite not found' in data['error']
    
    def test_remove_favorite(self, client, admin_token, app):
        """Test removing favorite"""
        with app.app_context():
            # Create admin user
            admin_user = User.query.filter_by(email='admin@test.com').first()
            
            # Create a favorite
            favorite = Favorite(
                user_id=admin_user.id,
                favorite_type='donor',
                favorite_id=1,
                notes='Admin favorite'
            )
            db.session.add(favorite)
            db.session.commit()
            favorite_id = favorite.id
        
        response = client.delete(f'/api/favorites/{favorite_id}', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Favorite removed successfully'
    
    def test_search_favorites(self, client, admin_token, app):
        """Test searching favorites"""
        with app.app_context():
            # Create admin user
            admin_user = User.query.filter_by(email='admin@test.com').first()
            
            # Create some favorites with different notes
            favorite_notes = ['Important donor', 'Top agency', 'Preferred surrogate']
            for i, notes in enumerate(favorite_notes):
                favorite = Favorite(
                    user_id=admin_user.id,
                    favorite_type='donor',
                    favorite_id=i + 1,
                    notes=notes
                )
                db.session.add(favorite)
            db.session.commit()
        
        # Search for favorites with 'Important' in notes
        response = client.get('/api/favorites/search?query=Important', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'favorites' in data
        assert len(data['favorites']) >= 1
    
    def test_filter_favorites(self, client, admin_token, app):
        """Test filtering favorites"""
        with app.app_context():
            # Create admin user
            admin_user = User.query.filter_by(email='admin@test.com').first()
            
            # Create some favorites with different types
            favorite_types = ['donor', 'surrogate', 'agency']
            for i, favorite_type in enumerate(favorite_types):
                favorite = Favorite(
                    user_id=admin_user.id,
                    favorite_type=favorite_type,
                    favorite_id=i + 1,
                    notes=f'Admin favorite {i}'
                )
                db.session.add(favorite)
            db.session.commit()
        
        # Filter for donor favorites
        response = client.get('/api/favorites/filter?favorite_type=donor', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'favorites' in data
        assert len(data['favorites']) >= 1
    
    def test_get_favorite_statistics(self, client, admin_token, app):
        """Test getting favorite statistics"""
        with app.app_context():
            # Create some users and their favorites
            roles = ['donor', 'surrogate', 'intending_parent']
            for i, role_name in enumerate(roles):
                role = Role(name=role_name)
                db.session.add(role)
                
                user = User(
                    email=f'statuser{i}@test.com',
                    password=generate_password_hash('password123'),
                    role=role_name,
                    is_verified=True,
                    is_active=True,
                    first_name=f'StatUser{i}',
                    last_name='Test'
                )
                db.session.add(user)
                db.session.commit()
                
                # Create some favorites for the user
                for j in range(2):
                    favorite = Favorite(
                        user_id=user.id,
                        favorite_type='donor',
                        favorite_id=j + 1,
                        notes=f'User {i} favorite {j}'
                    )
                    db.session.add(favorite)
            db.session.commit()
        
        response = client.get('/api/favorites/statistics', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'statistics' in data