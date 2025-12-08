"""Author: Aubin Mugisha
Helper functions to check and clean user input for security
"""

import re
from flask import jsonify

def validate_email(email):
    """Validate email format"""
    if not email or not isinstance(email, str):
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password: min 8 chars, 1 letter, 1 number"""
    if not password or not isinstance(password, str):
        return False, "Password is required"
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Za-z]', password):
        return False, "Password must contain at least one letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    return True, "Password is valid"

def validate_string_length(value, field_name, min_length=1, max_length=500):
    """Validate string field length"""
    if not value:
        return True, ""
    
    if not isinstance(value, str):
        return False, f"{field_name} must be a string"
    
    if len(value.strip()) < min_length:
        return False, f"{field_name} must be at least {min_length} characters"
    
    if len(value) > max_length:
        return False, f"{field_name} must not exceed {max_length} characters"
    
    return True, ""

def validate_project_data(data):
    """Validate project creation/update data"""
    errors = []
    
    # Title validation
    if 'project_title' in data:
        valid, msg = validate_string_length(data['project_title'], 'Project title', min_length=3, max_length=200)
        if not valid:
            errors.append(msg)
    
    # Description validation
    if 'project_description' in data and data['project_description']:
        valid, msg = validate_string_length(data['project_description'], 'Project description', min_length=0, max_length=5000)
        if not valid:
            errors.append(msg)
    
    # Tag validation
    if 'tag_name' in data and data['tag_name']:
        valid, msg = validate_string_length(data['tag_name'], 'Tag name', min_length=0, max_length=100)
        if not valid:
            errors.append(msg)
    
    if data.get('start_date') and data.get('end_date'):
        try:
            from datetime import datetime
            start = datetime.fromisoformat(str(data['start_date']))
            end = datetime.fromisoformat(str(data['end_date']))
            if end < start:
                errors.append("End date must be after start date")
        except:
            pass
    
    return len(errors) == 0, errors

def sanitize_string(value):
    """Strip whitespace and remove null bytes"""
    if not value or not isinstance(value, str):
        return value
    return value.strip().replace('\x00', '')