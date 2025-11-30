from flask import Blueprint, jsonify
from Backend.utils.logger import log_info, log_error

# Blueprint for person-related endpoints
person_bp = Blueprint('person', __name__, url_prefix='/person')


@person_bp.route('/all', methods=['GET'])
def get_all_people():
    """Return all people using the GetAllPeople stored procedure."""
    from app import mysql
    try:
        log_info("Fetching all people")
        log_info("Transaction started for fetching people")
        cursor = mysql.connection.cursor()
        cursor.callproc('GetAllPeople')
        results = cursor.fetchall()
        log_info("Transaction committed for fetching people")
        cursor.close()

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


@person_bp.route('/by-name/<string:person_name>', methods=['GET'])
def get_person_by_name(person_name: str):
    """Return a single person record by name using SelectPersonByName."""
    from app import mysql
    try:
        log_info(f"Fetching person by name: {person_name}")
        log_info("Transaction started for fetching person by name")
        cursor = mysql.connection.cursor()
        cursor.callproc('SelectPersonByName', [person_name])
        result = cursor.fetchone()
        log_info("Transaction committed for fetching person by name")
        cursor.close()
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


@person_bp.route('/<int:person_id>', methods=['GET'])
def get_person_full(person_id: int):
    """Return full person context including department and institution using SelectPersonFullContextByID."""
    from app import mysql
    try:
        log_info(f"Fetching full person context: person_id={person_id}")
        log_info("Transaction started for fetching full person context")
        cursor = mysql.connection.cursor()
        cursor.callproc('SelectPersonFullContextByID', [person_id])
        person = cursor.fetchone()
        log_info("Transaction committed for fetching full person context")
        cursor.close()

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


@person_bp.route('/<int:person_id>/projects', methods=['GET'])
def get_person_projects(person_id: int):
    """Return list of projects for a person using SelectProjectsByPersonID."""
    from app import mysql
    try:
        log_info(f"Fetching projects for person_id={person_id}")
        log_info("Transaction started for fetching projects for person")
        cursor = mysql.connection.cursor()
        cursor.callproc('SelectProjectsByPersonID', [person_id])
        projects = cursor.fetchall()
        log_info("Transaction committed for fetching projects for person")
        cursor.close()
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
