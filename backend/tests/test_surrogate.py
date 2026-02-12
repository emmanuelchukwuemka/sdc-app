import pytest
import json
import tempfile
import os
from unittest.mock import patch, MagicMock
from src.app import create_app
from src.models import db, User, Role, Surrogate, SurrogateProfile, SurrogateKyc
from werkzeug.security import generate_password_hash


class TestSurrogateAPI:
    """Test surrogate endpoints"""
    
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
            
            # Create surrogate profile
            surrogate_profile = SurrogateProfile(
                user_id=surrogate_user.id,
                height=165,
                weight=60,
                bmi=22.0,
                blood_type='O+',
                last_menstrual_period='2024-01-01',
                previous_pregnancies=2,
                previous_cesareans=0,
                previous_complications=False,
                current_health_conditions='None',
                medications='None',
                lifestyle_factors='Non-smoker, non-drinker',
                availability='available',
                preferences='No twins, no smoking'
            )
            db.session.add(surrogate_profile)
            db.session.commit()
        
        # Login to get token
        response = client.post('/api/auth/login', json={
            'email': 'surrogate@test.com',
            'password': 'surrogate123'
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
    
    def test_get_surrogate_profile(self, client, surrogate_token):
        """Test getting surrogate profile"""
        response = client.get('/api/surrogate/profile', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'surrogate_profile' in data
        assert data['surrogate_profile']['height'] == 165
    
    def test_update_surrogate_profile(self, client, surrogate_token):
        """Test updating surrogate profile"""
        response = client.put('/api/surrogate/profile', 
                            headers={'Authorization': f'Bearer {surrogate_token}'},
                            json={
                                'height': 170,
                                'weight': 65,
                                'bmi': 22.5,
                                'blood_type': 'A+',
                                'last_menstrual_period': '2024-02-01',
                                'previous_pregnancies': 3,
                                'previous_cesareans': 1,
                                'previous_complications': True,
                                'current_health_conditions': 'Gestational diabetes',
                                'medications': 'Insulin',
                                'lifestyle_factors': 'Non-smoker',
                                'availability': 'unavailable',
                                'preferences': 'No multiples'
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Surrogate profile updated successfully'
    
    def test_get_surrogate_kyc(self, client, surrogate_token):
        """Test getting surrogate KYC status"""
        response = client.get('/api/surrogate/kyc', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'kyc_status' in data
    
    def test_submit_surrogate_kyc(self, client, surrogate_token):
        """Test submitting surrogate KYC"""
        response = client.post('/api/surrogate/kyc', 
                             headers={'Authorization': f'Bearer {surrogate_token}'},
                             json={
                                 'id_number': 'SUR123456',
                                 'id_type': 'national_id',
                                 'id_expiry_date': '2025-12-31',
                                 'medical_history': 'Previous C-section',
                                 'reproductive_history': '2 pregnancies, 1 live birth',
                                 'genetic_testing': True,
                                 'genetic_testing_date': '2024-01-01',
                                 'genetic_testing_results': 'Normal',
                                 'drug_test_date': '2024-01-01',
                                 'drug_test_results': 'Negative',
                                 'infectious_disease_screening': True,
                                 'infectious_disease_date': '2024-01-01',
                                 'infectious_disease_results': 'Negative',
                                 'mental_health_screening': True,
                                 'mental_health_date': '2024-01-01',
                                 'mental_health_results': 'Clear',
                                 'home_environment': 'Stable home environment',
                                 'support_system': 'Strong support system'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'KYC information submitted successfully'
    
    def test_update_surrogate_kyc(self, client, surrogate_token, app):
        """Test updating surrogate KYC"""
        with app.app_context():
            # Create initial KYC
            surrogate_user = User.query.filter_by(email='surrogate@test.com').first()
            surrogate_kyc = SurrogateKyc(
                user_id=surrogate_user.id,
                id_number='SUR123456',
                id_type='national_id',
                id_expiry_date='2025-12-31',
                medical_history='Previous C-section',
                reproductive_history='2 pregnancies, 1 live birth',
                genetic_testing=True,
                genetic_testing_date='2024-01-01',
                genetic_testing_results='Normal'
            )
            db.session.add(surrogate_kyc)
            db.session.commit()
        
        response = client.put('/api/surrogate/kyc', 
                            headers={'Authorization': f'Bearer {surrogate_token}'},
                            json={
                                'medical_history': 'Updated medical history',
                                'reproductive_history': 'Updated reproductive history',
                                'drug_test_date': '2024-06-01',
                                'drug_test_results': 'Negative'
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'KYC information updated successfully'
    
    def test_get_surrogate_appointments(self, client, surrogate_token):
        """Test getting surrogate appointments"""
        response = client.get('/api/surrogate/appointments', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'appointments' in data
    
    def test_schedule_appointment(self, client, surrogate_token, app):
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
        
        response = client.post('/api/surrogate/appointments', 
                             headers={'Authorization': f'Bearer {surrogate_token}'},
                             json={
                                 'agency_id': agency_id,
                                 'appointment_date': '2024-06-01T10:00:00',
                                 'appointment_type': 'ultrasound',
                                 'purpose': 'First trimester ultrasound',
                                 'status': 'scheduled'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Appointment scheduled successfully'
    
    def test_update_appointment(self, client, surrogate_token, app):
        """Test updating appointment"""
        with app.app_context():
            # Create an appointment
            surrogate_user = User.query.filter_by(email='surrogate@test.com').first()
            appointment = SurrogateAppointment(
                surrogate_id=surrogate_user.id,
                appointment_date='2024-06-01T10:00:00',
                appointment_type='ultrasound',
                purpose='First trimester ultrasound',
                status='scheduled'
            )
            db.session.add(appointment)
            db.session.commit()
            appointment_id = appointment.id
        
        response = client.put(f'/api/surrogate/appointments/{appointment_id}', 
                            headers={'Authorization': f'Bearer {surrogate_token}'},
                            json={
                                'appointment_date': '2024-06-02T10:00:00',
                                'status': 'confirmed'
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Appointment updated successfully'
    
    def test_cancel_appointment(self, client, surrogate_token, app):
        """Test canceling appointment"""
        with app.app_context():
            # Create an appointment
            surrogate_user = User.query.filter_by(email='surrogate@test.com').first()
            appointment = SurrogateAppointment(
                surrogate_id=surrogate_user.id,
                appointment_date='2024-06-01T10:00:00',
                appointment_type='ultrasound',
                purpose='First trimester ultrasound',
                status='scheduled'
            )
            db.session.add(appointment)
            db.session.commit()
            appointment_id = appointment.id
        
        response = client.delete(f'/api/surrogate/appointments/{appointment_id}', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Appointment canceled successfully'
    
    def test_get_surrogate_contracts(self, client, surrogate_token):
        """Test getting surrogate contracts"""
        response = client.get('/api/surrogate/contracts', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'contracts' in data
    
    def test_get_contract_by_id(self, client, surrogate_token):
        """Test getting contract by ID"""
        # This would need actual contracts to be created
        # For now, test with non-existent ID
        response = client.get('/api/surrogate/contracts/99999', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 404
    
    def test_sign_contract(self, client, surrogate_token, app):
        """Test signing contract"""
        with app.app_context():
            # Create a contract
            surrogate_user = User.query.filter_by(email='surrogate@test.com').first()
            contract = Contract(
                surrogate_id=surrogate_user.id,
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
        
        response = client.put(f'/api/surrogate/contracts/{contract_id}/sign', 
                            headers={'Authorization': f'Bearer {surrogate_token}'},
                            json={'signature': 'Test signature'})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Contract signed successfully'
    
    def test_get_surrogate_wallet(self, client, surrogate_token):
        """Test getting surrogate wallet"""
        response = client.get('/api/surrogate/wallet', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'wallet' in data
    
    def test_get_surrogate_transactions(self, client, surrogate_token):
        """Test getting surrogate transactions"""
        response = client.get('/api/surrogate/wallet/transactions', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'transactions' in data
    
    def test_get_surrogate_notifications(self, client, surrogate_token):
        """Test getting surrogate notifications"""
        response = client.get('/api/surrogate/notifications', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'notifications' in data
    
    def test_mark_notification_read(self, client, surrogate_token):
        """Test marking notification as read"""
        # This would need actual notifications to be created
        # For now, test with non-existent ID
        response = client.put('/api/surrogate/notifications/99999/read', 
                            headers={'Authorization': f'Bearer {surrogate_token}'})
        
        assert response.status_code == 404
    
    def test_get_surrogate_messages(self, client, surrogate_token):
        """Test getting surrogate messages"""
        response = client.get('/api/surrogate/messages', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'messages' in data
    
    def test_send_message(self, client, surrogate_token, app):
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
        
        response = client.post('/api/surrogate/messages', 
                             headers={'Authorization': f'Bearer {surrogate_token}'},
                             json={
                                 'recipient_id': recipient_id,
                                 'subject': 'Test Message',
                                 'message': 'This is a test message from surrogate'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Message sent successfully'
    
    def test_get_message_by_id(self, client, surrogate_token):
        """Test getting message by ID"""
        # This would need actual messages to be created
        # For now, test with non-existent ID
        response = client.get('/api/surrogate/messages/99999', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 404
    
    def test_delete_message(self, client, surrogate_token):
        """Test deleting message"""
        # This would need actual messages to be created
        # For now, test with non-existent ID
        response = client.delete('/api/surrogate/messages/99999', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 404
    
    def test_get_surrogate_favorites(self, client, surrogate_token):
        """Test getting surrogate favorites"""
        response = client.get('/api/surrogate/favorites', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'favorites' in data
    
    def test_add_favorite(self, client, surrogate_token, app):
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
        
        response = client.post('/api/surrogate/favorites', 
                             headers={'Authorization': f'Bearer {surrogate_token}'},
                             json={'favorite_user_id': ip_id})
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Added to favorites successfully'
    
    def test_remove_favorite(self, client, surrogate_token, app):
        """Test removing favorite"""
        with app.app_context():
            # Create a favorite
            surrogate_user = User.query.filter_by(email='surrogate@test.com').first()
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
                surrogate_id=surrogate_user.id,
                favorite_user_id=ip_id
            )
            db.session.add(favorite)
            db.session.commit()
            favorite_id = favorite.id
        
        response = client.delete(f'/api/surrogate/favorites/{favorite_id}', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Removed from favorites successfully'
    
    def test_get_surrogate_badges(self, client, surrogate_token):
        """Test getting surrogate badges"""
        response = client.get('/api/surrogate/badges', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'badges' in data
    
    def test_get_surrogate_disputes(self, client, surrogate_token):
        """Test getting surrogate disputes"""
        response = client.get('/api/surrogate/disputes', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'disputes' in data
    
    def test_get_dispute_by_id(self, client, surrogate_token):
        """Test getting dispute by ID"""
        # This would need actual disputes to be created
        # For now, test with non-existent ID
        response = client.get('/api/surrogate/disputes/99999', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 404
    
    def test_create_dispute(self, client, surrogate_token, app):
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
        
        response = client.post('/api/surrogate/disputes', 
                             headers={'Authorization': f'Bearer {surrogate_token}'},
                             json={
                                 'agency_id': agency_id,
                                 'title': 'Test Dispute',
                                 'description': 'This is a test dispute',
                                 'category': 'medical_expense'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Dispute created successfully'
    
    def test_update_dispute_status(self, client, surrogate_token):
        """Test updating dispute status"""
        # This would need actual disputes to be created
        # For now, test with non-existent ID
        response = client.put('/api/surrogate/disputes/99999/status', 
                            headers={'Authorization': f'Bearer {surrogate_token}'},
                            json={'status': 'resolved', 'resolution': 'Test resolution'})
        
        assert response.status_code == 404