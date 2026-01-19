from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, KycDocument, User

@jwt_required()
def get_kyc_status():
    user_id = get_jwt_identity()
    kyc = KycDocument.query.filter_by(user_id=user_id).first()
    if not kyc:
        return jsonify({"msg": "KYC not found"}), 404
    return jsonify({
        "status": kyc.status,
        "role": kyc.role,
        "form_progress": kyc.form_progress,
        "form_data": kyc.form_data
    }), 200

@jwt_required()
def get_kyc_documents():
    user_id = get_jwt_identity()
    documents = KycDocument.query.filter_by(user_id=user_id).all()
    return jsonify([{
        "id": str(d.id),
        "role": d.role,
        "status": d.status,
        "form_progress": d.form_progress,
        "form_data": d.form_data,
        "file_url": d.file_url,
        "created_at": d.created_at.isoformat() if d.created_at else None,
        "updated_at": d.updated_at.isoformat() if d.updated_at else None
    } for d in documents]), 200

@jwt_required()
def submit_kyc_document():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Check if user already has a KYC document
    existing_kyc = KycDocument.query.filter_by(user_id=user_id).first()
    if existing_kyc:
        # Update existing document
        existing_kyc.form_data = data.get('form_data', existing_kyc.form_data)
        existing_kyc.form_progress = data.get('form_progress', existing_kyc.form_progress)
        existing_kyc.status = data.get('status', existing_kyc.status)
        existing_kyc.file_url = data.get('file_url', existing_kyc.file_url)
        db.session.commit()
        return jsonify({"msg": "KYC document updated", "id": str(existing_kyc.id)}), 200
    else:
        # Create new document
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({"msg": "User not found"}), 404
            
        new_kyc = KycDocument(
            user_id=user_id,
            role=user.role,
            form_data=data.get('form_data', {}),
            form_progress=data.get('form_progress', 0),
            status=data.get('status', 'in_progress'),
            file_url=data.get('file_url')
        )
        db.session.add(new_kyc)
        db.session.commit()
        return jsonify({"msg": "KYC document created", "id": str(new_kyc.id)}), 201