from flask import Flask
from flask_cors import CORS
from flask_mysqldb import MySQL
import os
import configparser
from routes.institution_routes import institution_bp
from routes.project_routes import project_bp
from routes.person_routes import person_bp
from routes.tag_routes import tags_bp
from routes.project_tag_routes import project_tag_bp
from routes.department_routes import department_bp
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
"""
Filename: app.py
Author: Lucas Matheson
Edited by: Lucas Matheson
Date: November 10, 2025

This app.py file is the file that will be used to start the flask
application for collabconnect. It will be the heart of the backend. 

All config settings are read from config.ini, which is not pushed
into the repo. This however may change.

Using MySql and MySql Workbench, this app.py file defines the database,
ensures it exists before starting the application, and runs the flask app.
All default routes, such as health, are defined here. 
"""


app = Flask(__name__)
CORS(app)  

config = configparser.ConfigParser()
config.read("config.ini")

app.config["MYSQL_HOST"] = config.get("Database", "db_host", fallback="127.0.0.1")
app.config["MYSQL_PORT"] = config.getint("Database", "db_port", fallback=3306)
app.config["MYSQL_USER"] = config.get("Database", "db_user", fallback="root")
app.config["MYSQL_PASSWORD"] = config.get("Database", "db_password", fallback="")
app.config["MYSQL_DB"] = config.get("Database", "db_name", fallback="collab_connect_db")
app.config["MYSQL_CURSORCLASS"] = config.get(
    "Database", "db_cursorclass", fallback="DictCursor"
)

mysql = MySQL(app)

# Define your routes here
app.register_blueprint(institution_bp)
app.register_blueprint(project_bp)
app.register_blueprint(person_bp)
app.register_blueprint(tags_bp)
app.register_blueprint(project_tag_bp)
app.register_blueprint(department_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(user_bp)


@app.route("/health")
def health():
    cursor = mysql.connection.cursor()
    cursor.execute(
        """
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = 'collab_connect_db';
    """
    )

    tables = cursor.fetchall()
    output = []

    for t in tables:
        output.append(t["TABLE_NAME"])

    cursor.close()

    #  On the page, it will print this and all the tables, seperated by commas
    return f'Connected to MySQL! Current tables: {", ".join(output)}'


if __name__ == "__main__":
    app.run()
