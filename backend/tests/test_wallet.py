import pytest
import json
import tempfile
import os
from unittest.mock import patch, MagicMock
from src.app import create_app
from src.models import db, User, Role, Wallet, Transaction
from werkzeug.security import generate_password_hash


class TestWalletAPI:
    """Test wallet endpoints for all roles"""
    
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
            
            # Create admin wallet
            admin_wallet = Wallet(
                user_id=admin_user.id,
                balance=1000.00,
                currency='USD'
            )
            db.session.add(admin_wallet)
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
            
            # Create agency wallet
            agency_wallet = Wallet(
                user_id=agency_user.id,
                balance=5000.00,
                currency='USD'
            )
            db.session.add(agency_wallet)
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
            
            # Create donor wallet
            donor_wallet = Wallet(
                user_id=donor_user.id,
                balance=1000.00,
                currency='USD'
            )
            db.session.add(donor_wallet)
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
            
            # Create surrogate wallet
            surrogate_wallet = Wallet(
                user_id=surrogate_user.id,
                balance=10000.00,
                currency='USD'
            )
            db.session.add(surrogate_wallet)
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
            
            # Create intending parent wallet
            ip_wallet = Wallet(
                user_id=ip_user.id,
                balance=20000.00,
                currency='USD'
            )
            db.session.add(ip_wallet)
            db.session.commit()
        
        # Login to get token
        response = client.post('/api/auth/login', json={
            'email': 'ip@test.com',
            'password': 'ip123'
        })
        
        return json.loads(response.data)['access_token']
    
    def test_admin_get_wallet(self, client, admin_token):
        """Test admin getting wallet"""
        response = client.get('/api/admin/wallet', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'wallet' in data
        assert data['wallet']['balance'] == 1000.00
    
    def test_admin_get_transactions(self, client, admin_token, app):
        """Test admin getting transactions"""
        with app.app_context():
            # Create some transactions
            admin_user = User.query.filter_by(email='admin@test.com').first()
            admin_wallet = Wallet.query.filter_by(user_id=admin_user.id).first()
            
            for i in range(3):
                transaction = Transaction(
                    wallet_id=admin_wallet.id,
                    amount=100.00 + i * 50,
                    transaction_type='credit',
                    description=f'Admin transaction {i}',
                    status='completed'
                )
                db.session.add(transaction)
            db.session.commit()
        
        response = client.get('/api/admin/wallet/transactions', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'transactions' in data
        assert len(data['transactions']) >= 3
    
    def test_admin_add_funds(self, client, admin_token):
        """Test admin adding funds"""
        response = client.post('/api/admin/wallet/add-funds', 
                             headers={'Authorization': f'Bearer {admin_token}'},
                             json={
                                 'amount': 500.00,
                                 'description': 'Test admin deposit'
                             })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Funds added successfully'
        assert 'new_balance' in data
    
    def test_admin_withdraw_funds(self, client, admin_token):
        """Test admin withdrawing funds"""
        response = client.post('/api/admin/wallet/withdraw', 
                             headers={'Authorization': f'Bearer {admin_token}'},
                             json={
                                 'amount': 200.00,
                                 'description': 'Test admin withdrawal'
                             })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Funds withdrawn successfully'
        assert 'new_balance' in data
    
    def test_agency_get_wallet(self, client, agency_token):
        """Test agency getting wallet"""
        response = client.get('/api/agency/wallet', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'wallet' in data
        assert data['wallet']['balance'] == 5000.00
    
    def test_agency_get_transactions(self, client, agency_token, app):
        """Test agency getting transactions"""
        with app.app_context():
            # Create some transactions
            agency_user = User.query.filter_by(email='agency@test.com').first()
            agency_wallet = Wallet.query.filter_by(user_id=agency_user.id).first()
            
            for i in range(3):
                transaction = Transaction(
                    wallet_id=agency_wallet.id,
                    amount=500.00 + i * 100,
                    transaction_type='credit',
                    description=f'Agency transaction {i}',
                    status='completed'
                )
                db.session.add(transaction)
            db.session.commit()
        
        response = client.get('/api/agency/wallet/transactions', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'transactions' in data
        assert len(data['transactions']) >= 3
    
    def test_agency_add_funds(self, client, agency_token):
        """Test agency adding funds"""
        response = client.post('/api/agency/wallet/add-funds', 
                             headers={'Authorization': f'Bearer {agency_token}'},
                             json={
                                 'amount': 1000.00,
                                 'description': 'Test agency deposit'
                             })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Funds added successfully'
        assert 'new_balance' in data
    
    def test_agency_withdraw_funds(self, client, agency_token):
        """Test agency withdrawing funds"""
        response = client.post('/api/agency/wallet/withdraw', 
                             headers={'Authorization': f'Bearer {agency_token}'},
                             json={
                                 'amount': 500.00,
                                 'description': 'Test agency withdrawal'
                             })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Funds withdrawn successfully'
        assert 'new_balance' in data
    
    def test_donor_get_wallet(self, client, donor_token):
        """Test donor getting wallet"""
        response = client.get('/api/donor/wallet', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'wallet' in data
        assert data['wallet']['balance'] == 1000.00
    
    def test_donor_get_transactions(self, client, donor_token, app):
        """Test donor getting transactions"""
        with app.app_context():
            # Create some transactions
            donor_user = User.query.filter_by(email='donor@test.com').first()
            donor_wallet = Wallet.query.filter_by(user_id=donor_user.id).first()
            
            for i in range(3):
                transaction = Transaction(
                    wallet_id=donor_wallet.id,
                    amount=100.00 + i * 50,
                    transaction_type='credit',
                    description=f'Donor transaction {i}',
                    status='completed'
                )
                db.session.add(transaction)
            db.session.commit()
        
        response = client.get('/api/donor/wallet/transactions', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'transactions' in data
        assert len(data['transactions']) >= 3
    
    def test_donor_add_funds(self, client, donor_token):
        """Test donor adding funds"""
        response = client.post('/api/donor/wallet/add-funds', 
                             headers={'Authorization': f'Bearer {donor_token}'},
                             json={
                                 'amount': 200.00,
                                 'description': 'Test donor deposit'
                             })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Funds added successfully'
        assert 'new_balance' in data
    
    def test_donor_withdraw_funds(self, client, donor_token):
        """Test donor withdrawing funds"""
        response = client.post('/api/donor/wallet/withdraw', 
                             headers={'Authorization': f'Bearer {donor_token}'},
                             json={
                                 'amount': 100.00,
                                 'description': 'Test donor withdrawal'
                             })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Funds withdrawn successfully'
        assert 'new_balance' in data
    
    def test_surrogate_get_wallet(self, client, surrogate_token):
        """Test surrogate getting wallet"""
        response = client.get('/api/surrogate/wallet', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'wallet' in data
        assert data['wallet']['balance'] == 10000.00
    
    def test_surrogate_get_transactions(self, client, surrogate_token, app):
        """Test surrogate getting transactions"""
        with app.app_context():
            # Create some transactions
            surrogate_user = User.query.filter_by(email='surrogate@test.com').first()
            surrogate_wallet = Wallet.query.filter_by(user_id=surrogate_user.id).first()
            
            for i in range(3):
                transaction = Transaction(
                    wallet_id=surrogate_wallet.id,
                    amount=1000.00 + i * 500,
                    transaction_type='credit',
                    description=f'Surrogate transaction {i}',
                    status='completed'
                )
                db.session.add(transaction)
            db.session.commit()
        
        response = client.get('/api/surrogate/wallet/transactions', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'transactions' in data
        assert len(data['transactions']) >= 3
    
    def test_surrogate_add_funds(self, client, surrogate_token):
        """Test surrogate adding funds"""
        response = client.post('/api/surrogate/wallet/add-funds', 
                             headers={'Authorization': f'Bearer {surrogate_token}'},
                             json={
                                 'amount': 2000.00,
                                 'description': 'Test surrogate deposit'
                             })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Funds added successfully'
        assert 'new_balance' in data
    
    def test_surrogate_withdraw_funds(self, client, surrogate_token):
        """Test surrogate withdrawing funds"""
        response = client.post('/api/surrogate/wallet/withdraw', 
                             headers={'Authorization': f'Bearer {surrogate_token}'},
                             json={
                                 'amount': 1000.00,
                                 'description': 'Test surrogate withdrawal'
                             })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Funds withdrawn successfully'
        assert 'new_balance' in data
    
    def test_ip_get_wallet(self, client, ip_token):
        """Test intending parent getting wallet"""
        response = client.get('/api/intending-parent/wallet', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'wallet' in data
        assert data['wallet']['balance'] == 20000.00
    
    def test_ip_get_transactions(self, client, ip_token, app):
        """Test intending parent getting transactions"""
        with app.app_context():
            # Create some transactions
            ip_user = User.query.filter_by(email='ip@test.com').first()
            ip_wallet = Wallet.query.filter_by(user_id=ip_user.id).first()
            
            for i in range(3):
                transaction = Transaction(
                    wallet_id=ip_wallet.id,
                    amount=2000.00 + i * 1000,
                    transaction_type='debit',
                    description=f'IP transaction {i}',
                    status='completed'
                )
                db.session.add(transaction)
            db.session.commit()
        
        response = client.get('/api/intending-parent/wallet/transactions', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'transactions' in data
        assert len(data['transactions']) >= 3
    
    def test_ip_add_funds(self, client, ip_token):
        """Test intending parent adding funds"""
        response = client.post('/api/intending-parent/wallet/add-funds', 
                             headers={'Authorization': f'Bearer {ip_token}'},
                             json={
                                 'amount': 5000.00,
                                 'description': 'Test IP deposit'
                             })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Funds added successfully'
        assert 'new_balance' in data
    
    def test_ip_withdraw_funds(self, client, ip_token):
        """Test intending parent withdrawing funds"""
        response = client.post('/api/intending-parent/wallet/withdraw', 
                             headers={'Authorization': f'Bearer {ip_token}'},
                             json={
                                 'amount': 1000.00,
                                 'description': 'Test IP withdrawal'
                             })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Funds withdrawn successfully'
        assert 'new_balance' in data
    
    def test_transfer_funds(self, client, ip_token, surrogate_token, app):
        """Test transferring funds between users"""
        with app.app_context():
            # Create wallets for both users
            ip_user = User.query.filter_by(email='ip@test.com').first()
            ip_wallet = Wallet.query.filter_by(user_id=ip_user.id).first()
            
            surrogate_user = User.query.filter_by(email='surrogate@test.com').first()
            surrogate_wallet = Wallet.query.filter_by(user_id=surrogate_user.id).first()
        
        response = client.post('/api/wallet/transfer', 
                             headers={'Authorization': f'Bearer {ip_token}'},
                             json={
                                 'recipient_id': surrogate_user.id,
                                 'amount': 1000.00,
                                 'description': 'Test transfer to surrogate'
                             })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Transfer successful'
        assert 'sender_new_balance' in data
        assert 'recipient_new_balance' in data
    
    def test_transfer_funds_insufficient_balance(self, client, donor_token, app):
        """Test transferring funds with insufficient balance"""
        with app.app_context():
            # Create a recipient user
            recipient_user = User(
                email='recipient@test.com',
                password=generate_password_hash('password123'),
                role='donor',
                is_verified=True,
                is_active=True,
                first_name='Recipient',
                last_name='User'
            )
            db.session.add(recipient_user)
            db.session.commit()
            
            # Create recipient wallet
            recipient_wallet = Wallet(
                user_id=recipient_user.id,
                balance=0.00,
                currency='USD'
            )
            db.session.add(recipient_wallet)
            db.session.commit()
        
        response = client.post('/api/wallet/transfer', 
                             headers={'Authorization': f'Bearer {donor_token}'},
                             json={
                                 'recipient_id': recipient_user.id,
                                 'amount': 5000.00,  # More than donor has
                                 'description': 'Test transfer with insufficient funds'
                             })
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'Insufficient balance' in data['error']
    
    def test_get_transaction_by_id(self, client, ip_token, app):
        """Test getting transaction by ID"""
        with app.app_context():
            # Create a transaction
            ip_user = User.query.filter_by(email='ip@test.com').first()
            ip_wallet = Wallet.query.filter_by(user_id=ip_user.id).first()
            
            transaction = Transaction(
                wallet_id=ip_wallet.id,
                amount=500.00,
                transaction_type='debit',
                description='Test transaction',
                status='completed'
            )
            db.session.add(transaction)
            db.session.commit()
            transaction_id = transaction.id
        
        response = client.get(f'/api/wallet/transactions/{transaction_id}', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['transaction']['id'] == transaction_id
    
    def test_get_transaction_by_id_not_found(self, client, ip_token):
        """Test getting transaction by non-existent ID"""
        response = client.get('/api/wallet/transactions/99999', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Transaction not found' in data['error']
    
    def test_get_wallet_balance(self, client, agency_token):
        """Test getting wallet balance"""
        response = client.get('/api/wallet/balance', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'balance' in data
        assert 'currency' in data
    
    def test_get_wallet_statistics(self, client, admin_token, app):
        """Test getting wallet statistics"""
        with app.app_context():
            # Create some test data
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
                    first_name=f'{role_name.capitalize()}{i}',
                    last_name='Test'
                )
                db.session.add(user)
                db.session.commit()
                
                wallet = Wallet(
                    user_id=user.id,
                    balance=1000.00 + i * 1000,
                    currency='USD'
                )
                db.session.add(wallet)
                db.session.commit()
        
        response = client.get('/api/wallet/statistics', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'statistics' in data