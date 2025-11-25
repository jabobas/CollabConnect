from flask import Blueprint, jsonify, request

# Create blueprint for department routes
department_bp = Blueprint('department', __name__, url_prefix='/department')

# Get routes

@department_bp.route('/by-name/<string:department_name>', methods=['GET'])
def get_department_by_name(department_name):
    from app import mysql
    cursor = mysql.connection.cursor()
    # Get department by name
    cursor.callproc('SelectDepartmentByName', [department_name])
    result = cursor.fetchone()
    cursor.close()
    
    if not result:
        return jsonify({'status': 'not_found', 'message': 'Department not found'}), 404
        
    return jsonify({'status': 'success', 'data': result})


# Post routes

@department_bp.route('/', methods=['POST'])
def create_department():
    from app import mysql
    # Get JSON data from request body
    data = request.get_json()
    
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
    
    mysql.connection.commit()
    cursor.close()
    
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
    
    cursor = mysql.connection.cursor()
    # Update all department fields at once
    cursor.callproc('UpdateDepartmentDetails', [
        department_id,
        data.get('department_phone'),
        data.get('department_email'),
        data.get('department_name')
    ])
    mysql.connection.commit()
    cursor.close()
    
    return jsonify({
        'status': 'success',
        'message': 'Department updated successfully'
    })


# Delete routes

@department_bp.route('/<int:department_id>', methods=['DELETE'])
def delete_department(department_id):
    from app import mysql
    cursor = mysql.connection.cursor()
    # Delete department
    cursor.callproc('DeleteDepartment', [department_id])
    mysql.connection.commit()
    cursor.close()
    
    return jsonify({
        'status': 'success',
        'message': 'Department deleted successfully'
    })
