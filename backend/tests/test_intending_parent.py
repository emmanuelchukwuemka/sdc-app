import pytest
import json
import tempfile
import os
from unittest.mock import patch, MagicMock
from src.app import create_app
from src.models import db, User, Role, IntendingParent, IntendingParentProfile
from werkzeug.security import generate_password_hash


class TestIntendingParentAPI:
    """Test intending parent endpoints"""
    
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
            
            # Create intending parent profile
            ip_profile = IntendingParentProfile(
                user_id=ip_user.id,
                marital_status='married',
                partner_name='Test Partner',
                partner_email='partner@test.com',
                partner_phone='+1234567890',
                infertility_diagnosis='Unexplained infertility',
                previous_treatments='IUI, IVF',
                preferred_surrogacy_type='gestational',
                budget_range='50000-100000',
                preferences='No smoking, healthy lifestyle',
                timeline='6-12 months'
            )
            db.session.add(ip_profile)
            db.session.commit()
        
        # Login to get token
        response = client.post('/api/auth/login', json={
            'email': 'ip@test.com',
            'password': 'ip123'
        })
        
        return json.loads(response.data)['access_token']
    
    @pytest.fixture
    def test_users(self, app):
        """Create test users for different roles"""
        with app.app_context():
            # Create roles
            roles = ['agency', 'donor', 'surrogate']
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
    
    def test_get_ip_profile(self, client, ip_token):
        """Test getting intending parent profile"""
        response = client.get('/api/intending-parent/profile', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'intending_parent_profile' in data
        assert data['intending_parent_profile']['marital_status'] == 'married'
    
    def test_update_ip_profile(self, client, ip_token):
        """Test updating intending parent profile"""
        response = client.put('/api/intending-parent/profile', 
                            headers={'Authorization': f'Bearer {ip_token}'},
                            json={
                                'marital_status': 'single',
                                'partner_name': 'Updated Partner',
                                'partner_email': 'updatedpartner@test.com',
                                'partner_phone': '+1987654321',
                                'infertility_diagnosis': 'Male factor',
                                'previous_treatments': 'IVF only',
                                'preferred_surrogacy_type': 'traditional',
                                'budget_range': '100000-150000',
                                'preferences': 'Updated preferences',
                                'timeline': '12-18 months'
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Intending parent profile updated successfully'
    
    def test_get_ip_kyc(self, client, ip_token):
        """Test getting intending parent KYC status"""
        response = client.get('/api/intending-parent/kyc', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'kyc_status' in data
    
    def test_submit_ip_kyc(self, client, ip_token):
        """Test submitting intending parent KYC"""
        response = client.post('/api/intending-parent/kyc', 
                             headers={'Authorization': f'Bearer {ip_token}'},
                             json={
                                 'id_number': 'IP123456',
                                 'id_type': 'passport',
                                 'id_expiry_date': '2025-12-31',
                                 'financial_documents': 'Bank statements provided',
                                 'legal_clearance': True,
                                 'legal_clearance_date': '2024-01-01',
                                 'legal_clearance_details': 'Clearance obtained',
                                 'medical_clearance': True,
                                 'medical_clearance_date': '2024-01-01',
                                 'medical_clearance_details': 'Clearance obtained',
                                 'psychological_evaluation': True,
                                 'psychological_evaluation_date': '2024-01-01',
                                 'psychological_evaluation_results': 'Clear',
                                 'home_study': True,
                                 'home_study_date': '2024-01-01',
                                 'home_study_results': 'Approved'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'KYC information submitted successfully'
    
    def test_update_ip_kyc(self, client, ip_token, app):
        """Test updating intending parent KYC"""
        with app.app_context():
            # Create initial KYC
            ip_user = User.query.filter_by(email='ip@test.com').first()
            ip_kyc = IntendingParentKyc(
                user_id=ip_user.id,
                id_number='IP123456',
                id_type='passport',
                id_expiry_date='2025-12-31',
                financial_documents='Bank statements provided',
                legal_clearance=True,
                legal_clearance_date='2024-01-01',
                legal_clearance_details='Clearance obtained'
            )
            db.session.add(ip_kyc)
            db.session.commit()
        
        response = client.put('/api/intending-parent/kyc', 
                            headers={'Authorization': f'Bearer {ip_token}'},
                            json={
                                'financial_documents': 'Updated financial documents',
                                'legal_clearance': False,
                                'medical_clearance': True,
                                'medical_clearance_date': '2024-06-01',
                                'medical_clearance_details': 'Updated clearance'
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'KYC information updated successfully'
    
    def test_get_ip_contracts(self, client, ip_token):
        """Test getting intending parent contracts"""
        response = client.get('/api/intending-parent/contracts', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'contracts' in data
    
    def test_get_contract_by_id(self, client, ip_token):
        """Test getting contract by ID"""
        # This would need actual contracts to be created
        # For now, test with non-existent ID
        response = client.get('/api/intending-parent/contracts/99999', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 404
    
    def test_sign_contract(self, client, ip_token, app):
        """Test signing contract"""
        with app.app_context():
            # Create a contract
            ip_user = User.query.filter_by(email='ip@test.com').first()
            contract = Contract(
                intending_parent_id=ip_user.id,
                contract_type='surrogacy',
                terms='Test contract terms',
                start_date='2024-01-01',
                end_date='2024-12-31',
                amount=50000.00,
                status='pending'
            )
            db.session.add(contract)
            db.session.commit()
            contract_id = contract.id
        
        response = client.put(f'/api/intending-parent/contracts/{contract_id}/sign', 
                            headers={'Authorization': f'Bearer {ip_token}'},
                            json={'signature': 'Test signature'})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Contract signed successfully'
    
    def test_get_ip_wallet(self, client, ip_token):
        """Test getting intending parent wallet"""
        response = client.get('/api/intending-parent/wallet', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'wallet' in data
    
    def test_get_ip_transactions(self, client, ip_token):
        """Test getting intending parent transactions"""
        response = client.get('/api/intending-parent/wallet/transactions', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'transactions' in data
    
    def test_get_ip_notifications(self, client, ip_token):
        """Test getting intending parent notifications"""
        response = client.get('/api/intending-parent/notifications', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'notifications' in data
    
    def test_mark_notification_read(self, client, ip_token):
        """Test marking notification as read"""
        # This would need actual notifications to be created
        # For now, test with non-existent ID
        response = client.put('/api/intending-parent/notifications/99999/read', 
                            headers={'Authorization': f'Bearer {ip_token}'})
        
        assert response.status_code == 404
    
    def test_get_ip_messages(self, client, ip_token):
        """Test getting intending parent messages"""
        response = client.get('/api/intending-parent/messages', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'messages' in data
    
    def test_send_message(self, client, ip_token, app):
        """Test sending message"""
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
        
        response = client.post('/api/intending-parent/messages', 
                             headers={'Authorization': f'Bearer {ip_token}'},
                             json={
                                 'recipient_id': recipient_id,
                                 'subject': 'Test Message',
                                 'message': 'This is a test message from intending parent'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Message sent successfully'
    
    def test_get_message_by_id(self, client, ip_token):
        """Test getting message by ID"""
        # This would need actual messages to be created
        # For now, test with non-existent ID
        response = client.get('/api/intending-parent/messages/99999', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 404
    
    def test_delete_message(self, client, ip_token):
        """Test deleting message"""
        # This would need actual messages to be created
        # For now, test with non-existent ID
        response = client.delete('/api/intending-parent/messages/99999', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 404
    
    def test_get_ip_favorites(self, client, ip_token):
        """Test getting intending parent favorites"""
        response = client.get('/api/intending-parent/favorites', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'favorites' in data
    
    def test_add_favorite(self, client, ip_token, app):
        """Test adding favorite"""
        with app.app_context():
            # Create a donor user
            donor_user = User(
                email='donor@test.com',
                password=generate_password_hash('donor123'),
                role='donor',
                is_verified=True,
                is_active=True,
                first_name='Donor',
                last_name='User'
            )
            db.session.add(donor_user)
            db.session.commit()
            donor_id = donor_user.id
        
        response = client.post('/api/intending-parent/favorites', 
                             headers={'Authorization': f'Bearer {ip_token}'},
                             json={'favorite_user_id': donor_id})
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Added to favorites successfully'
    
    def test_remove_favorite(self, client, ip_token, app):
        """Test removing favorite"""
        with app.app_context():
            # Create a favorite
            ip_user = User.query.filter_by(email='ip@test.com').first()
            donor_user = User(
                email='donor2@test.com',
                password=generate_password_hash('donor123'),
                role='donor',
                is_verified=True,
                is_active=True,
                first_name='Donor',
                last_name='User2'
            )
            db.session.add(donor_user)
            db.session.commit()
            donor_id = donor_user.id
            
            favorite = Favorite(
                intending_parent_id=ip_user.id,
                favorite_user_id=donor_id
            )
            db.session.add(favorite)
            db.session.commit()
            favorite_id = favorite.id
        
        response = client.delete(f'/api/intending-parent/favorites/{favorite_id}', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Removed from favorites successfully'
    
    def test_get_ip_badges(self, client, ip_token):
        """Test getting intending parent badges"""
        response = client.get('/api/intending-parent/badges', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'badges' in data
    
    def test_get_ip_disputes(self, client, ip_token):
        """Test getting intending parent disputes"""
        response = client.get('/api/intending-parent/disputes', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'disputes' in data
    
    def test_get_dispute_by_id(self, client, ip_token):
        """Test getting dispute by ID"""
        # This would need actual disputes to be created
        # For now, test with non-existent ID
        response = client.get('/api/intending-parent/disputes/99999', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 404
    
    def test_create_dispute(self, client, ip_token, app):
        """Test creating dispute"""
        with app.app_context():
            # Create an agency user
            agency_user = User(
                email='disputeagency@test.com',
                password=generate_password_hash('agency123'),
                role='agency',
                is_verified=True,
                is_active=True,
                first_name='Dispute',
                last_name='Agency'
            )
            db.session.add(agency_user)
            db.session.commit()
            agency_id = agency_user.id
        
        response = client.post('/api/intending-parent/disputes', 
                             headers={'Authorization': f'Bearer {ip_token}'},
                             json={
                                 'agency_id': agency_id,
                                 'title': 'Test Dispute',
                                 'description': 'This is a test dispute',
                                 'category': 'contract_terms'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Dispute created successfully'
    
    def test_update_dispute_status(self, client, ip_token):
        """Test updating dispute status"""
        # This would need actual disputes to be created
        # For now, test with non-existent ID
        response = client.put('/api/intending-parent/disputes/99999/status', 
                            headers={'Authorization': f'Bearer {ip_token}'},
                            json={'status': 'resolved', 'resolution': 'Test resolution'})
        
        assert response.status_code == 404
    
    def test_get_ip_journey(self, client, ip_token):
        """Test getting intending parent journey"""
        response = client.get('/api/intending-parent/journey', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'journey' in data
    
    def test_update_journey_status(self, client, ip_token, app):
        """Test updating journey status"""
        with app.app_context():
            # Create a journey
            ip_user = User.query.filter_by(email='ip@test.com').first()
            journey = IntendingParentJourney(
                intending_parent_id=ip_user.id,
                current_stage='initial_consultation',
                progress_percentage=10,
                estimated_completion_date='2025-06-01',
                notes='Starting the journey'
            )
            db.session.add(journey)
            db.session.commit()
            journey_id = journey.id
        
        response = client.put(f'/api/intending-parent/journey/{journey_id}', 
                            headers={'Authorization': f'Bearer {ip_token}'},
                            json={
                                'current_stage': 'matching',
                                'progress_percentage': 30,
                                'notes': 'Looking for matches'
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Journey updated successfully'
    
    def test_get_ip_agencies(self, client, ip_token, app):
        """Test getting intending parent agencies"""
        with app.app_context():
            # Create an agency user
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
        
        response = client.get('/api/intending-parent/agencies', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'agencies' in data
        assert len(data['agencies']) >= 1
    
    def test_get_agency_by_id(self, client, ip_token, app):
        """Test getting agency by ID"""
        with app.app_context():
            # Create an agency user
            agency_user = User(
                email='agency2@test.com',
                password=generate_password_hash('agency123'),
                role='agency',
                is_verified=True,
                is_active=True,
                first_name='Test',
                last_name='Agency2'
            )
            db.session.add(agency_user)
            db.session.commit()
            
            # Create agency
            agency = Agency(
                user_id=agency_user.id,
                name='Test Agency 2',
                license_number='TEST456',
                address='456 Test St',
                phone='+1987654321',
                description='Test agency description 2'
            )
            db.session.add(agency)
            db.session.commit()
            agency_id = agency.id
        
        response = client.get(f'/api/intending-parent/agencies/{agency_id}', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['agency']['id'] == agency_id
        assert data['agency']['name'] == 'Test Agency 2'