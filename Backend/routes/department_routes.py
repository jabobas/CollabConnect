from flask import Blueprint, jsonify, request
from utils.logger import log_info, log_error, get_request_user

# Create blueprint for department routes
department_bp = Blueprint('department', __name__, url_prefix='/department')

# Get routes

@department_bp.route('/<int:department_id>', methods=['GET'])
def get_department_by_id(department_id):
    from app import mysql
    cursor = None
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.execute('''
            SELECT d.*, i.institution_name, i.institution_id
            FROM Department d
            JOIN Institution i ON d.institution_id = i.institution_id
            WHERE d.department_id = %s
        ''', (department_id,))
        result = cursor.fetchone()
        mysql.connection.commit()
        
        if not result:
            return jsonify({'status': 'not_found', 'message': 'Department not found'}), 404
            
        return jsonify({'status': 'success', 'data': result})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()

# Fetch all people working in this department with their details
@department_bp.route('/<int:department_id>/people', methods=['GET'])
def get_department_people(department_id):
    from app import mysql
    cursor = None
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.execute('''
            SELECT p.*, d.department_name, i.institution_name 
            FROM Person p
            JOIN WorksIn wi ON p.person_id = wi.person_id
            JOIN Department d ON wi.department_id = d.department_id
            JOIN Institution i ON d.institution_id = i.institution_id
            WHERE d.department_id = %s
        ''', (department_id,))
        people = cursor.fetchall()
        mysql.connection.commit()
        
        for person in people:
            person['expertises'] = [e for e in [person.get('expertise_1'), person.get('expertise_2'), person.get('expertise_3')] if e]
        
        return jsonify({'status': 'success', 'data': people, 'count': len(people)})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@department_bp.route('/all', methods=['GET'])
def get_all_departments():
    """Get all departments for autocomplete"""
    from app import mysql
    cursor = None
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.execute('''
            SELECT department_id, department_name, institution_id
            FROM Department
            ORDER BY department_name
        ''')
        results = cursor.fetchall()
        mysql.connection.commit()
        return jsonify({'status': 'success', 'data': results, 'count': len(results)})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@department_bp.route('/by-name/<string:department_name>', methods=['GET'])
def get_department_by_name(department_name):
    from app import mysql
    cursor = None
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        # Get department by name
        cursor.callproc('SelectDepartmentByName', [department_name])
        result = cursor.fetchone()
        # Consume remaining result sets from stored procedure
        while cursor.nextset():
            pass
        mysql.connection.commit()
        
        if not result:
            return jsonify({'status': 'not_found', 'message': 'Department not found'}), 404
            
        return jsonify({'status': 'success', 'data': result})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


# Post routes

@department_bp.route('/', methods=['POST'])
def create_department():
    from app import mysql
    # Get JSON data from request body
    data = request.get_json()
    cursor = None
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
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
        
        return jsonify({
            'status': 'success',
            'message': 'Department created successfully',
            'department_id': department_id
        }), 201
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


# Patch routes (for updating existing departments)

@department_bp.route('/<int:department_id>', methods=['PATCH'])
def update_department(department_id):
    from app import mysql
    data = request.get_json()
    cursor = None
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
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
        
        return jsonify({
            'status': 'success',
            'message': 'Department updated successfully'
        })
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


# Delete routes

@department_bp.route('/<int:department_id>', methods=['DELETE'])
def delete_department(department_id):
    from app import mysql
    cursor = None
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.callproc('DeleteDepartment', [department_id])
        while cursor.nextset():
            pass
        mysql.connection.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Department deleted successfully'
        })
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
