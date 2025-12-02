"""
Author: Aubin Mugisha
Date: December 1, 2025

Tests for JWT authentication functionality including token generation,
validation, protected routes, and token refresh.
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
    client.post('/auth/register', json={
        'email': 'jwt_test@example.com',
        'password': 'TestPassword123'
    })
    
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
    client.post('/auth/register', json={
        'email': 'protected_test@example.com',
        'password': 'TestPassword123'
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
    client.post('/auth/register', json={
        'email': 'refresh_test@example.com',
        'password': 'TestPassword123'
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
