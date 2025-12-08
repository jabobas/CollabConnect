'''
Author: Aubin Mugisha & Copilot
Date: December 8, 2025
Description: Authentication routes handling user registration, login, and token management with JWT.
'''

from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from utils.jwt_utils import generate_access_token, token_required
from utils.validators import validate_email, validate_password

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    """Register new user account with email and password"""
    from app import mysql
    
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'status': 'error', 'message': 'Email and password required'}), 400
    
    if not validate_email(email):
        return jsonify({'status': 'error', 'message': 'Invalid email format'}), 400
    
    is_valid, msg = validate_password(password)
    if not is_valid:
        return jsonify({'status': 'error', 'message': msg}), 400
    
    try:
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
        
        return jsonify({
            'status': 'success',
            'message': 'Registration successful',
            'data': {'user_id': user_id}
        }), 201
    except Exception as e:
        mysql.connection.rollback()
        if 'Duplicate entry' in str(e):
            return jsonify({'status': 'error', 'message': 'Email already registered'}), 409
        return jsonify({'status': 'error', 'message': str(e)}), 500

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token"""
    from app import mysql
    
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'status': 'error', 'message': 'Email and password required'}), 400
    
    cursor = mysql.connection.cursor()
    cursor.execute("START TRANSACTION")
    cursor.callproc('SelectUserByEmail', [email])
    user = cursor.fetchone()
    
    while cursor.nextset():
        pass
    
    if not user or not check_password_hash(user['password_hash'], password):
        mysql.connection.rollback()
        cursor.close()
        return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401
    
    cursor.callproc('UpdateUserLastLogin', [user['user_id']])
    while cursor.nextset():
        pass
    mysql.connection.commit()
    cursor.close()
    
    access_token = generate_access_token(user['user_id'], user['email'], user.get('person_id'))
    
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
    cursor = mysql.connection.cursor()
    cursor.callproc('SelectUserById', [user_id])
    user = cursor.fetchone()
    
    while cursor.nextset():
        pass
    cursor.close()
    
    if not user:
        return jsonify({'status': 'error', 'message': 'User not found'}), 404
    
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
    new_token = generate_access_token(user_id, email)
    
    return jsonify({
        'status': 'success',
        'data': {'access_token': new_token}
    }), 200
