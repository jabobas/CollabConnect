from flask import Flask
from flask_mysqldb import MySQL
import configparser
import os

app = Flask(__name__)

config = configparser.ConfigParser()
config_path = os.path.join(os.path.dirname(__file__), 'config.ini')
config.read(config_path)

app.config['MYSQL_HOST'] = config.get('Database', 'db_host', fallback='localhost')
app.config['MYSQL_USER'] = config.get('Database', 'db_user', fallback='root')
app.config['MYSQL_PASSWORD'] = config.get('Database', 'db_password', fallback='')
app.config['MYSQL_DB'] = config.get('Database', 'db_name', fallback='collab_connect_db')
app.config['MYSQL_PORT'] = config.getint('Database', 'db_port', fallback=3306)
app.config['MYSQL_CURSORCLASS'] = config.get('Database', 'db_cursorclass', fallback='DictCursor')

def check_db():
    try:
        with app.app_context():
            app.config['MYSQL_DB'] = None
            sql_connection = MySQL(app)
            cursor = sql_connection.connection.cursor()

            cursor.execute("CREATE DATABASE IF NOT EXISTS collab_connect_db")
            print("Database 'collab_connect_db' checked/created successfully")

            sql_connection.connection.commit()
            cursor.close()

            app.config['MYSQL_DB'] = config.get('Database', 'db_name', fallback='collab_connect_db')
    except Exception as e:
        print(f"Error while connecting to MySQL: {e}")

# can't have a flask app without a db, so check to see if it exists before starting app
check_db()

mysql = MySQL(app)

@app.route('/')
def hello_world():
    cursor = mysql.connection.cursor()
    cursor.execute('SELECT NOW()')
    result = cursor.fetchone()
    cursor.close()
    return f'Connected to MySQL! Current time: {result["NOW()"]}'


if __name__ == '__main__':
    app.run()
