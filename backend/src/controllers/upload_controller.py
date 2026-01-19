# backend/src/controllers/upload_controller.py
import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from datetime import datetime

upload_bp = Blueprint('upload', __name__)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'txt', 'mp4', 'mov'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    """Upload a file and return its URL"""
    try:
        # Check if file is present in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
            
        file = request.files['file']
        
        # Check if file was selected
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
            
        # Validate file type
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Get conversation_id from form data or query params
        conversation_id = request.form.get('conversation_id') or request.args.get('conversation_id')
        if not conversation_id:
            return jsonify({'error': 'conversation_id is required'}), 400
        
        # Create upload directory if it doesn't exist
        upload_path = os.path.join(current_app.root_path, '..', UPLOAD_FOLDER, conversation_id)
        os.makedirs(upload_path, exist_ok=True)
        
        # Generate secure filename
        filename = secure_filename(file.filename)
        # Add timestamp to avoid conflicts
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{uuid.uuid4().hex[:8]}_{filename}"
        
        # Save file
        file_path = os.path.join(upload_path, unique_filename)
        file.save(file_path)
        
        # Generate URL (in production, use CDN or cloud storage)
        file_url = f"/uploads/{conversation_id}/{unique_filename}"
        
        # Return file info
        return jsonify({
            'url': file_url,
            'filename': filename,
            'size': os.path.getsize(file_path),
            'uploaded_at': datetime.now().isoformat()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@upload_bp.route('/uploads/<conversation_id>/<filename>')
def serve_file(conversation_id, filename):
    """Serve uploaded files"""
    try:
        from flask import send_from_directory
        directory = os.path.join(current_app.root_path, '..', UPLOAD_FOLDER, conversation_id)
        return send_from_directory(directory, filename)
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404