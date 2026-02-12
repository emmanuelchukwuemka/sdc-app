from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, MarketplaceUnlock, CommissionSetting, Surrogate, SurrogateProfile

def get_surrogates():
    """Get all available surrogates for marketplace"""
    # Get surrogates with status 'active'
    surrogates = Surrogate.query.filter_by(status='active').all()
    
    result = []
    for surrogate in surrogates:
        profile = SurrogateProfile.query.filter_by(surrogate_id=surrogate.id).first()
        surrogate_data = {
            "id": surrogate.id,
            "user_id": surrogate.user_id,
            "status": surrogate.status,
            "created_at": surrogate.created_at.isoformat() if surrogate.created_at else None
        }
        
        if profile:
            surrogate_data.update({
                "bio": profile.bio,
                "location": profile.location,
                "occupation": profile.occupation
            })
        
        result.append(surrogate_data)
    return jsonify(result), 200

def get_surrogate_by_id(surrogate_id):
    """Get a specific surrogate by ID"""
    surrogate = Surrogate.query.get(surrogate_id)
    if not surrogate:
        return jsonify({"msg": "Surrogate not found"}), 404
    
    profile = SurrogateProfile.query.filter_by(surrogate_id=surrogate_id).first()
    
    result = {
        "id": surrogate.id,
        "user_id": surrogate.user_id,
        "status": surrogate.status
    }
    
    if profile:
        result.update({
            "bio": profile.bio,
            "location": profile.location,
            "occupation": profile.occupation
        })
    
    return jsonify(result), 200

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

@jwt_required()
def update_commission_settings():
    # In a production app, add a check for admin role here
    data = request.get_json()
    category = data.get('category')
    percent = data.get('percent')
    
    if not category or percent is None:
        return jsonify({"msg": "Category and percent are required"}), 400
        
    setting = CommissionSetting.query.filter_by(category=category).first()
    if not setting:
        setting = CommissionSetting(category=category, percent=percent)
        db.session.add(setting)
    else:
        setting.percent = percent
        
    db.session.commit()
    return jsonify({"msg": "Commission setting updated"}), 200