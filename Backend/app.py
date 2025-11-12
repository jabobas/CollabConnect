from flask import Flask
from flask_mysqldb import MySQL
import os
import configparser

app = Flask(__name__)

config = configparser.ConfigParser()
config.read('config.ini')

app.config['MYSQL_HOST'] = config.get('Database', 'db_host', fallback='127.0.0.1')
app.config['MYSQL_PORT'] = config.getint('Database', 'db_port', fallback=3306) 
app.config['MYSQL_USER'] = config.get('Database', 'db_user', fallback='root')
app.config['MYSQL_PASSWORD'] = config.get('Database', 'db_password', fallback='')
app.config['MYSQL_DB'] = config.get('Database', 'db_name', fallback='collab_connect_db')
app.config['MYSQL_CURSORCLASS'] = config.get('Database', 'db_cursorclass', fallback='DictCursor')

mysql = MySQL(app)

def check_db() -> bool:
    try:
        # temporarily set no DB to check for existence
        app.config['MYSQL_DB'] = None

        with app.app_context():
            cursor = mysql.connection.cursor()

            db_exists = cursor.execute("""SELECT SCHEMA_NAME
                                        FROM INFORMATION_SCHEMA.SCHEMATA
                                        WHERE SCHEMA_NAME = 'collab_connect_db';
                                        """)

            if db_exists == 1:
                print("Database 'collab_connect_db' already exists")
                app.config['MYSQL_DB'] = config.get('Database', 'db_name', fallback='collab_connect_db')

            else:
                create_db()
                print("Database 'collab_connect_db' checked/created successfully")
            
            cursor.close()
            return True
        
    except Exception as e:
        print("Database check/creation failed:", e)
        print("Ensure that the MySQL server is running and the connection details are correct.")
        return False

def create_db():
    
    print('Creating database')
    cursor = mysql.connection.cursor()
    cursor.execute("CREATE SCHEMA collab_connect_db")
    cursor.execute("USE collab_connect_db")
    mysql.connection.commit()

    try:
        #  This will create all our tables
        with open("./sql_queries/creation_scripts/1_create_all_tables.sql", "r") as f:
            sql_script = f.read()
        
            statements = sql_script.split(';')
            
            # When doing all the tables at once, you end up with a 
            # Error creating tables: (2014, "Commands out of sync; you can't run this command now")
            # So, split the create tables up into seperate statements, then execute
            for statement in statements:
                create_table = statement.strip()
                if create_table:
                    cursor.execute(create_table)
  
            # Commit all the changes
            mysql.connection.commit()  
    except Exception as e:
        print("Error creating tables: ", {str(e)})
        raise
    finally:
        cursor.close()

    try:
        create_procedures()
    except Exception as e:
        print("Error creating procedures: ", {str(e)})
        raise

    # Uncomment when all data is in
    # try:
    #     insert_initial_data()
    # except Exception as e:
    #     print(f"Error inserting initial data: {str(e)}")
    #     raise


def create_procedures():
    print('Creating stored procedures...')
    cursor = mysql.connection.cursor()
    
    try:
        with open("./sql_queries/procedures/department_procedures.sql", "r") as f:
            sql_script = f.read()
            procedures = sql_script.split('CREATE PROCEDURE')

            for proc in procedures:
                if proc.strip():
                    try:
                        stmt = "CREATE PROCEDURE " + proc.strip()
                        cursor.execute(stmt)
                        mysql.connection.commit()  # Commit after each procedure
                    except Exception as e:
                        print("Error creating procedure: ", {str(e)})
                        print("Failed procedure: ",  {stmt[:200]})  
                        raise
    finally:
        cursor.close()

#  Currently an example! do not use! we need all the data to insert things properly
def insert_initial_data():
    print("Inserting initial data into Department...")

    # Department details
    department_phone = '123-456-7890'
    department_email = 'department@example.com'
    department_name = 'Computer Science'

    try:
        cursor = mysql.connection.cursor()

        # Call the stored procedure 'InsertIntoDepartment'
        # Ensure correct order of parameters
        cursor.callproc('InsertIntoDepartment', [
            department_phone,
            department_email,
            department_name
        ])

        mysql.connection.commit()

    except Exception as e:
        mysql.connection.rollback()
        raise
    finally:
        cursor.close()

 

@app.route('/health')
def health():
    cursor = mysql.connection.cursor()
    cursor.execute("""
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = 'collab_connect_db';
    """)

    tables = cursor.fetchall()
    output = []

    for t in tables:
        output.append(t['TABLE_NAME'])  

    cursor.close()

    #  On the page, it will print this and all the tables, seperated by commas
    return f'Connected to MySQL! Current tables: {", ".join(output)}'


if __name__ == '__main__':
    if not check_db():
        print('Database check failed; not starting Flask app.')
        import sys
        sys.exit(1)
   
    app.run()