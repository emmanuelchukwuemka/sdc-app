import pytest
import json
import tempfile
import os
from unittest.mock import patch, MagicMock
from src.app import create_app
from src.models import db, User, Role, Message
from werkzeug.security import generate_password_hash


class TestMessagesAPI:
    """Test message endpoints for all roles"""
    
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
    
    def test_admin_get_messages(self, client, admin_token, app):
        """Test admin getting messages"""
        with app.app_context():
            # Create some messages for admin
            admin_user = User.query.filter_by(email='admin@test.com').first()
            
            # Create a sender user
            sender_user = User(
                email='sender@test.com',
                password=generate_password_hash('password123'),
                role='donor',
                is_verified=True,
                is_active=True,
                first_name='Sender',
                last_name='User'
            )
            db.session.add(sender_user)
            db.session.commit()
            sender_id = sender_user.id
            
            for i in range(3):
                message = Message(
                    sender_id=sender_id,
                    recipient_id=admin_user.id,
                    subject=f'Admin Message {i}',
                    message=f'This is admin message {i}',
                    is_read=False
                )
                db.session.add(message)
            db.session.commit()
        
        response = client.get('/api/admin/messages', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'messages' in data
        assert len(data['messages']) >= 3
    
    def test_admin_send_message(self, client, admin_token, app):
        """Test admin sending message"""
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
            recipient_id = recipient_user.id
        
        response = client.post('/api/admin/messages', 
                             headers={'Authorization': f'Bearer {admin_token}'},
                             json={
                                 'recipient_id': recipient_id,
                                 'subject': 'Test Admin Message',
                                 'message': 'This is a test message from admin'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Message sent successfully'
    
    def test_admin_get_message_by_id(self, client, admin_token, app):
        """Test admin getting message by ID"""
        with app.app_context():
            # Create a message for admin
            admin_user = User.query.filter_by(email='admin@test.com').first()
            
            # Create a sender user
            sender_user = User(
                email='sender2@test.com',
                password=generate_password_hash('password123'),
                role='donor',
                is_verified=True,
                is_active=True,
                first_name='Sender',
                last_name='User2'
            )
            db.session.add(sender_user)
            db.session.commit()
            sender_id = sender_user.id
            
            message = Message(
                sender_id=sender_id,
                recipient_id=admin_user.id,
                subject='Test Admin Message',
                message='This is a test admin message',
                is_read=False
            )
            db.session.add(message)
            db.session.commit()
            message_id = message.id
        
        response = client.get(f'/api/admin/messages/{message_id}', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message']['id'] == message_id
    
    def test_admin_get_message_by_id_not_found(self, client, admin_token):
        """Test admin getting message by non-existent ID"""
        response = client.get('/api/admin/messages/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Message not found' in data['error']
    
    def test_admin_delete_message(self, client, admin_token, app):
        """Test admin deleting message"""
        with app.app_context():
            # Create a message for admin
            admin_user = User.query.filter_by(email='admin@test.com').first()
            
            # Create a sender user
            sender_user = User(
                email='sender3@test.com',
                password=generate_password_hash('password123'),
                role='donor',
                is_verified=True,
                is_active=True,
                first_name='Sender',
                last_name='User3'
            )
            db.session.add(sender_user)
            db.session.commit()
            sender_id = sender_user.id
            
            message = Message(
                sender_id=sender_id,
                recipient_id=admin_user.id,
                subject='Test Admin Message',
                message='This is a test admin message',
                is_read=False
            )
            db.session.add(message)
            db.session.commit()
            message_id = message.id
        
        response = client.delete(f'/api/admin/messages/{message_id}', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Message deleted successfully'
    
    def test_admin_delete_message_not_found(self, client, admin_token):
        """Test admin deleting non-existent message"""
        response = client.delete('/api/admin/messages/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Message not found' in data['error']
    
    def test_admin_mark_message_read(self, client, admin_token, app):
        """Test admin marking message as read"""
        with app.app_context():
            # Create a message for admin
            admin_user = User.query.filter_by(email='admin@test.com').first()
            
            # Create a sender user
            sender_user = User(
                email='sender4@test.com',
                password=generate_password_hash('password123'),
                role='donor',
                is_verified=True,
                is_active=True,
                first_name='Sender',
                last_name='User4'
            )
            db.session.add(sender_user)
            db.session.commit()
            sender_id = sender_user.id
            
            message = Message(
                sender_id=sender_id,
                recipient_id=admin_user.id,
                subject='Test Admin Message',
                message='This is a test admin message',
                is_read=False
            )
            db.session.add(message)
            db.session.commit()
            message_id = message.id
        
        response = client.put(f'/api/admin/messages/{message_id}/read', 
                            headers={'Authorization': f'Bearer {admin_token}'})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Message marked as read successfully'
    
    def test_agency_get_messages(self, client, agency_token, app):
        """Test agency getting messages"""
        with app.app_context():
            # Create some messages for agency
            agency_user = User.query.filter_by(email='agency@test.com').first()
            
            # Create a sender user
            sender_user = User(
                email='sender5@test.com',
                password=generate_password_hash('password123'),
                role='donor',
                is_verified=True,
                is_active=True,
                first_name='Sender',
                last_name='User5'
            )
            db.session.add(sender_user)
            db.session.commit()
            sender_id = sender_user.id
            
            for i in range(3):
                message = Message(
                    sender_id=sender_id,
                    recipient_id=agency_user.id,
                    subject=f'Agency Message {i}',
                    message=f'This is agency message {i}',
                    is_read=False
                )
                db.session.add(message)
            db.session.commit()
        
        response = client.get('/api/agency/messages', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'messages' in data
        assert len(data['messages']) >= 3
    
    def test_agency_send_message(self, client, agency_token, app):
        """Test agency sending message"""
        with app.app_context():
            # Create a recipient user
            recipient_user = User(
                email='recipient2@test.com',
                password=generate_password_hash('password123'),
                role='intending_parent',
                is_verified=True,
                is_active=True,
                first_name='Recipient',
                last_name='User2'
            )
            db.session.add(recipient_user)
            db.session.commit()
            recipient_id = recipient_user.id
        
        response = client.post('/api/agency/messages', 
                             headers={'Authorization': f'Bearer {agency_token}'},
                             json={
                                 'recipient_id': recipient_id,
                                 'subject': 'Test Agency Message',
                                 'message': 'This is a test message from agency'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Message sent successfully'
    
    def test_donor_get_messages(self, client, donor_token, app):
        """Test donor getting messages"""
        with app.app_context():
            # Create some messages for donor
            donor_user = User.query.filter_by(email='donor@test.com').first()
            
            # Create a sender user
            sender_user = User(
                email='sender6@test.com',
                password=generate_password_hash('password123'),
                role='agency',
                is_verified=True,
                is_active=True,
                first_name='Sender',
                last_name='User6'
            )
            db.session.add(sender_user)
            db.session.commit()
            sender_id = sender_user.id
            
            for i in range(3):
                message = Message(
                    sender_id=sender_id,
                    recipient_id=donor_user.id,
                    subject=f'Donor Message {i}',
                    message=f'This is donor message {i}',
                    is_read=False
                )
                db.session.add(message)
            db.session.commit()
        
        response = client.get('/api/donor/messages', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'messages' in data
        assert len(data['messages']) >= 3
    
    def test_donor_send_message(self, client, donor_token, app):
        """Test donor sending message"""
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
        
        response = client.post('/api/donor/messages', 
                             headers={'Authorization': f'Bearer {donor_token}'},
                             json={
                                 'recipient_id': recipient_id,
                                 'subject': 'Test Donor Message',
                                 'message': 'This is a test message from donor'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Message sent successfully'
    
    def test_surrogate_get_messages(self, client, surrogate_token, app):
        """Test surrogate getting messages"""
        with app.app_context():
            # Create some messages for surrogate
            surrogate_user = User.query.filter_by(email='surrogate@test.com').first()
            
            # Create a sender user
            sender_user = User(
                email='sender7@test.com',
                password=generate_password_hash('password123'),
                role='agency',
                is_verified=True,
                is_active=True,
                first_name='Sender',
                last_name='User7'
            )
            db.session.add(sender_user)
            db.session.commit()
            sender_id = sender_user.id
            
            for i in range(3):
                message = Message(
                    sender_id=sender_id,
                    recipient_id=surrogate_user.id,
                    subject=f'Surrogate Message {i}',
                    message=f'This is surrogate message {i}',
                    is_read=False
                )
                db.session.add(message)
            db.session.commit()
        
        response = client.get('/api/surrogate/messages', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'messages' in data
        assert len(data['messages']) >= 3
    
    def test_surrogate_send_message(self, client, surrogate_token, app):
        """Test surrogate sending message"""
        with app.app_context():
            # Create a recipient user
            recipient_user = User(
                email='recipient4@test.com',
                password=generate_password_hash('password123'),
                role='agency',
                is_verified=True,
                is_active=True,
                first_name='Recipient',
                last_name='User4'
            )
            db.session.add(recipient_user)
            db.session.commit()
            recipient_id = recipient_user.id
        
        response = client.post('/api/surrogate/messages', 
                             headers={'Authorization': f'Bearer {surrogate_token}'},
                             json={
                                 'recipient_id': recipient_id,
                                 'subject': 'Test Surrogate Message',
                                 'message': 'This is a test message from surrogate'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Message sent successfully'
    
    def test_ip_get_messages(self, client, ip_token, app):
        """Test intending parent getting messages"""
        with app.app_context():
            # Create some messages for intending parent
            ip_user = User.query.filter_by(email='ip@test.com').first()
            
            # Create a sender user
            sender_user = User(
                email='sender8@test.com',
                password=generate_password_hash('password123'),
                role='agency',
                is_verified=True,
                is_active=True,
                first_name='Sender',
                last_name='User8'
            )
            db.session.add(sender_user)
            db.session.commit()
            sender_id = sender_user.id
            
            for i in range(3):
                message = Message(
                    sender_id=sender_id,
                    recipient_id=ip_user.id,
                    subject=f'IP Message {i}',
                    message=f'This is IP message {i}',
                    is_read=False
                )
                db.session.add(message)
            db.session.commit()
        
        response = client.get('/api/intending-parent/messages', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'messages' in data
        assert len(data['messages']) >= 3
    
    def test_ip_send_message(self, client, ip_token, app):
        """Test intending parent sending message"""
        with app.app_context():
            # Create a recipient user
            recipient_user = User(
                email='recipient5@test.com',
                password=generate_password_hash('password123'),
                role='agency',
                is_verified=True,
                is_active=True,
                first_name='Recipient',
                last_name='User5'
            )
            db.session.add(recipient_user)
            db.session.commit()
            recipient_id = recipient_user.id
        
        response = client.post('/api/intending-parent/messages', 
                             headers={'Authorization': f'Bearer {ip_token}'},
                             json={
                                 'recipient_id': recipient_id,
                                 'subject': 'Test IP Message',
                                 'message': 'This is a test message from intending parent'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Message sent successfully'
    
    def test_get_conversation(self, client, admin_token, app):
        """Test getting conversation between two users"""
        with app.app_context():
            # Create a conversation partner
            partner_user = User(
                email='partner@test.com',
                password=generate_password_hash('password123'),
                role='donor',
                is_verified=True,
                is_active=True,
                first_name='Partner',
                last_name='User'
            )
            db.session.add(partner_user)
            db.session.commit()
            partner_id = partner_user.id
            
            admin_user = User.query.filter_by(email='admin@test.com').first()
            
            # Create some messages in the conversation
            for i in range(3):
                message = Message(
                    sender_id=admin_user.id,
                    recipient_id=partner_id,
                    subject=f'Conversation Message {i}',
                    message=f'This is conversation message {i}',
                    is_read=False
                )
                db.session.add(message)
                
                reply = Message(
                    sender_id=partner_id,
                    recipient_id=admin_user.id,
                    subject=f'Conversation Reply {i}',
                    message=f'This is conversation reply {i}',
                    is_read=False
                )
                db.session.add(reply)
            db.session.commit()
        
        response = client.get(f'/api/messages/conversation/{partner_id}', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'messages' in data
        assert len(data['messages']) >= 6  # 3 messages + 3 replies
    
    def test_get_conversation_not_found(self, client, admin_token):
        """Test getting conversation with non-existent user"""
        response = client.get('/api/messages/conversation/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'User not found' in data['error']
    
    def test_get_unread_count(self, client, donor_token, app):
        """Test getting unread message count"""
        with app.app_context():
            # Create some messages for donor
            donor_user = User.query.filter_by(email='donor@test.com').first()
            
            # Create a sender user
            sender_user = User(
                email='sender9@test.com',
                password=generate_password_hash('password123'),
                role='agency',
                is_verified=True,
                is_active=True,
                first_name='Sender',
                last_name='User9'
            )
            db.session.add(sender_user)
            db.session.commit()
            sender_id = sender_user.id
            
            # Create some messages, some read, some unread
            for i in range(3):
                message = Message(
                    sender_id=sender_id,
                    recipient_id=donor_user.id,
                    subject=f'Donor Message {i}',
                    message=f'This is donor message {i}',
                    is_read=(i == 0)  # First one is read, others are unread
                )
                db.session.add(message)
            db.session.commit()
        
        response = client.get('/api/messages/unread-count', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'unread_count' in data
        assert data['unread_count'] == 2
    
    def test_search_messages(self, client, admin_token, app):
        """Test searching messages"""
        with app.app_context():
            # Create some messages for admin
            admin_user = User.query.filter_by(email='admin@test.com').first()
            
            # Create a sender user
            sender_user = User(
                email='sender10@test.com',
                password=generate_password_hash('password123'),
                role='donor',
                is_verified=True,
                is_active=True,
                first_name='Sender',
                last_name='User10'
            )
            db.session.add(sender_user)
            db.session.commit()
            sender_id = sender_user.id
            
            # Create some messages with different subjects
            messages = [
                'Test message about appointment',
                'Test message about contract',
                'Test message about payment'
            ]
            
            for i, message_text in enumerate(messages):
                message = Message(
                    sender_id=sender_id,
                    recipient_id=admin_user.id,
                    subject=f'Test Message {i}',
                    message=message_text,
                    is_read=False
                )
                db.session.add(message)
            db.session.commit()
        
        # Search for messages containing 'appointment'
        response = client.get('/api/messages/search?query=appointment', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'messages' in data
        assert len(data['messages']) >= 1
    
    def test_get_message_recipients(self, client, admin_token, app):
        """Test getting message recipients"""
        with app.app_context():
            # Create some users to be potential recipients
            roles = ['donor', 'surrogate', 'intending_parent']
            for i, role_name in enumerate(roles):
                role = Role(name=role_name)
                db.session.add(role)
                
                user = User(
                    email=f'recipient{i}@test.com',
                    password=generate_password_hash('password123'),
                    role=role_name,
                    is_verified=True,
                    is_active=True,
                    first_name=f'Recipient{i}',
                    last_name='Test'
                )
                db.session.add(user)
            db.session.commit()
        
        response = client.get('/api/messages/recipients', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'recipients' in data
        assert len(data['recipients']) >= 3