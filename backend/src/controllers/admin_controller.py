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
    # Mock financial data - in production this would query actual transaction tables
    days = request.args.get('days', 30, type=int)
    
    mock_data = {
        'escrow_held': 1500000,
        'escrow_released': 1200000,
        'commission_earned': 150000,
        'referral_payouts': 25000,
        'total_transactions': 45,
        'period_days': days
    }
    
    return jsonify(mock_data), 200

@jwt_required()
def get_contracts():
    # Mock contract templates
    mock_contracts = [
        {
            'id': '1',
            'title': 'Standard Surrogacy Agreement',
            'type': 'surrogacy',
            'version': '2.1',
            'status': 'active',
            'created_at': datetime.utcnow().isoformat(),
            'last_updated': datetime.utcnow().isoformat()
        },
        {
            'id': '2', 
            'title': 'Egg Donation Agreement',
            'type': 'donation',
            'version': '1.5',
            'status': 'active',
            'created_at': datetime.utcnow().isoformat(),
            'last_updated': datetime.utcnow().isoformat()
        }
    ]
    
    return jsonify(mock_contracts), 200

@jwt_required()
def get_disputes():
    # Mock dispute data
    mock_disputes = [
        {
            'id': '1',
            'title': 'Payment Dispute - Escrow Release',
            'status': 'open',
            'priority': 'high',
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'involved_parties': ['user-001', 'user-002']
        },
        {
            'id': '2',
            'title': 'KYC Document Rejection Appeal',
            'status': 'in_progress',
            'priority': 'medium', 
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'involved_parties': ['user-003']
        }
    ]
    
    return jsonify(mock_disputes), 200