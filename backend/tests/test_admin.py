import pytest
import json
import tempfile
import os
import sys
from unittest.mock import patch, MagicMock
import bcrypt

# Add src to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src import create_app
from src.models import db, User, Role, Agency, Donor, Surrogate, IntendingParent


class TestAdminAPI:
    """Test admin endpoints"""
    
    @pytest.fixture
    def app(self):
        """Create and configure a new app instance for each test"""
        db_fd, db_path = tempfile.mkstemp(suffix='.db')
        
        app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
            'SQLALCHEMY_TRACK_MODIFICATIONS': False,
            'SECRET_KEY': 'test-secret-key',
            'JWT_SECRET_KEY': 'test-jwt-secret-key-32-chars-min!',
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
    def admin_token(self, client, app):
        """Create admin user and return token"""
        with app.app_context():
            # Create admin role
            admin_role = Role(name='admin')
            db.session.add(admin_role)
            
            # Create admin user
            admin_user = User(
                email='admin@test.com',
                username='admin',
                password_hash=bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                role='admin',
                is_verified=True,
                is_active=True
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
    def test_users(self, app):
        """Create test users for different roles"""
        with app.app_context():
            # Create roles
            roles = ['agency', 'donor', 'surrogate', 'intending_parent']
            for role_name in roles:
                role = Role(name=role_name)
                db.session.add(role)
            
            db.session.commit()
            
            # Create test users
            users = []
            for i, role_name in enumerate(roles):
                user = User(
                    email=f'{role_name}{i}@test.com',
                    username=f'{role_name}{i}',
                    password_hash=bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                    role=role_name,
                    is_verified=True,
                    is_active=True,
                    first_name=f'Test{i}',
                    last_name=f'{role_name.capitalize()}'
                )
                db.session.add(user)
                users.append(user)
            
            db.session.commit()
            return users
    
    def test_get_all_users(self, client, admin_token, test_users):
        """Test getting all users"""
        response = client.get('/api/admin/users', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'users' in data
        assert len(data['users']) >= 4  # At least our test users
    
    def test_get_all_users_unauthorized(self, client):
        """Test getting all users without admin token"""
        response = client.get('/api/admin/users')
        
        assert response.status_code == 401
    
    def test_get_all_users_wrong_role(self, client, app):
        """Test getting all users with non-admin token"""
        with app.app_context():
            # Create donor user
            donor_role = Role(name='donor')
            db.session.add(donor_role)
            
            donor_user = User(
                email='donor@test.com',
                username='donor',
                password_hash=bcrypt.hashpw('donor123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                role='donor',
                is_verified=True,
                is_active=True
            )
            db.session.add(donor_user)
            db.session.commit()
        
        # Login as donor
        login_response = client.post('/api/auth/login', json={
            'email': 'donor@test.com',
            'password': 'donor123'
        })
        
        donor_token = json.loads(login_response.data)['access_token']
        
        # Try to access admin endpoint
        response = client.get('/api/admin/users', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 403
    
    def test_get_user_by_id(self, client, admin_token, test_users):
        """Test getting user by ID"""
        user_id = test_users[0].id
        response = client.get(f'/api/admin/users/{user_id}', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['user']['id'] == user_id
    
    def test_get_user_by_id_not_found(self, client, admin_token):
        """Test getting user by non-existent ID"""
        response = client.get('/api/admin/users/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'User not found' in data['error']
    
    def test_update_user(self, client, admin_token, test_users):
        """Test updating user"""
        user_id = test_users[0].id
        response = client.put(f'/api/admin/users/{user_id}', 
                            headers={'Authorization': f'Bearer {admin_token}'},
                            json={
                                'first_name': 'Updated',
                                'last_name': 'Name',
                                'is_active': False
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'User updated successfully'
    
    def test_update_user_not_found(self, client, admin_token):
        """Test updating non-existent user"""
        response = client.put('/api/admin/users/99999', 
                            headers={'Authorization': f'Bearer {admin_token}'},
                            json={'first_name': 'Updated'})
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'User not found' in data['error']
    
    def test_delete_user(self, client, admin_token, test_users):
        """Test deleting user"""
        user_id = test_users[0].id
        response = client.delete(f'/api/admin/users/{user_id}', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'User deleted successfully'
    
    def test_delete_user_not_found(self, client, admin_token):
        """Test deleting non-existent user"""
        response = client.delete('/api/admin/users/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'User not found' in data['error']
    
    def test_get_all_agencies(self, client, admin_token, app):
        """Test getting all agencies"""
        with app.app_context():
            # Create agency role
            agency_role = Role(name='agency')
            db.session.add(agency_role)
            
            # Create agency user
            agency_user = User(
                email='agency@test.com',
                username='agency',
                password_hash=bcrypt.hashpw('agency123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                role='agency',
                is_verified=True,
                is_active=True,
                first_name='Test',
                last_name='Agency'
            )
            db.session.add(agency_user)
            db.session.commit()
            
            # Create agency
            agency = Agency(
                user_id=agency_user.id,
                name='Test Agency',
                license_number='TEST123',
                address='123 Test St',
                phone='+1234567890',
                description='Test agency description'
            )
            db.session.add(agency)
            db.session.commit()
        
        response = client.get('/api/admin/agencies', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'agencies' in data
        assert len(data['agencies']) >= 1
    
    def test_get_agency_by_id(self, client, admin_token, app):
        """Test getting agency by ID"""
        with app.app_context():
            # Create agency role and user
            agency_role = Role(name='agency')
            db.session.add(agency_role)
            
            agency_user = User(
                email='agency@test.com',
                username='agency',
                password_hash=bcrypt.hashpw('agency123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                role='agency',
                is_verified=True,
                is_active=True,
                first_name='Test',
                last_name='Agency'
            )
            db.session.add(agency_user)
            db.session.commit()
            
            # Create agency
            agency = Agency(
                user_id=agency_user.id,
                name='Test Agency',
                license_number='TEST123',
                address='123 Test St',
                phone='+1234567890',
                description='Test agency description'
            )
            db.session.add(agency)
            db.session.commit()
            agency_id = agency.id
        
        response = client.get(f'/api/admin/agencies/{agency_id}', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['agency']['id'] == agency_id
        assert data['agency']['name'] == 'Test Agency'
    
    def test_update_agency(self, client, admin_token, app):
        """Test updating agency"""
        with app.app_context():
            # Create agency role and user
            agency_role = Role(name='agency')
            db.session.add(agency_role)
            
            agency_user = User(
                email='agency@test.com',
                username='agency',
                password_hash=bcrypt.hashpw('agency123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                role='agency',
                is_verified=True,
                is_active=True,
                first_name='Test',
                last_name='Agency'
            )
            db.session.add(agency_user)
            db.session.commit()
            
            # Create agency
            agency = Agency(
                user_id=agency_user.id,
                name='Test Agency',
                license_number='TEST123',
                address='123 Test St',
                phone='+1234567890',
                description='Test agency description'
            )
            db.session.add(agency)
            db.session.commit()
            agency_id = agency.id
        
        response = client.put(f'/api/admin/agencies/{agency_id}', 
                            headers={'Authorization': f'Bearer {admin_token}'},
                            json={
                                'name': 'Updated Agency Name',
                                'license_number': 'UPDATED123',
                                'is_verified': True
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Agency updated successfully'
    
    def test_delete_agency(self, client, admin_token, app):
        """Test deleting agency"""
        with app.app_context():
            # Create agency role and user
            agency_role = Role(name='agency')
            db.session.add(agency_role)
            
            agency_user = User(
                email='agency@test.com',
                username='agency',
                password_hash=bcrypt.hashpw('agency123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                role='agency',
                is_verified=True,
                is_active=True,
                first_name='Test',
                last_name='Agency'
            )
            db.session.add(agency_user)
            db.session.commit()
            
            # Create agency
            agency = Agency(
                user_id=agency_user.id,
                name='Test Agency',
                license_number='TEST123',
                address='123 Test St',
                phone='+1234567890',
                description='Test agency description'
            )
            db.session.add(agency)
            db.session.commit()
            agency_id = agency.id
        
        response = client.delete(f'/api/admin/agencies/{agency_id}', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Agency deleted successfully'
    
    def test_get_all_contracts(self, client, admin_token, app):
        """Test getting all contracts"""
        response = client.get('/api/admin/contracts', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'contracts' in data
    
    def test_get_contract_by_id(self, client, admin_token, app):
        """Test getting contract by ID"""
        # This would need a contract to be created first
        # For now, test with non-existent ID
        response = client.get('/api/admin/contracts/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
    
    def test_update_contract_status(self, client, admin_token, app):
        """Test updating contract status"""
        # This would need a contract to be created first
        # For now, test with non-existent ID
        response = client.put('/api/admin/contracts/99999/status', 
                            headers={'Authorization': f'Bearer {admin_token}'},
                            json={'status': 'approved'})
        
        assert response.status_code == 404
    
    def test_get_all_disputes(self, client, admin_token):
        """Test getting all disputes"""
        response = client.get('/api/admin/disputes', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'disputes' in data
    
    def test_get_dispute_by_id(self, client, admin_token):
        """Test getting dispute by ID"""
        # This would need a dispute to be created first
        # For now, test with non-existent ID
        response = client.get('/api/admin/disputes/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
    
    def test_update_dispute_status(self, client, admin_token):
        """Test updating dispute status"""
        # This would need a dispute to be created first
        # For now, test with non-existent ID
        response = client.put('/api/admin/disputes/99999/status', 
                            headers={'Authorization': f'Bearer {admin_token}'},
                            json={'status': 'resolved', 'resolution': 'Test resolution'})
        
        assert response.status_code == 404
    
    def test_get_all_commissions(self, client, admin_token):
        """Test getting all commissions"""
        response = client.get('/api/admin/commissions', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'commissions' in data
    
    def test_get_commission_by_id(self, client, admin_token):
        """Test getting commission by ID"""
        # This would need a commission to be created first
        # For now, test with non-existent ID
        response = client.get('/api/admin/commissions/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
    
    def test_update_commission_status(self, client, admin_token):
        """Test updating commission status"""
        # This would need a commission to be created first
        # For now, test with non-existent ID
        response = client.put('/api/admin/commissions/99999/status', 
                            headers={'Authorization': f'Bearer {admin_token}'},
                            json={'status': 'paid'})
        
        assert response.status_code == 404
    
    def test_get_all_reports(self, client, admin_token):
        """Test getting all reports"""
        response = client.get('/api/admin/reports', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'reports' in data
    
    def test_generate_report(self, client, admin_token):
        """Test generating report"""
        response = client.post('/api/admin/reports/generate', 
                             headers={'Authorization': f'Bearer {admin_token}'},
                             json={
                                 'report_type': 'user_activity',
                                 'start_date': '2024-01-01',
                                 'end_date': '2024-12-31'
                             })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'report_id' in data
        assert 'download_url' in data
    
    def test_get_report_by_id(self, client, admin_token):
        """Test getting report by ID"""
        # This would need a report to be created first
        # For now, test with non-existent ID
        response = client.get('/api/admin/reports/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
    
    def test_delete_report(self, client, admin_token):
        """Test deleting report"""
        # This would need a report to be created first
        # For now, test with non-existent ID
        response = client.delete('/api/admin/reports/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404