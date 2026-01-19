# SDC Mobile Backend API

Professional Flask backend for the SDC Mobile application.

## Project Structure

```
backend/
├── src/                    # Source code
│   ├── __init__.py        # Application factory
│   ├── config.py          # Configuration settings
│   ├── controllers/       # API route handlers
│   │   ├── __init__.py    # Blueprint registration
│   │   ├── auth_controller.py
│   │   ├── user_controller.py
│   │   └── ...            # Other controllers
│   ├── models/            # Database models
│   │   └── __init__.py    # Model definitions
│   ├── schemas/           # Validation schemas
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
├── run.py                 # Application entry point
├── requirements.txt       # Python dependencies
└── .env                   # Environment variables
```

## Setup Instructions

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables:**
   Copy `.env.example` to `.env` and configure your settings

4. **Initialize database:**
   ```bash
   python init_db.py
   ```

5. **Run the application:**
   ```bash
   python run.py
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Users
- `GET /api/users` - List all users
- `GET /api/users/<id>` - Get user by ID

### KYC
- `GET /api/kyc/status` - Get KYC status
- `GET /api/kyc/documents` - Get KYC documents
- `POST /api/kyc/documents` - Submit/update KYC document

### Marketplace
- `GET /api/marketplace/unlocks` - Get unlocked profiles
- `POST /api/marketplace/unlock` - Unlock a profile
- `GET /api/marketplace/commission-settings` - Get commission rates

## Development Guidelines

- Follow REST API conventions
- Use proper HTTP status codes
- Implement proper error handling
- Write comprehensive tests
- Document all API endpoints