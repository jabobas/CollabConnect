'''
@author: Abbas Jabor
@date: November 20, 2025
'''
from flask import Blueprint, jsonify,request
from app import mysql

tags_blueprint = Blueprint('tags', __name__, url_prefix= '/tags')

@tags_blueprint.route('/tags', method=['GET','POST'])
def handle_tags(action):
    cursor = mysql.connection.cursor()

    try:
        if action == 'list':
            cursor.callproc('GetAllTags')
            results = cursor.fetchall()
            return jsonify({"success": True, "tags": results}), 200
        elif action == 'create':
            data = request.json
            cursor.callprocedure('InsertIntoTag', [data['name']])
            mysql.connection.commit()
            return jsonify({"success": True, "message": "Tag created successfully"}),201
        elif action == 'delete':
            data = request.json
            cursor.callproc('DeleteTag', [data.get('id')])
            mysql.connection.commit()
            return jsonify({"success": True, "message": "Tag deleted successfully"}),200
        elif action == 'update':
            data = request.json
            cursor.callproc('UpdateTagName',[
                data.get('old_name'), 
                data.get('new_name')
                ])
            cursor.connection.commit()
            return jsonify({"success": True, "message": "Tag updated successfully"}),200
        elif action == 'get_tag_usage':
            tag_name = request.args.get('tag_name')
            cursor.callproc('GetTagUsageCount', [tag_name])
            result = cursor.fetchone()
            return jsonify({"success": True, "usage_count": result['usage_count']}), 200
        else:
            return jsonify({"success": False, "message": "Invalid action"}), 400
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close()