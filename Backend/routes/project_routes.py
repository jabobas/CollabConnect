'''
This file manages project related routes for the CollabConnect application.
It defines endpoints for creating, updating, deleting, and retrieving projects.
@author: Abbas Jabor, Lucas Matheson
@date: November 20, 2025
'''
from flask import Blueprint, jsonify, request
from utils.logger import log_info, log_error, get_request_user

project_bp = Blueprint("project", __name__, url_prefix="/project")


@project_bp.route("/all", methods=["GET"])
def get_all_projects():
    from app import mysql
    try:
        log_info(f"[{get_request_user()}] Fetching all projects")
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.callproc("GetAllProjects")
        results = cursor.fetchall()
        # Consume remaining result sets from stored procedure
        while cursor.nextset():
            pass
        mysql.connection.commit()
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
    cursor = None
    try:
        data = request.get_json(force=True) or {}
        log_info(f"Create project request: {data}")
        
        required = ["title", "description", "person_id", "start_date", "end_date", "tag_name"]
        missing = [k for k in required if data.get(k) in (None, "")]
        if missing:
            log_error(f"Missing fields in create_project: {missing}")
            return jsonify({"status": "error", "message": f"Missing fields: {', '.join(missing)}"}), 400
        
        cursor = mysql.connection.cursor()
        
        # Start transaction with proper isolation level for concurrency control
        cursor.execute("START TRANSACTION")
        
        log_info("Transaction started for project creation")
        
        # Call stored procedure (handles locking and validation internally)
        cursor.callproc("InsertIntoProject", [
            data["title"],
            data["description"],
            data["person_id"],
            data["tag_name"],
            data["start_date"],
            data["end_date"]
        ])
        
        # Consume stored procedure results
        while cursor.nextset():
            pass
        
        # Commit the transaction 
        mysql.connection.commit()
        log_info("Transaction committed for project creation")
        
        log_info(f"Project created: title={data['title']}, description={data['description']}, "
                f"person_id={data['person_id']}, start_date={data['start_date']}, "
                f"end_date={data['end_date']}, tag_name={data['tag_name']}")
        
        return jsonify({"status": "success", "message": "Project created successfully"}), 201
        
    except Exception as e:
        # Rollback on error 
        if mysql.connection:
            try:
                mysql.connection.rollback()
            except:
                pass
      
        log_error(f"Transaction rolled back for project creation: {str(e)} | data={data}")
        return jsonify({"status": "error", "message": str(e)}), 500
        
    finally:
        if cursor:
            cursor.close()

@project_bp.route("/<int:project_id>", methods=["PUT"])
def update_project(project_id: int):
    from app import mysql
    cursor = None
    try:
        data = request.get_json(force=True) or {}
        log_info(f"Update project request: project_id={project_id}, data={data}")
        
        cursor = mysql.connection.cursor()
        
        # Start transaction with proper isolation level for concurrency control
        cursor.execute("START TRANSACTION")
        
        log_info("Transaction started for project update")
        
        # Call stored procedure (handles locking and validation internally)
        cursor.callproc("UpdateProjectDetails", [
            project_id,
            data.get("project_title"),
            data.get("project_description"),
            data.get("tag_name"),
            data.get("start_date"),
            data.get("end_date")
        ])
        
        # Consume stored procedure results
        while cursor.nextset():
            pass
        
        # Commit the transaction
        mysql.connection.commit()
        log_info("Transaction committed for project update")
        
        log_info(f"Project updated: id={project_id}, title={data.get('project_title')}, "
                f"description={data.get('project_description')}, start_date={data.get('start_date')}, "
                f"end_date={data.get('end_date')}, tag_name={data.get('tag_name')}")
        return jsonify({"status": "success", "message": "Project updated successfully"}), 200
        
    except Exception as e:
        # Rollback on error
        if mysql.connection:
            try:
                mysql.connection.rollback()
            except:
                pass
        
        log_error(f"Transaction rolled back for project update: {str(e)} | project_id={project_id}, data={data}")
        return jsonify({"status": "error", "message": str(e)}), 500
        
    finally:
        if cursor:
            cursor.close()


@project_bp.route("/<int:project_id>", methods=["DELETE"])
def delete_project(project_id: int):
    from app import mysql
    cursor = None
    try:
        log_info(f"Delete project request: project_id={project_id}")
        
        cursor = mysql.connection.cursor()
        
        # Start transaction with proper isolation level for concurrency control
        cursor.execute("START TRANSACTION")
        
        log_info("Transaction started for project deletion")
        
        # Call stored procedure (handles locking, validation, and cascading deletes internally)
        cursor.callproc("DeleteProject", [project_id])
        
        # Consume stored procedure results
        while cursor.nextset():
            pass
        
        # Commit the transaction
        mysql.connection.commit()
        log_info("Transaction committed for project deletion")
        
        log_info(f"Project deleted: project_id={project_id}")
        return jsonify({"status": "success", "message": "Project deleted successfully"}), 200
        
    except Exception as e:
        # Rollback on error
        if mysql.connection:
            try:
                mysql.connection.rollback()
            except:
                pass
        
        log_error(f"Transaction rolled back for project deletion: {str(e)} | project_id={project_id}")
        return jsonify({"status": "error", "message": str(e)}), 500
        
    finally:
        if cursor:
            cursor.close()


@project_bp.route("/by-person", methods=["GET"])
def get_projects_by_person():
    from app import mysql
    try:
        person_id = request.args.get("person_id")
        if not person_id:
            return jsonify({"status": "error", "message": "Query param 'person_id' is required"}), 400
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.callproc("SelectProjectsByPersonID", [person_id])
        results = cursor.fetchall()
        # Consume remaining result sets from stored procedure
        while cursor.nextset():
            pass
        mysql.connection.commit()
        cursor.close()
        return jsonify({"status": "success", "data": results, "count": len(results)}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@project_bp.route("/<int:project_id>", methods=["GET"])
def get_project_by_id(project_id: int):
    from app import mysql
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.callproc("SelectProjectByID", [project_id])
        result = cursor.fetchone()
        # Consume remaining result sets from stored procedure
        while cursor.nextset():
            pass
        mysql.connection.commit()
        cursor.close()
        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@project_bp.route("/<int:project_id>/people", methods=["GET"])
def get_people_by_project(project_id: int):
    from app import mysql
    try:
        log_info(f"Fetching people for project_id={project_id}")
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        query = (
            """
            SELECT 
                p.person_id,
                p.person_name,
                p.person_email,
                p.department_id,
                d.department_name,
                i.institution_id,
                i.institution_name
            FROM WorkedOn w
            JOIN Person p ON w.person_id = p.person_id
            LEFT JOIN Department d ON p.department_id = d.department_id
            LEFT JOIN Institution i ON d.institution_id = i.institution_id
            WHERE w.project_id = %s
            ORDER BY p.person_name ASC
            """
        )
        cursor.execute(query, [project_id])
        results = cursor.fetchall()
        mysql.connection.commit()
        cursor.close()
        log_info(f"Fetched {len(results)} people for project_id={project_id}")
        return jsonify({"status": "success", "data": results, "count": len(results)}), 200
    except Exception as e:
        log_error(f"Error fetching people for project_id={project_id}: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@project_bp.route("/num-projects-per-person", methods=['GET'])
def get_num_projects_per_person():
    from app import mysql 
    
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.callproc('SelectNumProjectsPerPerson')
        
        results = cursor.fetchall()
        # Consume remaining result sets from stored procedure
        while cursor.nextset():
            pass
        mysql.connection.commit()
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


