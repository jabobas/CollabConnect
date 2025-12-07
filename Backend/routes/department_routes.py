from flask import Blueprint, jsonify, request
from utils.logger import log_info, log_error, get_request_user

# Create blueprint for department routes
department_bp = Blueprint('department', __name__, url_prefix='/department')

# Get routes

@department_bp.route('/<int:department_id>', methods=['GET'])
def get_department_by_id(department_id):
    from app import mysql
    log_info(f"[{get_request_user()}] Fetching department: department_id={department_id}")
    cursor = mysql.connection.cursor()
    cursor.execute('''
        SELECT d.*, i.institution_name, i.institution_id
        FROM Department d
        JOIN Institution i ON d.institution_id = i.institution_id
        WHERE d.department_id = %s
    ''', (department_id,))
    result = cursor.fetchone()
    cursor.close()
    
    if not result:
        log_error(f"Department not found: department_id={department_id}")
        return jsonify({'status': 'not_found', 'message': 'Department not found'}), 404
    
    log_info(f"Department fetched: department_id={department_id}")
    return jsonify({'status': 'success', 'data': result})

# Fetch all people working in this department with their details
@department_bp.route('/<int:department_id>/people', methods=['GET'])
def get_department_people(department_id):
    from app import mysql
    log_info(f"Fetching people for department: department_id={department_id}")
    cursor = mysql.connection.cursor()
    cursor.execute('''
        SELECT p.*, d.department_name, i.institution_name 
        FROM Person p
        JOIN WorksIn wi ON p.person_id = wi.person_id
        JOIN Department d ON wi.department_id = d.department_id
        JOIN Institution i ON d.institution_id = i.institution_id
        WHERE d.department_id = %s
    ''', (department_id,))
    people = cursor.fetchall()
    cursor.close()
    
    for person in people:
        person['expertises'] = [e for e in [person.get('expertise_1'), person.get('expertise_2'), person.get('expertise_3')] if e]
    
    log_info(f"Fetched {len(people)} people for department_id={department_id}")
    return jsonify({'status': 'success', 'data': people, 'count': len(people)})


@department_bp.route('/by-name/<string:department_name>', methods=['GET'])
def get_department_by_name(department_name):
    from app import mysql
    log_info(f"Fetching department by name: {department_name}")
    cursor = mysql.connection.cursor()
    # Get department by name
    cursor.callproc('SelectDepartmentByName', [department_name])
    result = cursor.fetchone()
    # Clear remaining result sets 
    while cursor.nextset():
        pass
    cursor.close()
    
    if not result:
        log_error(f"Department not found: {department_name}")
        return jsonify({'status': 'not_found', 'message': 'Department not found'}), 404
    
    log_info(f"Department fetched by name: {department_name}")
    return jsonify({'status': 'success', 'data': result})


# Post routes

@department_bp.route('/', methods=['POST'])
def create_department():
    from app import mysql
    # Get JSON data from request body
    data = request.get_json()
    
    log_info(f"Creating department: {data.get('department_name')}")
    cursor = mysql.connection.cursor()
    # Insert new department with provided data
    cursor.callproc('InsertIntoDepartment', [
        data.get('department_phone'),
        data.get('department_email'),
        data.get('department_name'),
        data.get('institution_id')
    ])
    
    # Get the new department_id from the procedure result
    result = cursor.fetchone()
    department_id = result['new_id'] if result else None
    while cursor.nextset():
        pass
    
    mysql.connection.commit()
    cursor.close()
    
    log_info(f"Department created: department_id={department_id}, name={data.get('department_name')}")
    return jsonify({
        'status': 'success',
        'message': 'Department created successfully',
        'department_id': department_id
    }), 201


# Patch routes (for updating existing departments)

@department_bp.route('/<int:department_id>', methods=['PATCH'])
def update_department(department_id):
    from app import mysql
    data = request.get_json()
    
    log_info(f"Updating department: department_id={department_id}")
    cursor = mysql.connection.cursor()
    # Update all department fields at once
    cursor.callproc('UpdateDepartmentDetails', [
        department_id,
        data.get('department_phone'),
        data.get('department_email'),
        data.get('department_name')
    ])
    while cursor.nextset():
        pass
    mysql.connection.commit()
    cursor.close()
    
    log_info(f"Department updated: department_id={department_id}")
    return jsonify({
        'status': 'success',
        'message': 'Department updated successfully'
    })


# Delete routes

@department_bp.route('/<int:department_id>', methods=['DELETE'])
def delete_department(department_id):
    from app import mysql
    log_info(f"Deleting department: department_id={department_id}")
    cursor = mysql.connection.cursor()
    # Delete department
    cursor.callproc('DeleteDepartment', [department_id])
    while cursor.nextset():
        pass
    mysql.connection.commit()
    cursor.close()
    
    log_info(f"Department deleted: department_id={department_id}")
    return jsonify({
        'status': 'success',
        'message': 'Department deleted successfully'
    })
