from flask import Blueprint, jsonify
from utils.logger import log_info, log_error, get_request_user


institution_bp = Blueprint('institution', __name__, url_prefix='/institution')

@institution_bp.route("/all")
def get_all_institutions_departments_people():
    from app import mysql 

    try:
        log_info(f"[{get_request_user()}] Fetching all institutions, departments, and people")
        cursor = mysql.connection.cursor()
        cursor.callproc('GetAllInstitutionsDepartmentsAndPeople')
        
        # Fetch all results from the procedure
        results = cursor.fetchall()
        if results is None:
            results = []
        log_info("Transaction committed for fetching institutions/departments/people")
        cursor.close()

        for curr in results:
            curr['expertises'] = [
                curr.get('expertise_1'),
                curr.get('expertise_2'),
                curr.get('expertise_3')
            ]
        log_info(f"Fetched {len(results)} institution/department/people records")
        return jsonify({
            "status": "success",
            "data": results,
            "count": len(results)
        })
    except Exception as e:
        mysql.connection.rollback()
        log_error(f"Transaction rolled back for fetching institutions/departments/people: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500