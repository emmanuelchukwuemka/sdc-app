import pytest
import json
import tempfile
import os
from unittest.mock import patch, MagicMock
from src.app import create_app
from src.models import db, User, Role, Donor, Surrogate, IntendingParent, DonorProfile, SurrogateProfile
from werkzeug.security import generate_password_hash


class TestMarketplaceAPI:
    """Test marketplace endpoints"""
    
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
        
        # Login to get token
        response = client.post('/api/auth/login', json={
            'email': 'ip@test.com',
            'password': 'ip123'
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
    
    def test_get_donor_listings(self, client, ip_token, app):
        """Test getting donor listings"""
        with app.app_context():
            # Create some donors with profiles
            for i in range(3):
                donor_role = Role(name='donor')
                db.session.add(donor_role)
                
                donor_user = User(
                    email=f'donor{i}@test.com',
                    password=generate_password_hash('donor123'),
                    role='donor',
                    is_verified=True,
                    is_active=True,
                    first_name=f'Donor{i}',
                    last_name='Test'
                )
                db.session.add(donor_user)
                db.session.commit()
                
                donor_profile = DonorProfile(
                    user_id=donor_user.id,
                    blood_type='O+' if i % 2 == 0 else 'A+',
                    height=170 + i,
                    weight=65 + i,
                    eye_color='brown',
                    hair_color='brown',
                    ethnicity='Caucasian',
                    education_level='Bachelor',
                    occupation='Engineer',
                    has_children=False,
                    donation_count=i,
                    availability='available'
                )
                db.session.add(donor_profile)
                db.session.commit()
        
        response = client.get('/api/marketplace/donors', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'donors' in data
        assert len(data['donors']) >= 3
    
    def test_get_donor_by_id(self, client, ip_token, app):
        """Test getting donor by ID"""
        with app.app_context():
            # Create a donor with profile
            donor_role = Role(name='donor')
            db.session.add(donor_role)
            
            donor_user = User(
                email='donordetail@test.com',
                password=generate_password_hash('donor123'),
                role='donor',
                is_verified=True,
                is_active=True,
                first_name='Donor',
                last_name='Detail'
            )
            db.session.add(donor_user)
            db.session.commit()
            
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
            donor_id = donor_user.id
        
        response = client.get(f'/api/marketplace/donors/{donor_id}', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['donor']['id'] == donor_id
        assert 'profile' in data
    
    def test_get_donor_by_id_not_found(self, client, ip_token):
        """Test getting donor by non-existent ID"""
        response = client.get('/api/marketplace/donors/99999', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Donor not found' in data['error']
    
    def test_search_donors(self, client, ip_token, app):
        """Test searching donors"""
        with app.app_context():
            # Create some donors with different attributes
            for i in range(3):
                donor_role = Role(name='donor')
                db.session.add(donor_role)
                
                donor_user = User(
                    email=f'searchdonor{i}@test.com',
                    password=generate_password_hash('donor123'),
                    role='donor',
                    is_verified=True,
                    is_active=True,
                    first_name=f'SearchDonor{i}',
                    last_name='Test'
                )
                db.session.add(donor_user)
                db.session.commit()
                
                blood_type = 'O+' if i == 0 else 'A+' if i == 1 else 'B+'
                donor_profile = DonorProfile(
                    user_id=donor_user.id,
                    blood_type=blood_type,
                    height=170 + i * 5,
                    weight=65 + i * 5,
                    eye_color='brown' if i == 0 else 'blue',
                    hair_color='brown',
                    ethnicity='Caucasian',
                    education_level='Bachelor',
                    occupation='Engineer',
                    has_children=False,
                    donation_count=i,
                    availability='available'
                )
                db.session.add(donor_profile)
                db.session.commit()
        
        # Search by blood type
        response = client.get('/api/marketplace/donors/search?blood_type=O+', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'donors' in data
        assert len(data['donors']) >= 1
    
    def test_filter_donors(self, client, ip_token, app):
        """Test filtering donors"""
        with app.app_context():
            # Create some donors with different attributes
            for i in range(3):
                donor_role = Role(name='donor')
                db.session.add(donor_role)
                
                donor_user = User(
                    email=f'filterdonor{i}@test.com',
                    password=generate_password_hash('donor123'),
                    role='donor',
                    is_verified=True,
                    is_active=True,
                    first_name=f'FilterDonor{i}',
                    last_name='Test'
                )
                db.session.add(donor_user)
                db.session.commit()
                
                donor_profile = DonorProfile(
                    user_id=donor_user.id,
                    blood_type='O+',
                    height=170 + i * 5,
                    weight=65 + i * 5,
                    eye_color='brown',
                    hair_color='brown',
                    ethnicity='Caucasian',
                    education_level='Bachelor' if i == 0 else 'Master' if i == 1 else 'PhD',
                    occupation='Engineer',
                    has_children=False,
                    donation_count=i,
                    availability='available'
                )
                db.session.add(donor_profile)
                db.session.commit()
        
        # Filter by education level
        response = client.get('/api/marketplace/donors/filter?education_level=Bachelor', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'donors' in data
        assert len(data['donors']) >= 1
    
    def test_get_surrogate_listings(self, client, ip_token, app):
        """Test getting surrogate listings"""
        with app.app_context():
            # Create some surrogates with profiles
            for i in range(3):
                surrogate_role = Role(name='surrogate')
                db.session.add(surrogate_role)
                
                surrogate_user = User(
                    email=f'surrogate{i}@test.com',
                    password=generate_password_hash('surrogate123'),
                    role='surrogate',
                    is_verified=True,
                    is_active=True,
                    first_name=f'Surrogate{i}',
                    last_name='Test'
                )
                db.session.add(surrogate_user)
                db.session.commit()
                
                surrogate_profile = SurrogateProfile(
                    user_id=surrogate_user.id,
                    height=165 + i,
                    weight=60 + i,
                    bmi=22.0 + i,
                    blood_type='O+' if i % 2 == 0 else 'A+',
                    last_menstrual_period='2024-01-01',
                    previous_pregnancies=2 + i,
                    previous_cesareans=i,
                    previous_complications=False,
                    current_health_conditions='None',
                    medications='None',
                    lifestyle_factors='Non-smoker, non-drinker',
                    availability='available',
                    preferences='No twins, no smoking'
                )
                db.session.add(surrogate_profile)
                db.session.commit()
        
        response = client.get('/api/marketplace/surrogates', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'surrogates' in data
        assert len(data['surrogates']) >= 3
    
    def test_get_surrogate_by_id(self, client, ip_token, app):
        """Test getting surrogate by ID"""
        with app.app_context():
            # Create a surrogate with profile
            surrogate_role = Role(name='surrogate')
            db.session.add(surrogate_role)
            
            surrogate_user = User(
                email='surrogatedetail@test.com',
                password=generate_password_hash('surrogate123'),
                role='surrogate',
                is_verified=True,
                is_active=True,
                first_name='Surrogate',
                last_name='Detail'
            )
            db.session.add(surrogate_user)
            db.session.commit()
            
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
            surrogate_id = surrogate_user.id
        
        response = client.get(f'/api/marketplace/surrogates/{surrogate_id}', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['surrogate']['id'] == surrogate_id
        assert 'profile' in data
    
    def test_get_surrogate_by_id_not_found(self, client, ip_token):
        """Test getting surrogate by non-existent ID"""
        response = client.get('/api/marketplace/surrogates/99999', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Surrogate not found' in data['error']
    
    def test_search_surrogates(self, client, ip_token, app):
        """Test searching surrogates"""
        with app.app_context():
            # Create some surrogates with different attributes
            for i in range(3):
                surrogate_role = Role(name='surrogate')
                db.session.add(surrogate_role)
                
                surrogate_user = User(
                    email=f'searchsurrogate{i}@test.com',
                    password=generate_password_hash('surrogate123'),
                    role='surrogate',
                    is_verified=True,
                    is_active=True,
                    first_name=f'SearchSurrogate{i}',
                    last_name='Test'
                )
                db.session.add(surrogate_user)
                db.session.commit()
                
                surrogate_profile = SurrogateProfile(
                    user_id=surrogate_user.id,
                    height=165 + i * 5,
                    weight=60 + i * 5,
                    bmi=22.0 + i,
                    blood_type='O+' if i == 0 else 'A+' if i == 1 else 'B+',
                    last_menstrual_period='2024-01-01',
                    previous_pregnancies=2 + i,
                    previous_cesareans=i,
                    previous_complications=False,
                    current_health_conditions='None',
                    medications='None',
                    lifestyle_factors='Non-smoker, non-drinker',
                    availability='available',
                    preferences='No twins, no smoking'
                )
                db.session.add(surrogate_profile)
                db.session.commit()
        
        # Search by height range
        response = client.get('/api/marketplace/surrogates/search?min_height=165&max_height=175', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'surrogates' in data
        assert len(data['surrogates']) >= 1
    
    def test_filter_surrogates(self, client, ip_token, app):
        """Test filtering surrogates"""
        with app.app_context():
            # Create some surrogates with different attributes
            for i in range(3):
                surrogate_role = Role(name='surrogate')
                db.session.add(surrogate_role)
                
                surrogate_user = User(
                    email=f'filtersurrogate{i}@test.com',
                    password=generate_password_hash('surrogate123'),
                    role='surrogate',
                    is_verified=True,
                    is_active=True,
                    first_name=f'FilterSurrogate{i}',
                    last_name='Test'
                )
                db.session.add(surrogate_user)
                db.session.commit()
                
                surrogate_profile = SurrogateProfile(
                    user_id=surrogate_user.id,
                    height=165 + i * 5,
                    weight=60 + i * 5,
                    bmi=22.0 + i,
                    blood_type='O+',
                    last_menstrual_period='2024-01-01',
                    previous_pregnancies=2 + i,
                    previous_cesareans=i,
                    previous_complications=False if i == 0 else True,
                    current_health_conditions='None',
                    medications='None',
                    lifestyle_factors='Non-smoker, non-drinker',
                    availability='available',
                    preferences='No twins, no smoking'
                )
                db.session.add(surrogate_profile)
                db.session.commit()
        
        # Filter by previous complications
        response = client.get('/api/marketplace/surrogates/filter?previous_complications=false', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'surrogates' in data
        assert len(data['surrogates']) >= 1
    
    def test_get_agency_listings(self, client, ip_token, app):
        """Test getting agency listings"""
        with app.app_context():
            # Create some agencies
            for i in range(3):
                agency_role = Role(name='agency')
                db.session.add(agency_role)
                
                agency_user = User(
                    email=f'agency{i}@test.com',
                    password=generate_password_hash('agency123'),
                    role='agency',
                    is_verified=True,
                    is_active=True,
                    first_name=f'Agency{i}',
                    last_name='Test'
                )
                db.session.add(agency_user)
                db.session.commit()
                
                from src.models.agency import Agency
                agency = Agency(
                    user_id=agency_user.id,
                    name=f'Test Agency {i}',
                    license_number=f'TEST{i}',
                    address=f'{i}23 Test St',
                    phone=f'+123456789{i}',
                    description=f'Test agency description {i}'
                )
                db.session.add(agency)
                db.session.commit()
        
        response = client.get('/api/marketplace/agencies', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'agencies' in data
        assert len(data['agencies']) >= 3
    
    def test_get_agency_by_id(self, client, ip_token, app):
        """Test getting agency by ID"""
        with app.app_context():
            # Create an agency
            agency_role = Role(name='agency')
            db.session.add(agency_role)
            
            agency_user = User(
                email='agencydetail@test.com',
                password=generate_password_hash('agency123'),
                role='agency',
                is_verified=True,
                is_active=True,
                first_name='Agency',
                last_name='Detail'
            )
            db.session.add(agency_user)
            db.session.commit()
            
            from src.models.agency import Agency
            agency = Agency(
                user_id=agency_user.id,
                name='Test Agency Detail',
                license_number='TEST123',
                address='123 Test St',
                phone='+1234567890',
                description='Test agency description'
            )
            db.session.add(agency)
            db.session.commit()
            agency_id = agency.id
        
        response = client.get(f'/api/marketplace/agencies/{agency_id}', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['agency']['id'] == agency_id
    
    def test_get_agency_by_id_not_found(self, client, ip_token):
        """Test getting agency by non-existent ID"""
        response = client.get('/api/marketplace/agencies/99999', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Agency not found' in data['error']
    
    def test_search_agencies(self, client, ip_token, app):
        """Test searching agencies"""
        with app.app_context():
            # Create some agencies
            for i in range(3):
                agency_role = Role(name='agency')
                db.session.add(agency_role)
                
                agency_user = User(
                    email=f'searchagency{i}@test.com',
                    password=generate_password_hash('agency123'),
                    role='agency',
                    is_verified=True,
                    is_active=True,
                    first_name=f'SearchAgency{i}',
                    last_name='Test'
                )
                db.session.add(agency_user)
                db.session.commit()
                
                from src.models.agency import Agency
                agency = Agency(
                    user_id=agency_user.id,
                    name=f'Test Agency {i}',
                    license_number=f'TEST{i}',
                    address=f'{i}23 Test St',
                    phone=f'+123456789{i}',
                    description=f'Test agency description {i}'
                )
                db.session.add(agency)
                db.session.commit()
        
        # Search by name
        response = client.get('/api/marketplace/agencies/search?name=Test Agency', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'agencies' in data
        assert len(data['agencies']) >= 1
    
    def test_filter_agencies(self, client, ip_token, app):
        """Test filtering agencies"""
        with app.app_context():
            # Create some agencies with different verification status
            for i in range(3):
                agency_role = Role(name='agency')
                db.session.add(agency_role)
                
                agency_user = User(
                    email=f'filteragency{i}@test.com',
                    password=generate_password_hash('agency123'),
                    role='agency',
                    is_verified=True,
                    is_active=True,
                    first_name=f'FilterAgency{i}',
                    last_name='Test'
                )
                db.session.add(agency_user)
                db.session.commit()
                
                from src.models.agency import Agency
                agency = Agency(
                    user_id=agency_user.id,
                    name=f'Test Agency {i}',
                    license_number=f'TEST{i}',
                    address=f'{i}23 Test St',
                    phone=f'+123456789{i}',
                    description=f'Test agency description {i}',
                    is_verified=True if i == 0 else False
                )
                db.session.add(agency)
                db.session.commit()
        
        # Filter by verification status
        response = client.get('/api/marketplace/agencies/filter?is_verified=true', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'agencies' in data
        assert len(data['agencies']) >= 1
    
    def test_get_marketplace_statistics(self, client, ip_token, app):
        """Test getting marketplace statistics"""
        with app.app_context():
            # Create some test data
            roles = ['donor', 'surrogate', 'agency']
            for i, role_name in enumerate(roles):
                role = Role(name=role_name)
                db.session.add(role)
                
                for j in range(2):
                    user = User(
                        email=f'{role_name}{i}{j}@test.com',
                        password=generate_password_hash('password123'),
                        role=role_name,
                        is_verified=True,
                        is_active=True,
                        first_name=f'{role_name.capitalize()}{i}{j}',
                        last_name='Test'
                    )
                    db.session.add(user)
                    db.session.commit()
                    
                    if role_name == 'donor':
                        donor_profile = DonorProfile(
                            user_id=user.id,
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
                    elif role_name == 'surrogate':
                        surrogate_profile = SurrogateProfile(
                            user_id=user.id,
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
                    elif role_name == 'agency':
                        from src.models.agency import Agency
                        agency = Agency(
                            user_id=user.id,
                            name=f'Test Agency {i}{j}',
                            license_number=f'TEST{i}{j}',
                            address=f'{i}{j}23 Test St',
                            phone=f'+123456789{i}{j}',
                            description=f'Test agency description {i}{j}'
                        )
                        db.session.add(agency)
                    db.session.commit()
        
        response = client.get('/api/marketplace/statistics', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'statistics' in data
    
    def test_get_featured_listings(self, client, ip_token, app):
        """Test getting featured listings"""
        with app.app_context():
            # Create some featured listings (this would need actual implementation)
            # For now, just test the endpoint exists
            pass
        
        response = client.get('/api/marketplace/featured', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'featured_listings' in data