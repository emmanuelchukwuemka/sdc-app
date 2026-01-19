from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import db, Favorite

@jwt_required()
def get_favorites():
    user_id = get_jwt_identity()
    favs = Favorite.query.filter_by(ip_id=user_id).all()
    return jsonify([str(f.target_user_id) for f in favs])

@jwt_required()
def add_favorite():
    user_id = get_jwt_identity()
    data = request.get_json()
    target_id = data.get('target_user_id')
    
    if Favorite.query.filter_by(ip_id=user_id, target_user_id=target_id).first():
        return jsonify({"msg": "Already in favorites"}), 400
        
    new_fav = Favorite(ip_id=user_id, target_user_id=target_id)
    db.session.add(new_fav)
    db.session.commit()
    return jsonify({"msg": "Added to favorites"}), 201

@jwt_required()
def remove_favorite():
    user_id = get_jwt_identity()
    target_id = request.args.get('target_user_id')
    fav = Favorite.query.filter_by(ip_id=user_id, target_user_id=target_id).first()
    if fav:
        db.session.delete(fav)
        db.session.commit()
    return jsonify({"msg": "Removed from favorites"}), 200