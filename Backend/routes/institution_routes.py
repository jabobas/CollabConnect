from flask import Blueprint, jsonify


institution_bp = Blueprint('institution', __name__, url_prefix='/institution')

@institution_bp.route("/all")
def get_all_institutions_departments_people():
    from app import mysql 

    try:
        cursor = mysql.connection.cursor()
        cursor.callproc('GetAllInstitutionsDepartmentsAndPeople')
        
        # Fetch all results from the procedure
        results = cursor.fetchall()
        
        cursor.close()

        for curr in results:
            curr['expertises'] = [
                curr['expertise_1'],
                curr['expertise_2'],
                curr['expertise_3']
            ]   

        # Return the results as JSON, since the view function needs a response tuple in the
        # form (body, status, headers)
        return jsonify({
            "status": "success",
            "data": results,
            "count": len(results)
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500