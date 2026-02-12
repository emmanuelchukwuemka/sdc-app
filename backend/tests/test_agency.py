import pytest
import json
import tempfile
import os
import sys
from unittest.mock import patch, MagicMock

# Add src to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src import create_app
from src.models import db, User, Role, Agency, Donor, Surrogate, IntendingParent
from werkzeug.security import generate_password_hash


class TestAgencyAPI:
    """Test agency endpoints"""
    
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
        
        # Login to get token
        response = client.post('/api/auth/login', json={
            'email': 'agency@test.com',
            'password': 'agency123'
        })
        
        return json.loads(response.data)['access_token']
    
    @pytest.fixture
    def test_users(self, app):
        """Create test users for different roles"""
        with app.app_context():
            # Create roles
            roles = ['donor', 'surrogate', 'intending_parent']
            for role_name in roles:
                role = Role(name=role_name)
                db.session.add(role)
            
            db.session.commit()
            
            # Create test users
            users = []
            for i, role_name in enumerate(roles):
                user = User(
                    email=f'{role_name}{i}@test.com',
                    password=generate_password_hash('password123'),
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
    
    def test_get_agency_profile(self, client, agency_token):
        """Test getting agency profile"""
        response = client.get('/api/agency/profile', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'agency' in data
        assert data['agency']['name'] == 'Test Agency'
    
    def test_update_agency_profile(self, client, agency_token):
        """Test updating agency profile"""
        response = client.put('/api/agency/profile', 
                            headers={'Authorization': f'Bearer {agency_token}'},
                            json={
                                'name': 'Updated Agency Name',
                                'license_number': 'UPDATED123',
                                'address': '456 Updated St',
                                'phone': '+1987654321',
                                'description': 'Updated description'
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Agency profile updated successfully'
    
    def test_get_agency_clients(self, client, agency_token, app):
        """Test getting agency clients"""
        with app.app_context():
            # Create some clients for the agency
            agency_user = User.query.filter_by(email='agency@test.com').first()
            agency = Agency.query.filter_by(user_id=agency_user.id).first()
            
            # Create some clients
            for i in range(3):
                client_user = User(
                    email=f'client{i}@test.com',
                    password=generate_password_hash('password123'),
                    role='intending_parent',
                    is_verified=True,
                    is_active=True,
                    first_name=f'Client{i}',
                    last_name='Test'
                )
                db.session.add(client_user)
                db.session.commit()
                
                # Link client to agency (this would need actual implementation)
                # For now, just test the endpoint exists
                pass
        
        response = client.get('/api/agency/clients', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'clients' in data
    
    def test_get_client_by_id(self, client, agency_token, app):
        """Test getting client by ID"""
        # This would need actual clients to be created and linked to agency
        # For now, test with non-existent ID
        response = client.get('/api/agency/clients/99999', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 404
    
    def test_update_client_status(self, client, agency_token, app):
        """Test updating client status"""
        # This would need actual clients to be created and linked to agency
        # For now, test with non-existent ID
        response = client.put('/api/agency/clients/99999/status', 
                            headers={'Authorization': f'Bearer {agency_token}'},
                            json={'status': 'active'})
        
        assert response.status_code == 404
    
    def test_get_agency_contracts(self, client, agency_token):
        """Test getting agency contracts"""
        response = client.get('/api/agency/contracts', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'contracts' in data
    
    def test_get_contract_by_id(self, client, agency_token):
        """Test getting contract by ID"""
        # This would need actual contracts to be created
        # For now, test with non-existent ID
        response = client.get('/api/agency/contracts/99999', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 404
    
    def test_create_contract(self, client, agency_token, app):
        """Test creating contract"""
        with app.app_context():
            # Create a client user
            client_user = User(
                email='contractclient@test.com',
                password=generate_password_hash('password123'),
                role='intending_parent',
                is_verified=True,
                is_active=True,
                first_name='Contract',
                last_name='Client'
            )
            db.session.add(client_user)
            db.session.commit()
            client_id = client_user.id
        
        response = client.post('/api/agency/contracts', 
                             headers={'Authorization': f'Bearer {agency_token}'},
                             json={
                                 'client_id': client_id,
                                 'contract_type': 'surrogacy',
                                 'terms': 'Test contract terms',
                                 'start_date': '2024-01-01',
                                 'end_date': '2024-12-31',
                                 'amount': 50000.00
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Contract created successfully'
    
    def test_update_contract(self, client, agency_token, app):
        """Test updating contract"""
        # This would need actual contracts to be created
        # For now, test with non-existent ID
        response = client.put('/api/agency/contracts/99999', 
                            headers={'Authorization': f'Bearer {agency_token}'},
                            json={'terms': 'Updated terms'})
        
        assert response.status_code == 404
    
    def test_delete_contract(self, client, agency_token):
        """Test deleting contract"""
        # This would need actual contracts to be created
        # For now, test with non-existent ID
        response = client.delete('/api/agency/contracts/99999', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 404
    
    def test_get_agency_commissions(self, client, agency_token):
        """Test getting agency commissions"""
        response = client.get('/api/agency/commissions', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'commissions' in data
    
    def test_get_commission_by_id(self, client, agency_token):
        """Test getting commission by ID"""
        # This would need actual commissions to be created
        # For now, test with non-existent ID
        response = client.get('/api/agency/commissions/99999', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 404
    
    def test_get_agency_reports(self, client, agency_token):
        """Test getting agency reports"""
        response = client.get('/api/agency/reports', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'reports' in data
    
    def test_generate_agency_report(self, client, agency_token):
        """Test generating agency report"""
        response = client.post('/api/agency/reports/generate', 
                             headers={'Authorization': f'Bearer {agency_token}'},
                             json={
                                 'report_type': 'client_activity',
                                 'start_date': '2024-01-01',
                                 'end_date': '2024-12-31'
                             })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'report_id' in data
        assert 'download_url' in data
    
    def test_get_agency_kyc_requests(self, client, agency_token):
        """Test getting agency KYC requests"""
        response = client.get('/api/agency/kyc-requests', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'kyc_requests' in data
    
    def test_update_kyc_status(self, client, agency_token):
        """Test updating KYC status"""
        # This would need actual KYC requests to be created
        # For now, test with non-existent ID
        response = client.put('/api/agency/kyc-requests/99999/status', 
                            headers={'Authorization': f'Bearer {agency_token}'},
                            json={'status': 'approved', 'comments': 'KYC verified'})
        
        assert response.status_code == 404
    
    def test_get_agency_notifications(self, client, agency_token):
        """Test getting agency notifications"""
        response = client.get('/api/agency/notifications', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'notifications' in data
    
    def test_mark_notification_read(self, client, agency_token):
        """Test marking notification as read"""
        # This would need actual notifications to be created
        # For now, test with non-existent ID
        response = client.put('/api/agency/notifications/99999/read', 
                            headers={'Authorization': f'Bearer {agency_token}'})
        
        assert response.status_code == 404
    
    def test_get_agency_messages(self, client, agency_token):
        """Test getting agency messages"""
        response = client.get('/api/agency/messages', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'messages' in data
    
    def test_send_message(self, client, agency_token, app):
        """Test sending message"""
        with app.app_context():
            # Create a recipient user
            recipient_user = User(
                email='recipient@test.com',
                password=generate_password_hash('password123'),
                role='intending_parent',
                is_verified=True,
                is_active=True,
                first_name='Recipient',
                last_name='User'
            )
            db.session.add(recipient_user)
            db.session.commit()
            recipient_id = recipient_user.id
        
        response = client.post('/api/agency/messages', 
                             headers={'Authorization': f'Bearer {agency_token}'},
                             json={
                                 'recipient_id': recipient_id,
                                 'subject': 'Test Message',
                                 'message': 'This is a test message from agency'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Message sent successfully'
    
    def test_get_message_by_id(self, client, agency_token):
        """Test getting message by ID"""
        # This would need actual messages to be created
        # For now, test with non-existent ID
        response = client.get('/api/agency/messages/99999', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 404
    
    def test_delete_message(self, client, agency_token):
        """Test deleting message"""
        # This would need actual messages to be created
        # For now, test with non-existent ID
        response = client.delete('/api/agency/messages/99999', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 404
    
    def test_get_agency_wallet(self, client, agency_token):
        """Test getting agency wallet"""
        response = client.get('/api/agency/wallet', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'wallet' in data
    
    def test_get_agency_transactions(self, client, agency_token):
        """Test getting agency transactions"""
        response = client.get('/api/agency/wallet/transactions', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'transactions' in data
    
    def test_get_agency_disputes(self, client, agency_token):
        """Test getting agency disputes"""
        response = client.get('/api/agency/disputes', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'disputes' in data
    
    def test_get_dispute_by_id(self, client, agency_token):
        """Test getting dispute by ID"""
        # This would need actual disputes to be created
        # For now, test with non-existent ID
        response = client.get('/api/agency/disputes/99999', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 404
    
    def test_create_dispute(self, client, agency_token, app):
        """Test creating dispute"""
        with app.app_context():
            # Create a client user
            client_user = User(
                email='disputeclient@test.com',
                password=generate_password_hash('password123'),
                role='intending_parent',
                is_verified=True,
                is_active=True,
                first_name='Dispute',
                last_name='Client'
            )
            db.session.add(client_user)
            db.session.commit()
            client_id = client_user.id
        
        response = client.post('/api/agency/disputes', 
                             headers={'Authorization': f'Bearer {agency_token}'},
                             json={
                                 'client_id': client_id,
                                 'title': 'Test Dispute',
                                 'description': 'This is a test dispute',
                                 'category': 'contract'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Dispute created successfully'
    
    def test_update_dispute_status(self, client, agency_token):
        """Test updating dispute status"""
        # This would need actual disputes to be created
        # For now, test with non-existent ID
        response = client.put('/api/agency/disputes/99999/status', 
                            headers={'Authorization': f'Bearer {agency_token}'},
                            json={'status': 'resolved', 'resolution': 'Test resolution'})
        
        assert response.status_code == 404