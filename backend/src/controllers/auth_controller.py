from flask import request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
import bcrypt
from datetime import datetime
from ..models import db, User, KycDocument

def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    
    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "User already exists"}), 400
        
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    new_user = User(
        email=email,
        password_hash=hashed_pw,
        role=role,
        first_name=data.get('first_name'),
        last_name=data.get('last_name')
    )
    db.session.add(new_user)
    db.session.flush() # Get user ID
    
    # Create initial KYC document
    new_kyc = KycDocument(
        user_id=new_user.id,
        role=role,
        form_data=data.get('form_data', {}),
        status='in_progress'
    )
    db.session.add(new_kyc)
    db.session.commit()
    
    access_token = create_access_token(identity=str(new_user.id))
    return jsonify({
        "access_token": access_token,
        "user_id": str(new_user.id),
        "role": new_user.role,
        "email": new_user.email,
        "first_name": new_user.first_name,
        "last_name": new_user.last_name
    }), 201

def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    user = User.query.filter_by(email=email).first()
    if user and bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            "access_token": access_token, 
            "user_id": str(user.id), 
            "role": user.role,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name
        }), 200
    
    return jsonify({"msg": "Bad email or password"}), 401

@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
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