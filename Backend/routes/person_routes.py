from flask import Blueprint, jsonify

# Blueprint for person-related endpoints
person_bp = Blueprint('person', __name__, url_prefix='/person')


@person_bp.route('/all', methods=['GET'])
def get_all_people():
    """Return all people using the GetAllPeople stored procedure."""
    from app import mysql
    try:
        cursor = mysql.connection.cursor()
        cursor.callproc('GetAllPeople')
        results = cursor.fetchall()
        cursor.close()

        # Normalize expertise fields into a list for each person, excluding nulls
        for row in results:
            if 'expertise_1' in row:
                row['expertises'] = [e for e in [row.get('expertise_1'), row.get('expertise_2'), row.get('expertise_3')] if e]
        return jsonify({
            'status': 'success',
            'data': results,
            'count': len(results)
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@person_bp.route('/by-name/<string:person_name>', methods=['GET'])
def get_person_by_name(person_name: str):
    """Return a single person record by name using SelectPersonByName."""
    from app import mysql
    try:
        cursor = mysql.connection.cursor()
        cursor.callproc('SelectPersonByName', [person_name])
        result = cursor.fetchone()
        cursor.close()
        if not result:
            return jsonify({'status': 'not_found', 'message': 'Person not found'}), 404
        result['expertises'] = [e for e in [result.get('expertise_1'), result.get('expertise_2'), result.get('expertise_3')] if e]
        return jsonify({'status': 'success', 'data': result})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@person_bp.route('/<int:person_id>', methods=['GET'])
def get_person_full(person_id: int):
    """Return full person context including department and institution using SelectPersonFullContextByID."""
    from app import mysql
    try:
        cursor = mysql.connection.cursor()
        cursor.callproc('SelectPersonFullContextByID', [person_id])
        person = cursor.fetchone()
        cursor.close()

        if not person:
            return jsonify({'status': 'not_found', 'message': 'Person not found'}), 404

        # Build expertises list excluding nulls
        person['expertises'] = [e for e in [person.get('expertise_1'), person.get('expertise_2'), person.get('expertise_3')] if e]

        # Build structured response separating concerns
        institution_fields = {k: v for k, v in person.items() if k.startswith('institution_') or k in ['street', 'city', 'state', 'zipcode']}
        department_fields = {k: v for k, v in person.items() if k.startswith('department_')}
        person_fields = {k: v for k, v in person.items() if k.startswith('person_') or k in ['bio', 'expertise_1', 'expertise_2', 'expertise_3', 'main_field', 'expertises']}

        return jsonify({
            'status': 'success',
            'data': {
                'person': person_fields,
                'department': department_fields,
                'institution': institution_fields
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@person_bp.route('/<int:person_id>/projects', methods=['GET'])
def get_person_projects(person_id: int):
    """Return list of projects for a person using SelectProjectsByPersonID."""
    from app import mysql
    try:
        cursor = mysql.connection.cursor()
        cursor.callproc('SelectProjectsByPersonID', [person_id])
        projects = cursor.fetchall()
        cursor.close()
        return jsonify({
            'status': 'success',
            'data': projects,
            'count': len(projects)
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
