from flask import Blueprint
from .auth_controller import (
    register, login, get_current_user, reset_password, update_password,
    logout, refresh, forgot_password, reset_password_with_token,
    verify_email, get_profile, update_profile, delete_account, change_password
)
from .user_controller import get_users, get_user
from .kyc_controller import get_kyc_status, get_kyc_documents, submit_kyc_document
from .marketplace_controller import get_unlocks, unlock_profile, get_commission_settings, update_commission_settings, get_surrogates, get_surrogate_by_id
from .agency_controller import get_agencies, get_agency, get_agency_roster, get_agency_subscription, get_agency_wallet
from .favorite_controller import get_favorites, add_favorite, remove_favorite
from .badge_controller import get_badges
from .admin_controller import (
    get_reports, get_financial_data, get_contracts, get_disputes, 
    get_contract_templates, add_contract_template, resolve_dispute,
    get_all_users, get_user_by_id, update_user, delete_user,
    get_all_agencies, get_agency_by_id, update_agency, delete_agency
)
from .wallet_controller import get_transactions, get_balance
from .notification_controller import get_notifications, mark_as_read
from .messages_controller import get_messages, send_message, initialize_mock_messages
from .upload_controller import upload_file, serve_file

# Auth Blueprint
auth_bp = Blueprint('auth', __name__)
auth_bp.add_url_rule('/register', view_func=register, methods=['POST'])
auth_bp.add_url_rule('/login', view_func=login, methods=['POST'])
auth_bp.add_url_rule('/logout', view_func=logout, methods=['POST'])
auth_bp.add_url_rule('/refresh', view_func=refresh, methods=['POST'])
auth_bp.add_url_rule('/me', view_func=get_current_user, methods=['GET'])
auth_bp.add_url_rule('/profile', view_func=get_profile, methods=['GET'])
auth_bp.add_url_rule('/profile', view_func=update_profile, methods=['PUT'])
auth_bp.add_url_rule('/profile', view_func=delete_account, methods=['DELETE'])
auth_bp.add_url_rule('/change-password', view_func=change_password, methods=['POST'])
auth_bp.add_url_rule('/forgot-password', view_func=forgot_password, methods=['POST'])
auth_bp.add_url_rule('/reset-password', view_func=reset_password, methods=['POST', 'PUT'])
auth_bp.add_url_rule('/update-password', view_func=update_password, methods=['POST'])
auth_bp.add_url_rule('/verify-email', view_func=verify_email, methods=['GET'])
auth_bp.add_url_rule('/verify-email/<token>', view_func=verify_email, methods=['GET'])

# User Blueprint
user_bp = Blueprint('users', __name__)
user_bp.add_url_rule('', view_func=get_users, methods=['GET'])
user_bp.add_url_rule('/<user_id>', view_func=get_user, methods=['GET'])

# KYC Blueprint
kyc_bp = Blueprint('kyc', __name__)
kyc_bp.add_url_rule('/status', view_func=get_kyc_status, methods=['GET'])
kyc_bp.add_url_rule('/documents', view_func=get_kyc_documents, methods=['GET'])
kyc_bp.add_url_rule('/documents', view_func=submit_kyc_document, methods=['POST'])

# Marketplace Blueprint
marketplace_bp = Blueprint('marketplace', __name__)
marketplace_bp.add_url_rule('/surrogates', view_func=get_surrogates, methods=['GET'])
marketplace_bp.add_url_rule('/surrogates/<surrogate_id>', view_func=get_surrogate_by_id, methods=['GET'])
marketplace_bp.add_url_rule('/unlocks', view_func=get_unlocks, methods=['GET'])
marketplace_bp.add_url_rule('/unlock', view_func=unlock_profile, methods=['POST'])
marketplace_bp.add_url_rule('/commission-settings', view_func=get_commission_settings, methods=['GET'])
marketplace_bp.add_url_rule('/commission-settings', view_func=update_commission_settings, methods=['POST'])

# Agency Blueprint
agency_bp = Blueprint('agencies', __name__)
agency_bp.add_url_rule('', view_func=get_agencies, methods=['GET'])
agency_bp.add_url_rule('/<agency_id>', view_func=get_agency, methods=['GET'])
agency_bp.add_url_rule('/<agency_id>/roster', view_func=get_agency_roster, methods=['GET'])
agency_bp.add_url_rule('/<agency_id>/subscription', view_func=get_agency_subscription, methods=['GET'])
agency_bp.add_url_rule('/<agency_id>/wallet', view_func=get_agency_wallet, methods=['GET'])

# Favorite Blueprint
favorites_bp = Blueprint('favorites', __name__)
favorites_bp.add_url_rule('', view_func=get_favorites, methods=['GET'])
favorites_bp.add_url_rule('', view_func=add_favorite, methods=['POST'])
favorites_bp.add_url_rule('', view_func=remove_favorite, methods=['DELETE'])

# Badge Blueprint
badge_bp = Blueprint('badges', __name__)
badge_bp.add_url_rule('', view_func=get_badges, methods=['GET'])

# Admin Blueprint
admin_bp = Blueprint('admin', __name__)
admin_bp.add_url_rule('/users', view_func=get_all_users, methods=['GET'])
admin_bp.add_url_rule('/users/<user_id>', view_func=get_user_by_id, methods=['GET'])
admin_bp.add_url_rule('/users/<user_id>', view_func=update_user, methods=['PUT'])
admin_bp.add_url_rule('/users/<user_id>', view_func=delete_user, methods=['DELETE'])
admin_bp.add_url_rule('/agencies', view_func=get_all_agencies, methods=['GET'])
admin_bp.add_url_rule('/agencies/<agency_id>', view_func=get_agency_by_id, methods=['GET'])
admin_bp.add_url_rule('/agencies/<agency_id>', view_func=update_agency, methods=['PUT'])
admin_bp.add_url_rule('/agencies/<agency_id>', view_func=delete_agency, methods=['DELETE'])
admin_bp.add_url_rule('/reports', view_func=get_reports, methods=['GET'])
admin_bp.add_url_rule('/finance', view_func=get_financial_data, methods=['GET'])
admin_bp.add_url_rule('/contracts', view_func=get_contracts, methods=['GET'])
admin_bp.add_url_rule('/disputes', view_func=get_disputes, methods=['GET'])
admin_bp.add_url_rule('/contract-templates', view_func=get_contract_templates, methods=['GET'])
admin_bp.add_url_rule('/contract-templates', view_func=add_contract_template, methods=['POST'])
admin_bp.add_url_rule('/disputes/<dispute_id>/resolve', view_func=resolve_dispute, methods=['POST'])

# Wallet Blueprint
wallet_bp = Blueprint('wallet', __name__)
wallet_bp.add_url_rule('/transactions', view_func=get_transactions, methods=['GET'])
wallet_bp.add_url_rule('/balance', view_func=get_balance, methods=['GET'])

# Notification Blueprint
notification_bp = Blueprint('notifications', __name__)
notification_bp.add_url_rule('', view_func=get_notifications, methods=['GET'])
notification_bp.add_url_rule('/<notification_id>/read', view_func=mark_as_read, methods=['PUT'])

# Messages Blueprint
messages_bp = Blueprint('messages', __name__)
messages_bp.add_url_rule('/<conversation_id>', view_func=get_messages, methods=['GET'])
messages_bp.add_url_rule('', view_func=send_message, methods=['POST'])

# Upload Blueprint
upload_bp = Blueprint('upload', __name__)
upload_bp.add_url_rule('/upload', view_func=upload_file, methods=['POST'])
upload_bp.add_url_rule('/uploads/<conversation_id>/<filename>', view_func=serve_file, methods=['GET'])