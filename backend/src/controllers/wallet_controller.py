from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from ..models import db

@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    
    # Mock wallet transactions - in production this would query actual wallet transaction table
    mock_transactions = [
        {
            "id": "1",
            "user_id": user_id,
            "amount": 50000,
            "currency": "NGN",
            "type": "surrogate_payment",
            "status": "held",
            "reference": "ESCROW_001",
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": "2",
            "user_id": user_id,
            "amount": 2500,
            "currency": "NGN",
            "type": "referral_bonus",
            "status": "posted",
            "reference": "REF_001",
            "created_at": datetime.utcnow().isoformat()
        }
    ]
    
    return jsonify(mock_transactions), 200

@jwt_required()
def get_balance():
    user_id = get_jwt_identity()
    
    # Mock wallet balance - in production this would query actual wallet balance
    return jsonify({
        "balance": 0,
        "referral_balance": 2500,
        "currency": "NGN",
        "user_id": user_id
    }), 200