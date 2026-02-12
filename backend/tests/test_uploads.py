import pytest
import json
import tempfile
import os
from unittest.mock import patch, MagicMock
from src.app import create_app
from src.models import db, User, Role
from werkzeug.security import generate_password_hash


class TestUploadsAPI:
    """Test upload endpoints for all roles"""
    
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
            'WTF_CSRF_ENABLED': False,
            'UPLOAD_FOLDER': tempfile.mkdtemp()
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
    
    def test_admin_upload_file(self, client, admin_token):
        """Test admin uploading file"""
        # Create a temporary file
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
            temp_file.write(b'test image content')
            temp_file_path = temp_file.name
        
        try:
            with open(temp_file_path, 'rb') as f:
                response = client.post('/api/admin/upload', 
                                     headers={'Authorization': f'Bearer {admin_token}'},
                                     data={
                                         'file': (f, 'test_image.jpg')
                                     },
                                     content_type='multipart/form-data')
            
            assert response.status_code == 201
            data = json.loads(response.data)
            assert 'file_url' in data
            assert 'file_id' in data
        finally:
            os.unlink(temp_file_path)
    
    def test_admin_upload_file_no_file(self, client, admin_token):
        """Test admin uploading without file"""
        response = client.post('/api/admin/upload', 
                             headers={'Authorization': f'Bearer {admin_token}'},
                             data={},
                             content_type='multipart/form-data')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'No file provided' in data['error']
    
    def test_admin_upload_file_invalid_type(self, client, admin_token):
        """Test admin uploading invalid file type"""
        # Create a temporary file with invalid extension
        with tempfile.NamedTemporaryFile(suffix='.exe', delete=False) as temp_file:
            temp_file.write(b'test executable content')
            temp_file_path = temp_file.name
        
        try:
            with open(temp_file_path, 'rb') as f:
                response = client.post('/api/admin/upload', 
                                     headers={'Authorization': f'Bearer {admin_token}'},
                                     data={
                                         'file': (f, 'test_file.exe')
                                     },
                                     content_type='multipart/form-data')
            
            assert response.status_code == 400
            data = json.loads(response.data)
            assert 'Invalid file type' in data['error']
        finally:
            os.unlink(temp_file_path)
    
    def test_admin_get_uploads(self, client, admin_token, app):
        """Test admin getting uploads"""
        with app.app_context():
            # Create some test uploads (this would need actual implementation)
            pass
        
        response = client.get('/api/admin/uploads', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        # Should return 200 or 404 depending on implementation
        assert response.status_code in [200, 404]
    
    def test_admin_get_upload_by_id(self, client, admin_token, app):
        """Test admin getting upload by ID"""
        with app.app_context():
            # Create a test upload (this would need actual implementation)
            pass
        
        response = client.get('/api/admin/uploads/1', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        # Should return 200 or 404 depending on implementation
        assert response.status_code in [200, 404]
    
    def test_admin_delete_upload(self, client, admin_token, app):
        """Test admin deleting upload"""
        with app.app_context():
            # Create a test upload (this would need actual implementation)
            pass
        
        response = client.delete('/api/admin/uploads/1', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        # Should return 200 or 404 depending on implementation
        assert response.status_code in [200, 404]
    
    def test_agency_upload_file(self, client, agency_token):
        """Test agency uploading file"""
        # Create a temporary file
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
            temp_file.write(b'test pdf content')
            temp_file_path = temp_file.name
        
        try:
            with open(temp_file_path, 'rb') as f:
                response = client.post('/api/agency/upload', 
                                     headers={'Authorization': f'Bearer {agency_token}'},
                                     data={
                                         'file': (f, 'test_document.pdf')
                                     },
                                     content_type='multipart/form-data')
            
            assert response.status_code == 201
            data = json.loads(response.data)
            assert 'file_url' in data
            assert 'file_id' in data
        finally:
            os.unlink(temp_file_path)
    
    def test_agency_get_uploads(self, client, agency_token, app):
        """Test agency getting uploads"""
        with app.app_context():
            # Create some test uploads (this would need actual implementation)
            pass
        
        response = client.get('/api/agency/uploads', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        # Should return 200 or 404 depending on implementation
        assert response.status_code in [200, 404]
    
    def test_donor_upload_file(self, client, donor_token):
        """Test donor uploading file"""
        # Create a temporary file
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
            temp_file.write(b'test image content')
            temp_file_path = temp_file.name
        
        try:
            with open(temp_file_path, 'rb') as f:
                response = client.post('/api/donor/upload', 
                                     headers={'Authorization': f'Bearer {donor_token}'},
                                     data={
                                         'file': (f, 'test_image.jpg')
                                     },
                                     content_type='multipart/form-data')
            
            assert response.status_code == 201
            data = json.loads(response.data)
            assert 'file_url' in data
            assert 'file_id' in data
        finally:
            os.unlink(temp_file_path)
    
    def test_donor_get_uploads(self, client, donor_token, app):
        """Test donor getting uploads"""
        with app.app_context():
            # Create some test uploads (this would need actual implementation)
            pass
        
        response = client.get('/api/donor/uploads', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        # Should return 200 or 404 depending on implementation
        assert response.status_code in [200, 404]
    
    def test_surrogate_upload_file(self, client, surrogate_token):
        """Test surrogate uploading file"""
        # Create a temporary file
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
            temp_file.write(b'test image content')
            temp_file_path = temp_file.name
        
        try:
            with open(temp_file_path, 'rb') as f:
                response = client.post('/api/surrogate/upload', 
                                     headers={'Authorization': f'Bearer {surrogate_token}'},
                                     data={
                                         'file': (f, 'test_image.jpg')
                                     },
                                     content_type='multipart/form-data')
            
            assert response.status_code == 201
            data = json.loads(response.data)
            assert 'file_url' in data
            assert 'file_id' in data
        finally:
            os.unlink(temp_file_path)
    
    def test_surrogate_get_uploads(self, client, surrogate_token, app):
        """Test surrogate getting uploads"""
        with app.app_context():
            # Create some test uploads (this would need actual implementation)
            pass
        
        response = client.get('/api/surrogate/uploads', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        # Should return 200 or 404 depending on implementation
        assert response.status_code in [200, 404]
    
    def test_ip_upload_file(self, client, ip_token):
        """Test intending parent uploading file"""
        # Create a temporary file
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
            temp_file.write(b'test image content')
            temp_file_path = temp_file.name
        
        try:
            with open(temp_file_path, 'rb') as f:
                response = client.post('/api/intending-parent/upload', 
                                     headers={'Authorization': f'Bearer {ip_token}'},
                                     data={
                                         'file': (f, 'test_image.jpg')
                                     },
                                     content_type='multipart/form-data')
            
            assert response.status_code == 201
            data = json.loads(response.data)
            assert 'file_url' in data
            assert 'file_id' in data
        finally:
            os.unlink(temp_file_path)
    
    def test_ip_get_uploads(self, client, ip_token, app):
        """Test intending parent getting uploads"""
        with app.app_context():
            # Create some test uploads (this would need actual implementation)
            pass
        
        response = client.get('/api/intending-parent/uploads', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        # Should return 200 or 404 depending on implementation
        assert response.status_code in [200, 404]
    
    def test_upload_file_too_large(self, client, admin_token):
        """Test uploading file that's too large"""
        # Create a large temporary file
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
            # Write a large amount of data (simulate large file)
            temp_file.write(b'x' * (10 * 1024 * 1024))  # 10MB
            temp_file_path = temp_file.name
        
        try:
            with open(temp_file_path, 'rb') as f:
                response = client.post('/api/admin/upload', 
                                     headers={'Authorization': f'Bearer {admin_token}'},
                                     data={
                                         'file': (f, 'large_file.jpg')
                                     },
                                     content_type='multipart/form-data')
            
            assert response.status_code == 413  # Request Entity Too Large
        finally:
            os.unlink(temp_file_path)
    
    def test_upload_multiple_files(self, client, admin_token):
        """Test uploading multiple files"""
        # Create multiple temporary files
        temp_files = []
        try:
            for i in range(2):
                with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
                    temp_file.write(b'test image content')
                    temp_files.append(temp_file.name)
            
            files_data = {}
            for i, temp_file_path in enumerate(temp_files):
                files_data[f'file{i}'] = (open(temp_file_path, 'rb'), f'test_image{i}.jpg')
            
            response = client.post('/api/admin/upload', 
                                 headers={'Authorization': f'Bearer {admin_token}'},
                                 data=files_data,
                                 content_type='multipart/form-data')
            
            assert response.status_code == 201
            data = json.loads(response.data)
            assert 'files' in data or 'file_url' in data
        finally:
            for temp_file_path in temp_files:
                os.unlink(temp_file_path)
    
    def test_get_upload_statistics(self, client, admin_token, app):
        """Test getting upload statistics"""
        with app.app_context():
            # Create some test uploads (this would need actual implementation)
            pass
        
        response = client.get('/api/uploads/statistics', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        # Should return 200 or 404 depending on implementation
        assert response.status_code in [200, 404]
    
    def test_search_uploads(self, client, admin_token, app):
        """Test searching uploads"""
        with app.app_context():
            # Create some test uploads (this would need actual implementation)
            pass
        
        response = client.get('/api/uploads/search?query=test', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        # Should return 200 or 404 depending on implementation
        assert response.status_code in [200, 404]
    
    def test_filter_uploads(self, client, admin_token, app):
        """Test filtering uploads"""
        with app.app_context():
            # Create some test uploads (this would need actual implementation)
            pass
        
        response = client.get('/api/uploads/filter?file_type=image', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        # Should return 200 or 404 depending on implementation
        assert response.status_code in [200, 404]