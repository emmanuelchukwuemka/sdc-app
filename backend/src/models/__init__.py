from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import TypeDecorator, String
import uuid
from datetime import datetime
import json

class JSONType(TypeDecorator):
    """Platform-independent JSON type.
    Uses JSONB for PostgreSQL, String for SQLite.
    """
    impl = String
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(JSONB)
        else:
            return dialect.type_descriptor(String)

    def process_bind_param(self, value, dialect):
        if value is not None:
            if dialect.name == 'postgresql':
                return value
            else:
                return json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            if dialect.name == 'postgresql':
                return value
            else:
                return json.loads(value)
        return value

db = SQLAlchemy()

class Agency(db.Model):
    __tablename__ = 'agencies'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = db.Column(db.String(36)) # Can link to a User.id
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255))
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class KycDocument(db.Model):
    __tablename__ = 'kyc_documents'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), index=True, nullable=False, unique=True)
    role = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), default='in_progress')
    form_data = db.Column(JSONType, default={})
    form_progress = db.Column(db.Integer, default=0)
    agency_id = db.Column(db.String(36), db.ForeignKey('agencies.id'))
    file_url = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class User(db.Model):
    __tablename__ = 'users'
    __table_args__ = (
        db.UniqueConstraint('email', 'role', name='uq_user_email_role'),
        db.UniqueConstraint('username', 'role', name='uq_user_username_role'),
    )
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    role = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    username = db.Column(db.String(255), nullable=False)
    password_hash = db.Column(db.String(255))
    first_name = db.Column(db.String(255))
    last_name = db.Column(db.String(255))
    is_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def get_reset_token(self):
        # Simple token based on user id (in production, use proper JWT or secure token)
        import base64
        return base64.b64encode(f"reset_{self.id}_{self.email}".encode()).decode()
    
    @staticmethod
    def verify_reset_token(token):
        try:
            import base64
            data = base64.b64decode(token.encode()).decode()
            if data.startswith('reset_'):
                parts = data.split('_', 2)
                return parts[1]  # Return user id
        except:
            return None
    
    def get_verification_token(self):
        import base64
        return base64.b64encode(f"verify_{self.id}_{self.email}".encode()).decode()
    
    @staticmethod
    def verify_verification_token(token):
        try:
            import base64
            data = base64.b64decode(token.encode()).decode()
            if data.startswith('verify_'):
                parts = data.split('_', 2)
                return parts[1]
        except:
            return None

# Role model for user roles
class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(255))

# Donor related models
class Donor(db.Model):
    __tablename__ = 'donors'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), unique=True, nullable=False)
    agency_id = db.Column(db.String(36), db.ForeignKey('agencies.id'))
    status = db.Column(db.String(50), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class DonorProfile(db.Model):
    __tablename__ = 'donor_profiles'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    donor_id = db.Column(db.String(36), unique=True, nullable=False)
    bio = db.Column(db.Text)
    date_of_birth = db.Column(db.Date)
    location = db.Column(db.String(255))
    occupation = db.Column(db.String(255))
    education = db.Column(db.String(255))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

class DonorKyc(db.Model):
    __tablename__ = 'donor_kyc'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    donor_id = db.Column(db.String(36), unique=True, nullable=False)
    status = db.Column(db.String(50), default='pending')
    document_type = db.Column(db.String(50))
    document_number = db.Column(db.String(100))
    verified_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class DonorAppointment(db.Model):
    __tablename__ = 'donor_appointments'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    donor_id = db.Column(db.String(36), nullable=False)
    surrogate_id = db.Column(db.String(36))
    appointment_date = db.Column(db.DateTime)
    status = db.Column(db.String(50), default='scheduled')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Surrogate related models
class Surrogate(db.Model):
    __tablename__ = 'surrogates'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), unique=True, nullable=False)
    agency_id = db.Column(db.String(36), db.ForeignKey('agencies.id'))
    status = db.Column(db.String(50), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class SurrogateProfile(db.Model):
    __tablename__ = 'surrogate_profiles'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    surrogate_id = db.Column(db.String(36), unique=True, nullable=False)
    bio = db.Column(db.Text)
    date_of_birth = db.Column(db.Date)
    location = db.Column(db.String(255))
    occupation = db.Column(db.String(255))
    pregnancy_history = db.Column(db.Text)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

class SurrogateKyc(db.Model):
    __tablename__ = 'surrogate_kyc'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    surrogate_id = db.Column(db.String(36), unique=True, nullable=False)
    status = db.Column(db.String(50), default='pending')
    document_type = db.Column(db.String(50))
    document_number = db.Column(db.String(100))
    verified_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Intending Parent related models
class IntendingParent(db.Model):
    __tablename__ = 'intending_parents'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), unique=True, nullable=False)
    agency_id = db.Column(db.String(36), db.ForeignKey('agencies.id'))
    status = db.Column(db.String(50), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36))
    plan = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Numeric(10, 2), default=0)
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)

class EscrowTransaction(db.Model):
    __tablename__ = 'escrow_transactions'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36))
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(10), default='NGN')
    type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), default='held')
    reference = db.Column(db.String(255), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Dispute(db.Model):
    __tablename__ = 'disputes'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36))
    profile_id = db.Column(db.String(36))
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='open')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Report(db.Model):
    __tablename__ = 'reports'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reporter_id = db.Column(db.String(36))
    target_id = db.Column(db.String(36))
    reason = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Contract(db.Model):
    __tablename__ = 'contracts'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    creator_id = db.Column(db.String(36))
    signer_id = db.Column(db.String(36))
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='pending')
    signed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class MarketplaceUnlock(db.Model):
    __tablename__ = 'marketplace_unlocks'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    listing_id = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Favorite(db.Model):
    __tablename__ = 'favorites'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ip_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    target_user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class VerificationBadge(db.Model):
    __tablename__ = 'verification_badges'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class CommissionSetting(db.Model):
    __tablename__ = 'commission_settings'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    category = db.Column(db.String(50), nullable=False, unique=True)
    percent = db.Column(db.Numeric(5, 2), nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = db.Column(db.String(36), nullable=False)
    sender_user_id = db.Column(db.String(36), nullable=False)
    content = db.Column(db.Text)
    attachment_url = db.Column(db.Text)
    attachment_type = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class WalletTransaction(db.Model):
    __tablename__ = 'wallet_transactions'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(10), default='NGN')
    type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), default='pending')
    reference = db.Column(db.String(255), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    body = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(20), default='info')  # info, warning, error
    status = db.Column(db.String(20), default='unread')  # unread, read
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ContractTemplate(db.Model):
    __tablename__ = 'contract_templates'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    body = db.Column(db.Text, nullable=False)
    variables = db.Column(JSONType, default=[])
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
