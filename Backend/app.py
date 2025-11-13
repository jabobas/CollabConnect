from flask import Flask
from flask_mysqldb import MySQL
import os
import configparser

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
