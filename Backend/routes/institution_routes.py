from flask import Blueprint, jsonify


institution_bp = Blueprint('institution', __name__, url_prefix='/institution')


@institution_bp.route("/one/<int:id>", methods=['GET'])  
def get_institution(id: int):
    from app import mysql 

    try:
        cursor = mysql.connection.cursor()
        cursor.callproc('GetDepartmentsAndPeopleByInstitutionId', [id])
        
        results = cursor.fetchall()
        
        cursor.close()

        # to ensure effiecent frontend rendering, this loop will process the data into a better 
        # key : value structure, making department and person name be keys so in the frontend, 
        # data can be accessed in O(1) instead of processing through it on the client side, Which is improper full-stack development
        # Note there are no person duplicates, so no need to check each person to see if they already exist
        out = {}
        for curr in results:
            print(curr)
            # if departmant name isn't already a key, a new key value
            if curr['department_name'] not in out:
                out[curr['department_name']] = {}
            # department already exists
            out[curr['department_name']][curr['person_name']] = curr


        return jsonify({
            "status": "success",
            "data": out,
            "count": len(results)
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
        
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