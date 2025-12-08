"""
Test file for user authentication and profile management

Author: Aubin Mugisha
Date: December 1, 2025
"""

import pytest
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app


@pytest.fixture
def client():
    """Create a test client for the Flask app"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_register_user(client):
    """Test user registration"""
    response = client.post('/auth/register', json={
        'email': 'test@example.com',
        'password': 'TestPassword123'
    })
    
    # Print error details if test fails
    if response.status_code != 201:
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.get_json()}")
    
    assert response.status_code == 201
    data = response.get_json()
    assert data['status'] == 'success'
    assert 'user_id' in data['data']


def test_register_missing_fields(client):
    """Test registration with missing fields"""
    response = client.post('/auth/register', json={
        'email': 'test@example.com'
    })
    
    assert response.status_code == 400
    data = response.get_json()
    assert data['status'] == 'error'


def test_login_user(client):
    """Test user login"""
    # First register
    client.post('/auth/register', json={
        'email': 'login@example.com',
        'password': 'TestPassword123'
    })
    
    # Then login
    response = client.post('/auth/login', json={
        'email': 'login@example.com',
        'password': 'TestPassword123'
    })
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'success'
    assert 'user_id' in data['data']


def test_login_invalid_password(client):
    """Test login with wrong password"""
    # Register user
    client.post('/auth/register', json={
        'email': 'test2@example.com',
        'password': 'CorrectPassword123'
    })
    
    # Try to login with wrong password
    response = client.post('/auth/login', json={
        'email': 'test2@example.com',
        'password': 'WrongPassword123'
    })
    
    assert response.status_code == 401
    data = response.get_json()
    assert data['status'] == 'error'


def test_get_user(client):
    """Test getting user profile"""
    # Register user
    register_response = client.post('/auth/register', json={
        'email': 'profile@example.com',
        'password': 'TestPassword123'
    })
    
    user_id = register_response.get_json()['data']['user_id']
    
    # Get user profile
    response = client.get(f'/user/{user_id}')
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'success'
    assert data['data']['email'] == 'profile@example.com'


def test_search_profile(client):
    """Test searching for person profiles"""
    response = client.get('/user/search-profile?name=John')
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'success'
    assert isinstance(data['data'], list)
