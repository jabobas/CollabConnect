from flask import Flask
from flask_mysqldb import MySQL

app = Flask(__name__)

app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'  
app.config['MYSQL_PASSWORD'] = ''   
app.config['MYSQL_DB'] = 'collab_connect_db'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'  

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