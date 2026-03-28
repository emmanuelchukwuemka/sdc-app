import random
import string
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, User, WalletTransaction

def generate_unique_code(username):
    """Generate a unique referral code based on username and random chars."""
    # Clean username: alphanumeric only, upper case
    clean_username = "".join(filter(str.isalnum, username)).upper()
    base = clean_username[:5] if clean_username else "SDC"
    
    while True:
        suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        code = f"{base}-{suffix}"
        if not User.query.filter_by(referral_code=code).first():
            return code

@jwt_required()
def get_code():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    if not user.referral_code:
        user.referral_code = generate_unique_code(user.username or "USER")
        db.session.commit()
        
    return jsonify({"code": user.referral_code}), 200

@jwt_required()
def get_stats():
    user_id = get_jwt_identity()
    
    # Total referrals (users referred by this user)
    total_referrals = User.query.filter_by(referred_by_id=user_id).count()
    
    # Earned and Pending commissions from WalletTransaction
    # Assuming type='referral_bonus' for rewards
    earned_txs = WalletTransaction.query.filter_by(
        user_id=user_id, 
        type='referral_bonus', 
        status='completed'
    ).all()
    
    pending_txs = WalletTransaction.query.filter_by(
        user_id=user_id, 
        type='referral_bonus', 
        status='pending'
    ).all()
    
    earned = sum(float(tx.amount) for tx in earned_txs)
    pending = sum(float(tx.amount) for tx in pending_txs)
    
    return jsonify({
        "totalReferrals": total_referrals,
        "earned": earned,
        "pending": pending
    }), 200
