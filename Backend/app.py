from flask import Flask
from flask_mysqldb import MySQL
from datetime import datetime

# create the Flask app instance
app = Flask(__name__)

# MySQL configurations
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'  # default MySQL Workbench username
app.config['MYSQL_PASSWORD'] = ''   # your MySQL Workbench password
app.config['MYSQL_DB'] = 'collab_connect_db'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'  # this will return rows as dictionaries

# Initialize MySQL
mysql = MySQL(app)

def check_db():
    try:
        app.config['MYSQL_DB'] = None
        sql_connection = MySQL(app)
        cursor = sql_connection.connection.cursor()
        
        cursor.execute("CREATE DATABASE IF NOT EXISTS collab_connect_db")
        print("Database 'collab_connect_db' checked/created successfully")
        
        sql_connection.connection.commit()
        cursor.close()
        
        app.config['MYSQL_DB'] = 'collab_connect_db'
        
    except Exception as e:
        print(f"Error while connecting to MySQL: {e}")
# can't have a flask app without a db, so check to see if it exists before starting app
check_db()

@app.route('/')
def hello_world():
    cursor = mysql.connection.cursor()
    cursor.execute('SELECT NOW()')
    result = cursor.fetchone()
    cursor.close()
    return f'Connected to MySQL! Current time: {result["NOW()"]}'


if __name__ == '__main__':
    app.run()