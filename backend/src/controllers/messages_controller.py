# backend/src/controllers/messages_controller.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import uuid

messages_bp = Blueprint('messages', __name__)

# In-memory storage for messages (replace with database in production)
messages_store = []

@messages_bp.route('/messages/<conversation_id>', methods=['GET'])
@jwt_required()
def get_messages(conversation_id):
    """Get messages for a conversation"""
    try:
        # Filter messages by conversation_id
        conversation_messages = [
            msg for msg in messages_store 
            if str(msg.get('conversation_id')) == str(conversation_id)
        ]
        
        # Sort by created_at timestamp
        conversation_messages.sort(key=lambda x: x.get('created_at', ''))
        
        return jsonify(conversation_messages), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@messages_bp.route('/messages', methods=['POST'])
@jwt_required()
def send_message():
    """Send a new message"""
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        # Validate required fields
        if not data.get('conversation_id'):
            return jsonify({'error': 'conversation_id is required'}), 400
            
        if not data.get('content') and not data.get('attachment_url'):
            return jsonify({'error': 'Message must have content or attachment'}), 400
        
        # Create message object
        message = {
            'id': str(uuid.uuid4()),
            'conversation_id': data['conversation_id'],
            'sender_user_id': current_user_id,
            'content': data.get('content', ''),
            'attachment_url': data.get('attachment_url'),
            'attachment_type': data.get('attachment_type'),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Store message
        messages_store.append(message)
        
        return jsonify(message), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Mock data for testing
def initialize_mock_messages():
    """Initialize with some mock messages"""
    global messages_store
    if not messages_store:  # Only initialize if empty
        mock_messages = [
            {
                'id': 'msg1',
                'conversation_id': 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                'sender_user_id': 'user1',
                'content': 'Hello! How can I help you today?',
                'created_at': '2026-01-17T10:00:00',
                'updated_at': '2026-01-17T10:00:00'
            },
            {
                'id': 'msg2',
                'conversation_id': 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                'sender_user_id': 'user2',
                'content': 'I have a question about the surrogacy process.',
                'created_at': '2026-01-17T10:05:00',
                'updated_at': '2026-01-17T10:05:00'
            }
        ]
        messages_store.extend(mock_messages)