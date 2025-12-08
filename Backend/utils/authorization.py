"""Author: Aubin Mugisha
Decorators to make sure users only change their own projects and data
"""

from functools import wraps
from flask import request, jsonify

def verify_project_ownership(f):
    """Verify user owns the project being modified. Use after @token_required."""
    @wraps(f)
    def decorated(*args, **kwargs):
        from app import mysql
        
        project_id = kwargs.get('project_id')
        if not project_id:
            return jsonify({'status': 'error', 'message': 'Project ID required'}), 400
        
        if not hasattr(request, 'current_user'):
            return jsonify({'status': 'error', 'message': 'Authentication required'}), 401
        
        user_id = request.current_user['user_id']
        
        try:
            cursor = mysql.connection.cursor()
            cursor.execute("SELECT person_id FROM User WHERE user_id = %s", (user_id,))
            user_data = cursor.fetchone()
            
            if not user_data or not user_data.get('person_id'):
                cursor.close()
                return jsonify({'status': 'error', 'message': 'User must have a claimed profile to modify projects'}), 403
            
            person_id = user_data['person_id']
            
            cursor.execute("SELECT person_id FROM Project WHERE project_id = %s", (project_id,))
            project_data = cursor.fetchone()
            cursor.close()
            
            if not project_data:
                return jsonify({'status': 'error', 'message': 'Project not found'}), 404
            
            if project_data['person_id'] != person_id:
                return jsonify({'status': 'error', 'message': 'You do not have permission to modify this project'}), 403
            
            return f(*args, **kwargs)
            
        except Exception as e:
            return jsonify({'status': 'error', 'message': 'Authorization check failed'}), 500
    
    return decorated

def verify_user_access(f):
    """Verify user can only access their own data. Use after @token_required."""
    @wraps(f)
    def decorated(*args, **kwargs):
        url_user_id = kwargs.get('user_id')
        if not url_user_id:
            return jsonify({'status': 'error', 'message': 'User ID required'}), 400
        
        if not hasattr(request, 'current_user'):
            return jsonify({'status': 'error', 'message': 'Authentication required'}), 401
        
        token_user_id = request.current_user['user_id']
        
        if int(url_user_id) != int(token_user_id):
            return jsonify({'status': 'error', 'message': 'You can only access your own data'}), 403
        
        return f(*args, **kwargs)
    
    return decorated
