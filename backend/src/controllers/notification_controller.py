from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    
    # Query actual notifications from the database
    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    
    notifications_list = []
    for notification in notifications:
        notifications_list.append({
            "id": notification.id,
            "user_id": notification.user_id,
            "title": notification.title,
            "body": notification.body,
            "severity": notification.severity,
            "status": notification.status,
            "created_at": notification.created_at.isoformat() if notification.created_at else None
        })
    
    return jsonify(notifications_list), 200

@jwt_required()
def mark_as_read(notification_id):
    user_id = get_jwt_identity()
    
    # Update notification status in database
    notification = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
    if not notification:
        return jsonify({"msg": "Notification not found"}), 404
    
    notification.status = 'read'
    db.session.commit()
    
    return jsonify({"msg": "Notification marked as read"}), 200