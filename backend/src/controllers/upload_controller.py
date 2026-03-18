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
        
        # Get path or conversation_id from form data or query params
        path = request.form.get('path') or request.args.get('path')
        conversation_id = request.form.get('conversation_id') or request.args.get('conversation_id')
        
        # Use path if provided, otherwise fallback to conversation_id
        if path:
            target_subfolder = path
        elif conversation_id:
            target_subfolder = os.path.join('conversations', conversation_id)
        else:
            target_subfolder = 'general'
        
        # Create upload directory if it doesn't exist
        upload_path = os.path.normpath(os.path.join(current_app.root_path, '..', UPLOAD_FOLDER, target_subfolder))
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
        # Convert path separators to forward slashes for the URL
        url_subfolder = target_subfolder.replace(os.sep, '/')
        file_url = f"/uploads/{url_subfolder}/{unique_filename}"
        
        # Return file info
        return jsonify({
            'url': file_url,
            'filename': filename,
            'size': os.path.getsize(file_path),
            'uploaded_at': datetime.now().isoformat()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@upload_bp.route('/uploads/<path:filename>')
def serve_file(filename):
    """Serve uploaded files using a recursive path"""
    try:
        from flask import send_from_directory
        directory = os.path.normpath(os.path.join(current_app.root_path, '..', UPLOAD_FOLDER))
        return send_from_directory(directory, filename)
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404