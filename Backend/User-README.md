# User Authentication System

**Author:** Aubin Mugisha  
**Date:** December 1, 2025

## Overview

Simple authentication system for CollabConnect. Users create accounts, then link them to researcher profiles.

## How It Works

### 1. Registration & Login
- Sign up with email and password
- Login returns a JWT token (lasts 24 hours)
- Token stored in browser to stay logged in

### 2. Profile Setup
After login, users have two options:
- **Search & Claim** - Find your existing profile from scraped data
- **Create New** - Fill out a form with your info

### 3. Profile Info
Each profile has:
- Name, email, phone, bio
- 3 expertise areas (like "Machine Learning")
- Department and institution

## File Structure

### Backend Files
```
routes/
  auth_routes.py    - Register, login, token refresh
  user_routes.py    - View profile, search profiles, claim profile
  person_routes.py  - Create new profile
utils/
  jwt_utils.py      - Make and check JWT tokens
sql/
  tables/user.sql   - User table definition
  procedures/user_procedures.sql - Database operations
```

### Frontend Files
```
scenes/
  register/         - Sign up page
  login/            - Login page
  user/             - Profile page
  create-profile/   - New profile form
  global/Topbar.jsx - Login/logout buttons
```

## API Routes

**Authentication:**
- `POST /auth/register` - Create account
- `POST /auth/login` - Login, get token
- `GET /auth/me` - Get current user info
- `POST /auth/refresh` - Get new token

**User Operations:**
- `GET /user/<id>` - View profile
- `GET /user/search-profile?name=...&email=...` - Search profiles
- `POST /user/<id>/claim-person/<person_id>` - Link profile (needs token)

**Profile Creation:**
- `POST /person` - Create new profile

## Key-Notes
- Database reset removes all users
