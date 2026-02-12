import sys
import os

# Handle both package and direct execution
if __package__ is None or __package__ == '':
    # Running as script - add parent to path
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from src.models import db
    from src.config import Config
    from src.controllers import auth_bp, user_bp, kyc_bp, marketplace_bp, agency_bp, favorites_bp, badge_bp, admin_bp, wallet_bp, notification_bp, messages_bp, upload_bp
else:
    # Running as package
    from .models import db
    from .config import Config
    from .controllers import auth_bp, user_bp, kyc_bp, marketplace_bp, agency_bp, favorites_bp, badge_bp, admin_bp, wallet_bp, notification_bp, messages_bp, upload_bp

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO, emit, join_room, leave_room

def create_app(config_class=None):
    app = Flask(__name__)
    
    # Handle both dict and class config
    if config_class is None:
        config_class = Config
    if isinstance(config_class, dict):
        app.config.update(config_class)
    else:
        app.config.from_object(config_class)
    
    # Initialize extensions
    CORS(app)
    db.init_app(app)
    jwt = JWTManager(app)
    socketio = SocketIO(app, cors_allowed_origins="*")
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(kyc_bp, url_prefix='/api/kyc')
    app.register_blueprint(marketplace_bp, url_prefix='/api/marketplace')
    app.register_blueprint(agency_bp, url_prefix='/api/agencies')
    app.register_blueprint(favorites_bp, url_prefix='/api/favorites')
    app.register_blueprint(badge_bp, url_prefix='/api/verification-badges')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(wallet_bp, url_prefix='/api/wallet')
    app.register_blueprint(notification_bp, url_prefix='/api/notifications')
    app.register_blueprint(messages_bp, url_prefix='/api/messages')
    app.register_blueprint(upload_bp, url_prefix='/api')
    
    # WebSocket event handlers
    @socketio.on('connect')
    def handle_connect():
        print(f'Client connected: {request.sid}')
    
    @socketio.on('disconnect')
    def handle_disconnect():
        print(f'Client disconnected: {request.sid}')
    
    @socketio.on('join_conversation')
    def handle_join_conversation(data):
        conversation_id = data.get('conversation_id')
        if conversation_id:
            join_room(conversation_id)
            emit('joined_conversation', {'conversation_id': conversation_id})
    
    @socketio.on('leave_conversation')
    def handle_leave_conversation(data):
        conversation_id = data.get('conversation_id')
        if conversation_id:
            leave_room(conversation_id)
            emit('left_conversation', {'conversation_id': conversation_id})
    
    @socketio.on('new_message')
    def handle_new_message(data):
        conversation_id = data.get('conversation_id')
        message = data.get('message')
        if conversation_id and message:
            # Broadcast to all clients in the conversation room
            emit('message_received', message, room=conversation_id)
    
    # Health check route
    @app.route('/', methods=['GET'])
    def health_check():
        return jsonify({"message": "SDC Flask Backend is running!", "status": "healthy"}), 200
    
    return app
