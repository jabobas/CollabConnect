"""
Filename: institution_routes.py
Author: Lucas Matheson
Edited by: Lucas Matheson
Date: November 27, 2025

This file contains the routes for managing institutions in the CollabConnect application
"""

from flask import Blueprint, jsonify
from utils.logger import log_info, log_error


institution_bp = Blueprint('institution', __name__, url_prefix='/institution')


@institution_bp.route("/one/<int:id>", methods=['GET'])  
def get_institution(id: int):
    from app import mysql 
    cursor = None
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.callproc('GetDepartmentsAndPeopleByInstitutionId', [id])
        
        results = cursor.fetchall()
        # Consume remaining result sets from stored procedure
        while cursor.nextset():
            pass
        
        mysql.connection.commit()

        # to ensure effiecent frontend rendering, this loop will process the data into a better 
        # key : value structure, making department and person name be keys so in the frontend, 
        # data can be accessed in O(1) instead of processing through it on the client side, Which is improper full-stack development
        # Note there are no person duplicates, so no need to check each person to see if they already exist
        out = {'institution_name': results[0]['institution_name']}
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
        mysql.connection.rollback()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        if cursor:
            cursor.close()
        
@institution_bp.route("/all")
def get_all_institutions_departments_people():
    
    from app import mysql 
    cursor = None
    try:
        log_info("Fetching all institutions, departments, and people")
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.callproc('GetAllInstitutionsDepartmentsAndPeople')
        
        # Fetch all results from the procedure
        results = cursor.fetchall()
        if results is None:
            results = []
        # Consume remaining result sets from stored procedure
        while cursor.nextset():
            pass
        mysql.connection.commit()
        log_info("Transaction committed for fetching institutions/departments/people")

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
    finally:
        if cursor:
            cursor.close()