
# -- User profile management routes for viewing user info, searching profiles
# -- to claim, linking user accounts to person profiles, and viewing user projects.

from flask import Blueprint, request, jsonify
from utils.jwt_utils import token_required

user_bp = Blueprint('user', __name__)

@user_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get user profile information by user ID"""
    from app import mysql
    
    cursor = mysql.connection.cursor()
    cursor.callproc('SelectUserById', [user_id])
    user = cursor.fetchone()
    
    while cursor.nextset():
        pass
    cursor.close()
    
    if not user:
        return jsonify({'status': 'error', 'message': 'User not found'}), 404
    
    return jsonify({
        'status': 'success',
        'data': {
            'user_id': user['user_id'],
            'person_id': user['person_id'],
            'email': user['email'],
            'created_at': str(user['created_at']),
            'last_login': str(user['last_login']) if user['last_login'] else None,
            'person_name': user.get('person_name'),
            'person_email': user.get('person_email'),
            'person_phone': user.get('person_phone'),
            'bio': user.get('bio'),
            'expertise_1': user.get('expertise_1'),
            'expertise_2': user.get('expertise_2'),
            'expertise_3': user.get('expertise_3'),
            'department_name': user.get('department_name'),
            'institution_name': user.get('institution_name')
        }
    }), 200

@user_bp.route('/user/search-profile', methods=['GET'])
def search_profile():
    """Search for Person profiles to claim - finds profiles from scraped data"""
    from app import mysql
    
    name = request.args.get('name', '')
    email = request.args.get('email', '')
    
    if not name and not email:
        return jsonify({'status': 'error', 'message': 'Name or email required'}), 400
    
    cursor = mysql.connection.cursor()
    
    # Search for matching persons and check if already claimed
    query = """
        SELECT 
            p.person_id,
            p.person_name,
            p.person_email,
            p.person_phone,
            p.bio,
            p.expertise_1,
            p.expertise_2,
            p.expertise_3,
            CASE WHEN u.person_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_claimed
        FROM Person p
        LEFT JOIN User u ON p.person_id = u.person_id
        WHERE p.person_name LIKE %s OR p.person_email LIKE %s
        LIMIT 20
    """
    
    search_term = f"%{name if name else email}%"
    cursor.execute(query, (search_term, search_term))
    results = cursor.fetchall()
    cursor.close()
    
    profiles = []
    for row in results:
        profiles.append({
            'person_id': row['person_id'],
            'person_name': row['person_name'],
            'person_email': row['person_email'],
            'person_phone': row['person_phone'],
            'bio': row['bio'],
            'expertises': [exp for exp in [row.get('expertise_1'), row.get('expertise_2'), row.get('expertise_3')] if exp],
            'is_claimed': bool(row['is_claimed'])
        })
    
    return jsonify({'status': 'success', 'data': profiles}), 200

@user_bp.route('/user/<int:user_id>/claim-person/<int:person_id>', methods=['POST'])
@token_required
def claim_person(user_id, person_id):
    """Link user account to existing person profile - requires JWT authentication"""
    from app import mysql
    
    # Security check: users can only claim profiles for their own account
    if request.current_user['user_id'] != user_id:
        return jsonify({'status': 'error', 'message': 'Can only claim your own profile'}), 403
    
    # Link user to person using stored procedure
    cursor = mysql.connection.cursor()
    cursor.callproc('LinkUserToPerson', [user_id, person_id])
    result = cursor.fetchone()
    
    while cursor.nextset():
        pass
    mysql.connection.commit()
    cursor.close()
    
    return jsonify({'status': 'success', 'message': 'Profile claimed'}), 200

@user_bp.route('/user/<int:user_id>/projects', methods=['GET'])
def get_user_projects(user_id):
    """Get all projects for a user - requires linked person profile"""
    from app import mysql
    
    # First check if user has a linked person profile
    cursor = mysql.connection.cursor()
    cursor.callproc('SelectUserById', [user_id])
    user = cursor.fetchone()
    
    while cursor.nextset():
        pass
    
    # Return 404 if no person profile is linked (expected for new users)
    if not user or not user.get('person_id'):
        return jsonify({'status': 'error', 'message': 'No person profile'}), 404
    
    query = """
        SELECT 
            pr.project_id,
            pr.project_title,
            pr.project_description,
            pr.start_date,
            pr.end_date,
            pr.tag_name,
            wo.project_role
        FROM Project pr
        JOIN WorkedOn wo ON pr.project_id = wo.project_id
        WHERE wo.person_id = %s
        ORDER BY pr.start_date DESC
    """
    
    cursor.execute(query, (user['person_id'],))
    projects = cursor.fetchall()
    cursor.close()
    
    project_list = []
    for row in projects:
        project_list.append({
            'project_id': row['project_id'],
            'project_title': row['project_title'],
            'project_description': row['project_description'],
            'start_date': str(row['start_date']) if row['start_date'] else None,
            'end_date': str(row['end_date']) if row['end_date'] else None,
            'tag_name': row.get('tag_name'),
            'project_role': row['project_role']
        })
    
    return jsonify({'status': 'success', 'data': project_list}), 200
