import pytest
import json
import tempfile
import os
from unittest.mock import patch, MagicMock
from src.app import create_app
from src.models import db, User, Role, DonorKyc, SurrogateKyc, IntendingParentKyc
from werkzeug.security import generate_password_hash


class TestKYCAPI:
    """Test KYC endpoints for all roles"""
    
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
    
    def test_donor_get_kyc_status(self, client, donor_token):
        """Test donor getting KYC status"""
        response = client.get('/api/kyc/donor/status', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'kyc_status' in data
    
    def test_donor_submit_kyc(self, client, donor_token):
        """Test donor submitting KYC"""
        response = client.post('/api/kyc/donor/submit', 
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
    
    def test_donor_update_kyc(self, client, donor_token, app):
        """Test donor updating KYC"""
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
        
        response = client.put('/api/kyc/donor/update', 
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
    
    def test_donor_get_kyc_documents(self, client, donor_token, app):
        """Test donor getting KYC documents"""
        with app.app_context():
            # Create KYC documents
            donor_user = User.query.filter_by(email='donor@test.com').first()
            donor_kyc = DonorKyc(
                user_id=donor_user.id,
                id_number='DON123456',
                id_type='passport',
                id_expiry_date='2025-12-31',
                medical_history='No significant medical history',
                genetic_testing=True,
                genetic_testing_date='2024-01-01',
                genetic_testing_results='Normal',
                documents=['medical_report.pdf', 'genetic_test.pdf']
            )
            db.session.add(donor_kyc)
            db.session.commit()
        
        response = client.get('/api/kyc/donor/documents', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'documents' in data
    
    def test_surrogate_get_kyc_status(self, client, surrogate_token):
        """Test surrogate getting KYC status"""
        response = client.get('/api/kyc/surrogate/status', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'kyc_status' in data
    
    def test_surrogate_submit_kyc(self, client, surrogate_token):
        """Test surrogate submitting KYC"""
        response = client.post('/api/kyc/surrogate/submit', 
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
    
    def test_surrogate_update_kyc(self, client, surrogate_token, app):
        """Test surrogate updating KYC"""
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
        
        response = client.put('/api/kyc/surrogate/update', 
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
    
    def test_surrogate_get_kyc_documents(self, client, surrogate_token, app):
        """Test surrogate getting KYC documents"""
        with app.app_context():
            # Create KYC documents
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
                genetic_testing_results='Normal',
                documents=['medical_report.pdf', 'ultrasound.pdf', 'mental_health.pdf']
            )
            db.session.add(surrogate_kyc)
            db.session.commit()
        
        response = client.get('/api/kyc/surrogate/documents', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'documents' in data
    
    def test_ip_get_kyc_status(self, client, ip_token):
        """Test intending parent getting KYC status"""
        response = client.get('/api/kyc/intending-parent/status', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'kyc_status' in data
    
    def test_ip_submit_kyc(self, client, ip_token):
        """Test intending parent submitting KYC"""
        response = client.post('/api/kyc/intending-parent/submit', 
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
    
    def test_ip_update_kyc(self, client, ip_token, app):
        """Test intending parent updating KYC"""
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
        
        response = client.put('/api/kyc/intending-parent/update', 
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
    
    def test_ip_get_kyc_documents(self, client, ip_token, app):
        """Test intending parent getting KYC documents"""
        with app.app_context():
            # Create KYC documents
            ip_user = User.query.filter_by(email='ip@test.com').first()
            ip_kyc = IntendingParentKyc(
                user_id=ip_user.id,
                id_number='IP123456',
                id_type='passport',
                id_expiry_date='2025-12-31',
                financial_documents='Bank statements provided',
                legal_clearance=True,
                legal_clearance_date='2024-01-01',
                legal_clearance_details='Clearance obtained',
                documents=['financial_docs.pdf', 'legal_clearance.pdf', 'home_study.pdf']
            )
            db.session.add(ip_kyc)
            db.session.commit()
        
        response = client.get('/api/kyc/intending-parent/documents', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'documents' in data
    
    def test_admin_get_kyc_requests(self, client, admin_token, app):
        """Test admin getting KYC requests"""
        with app.app_context():
            # Create users for different roles
            roles = ['donor', 'surrogate', 'intending_parent']
            for i, role_name in enumerate(roles):
                role = Role(name=role_name)
                db.session.add(role)
                
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
            db.session.commit()
        
        response = client.get('/api/kyc/admin/requests', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'kyc_requests' in data
    
    def test_admin_get_kyc_request_by_id(self, client, admin_token, app):
        """Test admin getting KYC request by ID"""
        # This would need actual KYC requests to be created
        # For now, test with non-existent ID
        response = client.get('/api/kyc/admin/requests/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
    
    def test_admin_update_kyc_status(self, client, admin_token, app):
        """Test admin updating KYC status"""
        with app.app_context():
            # Create a donor user with KYC
            donor_role = Role(name='donor')
            db.session.add(donor_role)
            
            donor_user = User(
                email='kycdonor@test.com',
                password=generate_password_hash('donor123'),
                role='donor',
                is_verified=True,
                is_active=True,
                first_name='KYC',
                last_name='Donor'
            )
            db.session.add(donor_user)
            db.session.commit()
            
            donor_kyc = DonorKyc(
                user_id=donor_user.id,
                id_number='KDC123456',
                id_type='passport',
                id_expiry_date='2025-12-31',
                medical_history='No significant medical history',
                genetic_testing=True,
                genetic_testing_date='2024-01-01',
                genetic_testing_results='Normal'
            )
            db.session.add(donor_kyc)
            db.session.commit()
            kyc_id = donor_kyc.id
        
        response = client.put(f'/api/kyc/admin/requests/{kyc_id}/status', 
                            headers={'Authorization': f'Bearer {admin_token}'},
                            json={
                                'status': 'approved',
                                'comments': 'All documents verified'
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'KYC status updated successfully'
    
    def test_admin_reject_kyc_status(self, client, admin_token, app):
        """Test admin rejecting KYC status"""
        with app.app_context():
            # Create a surrogate user with KYC
            surrogate_role = Role(name='surrogate')
            db.session.add(surrogate_role)
            
            surrogate_user = User(
                email='kycsurrogate@test.com',
                password=generate_password_hash('surrogate123'),
                role='surrogate',
                is_verified=True,
                is_active=True,
                first_name='KYC',
                last_name='Surrogate'
            )
            db.session.add(surrogate_user)
            db.session.commit()
            
            surrogate_kyc = SurrogateKyc(
                user_id=surrogate_user.id,
                id_number='KSC123456',
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
            kyc_id = surrogate_kyc.id
        
        response = client.put(f'/api/kyc/admin/requests/{kyc_id}/status', 
                            headers={'Authorization': f'Bearer {admin_token}'},
                            json={
                                'status': 'rejected',
                                'comments': 'Missing required documents'
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'KYC status updated successfully'
    
    def test_admin_get_kyc_statistics(self, client, admin_token, app):
        """Test admin getting KYC statistics"""
        response = client.get('/api/kyc/admin/statistics', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'statistics' in data
    
    def test_kyc_upload_document(self, client, donor_token):
        """Test KYC document upload"""
        # This would need actual file upload implementation
        # For now, test the endpoint exists
        response = client.post('/api/kyc/upload', 
                             headers={'Authorization': f'Bearer {donor_token}'})
        
        # Should return 400 due to missing file, but endpoint should exist
        assert response.status_code == 400
    
    def test_kyc_download_document(self, client, admin_token):
        """Test KYC document download"""
        # This would need actual document to be uploaded
        # For now, test with non-existent document
        response = client.get('/api/kyc/documents/99999/download', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404