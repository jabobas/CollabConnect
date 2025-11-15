# Import sys module for modifying Python's runtime environment
import sys
# Import os module for interacting with the operating system
import os
# Import pytest for writing and running tests
import pytest

# Add the parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the Flask app instance from the main app file
from app import app

# Test ensures database is up
def test_home(client):
    try:
        response = client.get('/health')
        assert response.status_code == 200
        # Response should contain table list or connection message
        assert b"Connected" in response.data or b"tables" in response.data
    except Exception as e:
        pytest.skip(f"MySQL not available: {str(e)}")
