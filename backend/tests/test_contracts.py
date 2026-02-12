import pytest
import json
import tempfile
import os
from unittest.mock import patch, MagicMock
from src.app import create_app
from src.models import db, User, Role, Contract
from werkzeug.security import generate_password_hash


class TestContractsAPI:
    """Test contract endpoints for all roles"""
    
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
    
    def test_admin_get_contracts(self, client, admin_token, app):
        """Test admin getting contracts"""
        with app.app_context():
            # Create some contracts
            for i in range(3):
                contract = Contract(
                    contract_type='surrogacy',
                    terms=f'Test contract terms {i}',
                    start_date='2024-01-01',
                    end_date='2024-12-31',
                    amount=50000.00 + i * 10000,
                    status='pending'
                )
                db.session.add(contract)
            db.session.commit()
        
        response = client.get('/api/admin/contracts', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'contracts' in data
        assert len(data['contracts']) >= 3
    
    def test_admin_get_contract_by_id(self, client, admin_token, app):
        """Test admin getting contract by ID"""
        with app.app_context():
            # Create a contract
            contract = Contract(
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
        
        response = client.get(f'/api/admin/contracts/{contract_id}', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['contract']['id'] == contract_id
    
    def test_admin_get_contract_by_id_not_found(self, client, admin_token):
        """Test admin getting contract by non-existent ID"""
        response = client.get('/api/admin/contracts/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Contract not found' in data['error']
    
    def test_admin_update_contract_status(self, client, admin_token, app):
        """Test admin updating contract status"""
        with app.app_context():
            # Create a contract
            contract = Contract(
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
        
        response = client.put(f'/api/admin/contracts/{contract_id}/status', 
                            headers={'Authorization': f'Bearer {admin_token}'},
                            json={
                                'status': 'approved',
                                'comments': 'Contract approved by admin'
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Contract status updated successfully'
    
    def test_admin_update_contract_status_not_found(self, client, admin_token):
        """Test admin updating contract status for non-existent contract"""
        response = client.put('/api/admin/contracts/99999/status', 
                            headers={'Authorization': f'Bearer {admin_token}'},
                            json={
                                'status': 'approved',
                                'comments': 'Contract approved by admin'
                            })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Contract not found' in data['error']
    
    def test_admin_delete_contract(self, client, admin_token, app):
        """Test admin deleting contract"""
        with app.app_context():
            # Create a contract
            contract = Contract(
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
        
        response = client.delete(f'/api/admin/contracts/{contract_id}', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Contract deleted successfully'
    
    def test_admin_delete_contract_not_found(self, client, admin_token):
        """Test admin deleting non-existent contract"""
        response = client.delete('/api/admin/contracts/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Contract not found' in data['error']
    
    def test_agency_get_contracts(self, client, agency_token, app):
        """Test agency getting contracts"""
        with app.app_context():
            # Create agency user
            agency_user = User.query.filter_by(email='agency@test.com').first()
            
            # Create some contracts for the agency
            for i in range(3):
                contract = Contract(
                    agency_id=agency_user.id,
                    contract_type='surrogacy',
                    terms=f'Test contract terms {i}',
                    start_date='2024-01-01',
                    end_date='2024-12-31',
                    amount=50000.00 + i * 10000,
                    status='pending'
                )
                db.session.add(contract)
            db.session.commit()
        
        response = client.get('/api/agency/contracts', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'contracts' in data
        assert len(data['contracts']) >= 3
    
    def test_agency_create_contract(self, client, agency_token, app):
        """Test agency creating contract"""
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
    
    def test_agency_update_contract(self, client, agency_token, app):
        """Test agency updating contract"""
        with app.app_context():
            # Create agency user
            agency_user = User.query.filter_by(email='agency@test.com').first()
            
            # Create a contract
            contract = Contract(
                agency_id=agency_user.id,
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
        
        response = client.put(f'/api/agency/contracts/{contract_id}', 
                            headers={'Authorization': f'Bearer {agency_token}'},
                            json={
                                'terms': 'Updated contract terms',
                                'amount': 60000.00,
                                'status': 'active'
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Contract updated successfully'
    
    def test_donor_get_contracts(self, client, donor_token, app):
        """Test donor getting contracts"""
        with app.app_context():
            # Create donor user
            donor_user = User.query.filter_by(email='donor@test.com').first()
            
            # Create some contracts for the donor
            for i in range(3):
                contract = Contract(
                    donor_id=donor_user.id,
                    contract_type='donation',
                    terms=f'Test contract terms {i}',
                    start_date='2024-01-01',
                    end_date='2024-12-31',
                    amount=5000.00 + i * 1000,
                    status='pending'
                )
                db.session.add(contract)
            db.session.commit()
        
        response = client.get('/api/donor/contracts', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'contracts' in data
        assert len(data['contracts']) >= 3
    
    def test_donor_sign_contract(self, client, donor_token, app):
        """Test donor signing contract"""
        with app.app_context():
            # Create donor user
            donor_user = User.query.filter_by(email='donor@test.com').first()
            
            # Create a contract
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
                            json={'signature': 'Test donor signature'})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Contract signed successfully'
    
    def test_surrogate_get_contracts(self, client, surrogate_token, app):
        """Test surrogate getting contracts"""
        with app.app_context():
            # Create surrogate user
            surrogate_user = User.query.filter_by(email='surrogate@test.com').first()
            
            # Create some contracts for the surrogate
            for i in range(3):
                contract = Contract(
                    surrogate_id=surrogate_user.id,
                    contract_type='surrogacy',
                    terms=f'Test contract terms {i}',
                    start_date='2024-01-01',
                    end_date='2024-12-31',
                    amount=50000.00 + i * 10000,
                    status='pending'
                )
                db.session.add(contract)
            db.session.commit()
        
        response = client.get('/api/surrogate/contracts', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'contracts' in data
        assert len(data['contracts']) >= 3
    
    def test_surrogate_sign_contract(self, client, surrogate_token, app):
        """Test surrogate signing contract"""
        with app.app_context():
            # Create surrogate user
            surrogate_user = User.query.filter_by(email='surrogate@test.com').first()
            
            # Create a contract
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
                            json={'signature': 'Test surrogate signature'})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Contract signed successfully'
    
    def test_ip_get_contracts(self, client, ip_token, app):
        """Test intending parent getting contracts"""
        with app.app_context():
            # Create intending parent user
            ip_user = User.query.filter_by(email='ip@test.com').first()
            
            # Create some contracts for the intending parent
            for i in range(3):
                contract = Contract(
                    intending_parent_id=ip_user.id,
                    contract_type='surrogacy',
                    terms=f'Test contract terms {i}',
                    start_date='2024-01-01',
                    end_date='2024-12-31',
                    amount=50000.00 + i * 10000,
                    status='pending'
                )
                db.session.add(contract)
            db.session.commit()
        
        response = client.get('/api/intending-parent/contracts', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'contracts' in data
        assert len(data['contracts']) >= 3
    
    def test_ip_sign_contract(self, client, ip_token, app):
        """Test intending parent signing contract"""
        with app.app_context():
            # Create intending parent user
            ip_user = User.query.filter_by(email='ip@test.com').first()
            
            # Create a contract
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
                            json={'signature': 'Test IP signature'})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Contract signed successfully'
    
    def test_get_contract_by_id(self, client, admin_token, app):
        """Test getting contract by ID"""
        with app.app_context():
            # Create a contract
            contract = Contract(
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
        
        response = client.get(f'/api/contracts/{contract_id}', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['contract']['id'] == contract_id
    
    def test_get_contract_by_id_not_found(self, client, admin_token):
        """Test getting contract by non-existent ID"""
        response = client.get('/api/contracts/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Contract not found' in data['error']
    
    def test_update_contract_status(self, client, admin_token, app):
        """Test updating contract status"""
        with app.app_context():
            # Create a contract
            contract = Contract(
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
        
        response = client.put(f'/api/contracts/{contract_id}/status', 
                            headers={'Authorization': f'Bearer {admin_token}'},
                            json={
                                'status': 'approved',
                                'comments': 'Contract approved'
                            })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Contract status updated successfully'
    
    def test_search_contracts(self, client, admin_token, app):
        """Test searching contracts"""
        with app.app_context():
            # Create some contracts with different types
            contract_types = ['surrogacy', 'donation', 'agency']
            for i, contract_type in enumerate(contract_types):
                contract = Contract(
                    contract_type=contract_type,
                    terms=f'Test contract terms {i}',
                    start_date='2024-01-01',
                    end_date='2024-12-31',
                    amount=50000.00 + i * 10000,
                    status='pending'
                )
                db.session.add(contract)
            db.session.commit()
        
        # Search for surrogacy contracts
        response = client.get('/api/contracts/search?contract_type=surrogacy', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'contracts' in data
        assert len(data['contracts']) >= 1
    
    def test_filter_contracts(self, client, admin_token, app):
        """Test filtering contracts"""
        with app.app_context():
            # Create some contracts with different statuses
            statuses = ['pending', 'approved', 'rejected']
            for i, status in enumerate(statuses):
                contract = Contract(
                    contract_type='surrogacy',
                    terms=f'Test contract terms {i}',
                    start_date='2024-01-01',
                    end_date='2024-12-31',
                    amount=50000.00 + i * 10000,
                    status=status
                )
                db.session.add(contract)
            db.session.commit()
        
        # Filter for pending contracts
        response = client.get('/api/contracts/filter?status=pending', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'contracts' in data
        assert len(data['contracts']) >= 1
    
    def test_get_contract_statistics(self, client, admin_token, app):
        """Test getting contract statistics"""
        with app.app_context():
            # Create some contracts with different statuses
            statuses = ['pending', 'approved', 'rejected', 'completed']
            for i, status in enumerate(statuses):
                for j in range(2):
                    contract = Contract(
                        contract_type='surrogacy',
                        terms=f'Test contract terms {i}{j}',
                        start_date='2024-01-01',
                        end_date='2024-12-31',
                        amount=50000.00 + i * 10000 + j * 5000,
                        status=status
                    )
                    db.session.add(contract)
            db.session.commit()
        
        response = client.get('/api/contracts/statistics', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'statistics' in data