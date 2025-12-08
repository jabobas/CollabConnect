"""
Author: Aubin Mugisha
Date: December 1, 2025

Tests for JWT authentication functionality including token generation,
validation, protected routes, token refresh, and email verification.
"""

import pytest
from app import app
from utils.jwt_utils import generate_access_token, decode_access_token

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_jwt_token_generation():
    token = generate_access_token(1, 'test@example.com')
    assert token is not None
    assert isinstance(token, str)
    assert len(token) > 50

def test_jwt_token_decode():
    token = generate_access_token(1, 'test@example.com')
    payload = decode_access_token(token)
    
    assert payload is not None
    assert payload['user_id'] == 1
    assert payload['email'] == 'test@example.com'
    assert 'exp' in payload
    assert 'iat' in payload

def test_jwt_invalid_token():
    payload = decode_access_token('invalid.token.here')
    assert payload is None

def test_login_returns_jwt_token(client):
    # Register user
    register_response = client.post('/auth/register', json={
        'email': 'jwt_test@example.com',
        'password': 'TestPassword123'
    })
    assert register_response.status_code == 201
    
    # Try to login before verification (should fail)
    response = client.post('/auth/login', json={
        'email': 'jwt_test@example.com',
        'password': 'TestPassword123'
    })
    assert response.status_code == 403  # Forbidden - not verified
    
    # Verify email (get code from database for testing)
    from app import mysql
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT verification_code FROM User WHERE email = 'jwt_test@example.com'")
    result = cursor.fetchone()
    code = result['verification_code']
    cursor.close()
    
    # Verify the email
    verify_response = client.post('/auth/verify', json={
        'email': 'jwt_test@example.com',
        'code': code
    })
    assert verify_response.status_code == 200
    
    # Now login should work
    response = client.post('/auth/login', json={
        'email': 'jwt_test@example.com',
        'password': 'TestPassword123'
    })
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'success'
    assert 'access_token' in data['data']

def test_protected_route_without_token(client):
    response = client.get('/auth/me')
    assert response.status_code == 401
    data = response.get_json()
    assert 'token' in data['message'].lower()


def test_protected_route_with_valid_token(client):
    # Register and verify
    client.post('/auth/register', json={
        'email': 'protected_test@example.com',
        'password': 'TestPassword123'
    })
    
    # Get verification code and verify
    from app import mysql
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT verification_code FROM User WHERE email = 'protected_test@example.com'")
    result = cursor.fetchone()
    code = result['verification_code']
    cursor.close()
    
    client.post('/auth/verify', json={
        'email': 'protected_test@example.com',
        'code': code
    })
    
    login_response = client.post('/auth/login', json={
        'email': 'protected_test@example.com',
        'password': 'TestPassword123'
    })
    
    token = login_response.get_json()['data']['access_token']
    response = client.get('/auth/me', headers={'Authorization': f'Bearer {token}'})
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['data']['email'] == 'protected_test@example.com'


def test_token_refresh(client):
    # Register and verify
    client.post('/auth/register', json={
        'email': 'refresh_test@example.com',
        'password': 'TestPassword123'
    })
    
    # Get verification code and verify
    from app import mysql
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT verification_code FROM User WHERE email = 'refresh_test@example.com'")
    result = cursor.fetchone()
    code = result['verification_code']
    cursor.close()
    
    client.post('/auth/verify', json={
        'email': 'refresh_test@example.com',
        'code': code
    })
    
    login_response = client.post('/auth/login', json={
        'email': 'refresh_test@example.com',
        'password': 'TestPassword123'
    })
    
    old_token = login_response.get_json()['data']['access_token']
    response = client.post('/auth/refresh', headers={'Authorization': f'Bearer {old_token}'})
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'access_token' in data['data']


def test_email_verification_flow(client):
    """Test complete email verification flow"""
    # Register user
    response = client.post('/auth/register', json={
        'email': 'verify_flow@example.com',
        'password': 'TestPassword123'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['status'] == 'success'
    assert 'verification' in data['message'].lower()
    
    # Get verification code from database
    from app import mysql
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT verification_code, is_verified FROM User WHERE email = 'verify_flow@example.com'")
    result = cursor.fetchone()
    code = result['verification_code']
    is_verified = result['is_verified']
    cursor.close()
    
    assert code is not None
    assert len(code) == 6
    assert not is_verified
    
    # Verify with correct code
    verify_response = client.post('/auth/verify', json={
        'email': 'verify_flow@example.com',
        'code': code
    })
    assert verify_response.status_code == 200
    
    # Check user is now verified
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT is_verified FROM User WHERE email = 'verify_flow@example.com'")
    result = cursor.fetchone()
    cursor.close()
    assert result['is_verified']


def test_invalid_verification_code(client):
    """Test verification with invalid code"""
    client.post('/auth/register', json={
        'email': 'invalid_code@example.com',
        'password': 'TestPassword123'
    })
    
    # Try to verify with wrong code
    response = client.post('/auth/verify', json={
        'email': 'invalid_code@example.com',
        'code': '000000'
    })
    assert response.status_code == 400
    data = response.get_json()
    assert 'invalid' in data['message'].lower() or 'expired' in data['message'].lower()


def test_resend_verification_code(client):
    """Test resending verification code"""
    client.post('/auth/register', json={
        'email': 'resend_test@example.com',
        'password': 'TestPassword123'
    })
    
    # Get original code
    from app import mysql
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT verification_code FROM User WHERE email = 'resend_test@example.com'")
    result = cursor.fetchone()
    old_code = result['verification_code']
    cursor.close()
    
    # Resend code
    response = client.post('/auth/resend-code', json={
        'email': 'resend_test@example.com'
    })
    assert response.status_code == 200
    
    # Get new code
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT verification_code FROM User WHERE email = 'resend_test@example.com'")
    result = cursor.fetchone()
    new_code = result['verification_code']
    cursor.close()
    
    # Codes should be different
    assert old_code != new_code
    assert len(new_code) == 6
