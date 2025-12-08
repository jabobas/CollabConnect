# CollabConnect - Installation, Setup & API Documentation

## Table of Contents
1. [Installation & Setup](#installation--setup)
2. [Usage Guide](#usage-guide)
3. [API Documentation](#api-documentation)
4. [Troubleshooting](#troubleshooting)

---

## Installation & Setup

### Prerequisites
Before setting up CollabConnect, ensure you have the following installed:
- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **Node.js 14+** - [Download](https://nodejs.org/)
- **MySQL 8.0+** - [Download](https://dev.mysql.com/downloads/)
- **MySQL Workbench** (optional, for GUI) - [Download](https://dev.mysql.com/downloads/workbench/)
- **Git** - [Download](https://git-scm.com/)

### Step 1: Clone the Repository
```bash
git clone https://github.com/jabobas/CollabConnect.git
cd CollabConnect
```

### Step 2: Set Up MySQL Database & User
Start MySQL and create a database and user for CollabConnect:

```sql
-- Log in to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE collab_connect_db;

-- Create user and grant privileges
CREATE USER 'collab_user'@'localhost' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON collab_connect_db.* TO 'collab_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Configure Backend Database Connection
Create `Backend/config.ini` from the example template:

```bash
cp Backend/config.ini.example Backend/config.ini
```

Edit `Backend/config.ini` and update the credentials:
```ini
[General]
debug = True
log_level = info

[Database]
db_name = collab_connect_db
db_user = collab_user
db_password = your_password_here
db_host = localhost
db_port = 3306
db_cursorclass = DictCursor
```

### Step 4: Run Setup Script
Execute the main setup script to initialize the database and install dependencies:

```bash
chmod +x setup.sh
./setup.sh
```

The `setup.sh` script performs the following:
- Creates Python virtual environment in `databases/` folder
- Installs Python dependencies from `Backend/requirements.txt`
- Installs Node.js dependencies via `npm install` in `frontend/`
- Initializes database schema, tables, indexes, and stored procedures
- Loads seed data from JSON files in `Backend/data/processed/`
- Runs database validation checks

**What the setup script does:**
```bash
#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$ROOT_DIR/databases"
BACKEND_DIR="$ROOT_DIR/Backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# 1. Create and activate Python virtual environment
if [[ ! -d "$VENV_DIR" ]]; then
  python3 -m venv "$VENV_DIR"
fi
source "$VENV_DIR/bin/activate"

# 2. Install Python dependencies
pip install --upgrade pip
pip install -r "$BACKEND_DIR/requirements.txt"

# 3. Install frontend dependencies
pushd "$FRONTEND_DIR" >/dev/null
npm install
popd >/dev/null

# 4. Initialize database
pushd "$BACKEND_DIR" >/dev/null
python db_init.py
popd >/dev/null
```

> **Note:** The setup script expects MySQL user and database to already exist with credentials configured in `Backend/config.ini`. It will not create the database user itself.

### Step 5: Start the Application
Once setup completes, start both backend and frontend services:

```bash
chmod +x run.sh
./run.sh
```

The `run.sh` script:
- Activates the Python virtual environment from `databases/`
- Starts Flask backend server on `http://127.0.0.1:5000`
- Starts React frontend on `http://localhost:3000`
- Manages cleanup when you exit (Ctrl+C)

**What the run script does:**
```bash
#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$ROOT_DIR/databases"
BACKEND_DIR="$ROOT_DIR/Backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

source "$VENV_DIR/bin/activate"

# Start Flask backend in background
pushd "$BACKEND_DIR" >/dev/null
"$VENV_DIR/bin/python" app.py &
BACKEND_PID=$!
popd >/dev/null

# Setup cleanup on exit
cleanup() {
  echo "\n==> Stopping backend (PID $BACKEND_PID)"
  kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT

# Start React frontend in foreground
pushd "$FRONTEND_DIR" >/dev/null
npm start
popd >/dev/null
```

**Expected Output:**
```
==> Starting Flask backend on http://127.0.0.1:5000
==> Starting React frontend on http://localhost:3000
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

Open your browser to `http://localhost:3000` to access the application.

### Stopping the Application
Press `Ctrl+C` in the terminal. The `run.sh` script will:
1. Terminate the Flask backend process
2. Terminate the React frontend process
3. Clean up any remaining processes

### Database Initialization Details

The `db_init.py` script handles:
1. **Database existence check** - Verifies `collab_connect_db` exists
2. **Table creation** - Creates all necessary tables if they don't exist
3. **Index creation** - Adds indexes for performance optimization
4. **Stored procedures** - Registers all CRUD operation procedures
5. **Seed data loading** - Imports data from JSON files in `Backend/data/processed/`
6. **Unit tests** - Runs pytest to verify database functionality

If database already exists, it will skip schema creation and only verify tables are properly configured.

---

## Usage Guide

### Accessing the Application

1. **Open in Browser**
   ```
   http://localhost:3000
   ```

2. **Create an Account** or **Login**
   - Register with email and password
   - Login to access personalized features

3. **Search for Collaborators**
   - Navigate to "Search Collaborators"
   - Filter by expertise, institution, or department
   - Click on researcher profiles to view details

4. **Browse Projects**
   - View all 330+ projects
   - Filter by tags and keywords
   - Click on project to see associated researchers

5. **Manage Your Profile**
   - Create researcher profile
   - Claim existing profile from database
   - Link account to person profile
   - Add projects and expertise

### Key Features

**Dashboard**
- Overview of projects and statistics
- Quick access to search functions
- Recently viewed collaborators

**Search Collaborators**
- Search by name, expertise, or institution
- View researcher profiles with:
  - Contact information
  - Department & Institution
  - Research expertise
  - Associated projects

**Projects**
- Browse 330+ research projects
- See project descriptions and dates
- View researchers working on each project
- Filter by tags

**User Profiles**
- Create new researcher profile with affiliation
- Claim existing profiles from database
- Link user account to researcher profile
- Manage project participation

---

## API Documentation

### Base URL
```
http://localhost:5000
```

### Authentication
The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

### Authentication Routes

#### Register New User
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "Registration successful",
  "data": {
    "user_id": 42
  }
}
```

**Errors:**
- `400` - Missing email or password
- `409` - Email already registered

---

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user_id": 42,
    "person_id": null,
    "email": "user@example.com",
    "access_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Errors:**
- `400` - Missing email or password
- `401` - Invalid credentials

---

#### Get Current User (Protected)
```
GET /auth/me
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user_id": 42,
    "person_id": 123,
    "email": "user@example.com",
    "created_at": "2025-12-01T10:30:00",
    "last_login": "2025-12-07T15:45:00",
    "person_name": "Dr. Jane Smith",
    "person_email": "jane.smith@university.edu",
    "bio": "Research in Machine Learning"
  }
}
```

---

#### Refresh Token (Protected)
```
POST /auth/refresh
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### Project Routes

#### Get All Projects
```
GET /project/all
```

**Response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "project_id": 1,
      "project_title": "Machine Learning Research",
      "project_description": "Advanced ML techniques",
      "start_date": "2024-01-15",
      "end_date": "2025-12-31",
      "tag_name": "AI"
    }
  ],
  "count": 333
}
```

---

#### Get Single Project
```
GET /project/<project_id>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "project_id": 1,
    "project_title": "Machine Learning Research",
    "project_description": "Advanced ML techniques",
    "start_date": "2024-01-15",
    "end_date": "2025-12-31"
  }
}
```

**Errors:**
- `404` - Project not found

---

#### Get People on Project
```
GET /project/<project_id>/people
```

**Response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "person_id": 123,
      "person_name": "Dr. Jane Smith",
      "person_email": "jane.smith@university.edu",
      "department_id": 5,
      "department_name": "Computer Science",
      "institution_id": 1,
      "institution_name": "University of Maine"
    }
  ],
  "count": 3
}
```

---

#### Create Project (Protected)
```
POST /project/
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "New Research Project",
  "description": "Project description here",
  "person_id": 123,
  "start_date": "2025-01-01",
  "end_date": "2026-12-31",
  "tag_name": "AI"
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "Project created successfully"
}
```

**Errors:**
- `400` - Missing required fields
- `401` - Unauthorized

---

#### Update Project
```
PUT /project/
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "id": 1,
  "title": "Updated Title",
  "description": "Updated description",
  "start_date": "2025-01-01",
  "end_date": "2026-12-31"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Project updated successfully"
}
```

---

#### Delete Project
```
DELETE /project/<project_id>
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Project deleted successfully"
}
```

---

### Person Routes

#### Get All People
```
GET /person/all
```

**Response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "person_id": 1,
      "person_name": "Dr. Jane Smith",
      "person_email": "jane.smith@university.edu",
      "person_phone": "(207) 555-1234",
      "bio": "Research in AI and ML",
      "expertise_1": "Machine Learning",
      "expertise_2": "Data Science",
      "expertise_3": null,
      "expertises": ["Machine Learning", "Data Science"]
    }
  ],
  "count": 554
}
```

---

#### Get Single Person
```
GET /person/<person_id>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "person": {
      "person_id": 1,
      "person_name": "Dr. Jane Smith",
      "person_email": "jane.smith@university.edu",
      "person_phone": "(207) 555-1234",
      "bio": "Research in AI and ML",
      "expertises": ["Machine Learning", "Data Science"]
    },
    "department": {
      "department_id": 5,
      "department_name": "Computer Science"
    },
    "institution": {
      "institution_id": 1,
      "institution_name": "University of Maine"
    }
  }
}
```

---

#### Get Person's Projects
```
GET /person/<person_id>/projects
```

**Response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "project_id": 1,
      "project_title": "ML Research",
      "project_description": "Description",
      "start_date": "2024-01-15",
      "end_date": "2025-12-31"
    }
  ],
  "count": 5
}
```

---

#### Create Person (Protected)
```
POST /person/
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "person_name": "Dr. John Doe",
  "person_email": "john@university.edu",
  "person_phone": "(555) 123-4567",
  "bio": "Research in distributed systems",
  "expertise_1": "Distributed Systems",
  "expertise_2": "Cloud Computing",
  "expertise_3": null
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "Profile created",
  "data": {
    "person_id": 600
  }
}
```

---

### Department Routes

#### Get All Departments
```
GET /department/all
```

#### Get Department by ID
```
GET /department/<department_id>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "department_id": 5,
    "department_name": "Computer Science",
    "department_email": "cs@university.edu",
    "department_phone": "(207) 555-5000",
    "institution_id": 1,
    "institution_name": "University of Maine"
  }
}
```

---

#### Get People in Department
```
GET /department/<department_id>/people
```

**Response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "person_id": 1,
      "person_name": "Dr. Jane Smith",
      "expertise_1": "ML",
      "expertise_2": "AI",
      "expertises": ["ML", "AI"]
    }
  ],
  "count": 12
}
```

---

#### Create Department (Protected)
```
POST /department/
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "department_name": "Data Science",
  "department_email": "ds@university.edu",
  "department_phone": "(555) 987-6543",
  "institution_id": 1
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "Department created successfully",
  "department_id": 20
}
```

---

#### Update Department (Protected)
```
PATCH /department/<department_id>
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "department_name": "Updated Name",
  "department_email": "newemail@university.edu",
  "department_phone": "(555) 111-2222"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Department updated successfully"
}
```

---

#### Delete Department (Protected)
```
DELETE /department/<department_id>
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Department deleted successfully"
}
```

---

### Institution Routes

#### Get All Institutions, Departments & People
```
GET /institution/all
```

**Response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "institution_id": 1,
      "institution_name": "University of Maine",
      "institution_type": "Academic",
      "street": "Orono, ME",
      "city": "Orono",
      "state": "ME",
      "department_name": "Computer Science",
      "person_name": "Dr. Jane Smith"
    }
  ],
  "count": 554
}
```

---

### Tag Routes

#### Get All Tags
```
GET /tag/all
```

**Response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "tag_id": 1,
      "tag_name": "Machine Learning"
    }
  ],
  "count": 45
}
```

---

#### Get Projects by Tag
```
GET /project_tag/by-project?project_id=1
```

**Response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "tag_id": 1,
      "tag_name": "AI",
      "project_id": 1
    }
  ],
  "count": 3
}
```

---

### User Routes

#### Get User Profile
```
GET /user/<user_id>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user_id": 42,
    "person_id": 123,
    "email": "user@example.com",
    "person_name": "Dr. Jane Smith",
    "department_name": "Computer Science",
    "institution_name": "University of Maine"
  }
}
```

---

#### Search Profiles to Claim
```
GET /user/search-profile?name=Jane&email=jane@university.edu
```

**Response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "person_id": 123,
      "person_name": "Jane Smith",
      "person_email": "jane@university.edu",
      "expertises": ["AI", "ML"],
      "is_claimed": false
    }
  ]
}
```

---

#### Claim Existing Profile (Protected)
```
POST /user/<user_id>/claim-person/<person_id>
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Profile claimed"
}
```

---

#### Get User's Projects (Protected)
```
GET /user/<user_id>/projects
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": [
    {
      "project_id": 1,
      "project_title": "ML Research",
      "project_role": "Researcher"
    }
  ]
}
```

---

#### Create Profile with Affiliation (Protected)
```
POST /user/create-profile-with-affiliation
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "person_name": "Dr. New User",
  "person_email": "newuser@example.com",
  "person_phone": "(555) 999-8888",
  "bio": "Research in quantum computing",
  "expertise_1": "Quantum Computing",
  "expertise_2": "Physics",
  "institution_name": "MIT",
  "department_name": "Physics"
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "Profile created",
  "data": {
    "person_id": 601,
    "user_id": 42
  }
}
```

---

## Troubleshooting

### Database Connection Issues

**Error: "Can't connect to MySQL server"**
- Ensure MySQL is running: `mysql -u root -p`
- Verify credentials in `Backend/config.ini`
- Check port 3306 is accessible

**Error: "Database 'collab_connect_db' doesn't exist"**
- Run database setup: `./setup.sh`
- Or manually create: `CREATE DATABASE collab_connect_db;`

**Error: "PROCEDURE does not exist"**
- Stored procedures weren't created
- Re-run: `python Backend/db_init.py`

### Frontend Issues

**Port 3000 already in use**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

**"Can't connect to backend"**
- Ensure Flask is running on port 5000
- Check proxy setting in `frontend/package.json`
- Verify CORS is enabled in `Backend/app.py`

### Backend Issues

**Port 5000 already in use**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

**Module not found errors**
```bash
# Reactivate virtual environment
source databases/bin/activate

# Reinstall dependencies
pip install -r Backend/requirements.txt
```

### JWT Authentication Issues

**"Token missing" or "Invalid token"**
- Ensure token is in Authorization header: `Authorization: Bearer <token>`
- Check token hasn't expired (24 hour expiry)
- Refresh token using `/auth/refresh` endpoint

**"Can only claim your own profile"**
- Make sure user_id matches authenticated user
- You can only claim profiles for your own account

---

## Support & Documentation

- **Project Overview:** See [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)
- **GitHub Repository:** https://github.com/jabobas/CollabConnect
- **Team:** Abbas Jabor, Lucas Matheson, Wyatt McCurdy, Aubin Mugisha
- **University:** University of Maine (COS457)

---

**Last Updated:** December 7, 2025
