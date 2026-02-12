from flask import jsonify
from ..models import Agency, KycDocument, Subscription, WalletTransaction, User

def get_agencies():
    agencies = Agency.query.filter_by(status='approved').all()
    return jsonify([{
        "id": str(a.id),
        "name": a.name,
        "email": a.email,
        "status": a.status,
        "created_at": a.created_at.isoformat() if a.created_at else None
    } for a in agencies]), 200

def get_agency(agency_id):
    agency = Agency.query.filter_by(id=agency_id).first()
    if not agency:
        return jsonify({"msg": "Agency not found"}), 404
    
    return jsonify({
        "id": str(agency.id),
        "name": agency.name,
        "email": agency.email,
        "status": agency.status,
        "created_at": agency.created_at.isoformat() if agency.created_at else None
    }), 200

def get_agency_roster(agency_id):
    # Fetch all KYC documents associated with this agency
    documents = KycDocument.query.filter_by(agency_id=agency_id).all()
    user_ids = [doc.user_id for doc in documents]
    
    # Fetch corresponding users
    users = User.query.filter(User.id.in_(user_ids)).all()
    user_map = {user.id: user for user in users}
    
    roster = []
    for doc in documents:
        user = user_map.get(doc.user_id)
        if user:
            roster.append({
                "id": user.id,
                "first_name": user.first_name,
                "surname": user.last_name, 
                "role": user.role,
                "status": doc.status,
                "created_at": doc.created_at.isoformat() if doc.created_at else None
            })
            
    return jsonify(roster), 200

def get_agency_subscription(agency_id):
    agency = Agency.query.filter_by(id=agency_id).first()
    if not agency:
        return jsonify({"msg": "Agency not found"}), 404
        
    subscription = Subscription.query.filter_by(user_id=agency.id).first()
    if not subscription and agency.owner_id:
        subscription = Subscription.query.filter_by(user_id=agency.owner_id).first()
        
    if not subscription:
        return jsonify(None), 200
        
    return jsonify({
        "id": subscription.id,
        "plan": subscription.plan,
        "status": subscription.status,
        "expires_at": subscription.expires_at.isoformat() if subscription.expires_at else None
    }), 200

def get_agency_wallet(agency_id):
    agency = Agency.query.filter_by(id=agency_id).first()
    if not agency:
        return jsonify({"msg": "Agency not found"}), 404

    target_id = agency.owner_id if agency.owner_id else agency.id
    referral_transactions = WalletTransaction.query.filter_by(
        user_id=target_id,
        type='referral_bonus'
    ).all()
    
    referral_balance = sum(float(t.amount) for t in referral_transactions)
    
    return jsonify({
        "referral_balance": referral_balance,
        "currency": "NGN"
    }), 200