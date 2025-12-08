from utils.logger import log_info, log_error, get_request_user
from utils.jwt_utils import token_required
from flask import Blueprint, jsonify, request

# Blueprint for person-related endpoints
person_bp = Blueprint('person', __name__, url_prefix='/person')


@person_bp.route('', methods=['POST'])
def create_person():
    """Create a new person profile"""
    from app import mysql
    
    data = request.get_json()
    
    # Extract form data with defaults
    person_name = data.get('person_name')
    person_email = data.get('person_email')
    person_phone = data.get('person_phone')
    bio = data.get('bio')
    expertise_1 = data.get('expertise_1')
    expertise_2 = data.get('expertise_2')
    expertise_3 = data.get('expertise_3')
    main_field = data.get('expertise_1')  # Use primary expertise as main field
    department_id = None  # Will be set later if department exists
    
    if not person_name or not person_email:
        return jsonify({'status': 'error', 'message': 'Name and email required'}), 400
    
    cursor = None
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.callproc('InsertPerson', [
            person_name, person_email, person_phone, bio,
            expertise_1, expertise_2, expertise_3, main_field, department_id
        ])
        result = cursor.fetchone()
        person_id = result['person_id'] if result else None
        
        while cursor.nextset():
            pass
        
        mysql.connection.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Profile created',
            'data': {'person_id': person_id}
        }), 201
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@person_bp.route('/all', methods=['GET'])
def get_all_people():
    """Return all people using the GetAllPeople stored procedure."""
    from app import mysql
    cursor = None
    try:
        log_info("Fetching all people")
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        log_info("Transaction started for fetching people")
        cursor.callproc('GetAllPeople')
        results = cursor.fetchall()
        # Consume remaining result sets from stored procedure
        while cursor.nextset():
            pass
        mysql.connection.commit()
        log_info("Transaction committed for fetching people")

        # Normalize expertise fields into a list for each person, excluding nulls
        for row in results:
            if 'expertise_1' in row:
                row['expertises'] = [e for e in [row.get('expertise_1'), row.get('expertise_2'), row.get('expertise_3')] if e]
        log_info(f"Fetched {len(results)} people")
        return jsonify({
            'status': 'success',
            'data': results,
            'count': len(results)
        })
    except Exception as e:
        mysql.connection.rollback()
        log_error(f"Transaction rolled back for fetching people: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@person_bp.route('/by-name/<string:person_name>', methods=['GET'])
def get_person_by_name(person_name: str):
    """Return a single person record by name using SelectPersonByName."""
    from app import mysql
    cursor = None
    try:
        log_info(f"Fetching person by name: {person_name}")
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        log_info("Transaction started for fetching person by name")
        cursor.callproc('SelectPersonByName', [person_name])
        result = cursor.fetchone()
        # Consume remaining result sets from stored procedure
        while cursor.nextset():
            pass
        mysql.connection.commit()
        log_info("Transaction committed for fetching person by name")
        if not result:
            log_info(f"Person not found: {person_name}")
            return jsonify({'status': 'not_found', 'message': 'Person not found'}), 404
        result['expertises'] = [e for e in [result.get('expertise_1'), result.get('expertise_2'), result.get('expertise_3')] if e]
        log_info(f"Person found: {person_name}")
        return jsonify({'status': 'success', 'data': result})
    except Exception as e:
        mysql.connection.rollback()
        log_error(f"Transaction rolled back for fetching person by name: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@person_bp.route('/<int:person_id>', methods=['PUT'])
@token_required
def update_person(person_id: int):
    """Update a person profile using UpdatePerson stored procedure."""
    from app import mysql
    
    data = request.get_json()
    user_id = request.current_user['user_id']
    
    cursor = None
    try:
        log_info(f"Updating person profile: person_id={person_id}, user_id={user_id}")
        cursor = mysql.connection.cursor()
        
        # Start transaction
        cursor.execute("START TRANSACTION")
        log_info("Transaction started for updating person")
        
        # Handle institution - find or create
        institution_id = None
        institution_name = data.get('institution_name')
        if institution_name:
            cursor.callproc('SelectInstitutionByName', [institution_name])
            inst_result = cursor.fetchone()
            while cursor.nextset():
                pass
            
            if inst_result:
                institution_id = inst_result['institution_id']
            else:
                # Create new institution - InsertIntoInstitution(name, type, street, city, state, zipcode, phone)
                cursor.callproc('InsertIntoInstitution', [institution_name, None, None, None, None, None, None])
                result = cursor.fetchone()
                institution_id = result['new_id'] if result else None
                while cursor.nextset():
                    pass
        
        # Handle department - find or create
        department_id = None
        department_name = data.get('department_name')
        if department_name and institution_id:
            cursor.callproc('SelectDepartmentByName', [department_name])
            dept_result = cursor.fetchone()
            while cursor.nextset():
                pass
            
            if dept_result:
                department_id = dept_result['department_id']
            else:
                # Create new department - InsertIntoDepartment(phone, email, name, institution_id)
                cursor.callproc('InsertIntoDepartment', [None, None, department_name, institution_id])
                result = cursor.fetchone()
                department_id = result['new_id'] if result else None
                while cursor.nextset():
                    pass
        
        # Call UpdatePerson stored procedure
        cursor.callproc('UpdatePerson', [
            person_id,
            data.get('person_name'),
            data.get('person_email'),
            data.get('person_phone'),
            data.get('bio'),
            data.get('expertise_1'),
            data.get('expertise_2'),
            data.get('expertise_3'),
            data.get('expertise_1'),  # main_field = expertise_1
            department_id
        ])
        
        # Consume remaining result sets
        while cursor.nextset():
            pass
        
        mysql.connection.commit()
        log_info(f"Person profile updated successfully: person_id={person_id}")
        
        return jsonify({
            'status': 'success',
            'message': 'Profile updated successfully'
        }), 200
        
    except Exception as e:
        mysql.connection.rollback()
        log_error(f"Transaction rolled back for updating person: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@person_bp.route('/<int:person_id>', methods=['DELETE'])
@token_required
def delete_person(person_id: int):
    """Delete a person account using DeletePerson stored procedure."""
    from app import mysql
    
    user_id = request.current_user['user_id']
    
    cursor = None
    try:
        log_info(f"Deleting person account: person_id={person_id}, user_id={user_id}")
        cursor = mysql.connection.cursor()
        
        # Verify the person_id matches the logged-in user's person_id
        stored_person_id = request.current_user.get('person_id')
        if stored_person_id != person_id:
            log_error(f"Unauthorized delete attempt: user {user_id} tried to delete person {person_id}")
            return jsonify({
                'status': 'error',
                'message': 'Unauthorized: You can only delete your own account'
            }), 403
        
        # Start transaction
        cursor.execute("START TRANSACTION")
        log_info("Transaction started for deleting person")
        
        # First delete the associated user account
        cursor.callproc('DeleteUser', [user_id])
        while cursor.nextset():
            pass
        
        # Then delete the person record (this will cascade to related records)
        cursor.callproc('DeletePerson', [person_id])
        while cursor.nextset():
            pass
        
        mysql.connection.commit()
        log_info(f"Person account deleted successfully: person_id={person_id}")
        
        return jsonify({
            'status': 'success',
            'message': 'Account deleted successfully'
        }), 200
        
    except Exception as e:
        mysql.connection.rollback()
        log_error(f"Transaction rolled back for deleting person: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@person_bp.route('/<int:person_id>', methods=['GET'])
def get_person_full(person_id: int):
    """Return full person context including department and institution using SelectPersonFullContextByID."""
    from app import mysql
    cursor = None
    try:
        log_info(f"Fetching full person context: person_id={person_id}")
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        log_info("Transaction started for fetching full person context")
        cursor.callproc('SelectPersonFullContextByID', [person_id])
        person = cursor.fetchone()
        # Consume remaining result sets from stored procedure
        while cursor.nextset():
            pass
        mysql.connection.commit()
        log_info("Transaction committed for fetching full person context")

        if not person:
            log_info(f"Person not found: person_id={person_id}")
            return jsonify({'status': 'not_found', 'message': 'Person not found'}), 404

        # Build expertises list excluding nulls
        person['expertises'] = [e for e in [person.get('expertise_1'), person.get('expertise_2'), person.get('expertise_3')] if e]

        # Build structured response separating concerns
        institution_fields = {k: v for k, v in person.items() if k.startswith('institution_') or k in ['street', 'city', 'state', 'zipcode']}
        department_fields = {k: v for k, v in person.items() if k.startswith('department_')}
        person_fields = {k: v for k, v in person.items() if k.startswith('person_') or k in ['bio', 'expertise_1', 'expertise_2', 'expertise_3', 'main_field', 'expertises']}

        log_info(f"Full person context returned: person_id={person_id}")
        return jsonify({
            'status': 'success',
            'data': {
                'person': person_fields,
                'department': department_fields,
                'institution': institution_fields
            }
        })
    except Exception as e:
        mysql.connection.rollback()
        log_error(f"Transaction rolled back for fetching full person context: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@person_bp.route('/<int:person_id>/projects', methods=['GET'])
def get_person_projects(person_id: int):
    """Return list of projects for a person using SelectProjectsByPersonID."""
    from app import mysql
    cursor = None
    try:
        log_info(f"Fetching projects for person_id={person_id}")
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        log_info("Transaction started for fetching projects for person")
        cursor.callproc('SelectProjectsByPersonID', [person_id])
        projects = cursor.fetchall()
        while cursor.nextset():
            pass
        mysql.connection.commit()
        log_info("Transaction committed for fetching projects for person")
        log_info(f"Fetched {len(projects)} projects for person_id={person_id}")
        return jsonify({
            'status': 'success',
            'data': projects,
            'count': len(projects)
        })
    except Exception as e:
        mysql.connection.rollback()
        log_error(f"Transaction rolled back for fetching projects for person: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
