import pytest
import json
import tempfile
import os
from unittest.mock import patch, MagicMock
from src.app import create_app
from src.models import db, User, Role, Dispute
from werkzeug.security import generate_password_hash


class TestDisputesAPI:
    """Test dispute endpoints for all roles"""
    
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
    
    def test_admin_get_disputes(self, client, admin_token, app):
        """Test admin getting disputes"""
        with app.app_context():
            # Create some disputes
            for i in range(3):
                dispute = Dispute(
                    title=f'Test Dispute {i}',
                    description=f'This is test dispute {i}',
                    dispute_type='contract',
                    status='pending',
                    priority='medium'
                )
                db.session.add(dispute)
            db.session.commit()
        
        response = client.get('/api/admin/disputes', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'disputes' in data
        assert len(data['disputes']) >= 3
    
    def test_admin_get_dispute_by_id(self, client, admin_token, app):
        """Test admin getting dispute by ID"""
        with app.app_context():
            # Create a dispute
            dispute = Dispute(
                title='Test Dispute',
                description='This is a test dispute',
                dispute_type='contract',
                status='pending',
                priority='medium'
            )
            db.session.add(dispute)
            db.session.commit()
            dispute_id = dispute.id
        
        response = client.get(f'/api/admin/disputes/{dispute_id}', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['dispute']['id'] == dispute_id
    
    def test_admin_get_dispute_by_id_not_found(self, client, admin_token):
        """Test admin getting dispute by non-existent ID"""
        response = client.get('/api/admin/disputes/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Dispute not found' in data['error']
    
    def test_admin_update_dispute_status(self, client, admin_token, app):
        """Test admin updating dispute status"""
        with app.app_context():
            # Create a dispute
            dispute = Dispute(
                title='Test Dispute',
                description='This is a test dispute',
                dispute_type='contract',
                status='pending',
                priority='medium'
            )
            db.session.add(dispute)
            db.session.commit()
            dispute_id = dispute.id
        
        response = client.put(f'/api/admin/disputes/{dispute_id}/status', 
                            headers={'Authorization': f'Bearer {admin_token}'},
                            json={
                                'status': 'resolved',
                                'resolution': 'Dispute resolved by admin',
                                'resolution_date': '2024-01-15'
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Dispute status updated successfully'
    
    def test_admin_update_dispute_status_not_found(self, client, admin_token):
        """Test admin updating dispute status for non-existent dispute"""
        response = client.put('/api/admin/disputes/99999/status', 
                            headers={'Authorization': f'Bearer {admin_token}'},
                            json={
                                'status': 'resolved',
                                'resolution': 'Dispute resolved by admin',
                                'resolution_date': '2024-01-15'
                            })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Dispute not found' in data['error']
    
    def test_admin_delete_dispute(self, client, admin_token, app):
        """Test admin deleting dispute"""
        with app.app_context():
            # Create a dispute
            dispute = Dispute(
                title='Test Dispute',
                description='This is a test dispute',
                dispute_type='contract',
                status='pending',
                priority='medium'
            )
            db.session.add(dispute)
            db.session.commit()
            dispute_id = dispute.id
        
        response = client.delete(f'/api/admin/disputes/{dispute_id}', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Dispute deleted successfully'
    
    def test_admin_delete_dispute_not_found(self, client, admin_token):
        """Test admin deleting non-existent dispute"""
        response = client.delete('/api/admin/disputes/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Dispute not found' in data['error']
    
    def test_agency_get_disputes(self, client, agency_token, app):
        """Test agency getting disputes"""
        with app.app_context():
            # Create agency user
            agency_user = User.query.filter_by(email='agency@test.com').first()
            
            # Create some disputes for the agency
            for i in range(3):
                dispute = Dispute(
                    agency_id=agency_user.id,
                    title=f'Agency Dispute {i}',
                    description=f'This is agency dispute {i}',
                    dispute_type='contract',
                    status='pending',
                    priority='medium'
                )
                db.session.add(dispute)
            db.session.commit()
        
        response = client.get('/api/agency/disputes', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'disputes' in data
        assert len(data['disputes']) >= 3
    
    def test_agency_create_dispute(self, client, agency_token, app):
        """Test agency creating dispute"""
        with app.app_context():
            # Create a client user
            client_user = User(
                email='client@test.com',
                password=generate_password_hash('password123'),
                role='intending_parent',
                is_verified=True,
                is_active=True,
                first_name='Client',
                last_name='User'
            )
            db.session.add(client_user)
            db.session.commit()
            client_id = client_user.id
        
        response = client.post('/api/agency/disputes', 
                             headers={'Authorization': f'Bearer {agency_token}'},
                             json={
                                 'client_id': client_id,
                                 'title': 'Test Agency Dispute',
                                 'description': 'This is a test dispute from agency',
                                 'dispute_type': 'contract',
                                 'priority': 'high'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Dispute created successfully'
    
    def test_agency_update_dispute(self, client, agency_token, app):
        """Test agency updating dispute"""
        with app.app_context():
            # Create agency user
            agency_user = User.query.filter_by(email='agency@test.com').first()
            
            # Create a dispute
            dispute = Dispute(
                agency_id=agency_user.id,
                title='Test Agency Dispute',
                description='This is a test dispute from agency',
                dispute_type='contract',
                status='pending',
                priority='high'
            )
            db.session.add(dispute)
            db.session.commit()
            dispute_id = dispute.id
        
        response = client.put(f'/api/agency/disputes/{dispute_id}', 
                            headers={'Authorization': f'Bearer {agency_token}'},
                            json={
                                'title': 'Updated Agency Dispute',
                                'description': 'This is an updated dispute from agency',
                                'priority': 'medium'
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Dispute updated successfully'
    
    def test_donor_get_disputes(self, client, donor_token, app):
        """Test donor getting disputes"""
        with app.app_context():
            # Create donor user
            donor_user = User.query.filter_by(email='donor@test.com').first()
            
            # Create some disputes for the donor
            for i in range(3):
                dispute = Dispute(
                    donor_id=donor_user.id,
                    title=f'Donor Dispute {i}',
                    description=f'This is donor dispute {i}',
                    dispute_type='payment',
                    status='pending',
                    priority='medium'
                )
                db.session.add(dispute)
            db.session.commit()
        
        response = client.get('/api/donor/disputes', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'disputes' in data
        assert len(data['disputes']) >= 3
    
    def test_donor_create_dispute(self, client, donor_token, app):
        """Test donor creating dispute"""
        with app.app_context():
            # Create a recipient user
            recipient_user = User(
                email='recipient@test.com',
                password=generate_password_hash('password123'),
                role='agency',
                is_verified=True,
                is_active=True,
                first_name='Recipient',
                last_name='User'
            )
            db.session.add(recipient_user)
            db.session.commit()
            recipient_id = recipient_user.id
        
        response = client.post('/api/donor/disputes', 
                             headers={'Authorization': f'Bearer {donor_token}'},
                             json={
                                 'recipient_id': recipient_id,
                                 'title': 'Test Donor Dispute',
                                 'description': 'This is a test dispute from donor',
                                 'dispute_type': 'payment',
                                 'priority': 'high'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Dispute created successfully'
    
    def test_surrogate_get_disputes(self, client, surrogate_token, app):
        """Test surrogate getting disputes"""
        with app.app_context():
            # Create surrogate user
            surrogate_user = User.query.filter_by(email='surrogate@test.com').first()
            
            # Create some disputes for the surrogate
            for i in range(3):
                dispute = Dispute(
                    surrogate_id=surrogate_user.id,
                    title=f'Surrogate Dispute {i}',
                    description=f'This is surrogate dispute {i}',
                    dispute_type='contract',
                    status='pending',
                    priority='medium'
                )
                db.session.add(dispute)
            db.session.commit()
        
        response = client.get('/api/surrogate/disputes', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'disputes' in data
        assert len(data['disputes']) >= 3
    
    def test_surrogate_create_dispute(self, client, surrogate_token, app):
        """Test surrogate creating dispute"""
        with app.app_context():
            # Create a recipient user
            recipient_user = User(
                email='recipient2@test.com',
                password=generate_password_hash('password123'),
                role='agency',
                is_verified=True,
                is_active=True,
                first_name='Recipient',
                last_name='User2'
            )
            db.session.add(recipient_user)
            db.session.commit()
            recipient_id = recipient_user.id
        
        response = client.post('/api/surrogate/disputes', 
                             headers={'Authorization': f'Bearer {surrogate_token}'},
                             json={
                                 'recipient_id': recipient_id,
                                 'title': 'Test Surrogate Dispute',
                                 'description': 'This is a test dispute from surrogate',
                                 'dispute_type': 'contract',
                                 'priority': 'high'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Dispute created successfully'
    
    def test_ip_get_disputes(self, client, ip_token, app):
        """Test intending parent getting disputes"""
        with app.app_context():
            # Create intending parent user
            ip_user = User.query.filter_by(email='ip@test.com').first()
            
            # Create some disputes for the intending parent
            for i in range(3):
                dispute = Dispute(
                    intending_parent_id=ip_user.id,
                    title=f'IP Dispute {i}',
                    description=f'This is IP dispute {i}',
                    dispute_type='contract',
                    status='pending',
                    priority='medium'
                )
                db.session.add(dispute)
            db.session.commit()
        
        response = client.get('/api/intending-parent/disputes', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'disputes' in data
        assert len(data['disputes']) >= 3
    
    def test_ip_create_dispute(self, client, ip_token, app):
        """Test intending parent creating dispute"""
        with app.app_context():
            # Create a recipient user
            recipient_user = User(
                email='recipient3@test.com',
                password=generate_password_hash('password123'),
                role='agency',
                is_verified=True,
                is_active=True,
                first_name='Recipient',
                last_name='User3'
            )
            db.session.add(recipient_user)
            db.session.commit()
            recipient_id = recipient_user.id
        
        response = client.post('/api/intending-parent/disputes', 
                             headers={'Authorization': f'Bearer {ip_token}'},
                             json={
                                 'recipient_id': recipient_id,
                                 'title': 'Test IP Dispute',
                                 'description': 'This is a test dispute from intending parent',
                                 'dispute_type': 'contract',
                                 'priority': 'high'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Dispute created successfully'
    
    def test_get_dispute_by_id(self, client, admin_token, app):
        """Test getting dispute by ID"""
        with app.app_context():
            # Create a dispute
            dispute = Dispute(
                title='Test Dispute',
                description='This is a test dispute',
                dispute_type='contract',
                status='pending',
                priority='medium'
            )
            db.session.add(dispute)
            db.session.commit()
            dispute_id = dispute.id
        
        response = client.get(f'/api/disputes/{dispute_id}', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['dispute']['id'] == dispute_id
    
    def test_get_dispute_by_id_not_found(self, client, admin_token):
        """Test getting dispute by non-existent ID"""
        response = client.get('/api/disputes/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Dispute not found' in data['error']
    
    def test_update_dispute_status(self, client, admin_token, app):
        """Test updating dispute status"""
        with app.app_context():
            # Create a dispute
            dispute = Dispute(
                title='Test Dispute',
                description='This is a test dispute',
                dispute_type='contract',
                status='pending',
                priority='medium'
            )
            db.session.add(dispute)
            db.session.commit()
            dispute_id = dispute.id
        
        response = client.put(f'/api/disputes/{dispute_id}/status', 
                            headers={'Authorization': f'Bearer {admin_token}'},
                            json={
                                'status': 'resolved',
                                'resolution': 'Dispute resolved',
                                'resolution_date': '2024-01-15'
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Dispute status updated successfully'
    
    def test_search_disputes(self, client, admin_token, app):
        """Test searching disputes"""
        with app.app_context():
            # Create some disputes with different types
            dispute_types = ['contract', 'payment', 'service']
            for i, dispute_type in enumerate(dispute_types):
                dispute = Dispute(
                    title=f'Test Dispute {i}',
                    description=f'This is test dispute {i}',
                    dispute_type=dispute_type,
                    status='pending',
                    priority='medium'
                )
                db.session.add(dispute)
            db.session.commit()
        
        # Search for contract disputes
        response = client.get('/api/disputes/search?dispute_type=contract', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'disputes' in data
        assert len(data['disputes']) >= 1
    
    def test_filter_disputes(self, client, admin_token, app):
        """Test filtering disputes"""
        with app.app_context():
            # Create some disputes with different statuses
            statuses = ['pending', 'resolved', 'escalated']
            for i, status in enumerate(statuses):
                dispute = Dispute(
                    title=f'Test Dispute {i}',
                    description=f'This is test dispute {i}',
                    dispute_type='contract',
                    status=status,
                    priority='medium'
                )
                db.session.add(dispute)
            db.session.commit()
        
        # Filter for pending disputes
        response = client.get('/api/disputes/filter?status=pending', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'disputes' in data
        assert len(data['disputes']) >= 1
    
    def test_get_dispute_statistics(self, client, admin_token, app):
        """Test getting dispute statistics"""
        with app.app_context():
            # Create some disputes with different statuses
            statuses = ['pending', 'resolved', 'escalated', 'closed']
            for i, status in enumerate(statuses):
                for j in range(2):
                    dispute = Dispute(
                        title=f'Test Dispute {i}{j}',
                        description=f'This is test dispute {i}{j}',
                        dispute_type='contract',
                        status=status,
                        priority='medium'
                    )
                    db.session.add(dispute)
            db.session.commit()
        
        response = client.get('/api/disputes/statistics', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'statistics' in data