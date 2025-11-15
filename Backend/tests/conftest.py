"""
Pytest configuration and fixtures for CollabConnect backend tests.
Handles MySQL connection setup and app initialization for testing.
"""

import os
import sys
import pytest
import configparser

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app as flask_app

config = configparser.ConfigParser()
config.read("../config.ini")

@pytest.fixture
def app():
    """Fixture that provides the Flask app configured for testing."""


    flask_app.config["MYSQL_HOST"] = config.get("Database", "db_host", fallback="127.0.0.1")
    flask_app.config["MYSQL_PORT"] = config.getint("Database", "db_port", fallback=3306)
    flask_app.config["MYSQL_USER"] = config.get("Database", "db_user", fallback="root")
    flask_app.config["MYSQL_PASSWORD"] = config.get("Database", "db_password", fallback="")
    flask_app.config["MYSQL_DB"] = config.get("Database", "db_name", fallback="collab_connect_db")
    flask_app.config["MYSQL_CURSORCLASS"] = config.get(
        "Database", "db_cursorclass", fallback="DictCursor"
    )

    return flask_app


@pytest.fixture
def client(app):
    """Fixture that provides a test client for the Flask app."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Fixture that provides a test CLI runner for the Flask app."""
    return app.test_cli_runner()
