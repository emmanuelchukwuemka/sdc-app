from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from ..models import db, User, KycDocument, MarketplaceUnlock, Favorite, Contract, Dispute, ContractTemplate, EscrowTransaction, WalletTransaction, Agency

@jwt_required()
def get_reports():
    days = request.args.get('days', 30, type=int)
    since = datetime.utcnow() - timedelta(days=days)
    stats = {}
    stats['registrations'] = User.query.filter(User.created_at >= since).count()
    kyc_submitted = KycDocument.query.filter(KycDocument.created_at >= since).count()
    kyc_approved = KycDocument.query.filter(KycDocument.created_at >= since, KycDocument.status == 'approved').count()
    stats['kyc_submitted'] = kyc_submitted
    stats['kyc_approved'] = kyc_approved
    stats['profile_unlocks'] = MarketplaceUnlock.query.filter(MarketplaceUnlock.created_at >= since).count()
    stats['favorites_added'] = Favorite.query.filter(Favorite.created_at >= since).count()
    return jsonify(stats), 200

# User management functions
@jwt_required()
def get_all_users():
    users = User.query.all()
    return jsonify({'users': [{
        'id': u.id,
        'email': u.email,
        'username': u.username,
        'role': u.role,
        'is_verified': u.is_verified,
        'is_active': u.is_active,
        'created_at': u.created_at.isoformat() if u.created_at else None
    } for u in users]}), 200

@jwt_required()
def get_user_by_id(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    return jsonify({
        'id': user.id,
        'email': user.email,
        'username': user.username,
        'role': user.role,
        'is_verified': user.is_verified,
        'is_active': user.is_active,
        'created_at': user.created_at.isoformat() if user.created_at else None
    }), 200

@jwt_required()
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    data = request.get_json()
    if 'is_active' in data:
        user.is_active = data['is_active']
    if 'is_verified' in data:
        user.is_verified = data['is_verified']
    if 'role' in data:
        user.role = data['role']
    db.session.commit()
    return jsonify({"msg": "User updated successfully", "user": {
        'id': user.id,
        'email': user.email,
        'role': user.role,
        'is_verified': user.is_verified,
        'is_active': user.is_active
    }}), 200

@jwt_required()
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"msg": "User deleted successfully"}), 200

# Agency management functions
@jwt_required()
def get_all_agencies():
    agencies = Agency.query.all()
    return jsonify([{
        'id': a.id,
        'name': a.name,
        'email': a.email,
        'status': a.status,
        'created_at': a.created_at.isoformat() if a.created_at else None
    } for a in agencies]), 200

@jwt_required()
def get_agency_by_id(agency_id):
    agency = Agency.query.get(agency_id)
    if not agency:
        return jsonify({"msg": "Agency not found"}), 404
    return jsonify({
        'id': agency.id,
        'name': agency.name,
        'email': agency.email,
        'status': agency.status,
        'owner_id': agency.owner_id,
        'created_at': agency.created_at.isoformat() if agency.created_at else None
    }), 200

@jwt_required()
def update_agency(agency_id):
    agency = Agency.query.get(agency_id)
    if not agency:
        return jsonify({"msg": "Agency not found"}), 404
    data = request.get_json()
    if 'status' in data:
        agency.status = data['status']
    if 'name' in data:
        agency.name = data['name']
    db.session.commit()
    return jsonify({"msg": "Agency updated successfully", "agency": {
        'id': agency.id,
        'name': agency.name,
        'status': agency.status
    }}), 200

@jwt_required()
def delete_agency(agency_id):
    agency = Agency.query.get(agency_id)
    if not agency:
        return jsonify({"msg": "Agency not found"}), 404
    db.session.delete(agency)
    db.session.commit()
    return jsonify({"msg": "Agency deleted successfully"}), 200

@jwt_required()
def get_financial_data():
    days = request.args.get('days', 30, type=int)
    since = datetime.utcnow() - timedelta(days=days)
    escrow_held = db.session.query(db.func.sum(EscrowTransaction.amount)).filter(EscrowTransaction.status == 'held', EscrowTransaction.created_at >= since).scalar() or 0
    escrow_released = db.session.query(db.func.sum(EscrowTransaction.amount)).filter(EscrowTransaction.status == 'released', EscrowTransaction.created_at >= since).scalar() or 0
    commission_earned = db.session.query(db.func.sum(EscrowTransaction.amount * 0.05)).filter(EscrowTransaction.status.in_(['released', 'completed']), EscrowTransaction.created_at >= since).scalar() or 0
    referral_payouts = db.session.query(db.func.sum(WalletTransaction.amount)).filter(WalletTransaction.type == 'referral_bonus', WalletTransaction.status == 'completed', WalletTransaction.created_at >= since).scalar() or 0
    total_transactions = EscrowTransaction.query.filter(EscrowTransaction.created_at >= since).count()
    return jsonify({
        'escrow_held': float(escrow_held),
        'escrow_released': float(escrow_released),
        'commission_earned': float(commission_earned),
        'referral_payouts': float(referral_payouts),
        'total_transactions': total_transactions,
        'period_days': days
    }), 200

@jwt_required()
def get_contracts():
    contracts = Contract.query.all()
    return jsonify([{
        'id': c.id,
        'title': c.title,
        'type': c.content[:20] if c.content else 'unknown',
        'version': '1.0',
        'status': c.status,
        'created_at': c.created_at.isoformat() if c.created_at else None,
        'last_updated': c.created_at.isoformat() if c.created_at else None
    } for c in contracts]), 200

@jwt_required()
def get_disputes():
    disputes = Dispute.query.all()
    return jsonify([{
        'id': d.id,
        'title': d.reason[:50] if d.reason else 'Dispute',
        'status': d.status,
        'priority': 'medium',
        'created_at': d.created_at.isoformat() if d.created_at else None,
        'updated_at': d.created_at.isoformat() if d.created_at else None,
        'involved_parties': [d.user_id, d.profile_id] if d.profile_id else [d.user_id]
    } for d in disputes]), 200

@jwt_required()
def resolve_dispute(dispute_id):
    dispute = Dispute.query.get(dispute_id)
    if not dispute:
        return jsonify({"msg": "Dispute not found"}), 404
    data = request.get_json()
    dispute.status = data.get('status', 'resolved')
    db.session.commit()
    return jsonify({"id": dispute.id, "status": dispute.status, "msg": "Dispute resolved successfully"}), 200

@jwt_required()
def get_contract_templates():
    templates = ContractTemplate.query.all()
    return jsonify([{
        'id': t.id,
        'name': t.name,
        'body': t.body,
        'variables': t.variables,
        'created_at': t.created_at.isoformat()
    } for t in templates]), 200

@jwt_required()
def add_contract_template():
    data = request.get_json()
    if not data.get('name') or not data.get('body'):
        return jsonify({"msg": "Missing name or body"}), 400
    new_template = ContractTemplate(name=data['name'], body=data['body'], variables=data.get('variables', []))
    db.session.add(new_template)
    db.session.commit()
    return jsonify({'id': new_template.id, 'name': new_template.name, 'created_at': new_template.created_at.isoformat()}), 201