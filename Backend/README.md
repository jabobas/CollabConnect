# CollabConnect Backend

This directory contains the backend components of the CollabConnect application.

## Table of Contents
1. [How to Set Up CollabConnect Backend](#how-to-set-up-collabconnect-backend)  
2. [MySQL Workbench](#1-mysql-workbench)  
   - [Installation Steps](#installation-steps)  
3. [Start the MySQL Server in MySQL Workbench](#2-start-the-mysql-server-in-mysql-workbench)  
4. [Set up config.ini](#3-set-up-configini)  
5. [Run Commands](#4-run-commands)  
6. [Setup Complete!](setup-complete!)

## How to Set Up CollabConnect Backend

## 1.) MySQL Workbench

MySQL Workbench must be downloaded to be used as the database for this application. Its download can be found here:  
https://dev.mysql.com/downloads/workbench/

Below is a general guide for installing MySQL Workbench. A more detailed installation walkthrough can be found here:  
https://www.geeksforgeeks.org/installation-guide/how-to-install-sql-workbench-for-mysql-on-windows/

### Installation Steps

### 1. Download & Run MySQL Installer
- Choose the first Windows installer and run it.  
**Troubleshooting:** Windows may block the install — click *Run Anyway*.

### 2. Select “Full”
This ensures all packages are installed if you are not sure what you will need.  
If you know which packages you need, click **Custom** and select them manually.

### 2.5. Add Components if Using Custom
If you choose to use custom packages, the following are recommended:
- **MySQL Server 8.0**
- **MySQL Workbench 8.0**
- **MySQL Shell 8.0**  
**Troubleshooting:** If items won’t move, try double-clicking instead of dragging.

### 4. Click *Next*, then *Execute*
The installer will download and install the components.  
**Troubleshooting:** If the install fails, restart the installer — it will resume automatically.

### 5. Configure MySQL Server
Set a **root password**.  
**Troubleshooting:** If connection issues appear, ensure the MySQL server service is running.

### 6. Finish Installation
Workbench should auto-launch (or open it from the Start Menu).  
**Troubleshooting:** If it won’t open, try running Workbench as administrator.

---

## 2.) Start the MySQL Server in MySQL Workbench

Now that MySQL Workbench is downloaded and configured, the next step is to start the MySQL server.  
Open a connection **on port 3306** — this port is required for the application to function correctly.

MySQL’s guide on creating a connection is here:  
https://dev.mysql.com/doc/workbench/en/wb-mysql-connections-new.html

---

## 3.) Set up config.ini

The backend requires a `config.ini` to define your username, password, and other details about your MySQL connection.

The backend includes an example config file to use as a reference. Ensure the final file is named **config.ini**.  
All database values should remain the same **except your password**, which must be updated.  
If you change the default MySQL username from `root`, make sure you update it here as well.

**config.ini.example**
```
[General]
debug = True
log_level = info

[Database]
db_name = collab_connect_db
db_user = root
db_password = YOUR_MYSQL_PASSWORD_HERE
db_host = localhost
db_port = 3306
db_cursorclass = DictCursor
```

## 4.) Run Commands

Now that the everything is set up, it is time to set up your python virtual venv. This is how you do so
# Python venv setup (Windows, macOS, Linux)

For Windows:
```
python -m venv venv

venv\Scripts\activate
```
For macOS: 
```
python3 -m venv venv

source venv/bin/activate
```
For Linux:
```
python3 -m venv venv

source venv/bin/activate
```

This will give you a space to install all the neccessary dependancies CollabConnect runs on
After you active your python venv, run `pip install -r requirements.txt` to install all 
the dependancies needed. This may take some time

After all the dependancies are installed, run `python db_init.py`. This will call the database
initalization script that will create the schema with all the tables, procedures, indexes, and 
data associated with CollabConnect. Unit tests will also fire to ensure everything is running
correctly.

If when running `python db_init.py`, if something goes wrong the database creation script will
return the error where it failed and drop the schema, as it should not exist if it is half way 
created. This will give you a pointer where the error may be. But if all steps were followed 
properly, it should print all pasted tests. 

## Setup Complete!

Congrats! The backend and database for Collab Connect is now running locally on your Machine! 
Please reach out to lucas.matheson@maine.edu for any questions or assistance with running 
the CollabConnect database. 

