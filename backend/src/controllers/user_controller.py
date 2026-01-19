from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, User

@jwt_required()
def get_users():
    users = User.query.all()
    return jsonify([{
        "id": str(u.id),
        "email": u.email,
        "role": u.role,
        "first_name": u.first_name,
        "last_name": u.last_name,
        "created_at": u.created_at.isoformat() if u.created_at else None
    } for u in users]), 200

@jwt_required()
def get_user(user_id):
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    return jsonify({
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }), 200