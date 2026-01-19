from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    
    # Mock notifications - in production this would query actual notifications table
    mock_notifications = [
        {
            "id": "1",
            "user_id": user_id,
            "title": "KYC Approved",
            "body": "Your KYC verification has been approved. You can now access all platform features.",
            "severity": "info",
            "status": "unread",
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": "2",
            "user_id": user_id,
            "title": "New Message",
            "body": "You have a new message from a potential match.",
            "severity": "info",
            "status": "unread",
            "created_at": datetime.utcnow().isoformat()
        }
    ]
    
    return jsonify(mock_notifications), 200

@jwt_required()
def mark_as_read(notification_id):
    # In production, this would update the notification status in database
    return jsonify({"msg": "Notification marked as read"}), 200