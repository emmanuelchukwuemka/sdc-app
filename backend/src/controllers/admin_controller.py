from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from ..models import db, User, KycDocument, MarketplaceUnlock, Favorite

@jwt_required()
def get_reports():
    # Get date range filter
    days = request.args.get('days', 30, type=int)
    since = datetime.utcnow() - timedelta(days=days)
    
    # Get various statistics
    stats = {}
    
    # User registrations
    user_count = User.query.filter(User.created_at >= since).count()
    stats['registrations'] = user_count
    
    # KYC submissions
    kyc_submitted = KycDocument.query.filter(KycDocument.created_at >= since).count()
    kyc_approved = KycDocument.query.filter(
        KycDocument.created_at >= since,
        KycDocument.status == 'approved'
    ).count()
    stats['kyc_submitted'] = kyc_submitted
    stats['kyc_approved'] = kyc_approved
    
    # Marketplace activity
    unlocks = MarketplaceUnlock.query.filter(MarketplaceUnlock.created_at >= since).count()
    stats['profile_unlocks'] = unlocks
    
    # Favorites
    favorites = Favorite.query.filter(Favorite.created_at >= since).count()
    stats['favorites_added'] = favorites
    
    return jsonify(stats), 200

@jwt_required()
def get_financial_data():
    # Query actual financial data from the database
    days = request.args.get('days', 30, type=int)
    since = datetime.utcnow() - timedelta(days=days)
    
    # Calculate escrow held (transactions with status 'held')
    escrow_held = db.session.query(db.func.sum(EscrowTransaction.amount)).filter(
        EscrowTransaction.status == 'held',
        EscrowTransaction.created_at >= since
    ).scalar() or 0
    
    # Calculate escrow released (transactions with status 'released')
    escrow_released = db.session.query(db.func.sum(EscrowTransaction.amount)).filter(
        EscrowTransaction.status == 'released',
        EscrowTransaction.created_at >= since
    ).scalar() or 0
    
    # Calculate commission earned (based on commission settings and transactions)
    commission_earned = db.session.query(db.func.sum(EscrowTransaction.amount * 0.05)).filter(
        EscrowTransaction.status.in_(['released', 'completed']),
        EscrowTransaction.created_at >= since
    ).scalar() or 0
    
    # Calculate referral payouts (from wallet transactions)
    referral_payouts = db.session.query(db.func.sum(WalletTransaction.amount)).filter(
        WalletTransaction.type == 'referral_bonus',
        WalletTransaction.status == 'completed',
        WalletTransaction.created_at >= since
    ).scalar() or 0
    
    # Total transactions count
    total_transactions = EscrowTransaction.query.filter(
        EscrowTransaction.created_at >= since
    ).count()
    
    financial_data = {
        'escrow_held': float(escrow_held),
        'escrow_released': float(escrow_released),
        'commission_earned': float(commission_earned),
        'referral_payouts': float(referral_payouts),
        'total_transactions': total_transactions,
        'period_days': days
    }
    
    return jsonify(financial_data), 200

@jwt_required()
def get_contracts():
    # Query actual contracts from the database
    contracts = Contract.query.all()
    
    contracts_list = []
    for contract in contracts:
        contracts_list.append({
            'id': contract.id,
            'title': contract.title,
            'type': contract.content[:20] if contract.content else 'unknown',  # Simplified type from content
            'version': '1.0',  # Default version
            'status': contract.status,
            'created_at': contract.created_at.isoformat() if contract.created_at else None,
            'last_updated': contract.created_at.isoformat() if contract.created_at else None
        })
    
    return jsonify(contracts_list), 200

@jwt_required()
def get_disputes():
    # Query actual disputes from the database
    disputes = Dispute.query.all()
    
    disputes_list = []
    for dispute in disputes:
        # Get involved parties (simplified - just user_id and profile_id)
        involved_parties = [dispute.user_id]
        if dispute.profile_id:
            involved_parties.append(dispute.profile_id)
        
        disputes_list.append({
            'id': dispute.id,
            'title': dispute.reason[:50] if dispute.reason else 'Dispute',  # Use reason as title if available
            'status': dispute.status,
            'priority': 'medium',  # Default priority
            'created_at': dispute.created_at.isoformat() if dispute.created_at else None,
            'updated_at': dispute.created_at.isoformat() if dispute.created_at else None,
            'involved_parties': involved_parties
        })
    
    return jsonify(disputes_list), 200