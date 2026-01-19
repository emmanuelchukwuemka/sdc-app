from flask import jsonify
from ..models import Agency

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