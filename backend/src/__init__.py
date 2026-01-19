from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .models import db
from .config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    CORS(app)
    db.init_app(app)
    jwt = JWTManager(app)
    
    # Register blueprints/routes
    from .controllers import auth_bp, user_bp, kyc_bp, marketplace_bp, agency_bp, favorites_bp, badge_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(kyc_bp, url_prefix='/api/kyc')
    app.register_blueprint(marketplace_bp, url_prefix='/api/marketplace')
    app.register_blueprint(agency_bp, url_prefix='/api/agencies')
    app.register_blueprint(favorites_bp, url_prefix='/api/favorites')
    app.register_blueprint(badge_bp, url_prefix='/api/verification-badges')
    
    # Health check route
    @app.route('/', methods=['GET'])
    def health_check():
        return jsonify({"message": "SDC Flask Backend is running!", "status": "healthy"}), 200
    
    return app