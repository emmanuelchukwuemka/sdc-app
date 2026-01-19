from flask import Blueprint
from .auth_controller import register, login, get_current_user
from .user_controller import get_users, get_user
from .kyc_controller import get_kyc_status, get_kyc_documents, submit_kyc_document
from .marketplace_controller import get_unlocks, unlock_profile, get_commission_settings
from .agency_controller import get_agencies, get_agency
from .favorite_controller import get_favorites, add_favorite, remove_favorite
from .badge_controller import get_badges
from .admin_controller import get_reports, get_financial_data, get_contracts, get_disputes
from .wallet_controller import get_transactions, get_balance
from .notification_controller import get_notifications, mark_as_read
from .messages_controller import get_messages, send_message, initialize_mock_messages
from .upload_controller import upload_file, serve_file

# Auth Blueprint
auth_bp = Blueprint('auth', __name__)
auth_bp.add_url_rule('/register', view_func=register, methods=['POST'])
auth_bp.add_url_rule('/login', view_func=login, methods=['POST'])
auth_bp.add_url_rule('/me', view_func=get_current_user, methods=['GET'])

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
marketplace_bp.add_url_rule('/unlocks', view_func=get_unlocks, methods=['GET'])
marketplace_bp.add_url_rule('/unlock', view_func=unlock_profile, methods=['POST'])
marketplace_bp.add_url_rule('/commission-settings', view_func=get_commission_settings, methods=['GET'])

# Agency Blueprint
agency_bp = Blueprint('agencies', __name__)
agency_bp.add_url_rule('', view_func=get_agencies, methods=['GET'])
agency_bp.add_url_rule('/<agency_id>', view_func=get_agency, methods=['GET'])

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
admin_bp.add_url_rule('/reports', view_func=get_reports, methods=['GET'])
admin_bp.add_url_rule('/finance', view_func=get_financial_data, methods=['GET'])
admin_bp.add_url_rule('/contracts', view_func=get_contracts, methods=['GET'])
admin_bp.add_url_rule('/disputes', view_func=get_disputes, methods=['GET'])

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