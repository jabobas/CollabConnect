
# -- User profile management routes for viewing user info, searching profiles
# -- to claim, linking user accounts to person profiles, and viewing user projects.

from flask import Blueprint, request, jsonify
from utils.jwt_utils import token_required
from utils.logger import log_info, log_error, get_request_user

user_bp = Blueprint('user', __name__)

@user_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get user profile information by user ID"""
    from app import mysql
    cursor = None
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.callproc('SelectUserById', [user_id])
        user = cursor.fetchone()
        
        while cursor.nextset():
            pass
        mysql.connection.commit()
        
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
                'department_id': user.get('department_id'),
                'department_name': user.get('department_name'),
                'institution_id': user.get('institution_id'),
                'institution_name': user.get('institution_name')
            }
        }), 200
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@user_bp.route('/user/search-profile', methods=['GET'])
def search_profile():
    """Search for Person profiles to claim - finds profiles from scraped data"""
    from app import mysql
    
    name = request.args.get('name', '')
    email = request.args.get('email', '')
    
    log_info(f"Searching for profile: name={name}, email={email}")
    
    if not name and not email:
        return jsonify({'status': 'error', 'message': 'User ID and person ID required'}), 400
    
    cursor = None
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
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
        mysql.connection.commit()
        
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
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@user_bp.route('/user/<int:user_id>/claim-person/<int:person_id>', methods=['POST'])
@token_required
def claim_person(user_id, person_id):
    """Link user account to existing person profile - requires JWT authentication"""
    from app import mysql
    
    auth_user_id = request.current_user['user_id']
    log_info(f"[User: {auth_user_id}] Claiming profile: user_id={user_id}, person_id={person_id}")
    
    # Security check: users can only claim profiles for their own account
    if auth_user_id != user_id:
        log_error(f"[User: {auth_user_id}] Unauthorized claim attempt: user_id={user_id}, person_id={person_id}")
        return jsonify({'status': 'error', 'message': 'Can only claim your own profile'}), 403
    
    cursor = None
    try:
        # Link user to person using stored procedure
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.callproc('LinkUserToPerson', [user_id, person_id])
        result = cursor.fetchone()
        
        while cursor.nextset():
            pass
        mysql.connection.commit()
        
        return jsonify({
            'status': 'success', 
            'message': 'Profile claimed',
            'data': {'person_id': person_id}
        }), 200
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@user_bp.route('/user/<int:user_id>/projects', methods=['GET'])
def get_user_projects(user_id):
    """Get all projects for a user - requires linked person profile"""
    from app import mysql
    cursor = None
    try:
        # First check if user has a linked person profile
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.callproc('SelectUserById', [user_id])
        user = cursor.fetchone()
        
        while cursor.nextset():
            pass
        
        # Return 404 if no person profile is linked (expected for new users)
        if not user or not user.get('person_id'):
            mysql.connection.commit()
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
        mysql.connection.commit()
        
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
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

@user_bp.route('/user/<int:user_id>/projects', methods=['POST'])
@token_required
def add_user_project(user_id):
    """Add a new project for the user"""
    from app import mysql
    
    auth_user_id = request.current_user['user_id']
    log_info(f"[User: {auth_user_id}] Adding project for user_id={user_id}")
    
    if auth_user_id != user_id:
        log_error(f"[User: {auth_user_id}] Unauthorized project add attempt for user_id={user_id}")
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
    
    data = request.get_json()
    
    if not data.get('project_title'):
        return jsonify({'status': 'error', 'message': 'Project title required'}), 400
    
    cursor = mysql.connection.cursor()
    
    try:
        cursor.execute("START TRANSACTION")
        cursor.callproc('SelectUserById', [user_id])
        user = cursor.fetchone()
        while cursor.nextset():
            pass
        
        if not user or not user.get('person_id'):
            mysql.connection.rollback()
            return jsonify({'status': 'error', 'message': 'No person profile linked'}), 404
        
        person_id = user['person_id']
        
        cursor.callproc('InsertIntoProject', [
            data['project_title'],
            data.get('project_description'),
            person_id,
            data.get('tag_name'),
            data.get('start_date'),
            data.get('end_date')
        ])
        result = cursor.fetchone()
        project_id = result['project_id'] if result else None
        while cursor.nextset():
            pass
        
        if not project_id:
            mysql.connection.rollback()
            raise Exception("Failed to create project")
        
        cursor.callproc('sp_insert_workedon', [
            person_id,
            project_id,
            data.get('project_role', 'Contributor'),
            data.get('start_date'),
            data.get('end_date')
        ])
        while cursor.nextset():
            pass
        mysql.connection.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Project added',
            'data': {'project_id': project_id}
        }), 201
        
    except Exception as e:
        mysql.connection.rollback()
        log_error(f"Failed to add project for user_id={user_id}: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        cursor.close()

@user_bp.route('/user/create-profile-with-affiliation', methods=['POST'])
@token_required
def create_profile_with_affiliation():
    """Create complete profile with institution/department relationships"""
    from app import mysql
    
    user_id = request.current_user['user_id']
    data = request.get_json()
    
    log_info(f"[User: {user_id}] Creating profile with affiliation")
    
    if not data.get('person_name') or not data.get('person_email'):
        log_error("Profile creation failed: Missing name or email")
        return jsonify({'status': 'error', 'message': 'Name and email required'}), 400
    
    cursor = mysql.connection.cursor()
    
    try:
        cursor.execute("START TRANSACTION")
        # Find or create institution
        institution_id = None
        if data.get('institution_name'):
            cursor.callproc('SelectInstitutionByName', [data['institution_name']])
            inst = cursor.fetchone()
            while cursor.nextset():
                pass
            
            if inst:
                institution_id = inst['institution_id']
            else:
                cursor.callproc('InsertIntoInstitution', [
                    data['institution_name'],
                    data.get('institution_type', 'Academic'),
                    None, None, None, None, None
                ])
                result = cursor.fetchone()
                institution_id = result['new_id'] if result else None
                while cursor.nextset():
                    pass
        
        # Find or create department (only if institution exists)
        department_id = None
        if institution_id and data.get('department_name'):
            cursor.execute("""
                SELECT department_id FROM Department 
                WHERE department_name = %s AND institution_id = %s
            """, (data['department_name'], institution_id))
            dept = cursor.fetchone()
            
            if dept:
                department_id = dept['department_id']
            else:
                cursor.callproc('InsertIntoDepartment', [
                    None,
                    None,
                    data['department_name'],
                    institution_id
                ])
                result = cursor.fetchone()
                department_id = result['new_id'] if result else None
                while cursor.nextset():
                    pass
        
        # Create person with department_id
        cursor.callproc('InsertPerson', [
            data['person_name'],
            data['person_email'],
            data.get('person_phone'),
            data.get('bio'),
            data.get('expertise_1'),
            data.get('expertise_2'),
            data.get('expertise_3'),
            data.get('expertise_1', 'General'),
            department_id
        ])
        result = cursor.fetchone()
        person_id = result['person_id'] if result else None
        while cursor.nextset():
            pass
        
        if not person_id:
            mysql.connection.rollback()
            raise Exception("Failed to create person")
        
        # Create WorksIn relationship if department exists
        if department_id:
            cursor.callproc('InsertWorksIn', [person_id, department_id])
            while cursor.nextset():
                pass
            
            # Create BelongsTo relationship
            cursor.callproc('sp_insert_belongsto', [
                department_id,
                institution_id,
                '2025-01-01',
                None
            ])
            while cursor.nextset():
                pass
        
        # Link user to person
        cursor.callproc('LinkUserToPerson', [user_id, person_id])
        while cursor.nextset():
            pass
        mysql.connection.commit()
        
        log_info(f"Profile created with affiliation: user_id={user_id}, person_id={person_id}")
        return jsonify({
            'status': 'success',
            'message': 'Profile created',
            'data': {'person_id': person_id, 'user_id': user_id}
        }), 201
        
    except Exception as e:
        mysql.connection.rollback()
        log_error(f"Failed to create profile with affiliation for user_id={user_id}: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        cursor.close()

