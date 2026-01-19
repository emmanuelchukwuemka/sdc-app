from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, MarketplaceUnlock, CommissionSetting

@jwt_required()
def get_unlocks():
    user_id = get_jwt_identity()
    unlocks = MarketplaceUnlock.query.filter_by(user_id=user_id).all()
    return jsonify([u.listing_id for u in unlocks])

@jwt_required()
def unlock_profile():
    user_id = get_jwt_identity()
    data = request.get_json()
    listing_id = data.get('listing_id')
    
    if MarketplaceUnlock.query.filter_by(user_id=user_id, listing_id=listing_id).first():
        return jsonify({"msg": "Already unlocked"}), 400
        
    new_unlock = MarketplaceUnlock(user_id=user_id, listing_id=listing_id)
    db.session.add(new_unlock)
    db.session.commit()
    return jsonify({"msg": "Profile unlocked"}), 201

def get_commission_settings():
    settings = CommissionSetting.query.all()
    return jsonify({s.category: float(s.percent) for s in settings})