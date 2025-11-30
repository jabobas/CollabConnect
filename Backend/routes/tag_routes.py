'''
this module defines the routes for managing tags in the application.
It includes endpoints for creating, updating, deleting, and retrieving tags.
@author: Abbas Jabor
@date: November 20, 2025
'''
from flask import Blueprint, jsonify, request

tags_bp = Blueprint("tags", __name__, url_prefix="/tags")


@tags_bp.route("/all", methods=["GET"])
def get_all_tags():
    from app import mysql
    try:
        cursor = mysql.connection.cursor()
        cursor.callproc("GetAllTags")
        results = cursor.fetchall()
        cursor.close()
        return jsonify({
            "status": "success",
            "data": results,
            "count": len(results)
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@tags_bp.route("/", methods=["POST"])
def create_tag():
    from app import mysql
    try:
        data = request.get_json(force=True) or {}
        name = data.get("name")
        if not name:
            return jsonify({"status": "error", "message": "Field 'name' is required"}), 400
        cursor = mysql.connection.cursor()
        cursor.callproc("InsertIntoTag", [name])
        mysql.connection.commit()
        cursor.close()
        return jsonify({"status": "success", "message": "Tag created successfully"}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@tags_bp.route("/<int:tag_id>", methods=["DELETE"])
def delete_tag(tag_id: int):
    from app import mysql
    try:
        cursor = mysql.connection.cursor()
        cursor.callproc("DeleteTag", [tag_id])
        mysql.connection.commit()
        cursor.close()
        return jsonify({"status": "success", "message": "Tag deleted successfully"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@tags_bp.route("/rename", methods=["PUT"])
def rename_tag():
    from app import mysql
    try:
        data = request.get_json(force=True) or {}
        old_name = data.get("old_name")
        new_name = data.get("new_name")
        if not old_name or not new_name:
            return jsonify({"status": "error", "message": "Fields 'old_name' and 'new_name' are required"}), 400
        cursor = mysql.connection.cursor()
        cursor.callproc("UpdateTagName", [old_name, new_name])
        mysql.connection.commit()
        cursor.close()
        return jsonify({"status": "success", "message": "Tag updated successfully"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@tags_bp.route("/usage", methods=["GET"])
def get_tag_usage():
    from app import mysql
    try:
        tag_name = request.args.get("tag_name")
        if not tag_name:
            return jsonify({"status": "error", "message": "Query param 'tag_name' is required"}), 400
        cursor = mysql.connection.cursor()
        cursor.callproc("GetTagUsageCount", [tag_name])
        result = cursor.fetchone() or {}
        cursor.close()
        return jsonify({
            "status": "success",
            "usage_count": result.get("usage_count", 0)
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500