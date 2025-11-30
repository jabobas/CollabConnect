'''
This file manages project tag related routes for the CollabConnect application.
It defines endpoints for associating and dissociating tags with projects.
@author: Abbas Jabor
@date: November 25, 2025
'''
from flask import Blueprint, jsonify, request
from Backend.utils.logger import log_info, log_error

project_tag_bp = Blueprint("project_tag", __name__, url_prefix="/project_tag")


@project_tag_bp.route("/add", methods=["POST"])
def add_tag_to_project():
    from app import mysql
    try:
        data = request.get_json(force=True) or {}
        log_info(f"Add tag to project request: {data}")
        required = ["project_id", "tag_name"]
        missing = [k for k in required if data.get(k) in (None, "")]
        if missing:
            log_error(f"Missing fields in add_tag_to_project: {missing}")
            return jsonify({"status": "error", "message": f"Missing fields: {', '.join(missing)}"}), 400
        log_info("Transaction started for add tag to project")
        cursor = mysql.connection.cursor()
        cursor.callproc("AddTagToProject", [data["project_id"], data["tag_name"]])
        mysql.connection.commit()
        log_info("Transaction committed for add tag to project")
        cursor.close()
        log_info(f"Tag added to project: project_id={data['project_id']}, tag_name={data['tag_name']}")
        return jsonify({"status": "success", "message": "Tag added to project successfully"}), 201
    except Exception as e:
        mysql.connection.rollback()
        log_error(f"Transaction rolled back for add tag to project: {str(e)} | data={data}")
        return jsonify({"status": "error", "message": str(e)}), 500


@project_tag_bp.route("/remove", methods=["DELETE"])
def remove_tag_from_project():
    from app import mysql
    try:
        data = request.get_json(force=True) or {}
        log_info(f"Remove tag from project request: {data}")
        required = ["project_id", "tag_name"]
        missing = [k for k in required if data.get(k) in (None, "")]
        if missing:
            log_error(f"Missing fields in remove_tag_from_project: {missing}")
            return jsonify({"status": "error", "message": f"Missing fields: {', '.join(missing)}"}), 400
        log_info("Transaction started for remove tag from project")
        cursor = mysql.connection.cursor()
        cursor.callproc("RemoveTagFromProject", [data["project_id"], data["tag_name"]])
        mysql.connection.commit()
        log_info("Transaction committed for remove tag from project")
        cursor.close()
        log_info(f"Tag removed from project: project_id={data['project_id']}, tag_name={data['tag_name']}")
        return jsonify({"status": "success", "message": "Tag removed from project successfully"}), 200
    except Exception as e:
        mysql.connection.rollback()
        log_error(f"Transaction rolled back for remove tag from project: {str(e)} | data={data}")
        return jsonify({"status": "error", "message": str(e)}), 500


@project_tag_bp.route("/by-project", methods=["GET"])
def get_project_tags():
    from app import mysql
    try:
        project_id = request.args.get("project_id")
        if not project_id:
            log_error("Missing query param 'project_id' in get_project_tags")
            return jsonify({"status": "error", "message": "Query param 'project_id' is required"}), 400
        cursor = mysql.connection.cursor()
        cursor.callproc("GetProjectTags", [project_id])
        results = cursor.fetchall()
        cursor.close()
        return jsonify({"status": "success", "data": results, "count": len(results)}), 200
    except Exception as e:
        log_error(f"Error getting project tags: {str(e)} | project_id={project_id}")
        return jsonify({"status": "error", "message": str(e)}), 500


@project_tag_bp.route("/by-tag", methods=["GET"])
def get_projects_by_tag():
    from app import mysql
    try:
        tag_name = request.args.get("tag_name")
        if not tag_name:
            log_error("Missing query param 'tag_name' in get_projects_by_tag")
            return jsonify({"status": "error", "message": "Query param 'tag_name' is required"}), 400
        cursor = mysql.connection.cursor()
        cursor.callproc("GetProjectsByTag", [tag_name])
        results = cursor.fetchall()
        cursor.close()
        return jsonify({"status": "success", "data": results, "count": len(results)}), 200
    except Exception as e:
        log_error(f"Error getting projects by tag: {str(e)} | tag_name={tag_name}")
        return jsonify({"status": "error", "message": str(e)}), 500