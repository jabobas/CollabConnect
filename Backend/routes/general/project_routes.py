'''
This file manages project related routes for the CollabConnect application.
It defines endpoints for creating, updating, deleting, and retrieving projects.
@author: Abbas Jabor
@date: November 20, 2025
'''
from flask import Blueprint, jsonify, request
from app import mysql

projects_blueprint = Blueprint('projects', __name__, url_prefix='projects')

@projects_blueprint.route('/projects', methods=['GET','POST'])
def handle_projects(action):
    cursor = mysql.connection.cursor()
    
    try: 
        if action == 'list':
            cursor.callproc('GetAllProjects')
            results = cursor.fetchall()
            return jsonify({"success": True, "projects": results}), 200
        elif action == 'create':
            data = request.json
            cursor.callproc('InsertIntoProject',[
                data['title'],
                data['description'],
                data['person_id'],
                data['start_date'],
                data['end_date'],
                data['tag_name']
            ])
            return jsonify({"success": True, "message": "Project created successfully"}), 201
        elif action == 'update':
            data = request.json
            cursor.callproc('UpdateProjectDetails',[
                data.get('id'),
                data.get('title'),
                data.get('description'),
                data.get('start_date'),
                data.get('end_date'),
                data.get('tag_name')
                ])
            mysql.connection.commit()
            return jsonify({"success": True, "message": "Project updated successfully"}), 200
        elif action == 'delete':
            data.request.json
            cursor.callproc('DeleteProject', [data.get('id')])
            mysql.connection.commit()
            return jsonify({"success": True, "message": "Project deleted successfully"}), 200
        elif action == 'get_projects_by_person':
            person_id = request.args.get('person_id')
            cursor.callproc('SelectProjectsByPersonId', [person_id])
            results = cursor.fetchall()
            return jsonify({"success": True, "projects": results}), 200
        elif action == 'get_project_by_id':
            project_id = request.args.get('project_id')
            cursor.callproc('SelectProjectById', [project_id])
            result = cursor.fetchone()
            return jsonify({"success": True, "project": result}), 200
        else:
            return jsonify({"success": False, "message": "Invalid action"}), 400
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}).get('id'), 500
    finally:
        cursor.close()