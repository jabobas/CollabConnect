
# -- Authentication routes for user registration, login, email verification,
# -- password reset, and token refresh. Uses JWT for secure authentication.

from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from utils.jwt_utils import generate_access_token, token_required
from utils.logger import log_info, log_error

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    """Register new user account with email and password"""
    from app import mysql
    
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    log_info(f"Registration attempt for email: {email}")
    
    if not email or not password:
        log_error("Registration failed: Missing email or password")
        return jsonify({'status': 'error', 'message': 'Email and password required'}), 400
    
    try:
        # Hash password for security - never store plain text passwords
        password_hash = generate_password_hash(password)
        
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.callproc('InsertUser', [email, password_hash])
        result = cursor.fetchone()
        user_id = result['user_id'] if result else None
        
        while cursor.nextset():
            pass
        
        mysql.connection.commit()
        cursor.close()
        
        log_info(f"User registered successfully: user_id={user_id}, email={email}")
        return jsonify({
            'status': 'success',
            'message': 'Registration successful',
            'data': {'user_id': user_id}
        }), 201
    except Exception as e:
        mysql.connection.rollback()
        # Handle duplicate email error
        if 'Duplicate entry' in str(e):
            log_error(f"Registration failed: Email already registered - {email}")
            return jsonify({'status': 'error', 'message': 'Email already registered'}), 409
        log_error(f"Registration failed: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token"""
    from app import mysql
    
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    log_info(f"Login attempt for email: {email}")
    
    if not email or not password:
        log_error("Login failed: Missing email or password")
        return jsonify({'status': 'error', 'message': 'Email and password required'}), 400
    
    # Find user by email and update last login in single transaction
    cursor = mysql.connection.cursor()
    cursor.execute("START TRANSACTION")
    cursor.callproc('SelectUserByEmail', [email])
    user = cursor.fetchone()
    
    while cursor.nextset():
        pass
    
    # Verify user exists and password matches
    if not user or not check_password_hash(user['password_hash'], password):
        mysql.connection.rollback()
        cursor.close()
        return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401
    
    # Update last login timestamp
    cursor.callproc('UpdateUserLastLogin', [user['user_id']])
    while cursor.nextset():
        pass
    mysql.connection.commit()
    cursor.close()
    
    # Generate JWT token for authentication - this is what the frontend will use
    access_token = generate_access_token(user['user_id'], user['email'])
    
    log_info(f"Login successful: user_id={user['user_id']}, email={email}")
    return jsonify({
        'status': 'success',
        'data': {
            'user_id': user['user_id'],
            'person_id': user['person_id'],
            'email': user['email'],
            'access_token': access_token
        }
    }), 200

@auth_bp.route('/auth/me', methods=['GET'])
@token_required
def get_current_user():
    from app import mysql
    
    user_id = request.current_user['user_id']
    log_info(f"[User: {user_id}] Fetching current user profile")
    
    cursor = mysql.connection.cursor()
    cursor.callproc('SelectUserById', [user_id])
    user = cursor.fetchone()
    
    while cursor.nextset():
        pass
    cursor.close()
    
    if not user:
        log_error(f"User not found: user_id={user_id}")
        return jsonify({'status': 'error', 'message': 'User not found'}), 404
    
    log_info(f"Current user fetched: user_id={user_id}")
    return jsonify({
        'status': 'success',
        'data': {
            'user_id': user['user_id'],
            'person_id': user['person_id'],
            'email': user['email'],
            'created_at': str(user['created_at']),
            'last_login': str(user['last_login']) if user['last_login'] else None,
            'person_name': user.get('person_name'),
            'person_email': user.get('person_email'),
            'person_phone': user.get('person_phone'),
            'bio': user.get('bio')
        }
    }), 200

@auth_bp.route('/auth/refresh', methods=['POST'])
@token_required
def refresh_token():
    user_id = request.current_user['user_id']
    email = request.current_user['email']
    
    log_info(f"[User: {user_id}] Refreshing authentication token")
    new_token = generate_access_token(user_id, email)
    
    return jsonify({
        'status': 'success',
        'data': {'access_token': new_token}
    }), 200
