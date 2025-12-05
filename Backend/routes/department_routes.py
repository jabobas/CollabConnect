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
    
    while cursor.nextset():
        pass
    
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
    
    try:
        # Lock the department row before updating
        cursor.execute(
            "SELECT department_id FROM departments WHERE department_id = %s FOR UPDATE",
            (department_id,)
        )
        
        # Verify the row exists
        if cursor.fetchone() is None:
            return jsonify({
                'status': 'error',
                'message': 'Department not found'
            }), 404
        
        # Now call the stored procedure while holding the lock
        cursor.callproc('UpdateDepartmentDetails', [
            department_id,
            data.get('department_phone'),
            data.get('department_email'),
            data.get('department_name')
        ])
        
        mysql.connection.commit()  # Releases the lock
        
        return jsonify({
            'status': 'success',
            'message': 'Department updated successfully'
        })
        
    except Exception as e:
        mysql.connection.rollback()  # Release lock on error
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
        
    finally:
        cursor.close()

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
