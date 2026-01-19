import os
from datetime import timedelta

class Config:
    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///sdc_dev.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'your-very-secret-key-change-me'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # Security
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'fallback-secret-key-for-dev'
    
    # Application settings
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    TESTING = False