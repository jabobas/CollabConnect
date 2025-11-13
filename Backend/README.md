# CollabConnect Backend

This directory contains the backend components of the CollabConnect application.

## How to Set Up CollabConnect Backend

**Prerequisites:**
Before running any of the commands, there is a list of things that need to be done before commands can be ran. 

### 1.) MySQL Workbench

MySQL Workbench must be downloaded to be used as the database for this applicaiton. Its download can be found here
https://dev.mysql.com/downloads/workbench/

Below I provided a general guide to installing MySQL workbench, more details about installation can be found here
https://www.geeksforgeeks.org/installation-guide/how-to-install-sql-workbench-for-mysql-on-windows/

### Installation Steps 

### 1. Download & Run MySQL Installer
- Choose the first Windows installer and run it.  
**Troubleshooting:** Windows may block the install, ensure to approve it by clicking *Run Anyway*.

### 2. Select “Full”
This ensures all packages are installed if you are not sure what packages you will need. If you know what
packages you need and the ones you don't, click "custom" and select the correct packages

### 2.5. Add Components if Using Custom
If you want to use custom packages, I recommend the following
- **MySQL Server 8.0**
- **MySQL Workbench 8.0**
- **MySQL Shell 8.0**  
**Troubleshooting:** If the items won't move, try double-click instead of dragging.

### 4. Click *Next*, then *Execute*
Installer downloads and installs the components.  
**Troubleshooting:** If the install fails, try to restart the installer. It resumes automatically.

### 5. Configure MySQL Server
Set a **root password**.  
**Troubleshooting:** This can be common, if connection issues appear, please ensure the server service is running

### 6. Finish Installation
Workbench should auto-launch (or open it from Start Menu).  
**Troubleshooting:** If it won’t open, try to run workbench as administrator.


- Database must be created (run Flask app first to auto-create)
- `config.ini` must be configured with database credentials


## Database Schema

The database consists of the following main tables:
- `Institution` - Academic/research institutions
- `Department` - Departments within institutions
- `Person` - Faculty, staff, and researchers
- `Project` - Research projects
- `Tag` - Expertise and project tags
- `WorksIn` - Many-to-many relationship between Person and Department
- `WorkedOn` - Person-project relationships
- `BelongsTo` - Department-institution history
- `Project_Tag` - Project-tag relationships
