from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from ..models import db, WalletTransaction

@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    
    # Query actual wallet transactions from the database
    transactions = WalletTransaction.query.filter_by(user_id=user_id).order_by(WalletTransaction.created_at.desc()).all()
    
    transactions_list = []
    for transaction in transactions:
        transactions_list.append({
            "id": transaction.id,
            "user_id": transaction.user_id,
            "amount": float(transaction.amount),
            "currency": transaction.currency,
            "type": transaction.type,
            "status": transaction.status,
            "reference": transaction.reference,
            "created_at": transaction.created_at.isoformat() if transaction.created_at else None
        })
    
    return jsonify(transactions_list), 200

@jwt_required()
def get_balance():
    user_id = get_jwt_identity()
    
    # Calculate actual wallet balance from database
    # Sum all completed transactions (positive for credits, negative for debits)
    completed_transactions = WalletTransaction.query.filter_by(
        user_id=user_id,
        status='completed'
    ).all()
    
    balance = sum(float(t.amount) if t.type in ['credit', 'referral_bonus', 'payment'] else -float(t.amount) 
              for t in completed_transactions)
    
    # Calculate referral balance separately
    referral_transactions = WalletTransaction.query.filter_by(
        user_id=user_id,
        type='referral_bonus'
    ).all()
    referral_balance = sum(float(t.amount) for t in referral_transactions)
    
    return jsonify({
        "balance": balance,
        "referral_balance": referral_balance,
        "currency": "NGN",
        "user_id": user_id
    }), 200