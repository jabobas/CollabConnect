'''
this module defines the routes for managing tags in the application.
It includes endpoints for creating, updating, deleting, and retrieving tags.
@author: Abbas Jabor
@date: November 20, 2025
'''
from flask import Blueprint, jsonify, request
from utils.logger import log_info, log_error

tags_bp = Blueprint("tags", __name__, url_prefix="/tags")


@tags_bp.route("/all", methods=["GET"])
def get_all_tags():
    from app import mysql
    try:
        log_info("Fetching all tags")
        cursor = mysql.connection.cursor()
        cursor.callproc("GetAllTags")
        results = cursor.fetchall()
        cursor.close()
        log_info(f"Fetched {len(results)} tags")
        return jsonify({
            "status": "success",
            "data": results,
            "count": len(results)
        }), 200
    except Exception as e:
        log_error(f"Error fetching tags: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


@tags_bp.route("/", methods=["POST"])
def create_tag():
    from app import mysql
    try:
        data = request.get_json(force=True) or {}
        log_info(f"Create tag request: {data}")
        name = data.get("name")
        if not name:
            log_error("Missing field 'name' in create_tag")
            return jsonify({"status": "error", "message": "Field 'name' is required"}), 400
        log_info("Transaction started for tag creation")
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.callproc("InsertIntoTag", [name])
        while cursor.nextset():
            pass
        mysql.connection.commit()
        log_info("Transaction committed for tag creation")
        cursor.close()
        log_info(f"Tag created: name={name}")
        return jsonify({"status": "success", "message": "Tag created successfully"}), 201
    except Exception as e:
        mysql.connection.rollback()
        log_error(f"Transaction rolled back for tag creation: {str(e)} | data={data}")
        return jsonify({"status": "error", "message": str(e)}), 500


@tags_bp.route("/<int:tag_id>", methods=["DELETE"])
def delete_tag(tag_id: int):
    from app import mysql
    try:
        log_info(f"Delete tag request: tag_id={tag_id}")
        log_info("Transaction started for tag deletion")
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.callproc("DeleteTag", [tag_id])
        while cursor.nextset():
            pass
        mysql.connection.commit()
        log_info("Transaction committed for tag deletion")
        cursor.close()
        log_info(f"Tag deleted: tag_id={tag_id}")
        return jsonify({"status": "success", "message": "Tag deleted successfully"}), 200
    except Exception as e:
        mysql.connection.rollback()
        log_error(f"Transaction rolled back for tag deletion: {str(e)} | tag_id={tag_id}")
        return jsonify({"status": "error", "message": str(e)}), 500


@tags_bp.route("/rename", methods=["PUT"])
def rename_tag():
    from app import mysql
    try:
        data = request.get_json(force=True) or {}
        log_info(f"Rename tag request: {data}")
        old_name = data.get("old_name")
        new_name = data.get("new_name")
        if not old_name or not new_name:
            log_error("Missing fields 'old_name' or 'new_name' in rename_tag")
            return jsonify({"status": "error", "message": "Fields 'old_name' and 'new_name' are required"}), 400
        log_info("Transaction started for tag rename")
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.callproc("UpdateTagName", [old_name, new_name])
        while cursor.nextset():
            pass
        mysql.connection.commit()
        log_info("Transaction committed for tag rename")
        cursor.close()
        log_info(f"Tag renamed: old_name={old_name}, new_name={new_name}")
        return jsonify({"status": "success", "message": "Tag updated successfully"}), 200
    except Exception as e:
        mysql.connection.rollback()
        log_error(f"Transaction rolled back for tag rename: {str(e)} | data={data}")
        return jsonify({"status": "error", "message": str(e)}), 500


@tags_bp.route("/usage", methods=["GET"])
def get_tag_usage():
    from app import mysql
    try:
        tag_name = request.args.get("tag_name")
        if not tag_name:
            log_error("Missing query param 'tag_name' in get_tag_usage")
            return jsonify({"status": "error", "message": "Query param 'tag_name' is required"}), 400
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.callproc("GetTagUsageCount", [tag_name])
        result = cursor.fetchone() or {}
        # Consume remaining result sets from stored procedure
        while cursor.nextset():
            pass
        mysql.connection.commit()
        cursor.close()
        log_info(f"Tag usage checked: tag_name={tag_name}, usage_count={result.get('usage_count', 0)}")
        return jsonify({
            "status": "success",
            "usage_count": result.get("usage_count", 0)
        }), 200
    except Exception as e:
        log_error(f"Error getting tag usage: {str(e)} | tag_name={tag_name}")
        return jsonify({"status": "error", "message": str(e)}), 500