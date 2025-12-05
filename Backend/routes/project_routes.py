from flask import Blueprint, jsonify, request
from threading import Lock

"""

Filename: index.jsx
Author: Lucas Matheson
Edited by: Lucas Matheson
Date: November 28, 2025

These routes look to provide access to the database for all project data. 


"""

project_bp = Blueprint('project', __name__, url_prefix='/project')

@project_bp.route("/num-projects-per-person", methods=['GET'])
def get_num_projects_per_person():
    
    from app import mysql 
    
    try:
        cursor = mysql.connection.cursor()
        cursor.callproc('SelectNumProjectsPerPerson')
        
        results = cursor.fetchall()
        cursor.close()
        out = {}
        for curr in results:
            out[curr['person_id']] = {'num_projects': curr['num_projects'], 'person_name': curr['person_name']}
        return jsonify({
            "status": "success",
            "data": out,
            "count": len(results)
        })
        
    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


