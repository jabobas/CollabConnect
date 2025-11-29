'''
This file manages project tag related routes for the CollabConnect application.
It defines endpoints for associating and dissociating tags with projects.
@author: Abbas Jabor
@date: November 25, 2025
'''
from flask import Blueprint, jsonify, request
from app import mysql

project_tags_blueprint = Blueprint('project_tags', __name__, url_prefix='/project_tags')
@project_tags_blueprint.route('/project_tags', methods=['POST'])

def handle_project_tags(action):
    cursor = mysql.connection.cursor()
    try:
        if action == 'AddTagToProject':
            data = request.json
            cursor.callproc('AddTagToProject', [
                data['project_id'],
                data['tag_name']
            ])
            mysql.connection.commit()
            return jsonify({"success": True, "message": "Tag added to project successfully"}), 201
        elif action == 'RemoveTagFromProject':
            data = request.json
            cursor.callproc('RemoveTagFromProject', [
                data['project_id'],
                data['tag_name']
            ])
            mysql.connection.commit()
            return jsonify({"success": True, "message": "Tag removed from project successfully"}), 200
        elif action == 'get_project_tags':
            project_id = request.args.get('project_id')
            cursor.callproc('GetProjectTags', [project_id])
            results = cursor.fetchall()
            return jsonify({"success": True, "tags": results}), 200
        elif action == 'get_projects_by_tag':
            tag_name = request.args.get('tag_name')
            cursor.callproc('GetProjectsByTag', [tag_name])
            results = cursor.fetchall()
            return jsonify({"success": True, "projects": results}), 200
        else:
            return jsonify({"success": False, "message": "Invalid action"}), 400
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()