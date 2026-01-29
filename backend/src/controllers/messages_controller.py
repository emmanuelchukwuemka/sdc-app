# backend/src/controllers/messages_controller.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import uuid
from ..models import db, Message

messages_bp = Blueprint('messages', __name__)


@messages_bp.route('/messages/<conversation_id>', methods=['GET'])
@jwt_required()
def get_messages(conversation_id):
    """Get messages for a conversation"""
    try:
        # Query messages from database by conversation_id
        conversation_messages = Message.query.filter_by(
            conversation_id=conversation_id
        ).order_by(Message.created_at.asc()).all()
        
        # Convert to dictionary format
        messages_list = []
        for msg in conversation_messages:
            messages_list.append({
                'id': msg.id,
                'conversation_id': msg.conversation_id,
                'sender_user_id': msg.sender_user_id,
                'content': msg.content,
                'attachment_url': msg.attachment_url,
                'attachment_type': msg.attachment_type,
                'created_at': msg.created_at.isoformat() if msg.created_at else None,
                'updated_at': msg.updated_at.isoformat() if msg.updated_at else None
            })
        
        return jsonify(messages_list), 200
        
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
        message = Message(
            conversation_id=data['conversation_id'],
            sender_user_id=current_user_id,
            content=data.get('content', ''),
            attachment_url=data.get('attachment_url'),
            attachment_type=data.get('attachment_type')
        )
        
        # Save to database
        db.session.add(message)
        db.session.commit()
        
        # Return the saved message
        return jsonify({
            'id': message.id,
            'conversation_id': message.conversation_id,
            'sender_user_id': message.sender_user_id,
            'content': message.content,
            'attachment_url': message.attachment_url,
            'attachment_type': message.attachment_type,
            'created_at': message.created_at.isoformat() if message.created_at else None,
            'updated_at': message.updated_at.isoformat() if message.updated_at else None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def initialize_mock_messages():
    """Initialize with some sample messages if needed"""
    # This function can remain as a placeholder if needed for testing purposes
    pass