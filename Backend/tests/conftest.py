import os
import sys
import pytest
import configparser
# Add parent directory to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
config = configparser.ConfigParser()
config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config.ini")
config.read(config_path)


@pytest.fixture(scope='session')
def app():
    """Fixture that provides the Flask app configured for testing."""
    
    # Import here to avoid early initialization
    from app import app as flask_app
    
    flask_app.config["TESTING"] = True
    flask_app.config["MYSQL_HOST"] = config.get("Database", "db_host", fallback="127.0.0.1")
    flask_app.config["MYSQL_PORT"] = config.getint("Database", "db_port", fallback=3306)
    flask_app.config["MYSQL_USER"] = config.get("Database", "db_user", fallback="root")
    flask_app.config["MYSQL_PASSWORD"] = config.get("Database", "db_password", fallback="")
    flask_app.config["MYSQL_DB"] = config.get("Database", "db_name", fallback="collab_connect_db")
    flask_app.config["MYSQL_CURSORCLASS"] = config.get(
        "Database", "db_cursorclass", fallback="DictCursor"
    )
    
    return flask_app


@pytest.fixture(scope='session')
def mysql_connection(app):
    """Fixture that provides a properly configured MySQL connection."""
    from flask_mysqldb import MySQL
    
    # Create a new MySQL instance with the test app
    mysql = MySQL(app)
    
    # Test the connection
    with app.app_context():
        try:
            cursor = mysql.connection.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            print("Database connection successful")
        except Exception as e:
            print("Database connection failed: ", e)
            raise
    
    return mysql


@pytest.fixture
def client(app):
    """Fixture that provides a test client for the Flask app."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Fixture that provides a test CLI runner for the Flask app."""
    return app.test_cli_runner()