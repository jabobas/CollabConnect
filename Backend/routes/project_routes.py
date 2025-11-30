'''
This file manages project related routes for the CollabConnect application.
It defines endpoints for creating, updating, deleting, and retrieving projects.
@author: Abbas Jabor
@date: November 20, 2025
'''
from flask import Blueprint, jsonify, request
from Backend.utils.logger import log_info, log_error

project_bp = Blueprint("project", __name__, url_prefix="/project")


@project_bp.route("/all", methods=["GET"])
def get_all_projects():
    from app import mysql
    try:
        log_info("Fetching all projects")
        cursor = mysql.connection.cursor()
        cursor.callproc("GetAllProjects")
        results = cursor.fetchall()
        cursor.close()
        log_info(f"Fetched {len(results)} projects")
        return jsonify({
            "status": "success",
            "data": results,
            "count": len(results)
        }), 200
    except Exception as e:
        log_error(f"Error fetching projects: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


@project_bp.route("/", methods=["POST"])
def create_project():
    from app import mysql
    try:
        data = request.get_json(force=True) or {}
        log_info(f"Create project request: {data}")
        required = ["title", "description", "person_id", "start_date", "end_date", "tag_name"]
        missing = [k for k in required if data.get(k) in (None, "")]
        if missing:
            log_error(f"Missing fields in create_project: {missing}")
            return jsonify({"status": "error", "message": f"Missing fields: {', '.join(missing)}"}), 400
        log_info("Transaction started for project creation")
        cursor = mysql.connection.cursor()
        cursor.callproc("InsertIntoProject", [
            data["title"],
            data["description"],
            data["person_id"],
            data["start_date"],
            data["end_date"],
            data["tag_name"]
        ])
        mysql.connection.commit()
        log_info("Transaction committed for project creation")
        cursor.close()
        log_info(f"Project created: title={data['title']}, description={data['description']}, person_id={data['person_id']}, start_date={data['start_date']}, end_date={data['end_date']}, tag_name={data['tag_name']}")
        return jsonify({"status": "success", "message": "Project created successfully"}), 201
    except Exception as e:
        mysql.connection.rollback()
        log_error(f"Transaction rolled back for project creation: {str(e)} | data={data}")
        return jsonify({"status": "error", "message": str(e)}), 500


@project_bp.route("/", methods=["PUT"])
def update_project():
    from app import mysql
    try:
        data = request.get_json(force=True) or {}
        if not data.get("id"):
            log_error("Update project failed: Field 'id' is required")
            return jsonify({"status": "error", "message": "Field 'id' is required"}), 400
        log_info("Transaction started for project update")
        cursor = mysql.connection.cursor()
        cursor.callproc("UpdateProjectDetails", [
            data.get("id"),
            data.get("title"),
            data.get("description"),
            data.get("start_date"),
            data.get("end_date"),
            data.get("tag_name")
        ])
        mysql.connection.commit()
        log_info("Transaction committed for project update")
        cursor.close()
        log_info(f"Project updated: id={data.get('id')}, title={data.get('title')}, description={data.get('description')}, start_date={data.get('start_date')}, end_date={data.get('end_date')}, tag_name={data.get('tag_name')}")
        return jsonify({"status": "success", "message": "Project updated successfully"}), 200
    except Exception as e:
        mysql.connection.rollback()
        log_error(f"Transaction rolled back for project update: {str(e)} | data={data}")
        return jsonify({"status": "error", "message": str(e)}), 500


@project_bp.route("/<int:project_id>", methods=["DELETE"])
def delete_project(project_id: int):
    from app import mysql
    try:
        log_info(f"Delete project request: project_id={project_id}")
        log_info("Transaction started for project deletion")
        cursor = mysql.connection.cursor()
        cursor.callproc("DeleteProject", [project_id])
        mysql.connection.commit()
        log_info("Transaction committed for project deletion")
        cursor.close()
        log_info(f"Project deleted: project_id={project_id}")
        return jsonify({"status": "success", "message": "Project deleted successfully"}), 200
    except Exception as e:
        mysql.connection.rollback()
        log_error(f"Transaction rolled back for project deletion: {str(e)} | project_id={project_id}")
        return jsonify({"status": "error", "message": str(e)}), 500


@project_bp.route("/by-person", methods=["GET"])
def get_projects_by_person():
    from app import mysql
    try:
        person_id = request.args.get("person_id")
        if not person_id:
            return jsonify({"status": "error", "message": "Query param 'person_id' is required"}), 400
        cursor = mysql.connection.cursor()
        cursor.callproc("SelectProjectsByPersonId", [person_id])
        results = cursor.fetchall()
        cursor.close()
        return jsonify({"status": "success", "data": results, "count": len(results)}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@project_bp.route("/<int:project_id>", methods=["GET"])
def get_project_by_id(project_id: int):
    from app import mysql
    try:
        cursor = mysql.connection.cursor()
        cursor.callproc("SelectProjectById", [project_id])
        result = cursor.fetchone()
        cursor.close()
        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# from flask import Blueprint, jsonify, request


# project_bp = Blueprint('project', __name__, url_prefix='/project')

# @project_bp.route("/num-projects-per-person", methods=['GET'])
# def get_num_projects_per_person():
#     from app import mysql 
    
#     try:
#         cursor = mysql.connection.cursor()
#         cursor.callproc('SelectNumProjectsPerPerson')
        
#         results = cursor.fetchall()
#         cursor.close()
#         out = {}
#         for curr in results:
#             out[curr['person_id']] = {'num_projects': curr['num_projects'], 'person_name': curr['person_name']}
#         return jsonify({
#             "status": "success",
#             "data": out,
#             "count": len(results)
#         })
        
#     except Exception as e:
#         return jsonify({
#             "error": str(e)
#         }), 500


