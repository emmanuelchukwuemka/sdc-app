import pytest
import json
import tempfile
import os
import sys
from unittest.mock import patch, MagicMock

# Add src to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from src import create_app
from src.models import db, User, Role, Donor, DonorProfile, DonorKyc, DonorAppointment, Contract, Favorite
from werkzeug.security import generate_password_hash


class TestDonorAPI:
    """Test donor endpoints"""
    
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
            
            # Create donor profile
            donor_profile = DonorProfile(
                user_id=donor_user.id,
                blood_type='O+',
                height=170,
                weight=65,
                eye_color='brown',
                hair_color='brown',
                ethnicity='Caucasian',
                education_level='Bachelor',
                occupation='Engineer',
                has_children=False,
                donation_count=0,
                availability='available'
            )
            db.session.add(donor_profile)
            db.session.commit()
        
        # Login to get token
        response = client.post('/api/auth/login', json={
            'email': 'donor@test.com',
            'password': 'donor123'
        })
        
        return json.loads(response.data)['access_token']
    
    @pytest.fixture
    def test_users(self, app):
        """Create test users for different roles"""
        with app.app_context():
            # Create roles
            roles = ['agency', 'intending_parent']
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
    
    def test_get_donor_profile(self, client, donor_token):
        """Test getting donor profile"""
        response = client.get('/api/donor/profile', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'donor_profile' in data
        assert data['donor_profile']['blood_type'] == 'O+'
    
    def test_update_donor_profile(self, client, donor_token):
        """Test updating donor profile"""
        response = client.put('/api/donor/profile', 
                            headers={'Authorization': f'Bearer {donor_token}'},
                            json={
                                'blood_type': 'A+',
                                'height': 175,
                                'weight': 70,
                                'eye_color': 'blue',
                                'hair_color': 'blonde',
                                'ethnicity': 'Asian',
                                'education_level': 'Master',
                                'occupation': 'Doctor',
                                'has_children': True,
                                'availability': 'unavailable'
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Donor profile updated successfully'
    
    def test_get_donor_kyc(self, client, donor_token):
        """Test getting donor KYC status"""
        response = client.get('/api/donor/kyc', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'kyc_status' in data
    
    def test_submit_donor_kyc(self, client, donor_token):
        """Test submitting donor KYC"""
        response = client.post('/api/donor/kyc', 
                             headers={'Authorization': f'Bearer {donor_token}'},
                             json={
                                 'id_number': 'DON123456',
                                 'id_type': 'passport',
                                 'id_expiry_date': '2025-12-31',
                                 'medical_history': 'No significant medical history',
                                 'genetic_testing': True,
                                 'genetic_testing_date': '2024-01-01',
                                 'genetic_testing_results': 'Normal',
                                 'drug_test_date': '2024-01-01',
                                 'drug_test_results': 'Negative',
                                 'infectious_disease_screening': True,
                                 'infectious_disease_date': '2024-01-01',
                                 'infectious_disease_results': 'Negative'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'KYC information submitted successfully'
    
    def test_update_donor_kyc(self, client, donor_token, app):
        """Test updating donor KYC"""
        with app.app_context():
            # Create initial KYC
            donor_user = User.query.filter_by(email='donor@test.com').first()
            donor_kyc = DonorKyc(
                user_id=donor_user.id,
                id_number='DON123456',
                id_type='passport',
                id_expiry_date='2025-12-31',
                medical_history='No significant medical history',
                genetic_testing=True,
                genetic_testing_date='2024-01-01',
                genetic_testing_results='Normal'
            )
            db.session.add(donor_kyc)
            db.session.commit()
        
        response = client.put('/api/donor/kyc', 
                            headers={'Authorization': f'Bearer {donor_token}'},
                            json={
                                'medical_history': 'Updated medical history',
                                'genetic_testing': False,
                                'drug_test_date': '2024-06-01',
                                'drug_test_results': 'Negative'
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'KYC information updated successfully'
    
    def test_get_donor_appointments(self, client, donor_token):
        """Test getting donor appointments"""
        response = client.get('/api/donor/appointments', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'appointments' in data
    
    def test_schedule_appointment(self, client, donor_token, app):
        """Test scheduling appointment"""
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
            agency_id = agency_user.id
        
        response = client.post('/api/donor/appointments', 
                             headers={'Authorization': f'Bearer {donor_token}'},
                             json={
                                 'agency_id': agency_id,
                                 'appointment_date': '2024-06-01T10:00:00',
                                 'appointment_type': 'medical_evaluation',
                                 'purpose': 'Initial medical evaluation',
                                 'status': 'scheduled'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Appointment scheduled successfully'
    
    def test_update_appointment(self, client, donor_token, app):
        """Test updating appointment"""
        with app.app_context():
            # Create an appointment
            donor_user = User.query.filter_by(email='donor@test.com').first()
            appointment = DonorAppointment(
                donor_id=donor_user.id,
                appointment_date='2024-06-01T10:00:00',
                appointment_type='medical_evaluation',
                purpose='Initial medical evaluation',
                status='scheduled'
            )
            db.session.add(appointment)
            db.session.commit()
            appointment_id = appointment.id
        
        response = client.put(f'/api/donor/appointments/{appointment_id}', 
                            headers={'Authorization': f'Bearer {donor_token}'},
                            json={
                                'appointment_date': '2024-06-02T10:00:00',
                                'status': 'confirmed'
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Appointment updated successfully'
    
    def test_cancel_appointment(self, client, donor_token, app):
        """Test canceling appointment"""
        with app.app_context():
            # Create an appointment
            donor_user = User.query.filter_by(email='donor@test.com').first()
            appointment = DonorAppointment(
                donor_id=donor_user.id,
                appointment_date='2024-06-01T10:00:00',
                appointment_type='medical_evaluation',
                purpose='Initial medical evaluation',
                status='scheduled'
            )
            db.session.add(appointment)
            db.session.commit()
            appointment_id = appointment.id
        
        response = client.delete(f'/api/donor/appointments/{appointment_id}', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Appointment canceled successfully'
    
    def test_get_donor_contracts(self, client, donor_token):
        """Test getting donor contracts"""
        response = client.get('/api/donor/contracts', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'contracts' in data
    
    def test_get_contract_by_id(self, client, donor_token):
        """Test getting contract by ID"""
        # This would need actual contracts to be created
        # For now, test with non-existent ID
        response = client.get('/api/donor/contracts/99999', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 404
    
    def test_sign_contract(self, client, donor_token, app):
        """Test signing contract"""
        with app.app_context():
            # Create a contract
            donor_user = User.query.filter_by(email='donor@test.com').first()
            contract = Contract(
                donor_id=donor_user.id,
                contract_type='donation',
                terms='Test contract terms',
                start_date='2024-01-01',
                end_date='2024-12-31',
                amount=5000.00,
                status='pending'
            )
            db.session.add(contract)
            db.session.commit()
            contract_id = contract.id
        
        response = client.put(f'/api/donor/contracts/{contract_id}/sign', 
                            headers={'Authorization': f'Bearer {donor_token}'},
                            json={'signature': 'Test signature'})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Contract signed successfully'
    
    def test_get_donor_wallet(self, client, donor_token):
        """Test getting donor wallet"""
        response = client.get('/api/donor/wallet', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'wallet' in data
    
    def test_get_donor_transactions(self, client, donor_token):
        """Test getting donor transactions"""
        response = client.get('/api/donor/wallet/transactions', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'transactions' in data
    
    def test_get_donor_notifications(self, client, donor_token):
        """Test getting donor notifications"""
        response = client.get('/api/donor/notifications', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'notifications' in data
    
    def test_mark_notification_read(self, client, donor_token):
        """Test marking notification as read"""
        # This would need actual notifications to be created
        # For now, test with non-existent ID
        response = client.put('/api/donor/notifications/99999/read', 
                            headers={'Authorization': f'Bearer {donor_token}'})
        
        assert response.status_code == 404
    
    def test_get_donor_messages(self, client, donor_token):
        """Test getting donor messages"""
        response = client.get('/api/donor/messages', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'messages' in data
    
    def test_send_message(self, client, donor_token, app):
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
        
        response = client.post('/api/donor/messages', 
                             headers={'Authorization': f'Bearer {donor_token}'},
                             json={
                                 'recipient_id': recipient_id,
                                 'subject': 'Test Message',
                                 'message': 'This is a test message from donor'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Message sent successfully'
    
    def test_get_message_by_id(self, client, donor_token):
        """Test getting message by ID"""
        # This would need actual messages to be created
        # For now, test with non-existent ID
        response = client.get('/api/donor/messages/99999', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 404
    
    def test_delete_message(self, client, donor_token):
        """Test deleting message"""
        # This would need actual messages to be created
        # For now, test with non-existent ID
        response = client.delete('/api/donor/messages/99999', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 404
    
    def test_get_donor_favorites(self, client, donor_token):
        """Test getting donor favorites"""
        response = client.get('/api/donor/favorites', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'favorites' in data
    
    def test_add_favorite(self, client, donor_token, app):
        """Test adding favorite"""
        with app.app_context():
            # Create an intending parent user
            ip_user = User(
                email='ip@test.com',
                password=generate_password_hash('ip123'),
                role='intending_parent',
                is_verified=True,
                is_active=True,
                first_name='Intending',
                last_name='Parent'
            )
            db.session.add(ip_user)
            db.session.commit()
            ip_id = ip_user.id
        
        response = client.post('/api/donor/favorites', 
                             headers={'Authorization': f'Bearer {donor_token}'},
                             json={'favorite_user_id': ip_id})
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Added to favorites successfully'
    
    def test_remove_favorite(self, client, donor_token, app):
        """Test removing favorite"""
        with app.app_context():
            # Create a favorite
            donor_user = User.query.filter_by(email='donor@test.com').first()
            ip_user = User(
                email='ip2@test.com',
                password=generate_password_hash('ip123'),
                role='intending_parent',
                is_verified=True,
                is_active=True,
                first_name='Intending',
                last_name='Parent2'
            )
            db.session.add(ip_user)
            db.session.commit()
            ip_id = ip_user.id
            
            favorite = Favorite(
                donor_id=donor_user.id,
                favorite_user_id=ip_id
            )
            db.session.add(favorite)
            db.session.commit()
            favorite_id = favorite.id
        
        response = client.delete(f'/api/donor/favorites/{favorite_id}', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Removed from favorites successfully'
    
    def test_get_donor_badges(self, client, donor_token):
        """Test getting donor badges"""
        response = client.get('/api/donor/badges', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'badges' in data
    
    def test_get_donor_disputes(self, client, donor_token):
        """Test getting donor disputes"""
        response = client.get('/api/donor/disputes', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'disputes' in data
    
    def test_get_dispute_by_id(self, client, donor_token):
        """Test getting dispute by ID"""
        # This would need actual disputes to be created
        # For now, test with non-existent ID
        response = client.get('/api/donor/disputes/99999', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 404
    
    def test_create_dispute(self, client, donor_token, app):
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
        
        response = client.post('/api/donor/disputes', 
                             headers={'Authorization': f'Bearer {donor_token}'},
                             json={
                                 'agency_id': agency_id,
                                 'title': 'Test Dispute',
                                 'description': 'This is a test dispute',
                                 'category': 'payment'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Dispute created successfully'
    
    def test_update_dispute_status(self, client, donor_token):
        """Test updating dispute status"""
        # This would need actual disputes to be created
        # For now, test with non-existent ID
        response = client.put('/api/donor/disputes/99999/status', 
                            headers={'Authorization': f'Bearer {donor_token}'},
                            json={'status': 'resolved', 'resolution': 'Test resolution'})
        
        assert response.status_code == 404