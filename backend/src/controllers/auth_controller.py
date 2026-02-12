from flask import request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, get_jwt
import bcrypt
from datetime import datetime
from ..models import db, User, KycDocument

# Store for revoked tokens (in production, use Redis)
revoked_tokens = set()

def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    
    # Validate required fields
    if not email or not password or not role:
        return jsonify({"msg": "Missing required fields: email, password, role"}), 400
    
    # Validate role - accept both uppercase and lowercase
    role_upper = role.upper() if role else ''
    role_mapping = {
        'ADMIN': 'admin',
        'AGENCY': 'agency', 
        'DONOR': 'donor',
        'SURROGATE': 'surrogate',
        'IP': 'intending_parent',
        'INTENDING_PARENT': 'intending_parent'
    }
    allowed_roles = ['admin', 'ADMIN', 'agency', 'AGENCY', 'donor', 'DONOR', 'surrogate', 'SURROGATE', 'intending_parent', 'INTENDING_PARENT', 'IP']
    
    if role not in allowed_roles:
        return jsonify({"msg": f"Invalid role. Allowed roles: admin, agency, donor, surrogate, intending_parent"}), 400
    
    # Normalize role to lowercase for storage
    normalized_role = role_mapping.get(role_upper, role.lower())
    
    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "User already exists"}), 400
        
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Generate username from email if not provided
    username = data.get('username') or email.split('@')[0]
    
    new_user = User(
        email=email,
        username=username,
        password_hash=hashed_pw,
        role=normalized_role,
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
    
    # Check if user exists
    if not user:
        return jsonify({"msg": "Invalid credentials"}), 401
    
    # Check if user is active
    if not user.is_active:
        return jsonify({"msg": "Account is inactive"}), 401
    
    # Check if user is verified
    if not user.is_verified:
        return jsonify({"msg": "Please verify your email first"}), 401
    
    # Check password
    if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({"msg": "Invalid credentials"}), 401
    
    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "access_token": access_token, 
        "user_id": str(user.id), 
        "role": 'IP' if user.role == 'intending_parent' else (user.role.upper() if user.role else user.role),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name
    }), 200

@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    return jsonify({
        "id": str(user.id),
        "email": user.email,
        "role": 'IP' if user.role == 'intending_parent' else (user.role.upper() if user.role else user.role),
        "first_name": user.first_name,
        "last_name": user.last_name,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }), 200

def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')
    
    # If token is provided, it's a password reset with token
    if token and new_password:
        user_id = User.verify_reset_token(token)
        if not user_id:
            return jsonify({"msg": "Invalid or expired token"}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"msg": "Invalid or expired token"}), 400
        
        hashed_pw = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user.password_hash = hashed_pw
        db.session.commit()
        
        return jsonify({"msg": "Password has been reset successfully"}), 200
    
    # Otherwise, it's a forgot password request
    email = data.get('email')
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"msg": "If that email exists, a reset link has been sent"}), 200
    return jsonify({"msg": "Password reset email sent"}), 200

@jwt_required()
def update_password():
    user_id = get_jwt_identity()
    data = request.get_json()
    password = data.get('password')
    
    if not password:
        return jsonify({"msg": "Missing password"}), 400
        
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404
        
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.password_hash = hashed_pw
    db.session.commit()
    
    return jsonify({"msg": "Password updated successfully"}), 200

@jwt_required()
def logout():
    jti = get_jwt()['jti']
    revoked_tokens.add(jti)
    return jsonify({"msg": "Successfully logged out"}), 200

@jwt_required()
def refresh():
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    return jsonify({"access_token": access_token}), 200

def forgot_password():
    data = request.get_json()
    email = data.get('email')
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"msg": "If that email exists, a reset link has been sent"}), 200
    return jsonify({"msg": "Password reset email sent"}), 200

def reset_password_with_token():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')
    
    if not token or not new_password:
        return jsonify({"msg": "Missing token or password"}), 400
    
    user_id = User.verify_reset_token(token)
    if not user_id:
        return jsonify({"msg": "Invalid or expired token"}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "Invalid or expired token"}), 400
    
    hashed_pw = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.password_hash = hashed_pw
    db.session.commit()
    
    return jsonify({"msg": "Password has been reset successfully"}), 200

def verify_email(token=None):
    # Get token from query string or path parameter
    if not token:
        token = request.args.get('token')
    
    if not token:
        return jsonify({"msg": "Missing token"}), 400
    
    user_id = User.verify_verification_token(token)
    if not user_id:
        return jsonify({"msg": "Invalid or expired token"}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "Invalid or expired token"}), 400
    
    if user.is_verified:
        return jsonify({"msg": "Email already verified"}), 200
    
    user.is_verified = True
    db.session.commit()
    
    return jsonify({"msg": "Email verified successfully"}), 200

@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    return jsonify({
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "role": 'IP' if user.role == 'intending_parent' else (user.role.upper() if user.role else user.role),
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_verified": user.is_verified,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }), 200

@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    data = request.get_json()
    
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'phone' in data:
        user.phone = data['phone']
    
    db.session.commit()
    
    return jsonify({"msg": "Profile updated successfully"}), 200

@jwt_required()
def delete_account():
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({"msg": "Account deleted successfully"}), 200

@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({"msg": "Missing current_password or new_password"}), 400
    
    if not bcrypt.checkpw(current_password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({"msg": "Current password is incorrect"}), 400
    
    hashed_pw = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.password_hash = hashed_pw
    db.session.commit()
    
    return jsonify({"msg": "Password changed successfully"}), 200