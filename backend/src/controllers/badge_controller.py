from flask import request, jsonify
from ..models import VerificationBadge

def get_badges():
    user_ids = request.args.getlist('user_ids')
    badges = VerificationBadge.query.filter(VerificationBadge.user_id.in_(user_ids)).all()
    return jsonify([{
        "user_id": str(b.user_id),
        "type": b.type,
        "status": b.status
    } for b in badges])