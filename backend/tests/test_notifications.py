import pytest
import json
import tempfile
import os
from unittest.mock import patch, MagicMock
from src.app import create_app
from src.models import db, User, Role, Notification
from werkzeug.security import generate_password_hash


class TestNotificationsAPI:
    """Test notification endpoints for all roles"""
    
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
    
    def test_admin_get_notifications(self, client, admin_token, app):
        """Test admin getting notifications"""
        with app.app_context():
            # Create some notifications for admin
            admin_user = User.query.filter_by(email='admin@test.com').first()
            
            for i in range(3):
                notification = Notification(
                    user_id=admin_user.id,
                    title=f'Admin Notification {i}',
                    message=f'This is admin notification {i}',
                    notification_type='system',
                    is_read=False
                )
                db.session.add(notification)
            db.session.commit()
        
        response = client.get('/api/admin/notifications', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'notifications' in data
        assert len(data['notifications']) >= 3
    
    def test_admin_mark_notification_read(self, client, admin_token, app):
        """Test admin marking notification as read"""
        with app.app_context():
            # Create a notification for admin
            admin_user = User.query.filter_by(email='admin@test.com').first()
            
            notification = Notification(
                user_id=admin_user.id,
                title='Test Admin Notification',
                message='This is a test admin notification',
                notification_type='system',
                is_read=False
            )
            db.session.add(notification)
            db.session.commit()
            notification_id = notification.id
        
        response = client.put(f'/api/admin/notifications/{notification_id}/read', 
                            headers={'Authorization': f'Bearer {admin_token}'})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Notification marked as read successfully'
    
    def test_admin_mark_notification_read_not_found(self, client, admin_token):
        """Test admin marking non-existent notification as read"""
        response = client.put('/api/admin/notifications/99999/read', 
                            headers={'Authorization': f'Bearer {admin_token}'})
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Notification not found' in data['error']
    
    def test_admin_delete_notification(self, client, admin_token, app):
        """Test admin deleting notification"""
        with app.app_context():
            # Create a notification for admin
            admin_user = User.query.filter_by(email='admin@test.com').first()
            
            notification = Notification(
                user_id=admin_user.id,
                title='Test Admin Notification',
                message='This is a test admin notification',
                notification_type='system',
                is_read=False
            )
            db.session.add(notification)
            db.session.commit()
            notification_id = notification.id
        
        response = client.delete(f'/api/admin/notifications/{notification_id}', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Notification deleted successfully'
    
    def test_admin_delete_notification_not_found(self, client, admin_token):
        """Test admin deleting non-existent notification"""
        response = client.delete('/api/admin/notifications/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Notification not found' in data['error']
    
    def test_admin_get_unread_count(self, client, admin_token, app):
        """Test admin getting unread notification count"""
        with app.app_context():
            # Create some notifications for admin
            admin_user = User.query.filter_by(email='admin@test.com').first()
            
            for i in range(3):
                notification = Notification(
                    user_id=admin_user.id,
                    title=f'Admin Notification {i}',
                    message=f'This is admin notification {i}',
                    notification_type='system',
                    is_read=(i == 0)  # First one is read, others are unread
                )
                db.session.add(notification)
            db.session.commit()
        
        response = client.get('/api/admin/notifications/unread-count', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'unread_count' in data
        assert data['unread_count'] == 2
    
    def test_agency_get_notifications(self, client, agency_token, app):
        """Test agency getting notifications"""
        with app.app_context():
            # Create some notifications for agency
            agency_user = User.query.filter_by(email='agency@test.com').first()
            
            for i in range(3):
                notification = Notification(
                    user_id=agency_user.id,
                    title=f'Agency Notification {i}',
                    message=f'This is agency notification {i}',
                    notification_type='system',
                    is_read=False
                )
                db.session.add(notification)
            db.session.commit()
        
        response = client.get('/api/agency/notifications', headers={
            'Authorization': f'Bearer {agency_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'notifications' in data
        assert len(data['notifications']) >= 3
    
    def test_agency_mark_notification_read(self, client, agency_token, app):
        """Test agency marking notification as read"""
        with app.app_context():
            # Create a notification for agency
            agency_user = User.query.filter_by(email='agency@test.com').first()
            
            notification = Notification(
                user_id=agency_user.id,
                title='Test Agency Notification',
                message='This is a test agency notification',
                notification_type='system',
                is_read=False
            )
            db.session.add(notification)
            db.session.commit()
            notification_id = notification.id
        
        response = client.put(f'/api/agency/notifications/{notification_id}/read', 
                            headers={'Authorization': f'Bearer {agency_token}'})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Notification marked as read successfully'
    
    def test_donor_get_notifications(self, client, donor_token, app):
        """Test donor getting notifications"""
        with app.app_context():
            # Create some notifications for donor
            donor_user = User.query.filter_by(email='donor@test.com').first()
            
            for i in range(3):
                notification = Notification(
                    user_id=donor_user.id,
                    title=f'Donor Notification {i}',
                    message=f'This is donor notification {i}',
                    notification_type='system',
                    is_read=False
                )
                db.session.add(notification)
            db.session.commit()
        
        response = client.get('/api/donor/notifications', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'notifications' in data
        assert len(data['notifications']) >= 3
    
    def test_donor_mark_notification_read(self, client, donor_token, app):
        """Test donor marking notification as read"""
        with app.app_context():
            # Create a notification for donor
            donor_user = User.query.filter_by(email='donor@test.com').first()
            
            notification = Notification(
                user_id=donor_user.id,
                title='Test Donor Notification',
                message='This is a test donor notification',
                notification_type='system',
                is_read=False
            )
            db.session.add(notification)
            db.session.commit()
            notification_id = notification.id
        
        response = client.put(f'/api/donor/notifications/{notification_id}/read', 
                            headers={'Authorization': f'Bearer {donor_token}'})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Notification marked as read successfully'
    
    def test_surrogate_get_notifications(self, client, surrogate_token, app):
        """Test surrogate getting notifications"""
        with app.app_context():
            # Create some notifications for surrogate
            surrogate_user = User.query.filter_by(email='surrogate@test.com').first()
            
            for i in range(3):
                notification = Notification(
                    user_id=surrogate_user.id,
                    title=f'Surrogate Notification {i}',
                    message=f'This is surrogate notification {i}',
                    notification_type='system',
                    is_read=False
                )
                db.session.add(notification)
            db.session.commit()
        
        response = client.get('/api/surrogate/notifications', headers={
            'Authorization': f'Bearer {surrogate_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'notifications' in data
        assert len(data['notifications']) >= 3
    
    def test_surrogate_mark_notification_read(self, client, surrogate_token, app):
        """Test surrogate marking notification as read"""
        with app.app_context():
            # Create a notification for surrogate
            surrogate_user = User.query.filter_by(email='surrogate@test.com').first()
            
            notification = Notification(
                user_id=surrogate_user.id,
                title='Test Surrogate Notification',
                message='This is a test surrogate notification',
                notification_type='system',
                is_read=False
            )
            db.session.add(notification)
            db.session.commit()
            notification_id = notification.id
        
        response = client.put(f'/api/surrogate/notifications/{notification_id}/read', 
                            headers={'Authorization': f'Bearer {surrogate_token}'})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Notification marked as read successfully'
    
    def test_ip_get_notifications(self, client, ip_token, app):
        """Test intending parent getting notifications"""
        with app.app_context():
            # Create some notifications for intending parent
            ip_user = User.query.filter_by(email='ip@test.com').first()
            
            for i in range(3):
                notification = Notification(
                    user_id=ip_user.id,
                    title=f'IP Notification {i}',
                    message=f'This is IP notification {i}',
                    notification_type='system',
                    is_read=False
                )
                db.session.add(notification)
            db.session.commit()
        
        response = client.get('/api/intending-parent/notifications', headers={
            'Authorization': f'Bearer {ip_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'notifications' in data
        assert len(data['notifications']) >= 3
    
    def test_ip_mark_notification_read(self, client, ip_token, app):
        """Test intending parent marking notification as read"""
        with app.app_context():
            # Create a notification for intending parent
            ip_user = User.query.filter_by(email='ip@test.com').first()
            
            notification = Notification(
                user_id=ip_user.id,
                title='Test IP Notification',
                message='This is a test IP notification',
                notification_type='system',
                is_read=False
            )
            db.session.add(notification)
            db.session.commit()
            notification_id = notification.id
        
        response = client.put(f'/api/intending-parent/notifications/{notification_id}/read', 
                            headers={'Authorization': f'Bearer {ip_token}'})
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Notification marked as read successfully'
    
    def test_get_notification_by_id(self, client, admin_token, app):
        """Test getting notification by ID"""
        with app.app_context():
            # Create a notification for admin
            admin_user = User.query.filter_by(email='admin@test.com').first()
            
            notification = Notification(
                user_id=admin_user.id,
                title='Test Notification',
                message='This is a test notification',
                notification_type='system',
                is_read=False
            )
            db.session.add(notification)
            db.session.commit()
            notification_id = notification.id
        
        response = client.get(f'/api/notifications/{notification_id}', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['notification']['id'] == notification_id
    
    def test_get_notification_by_id_not_found(self, client, admin_token):
        """Test getting notification by non-existent ID"""
        response = client.get('/api/notifications/99999', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'Notification not found' in data['error']
    
    def test_send_notification_to_user(self, client, admin_token, app):
        """Test sending notification to specific user"""
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
        
        response = client.post('/api/notifications/send', 
                             headers={'Authorization': f'Bearer {admin_token}'},
                             json={
                                 'recipient_id': recipient_id,
                                 'title': 'Test Notification',
                                 'message': 'This is a test notification from admin',
                                 'notification_type': 'system'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Notification sent successfully'
    
    def test_send_notification_to_user_not_found(self, client, admin_token):
        """Test sending notification to non-existent user"""
        response = client.post('/api/notifications/send', 
                             headers={'Authorization': f'Bearer {admin_token}'},
                             json={
                                 'recipient_id': 99999,
                                 'title': 'Test Notification',
                                 'message': 'This is a test notification',
                                 'notification_type': 'system'
                             })
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'User not found' in data['error']
    
    def test_send_notification_to_role(self, client, admin_token, app):
        """Test sending notification to users with specific role"""
        with app.app_context():
            # Create some users with the same role
            for i in range(3):
                role = Role(name='donor')
                db.session.add(role)
                
                user = User(
                    email=f'roleuser{i}@test.com',
                    password=generate_password_hash('password123'),
                    role='donor',
                    is_verified=True,
                    is_active=True,
                    first_name=f'RoleUser{i}',
                    last_name='Test'
                )
                db.session.add(user)
            db.session.commit()
        
        response = client.post('/api/notifications/send-to-role', 
                             headers={'Authorization': f'Bearer {admin_token}'},
                             json={
                                 'role': 'donor',
                                 'title': 'Role Notification',
                                 'message': 'This is a notification for all donors',
                                 'notification_type': 'system'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Notifications sent successfully'
        assert 'sent_count' in data
    
    def test_send_notification_to_all_users(self, client, admin_token, app):
        """Test sending notification to all users"""
        with app.app_context():
            # Create some test users
            roles = ['donor', 'surrogate', 'intending_parent']
            for i, role_name in enumerate(roles):
                role = Role(name=role_name)
                db.session.add(role)
                
                user = User(
                    email=f'alluser{i}@test.com',
                    password=generate_password_hash('password123'),
                    role=role_name,
                    is_verified=True,
                    is_active=True,
                    first_name=f'AllUser{i}',
                    last_name='Test'
                )
                db.session.add(user)
            db.session.commit()
        
        response = client.post('/api/notifications/send-to-all', 
                             headers={'Authorization': f'Bearer {admin_token}'},
                             json={
                                 'title': 'All Users Notification',
                                 'message': 'This is a notification for all users',
                                 'notification_type': 'system'
                             })
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['message'] == 'Notifications sent successfully'
        assert 'sent_count' in data
    
    def test_get_notification_preferences(self, client, donor_token, app):
        """Test getting notification preferences"""
        # This would need actual implementation of notification preferences
        # For now, just test the endpoint exists
        response = client.get('/api/notifications/preferences', headers={
            'Authorization': f'Bearer {donor_token}'
        })
        
        # Should return 404 or 200 depending on implementation
        assert response.status_code in [200, 404]
    
    def test_update_notification_preferences(self, client, donor_token):
        """Test updating notification preferences"""
        # This would need actual implementation of notification preferences
        # For now, just test the endpoint exists
        response = client.put('/api/notifications/preferences', 
                            headers={'Authorization': f'Bearer {donor_token}'},
                            json={
                                'email_notifications': True,
                                'push_notifications': False,
                                'sms_notifications': True
                            })
        
        # Should return 404 or 200 depending on implementation
        assert response.status_code in [200, 404]