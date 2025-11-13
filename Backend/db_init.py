import json

# Todo: research the implications of using two different cursors in a flask project
#       Or how to do it properly
import MySQLdb
from app import app, mysql, config
import re

"""
Filename: db_init.py
Author: Lucas Matheson
Edited by: Lucas Matheson
Date: November 13, 2025

This file initalizes the database. It does so by importing all the nesseccary
SQL scripts found in the folder sql_queries. It first creates the schema
by using the app.py file's flask app, which is connected to the MySql workbench
using port 3306. After creating the schema, this file will creates the tables, 
then procedures, then insert all the scraped data found in the data folder. 

"""


def check_db() -> bool:
    try:
        # temporarily set no DB to check for existence
        app.config["MYSQL_DB"] = None

        with app.app_context():
            cursor = mysql.connection.cursor()

            db_exists = cursor.execute(
                """SELECT SCHEMA_NAME
                    FROM INFORMATION_SCHEMA.SCHEMATA
                    WHERE SCHEMA_NAME = 'collab_connect_db';
                """
            )

            # ToDo: this is improper and not robust, needs fixing
            if db_exists == 1:
                print("Database 'collab_connect_db' already exists")
                app.config["MYSQL_DB"] = config.get(
                    "Database", "db_name", fallback="collab_connect_db"
                )

            else:
                create_db()
                print("Database 'collab_connect_db' checked/created successfully")

            cursor.close()
            return True

    except Exception as e:
        print("Database check/creation failed:", e)
        print(
            "Ensure that the MySQL server is running and the connection details are correct."
        )
        return False


def create_db():

    print("Creating database")
    cursor = mysql.connection.cursor()
    cursor.execute("CREATE SCHEMA collab_connect_db")
    cursor.execute("USE collab_connect_db")
    mysql.connection.commit()

    try:
        #  This will create all our tables
        with open("./sql_queries/creation_scripts/1_create_all_tables.sql", "r") as f:
            sql_script = f.read()

            statements = sql_script.split(";")

            # When doing all the tables at once, you end up with a
            # Error creating tables: (2014, "Commands out of sync; you can't run this command now")
            # So, split the create tables up into seperate statements, then execute
            for statement in statements:
                create_table = statement.strip()
                if create_table:
                    cursor.execute(create_table)

            # Commit all the changes
            mysql.connection.commit()
    except Exception as e:
        print("Error creating tables: ", {str(e)})
        raise
    finally:
        cursor.close()

    try:
        create_procedures()
    except Exception as e:
        print("Error creating procedures: ", {str(e)})
        raise

    try:
        insert_initial_data()
    except Exception as e:
        print(f"Error inserting initial data: {str(e)}")
        raise


def create_procedures():
    print("Creating stored procedures...")
    cursor = mysql.connection.cursor()
    procedures_file_paths = [
        "./sql_queries/procedures/institution_procedures.sql",
        "./sql_queries/procedures/department_procedures.sql",
        "./sql_queries/procedures/person_procedures.sql",
        "./sql_queries/procedures/project_procedures.sql",
        "./sql_queries/procedures/belongsto_crud.sql",
        "./sql_queries/procedures/project_tag_procedures.sql",
        "./sql_queries/procedures/tag_procedures.sql",
        "./sql_queries/procedures/workedon_crud.sql",
    ]
    try:
        for file_path in procedures_file_paths:
            with open(file_path, "r") as f:

                sql_script = f.read()

                # some procedures have header comments, these should be ignored
                # Remove single-line comments: -- comment
                sql_script = re.sub(r"--.*", "", sql_script)

                # Remove multi-line comments: /* comment */
                sql_script = re.sub(r"/\*[\s\S]*?\*/", "", sql_script)

                # Remove DELIMITER statements (they're MySQL client commands, not SQL), my bad for saying you needed them
                sql_script = sql_script.replace("DELIMITER $$", "").replace(
                    "DELIMITER ;", ""
                )
            procedures = sql_script.split("CREATE PROCEDURE")

            for curr in procedures:
                if curr.strip():
                    try:
                        stmt = "CREATE PROCEDURE " + curr.strip()
                        # Remove trailing $$ if present (replace with ;)
                        stmt = stmt.rstrip("$").rstrip() + ";"
                        cursor.execute(stmt)
                        mysql.connection.commit()
                    except Exception as e:
                        print("Error creating procedure: ", {str(e)})
                        print("Failed procedure: ", {stmt[:200]})
                        raise
    finally:
        cursor.close()


def insert_initial_data():
    print("Inserting initial data...")
    file_paths = [
        "./data/post_cleaning_usm_data.json",
        "./data/post_formatting_roux_data.json",
    ]
    for path in file_paths:
        json_data = get_json_data(path)

        try:
            # Use default cursor (tuple cursor) instead of DictCursor for stored procedures
            # This is because the inserts return the id of the last inserted tuple to be used
            # in the next inserts.
            cursor = mysql.connection.cursor(MySQLdb.cursors.Cursor)

            # Insert institution data
            institution = json_data.get("institution", {})
            institution_id = None
            department_id = None
            if institution:
                cursor.callproc(
                    "InsertIntoInstitution",
                    [
                        institution.get("institution_name"),
                        institution.get("institution_type"),
                        institution.get("street"),
                        institution.get("city"),
                        institution.get("state"),
                        institution.get("zipcode"),
                        institution.get("institution_phone"),
                    ],
                )

                # get the LAST_INSERT_ID() result
                row = cursor.fetchone()
                if row:
                    institution_id = row[0]

                while cursor.nextset():
                    pass

                mysql.connection.commit()

            # Insert departments and people
            departments = json_data.get("departments", {})

            for dept_key, dept_data in departments.items():
                dept_name = dept_data.get("department_name", dept_key)
                dept_email = dept_data.get("department_email")
                dept_phone = dept_data.get("department_phone")

                cursor.callproc(
                    "InsertIntoDepartment",
                    [dept_phone, dept_email, dept_name, institution_id],
                )

                # Fetch the LAST_INSERT_ID() result
                row = cursor.fetchone()
                if row:
                    department_id = row[0]

                # Consume all result sets
                while cursor.nextset():
                    pass

                mysql.connection.commit()

                # Insert people in this department
                # ToDo: Use the data cleaning to get the main feild using the chat gpt api
                people = dept_data.get("people", {})
                for person_name, person_data in people.items():
                    phone_num = person_data.get("person_phone")
                    # ToDo: this needs to be added to the cleaning for usm data
                    if (
                        person_data.get("person_phone")
                        and len(person_data.get("person_phone")) > 15
                    ):
                        print(person_name)
                        print(person_data.get("person_phone"))
                        phone_num = None
                    cursor.callproc(
                        "InsertPerson",
                        (
                            person_name,
                            person_data.get("person_email"),
                            phone_num,
                            person_data.get("bio"),
                            person_data.get("expertise_1"),
                            person_data.get("expertise_2"),
                            person_data.get("expertise_3"),
                            "main_field",
                            department_id,
                        ),
                    )

                    # Consume all result sets
                    while cursor.nextset():
                        pass

                    mysql.connection.commit()

                    # Todo: When using the rest of the data, ensure to update the Nones
                    # Also, there is no person that we have where we need to save the
                    # previous work history, so this table may be irrevelent
                    # cursor.callproc(
                    #     "sp_insert_belongsto",
                    #     (
                    #         department_id,
                    #         institution_id,
                    #         'None',
                    #         'None',
                    #         'None'
                    #     )
                    # )

                    # while cursor.nextset():
                    #     pass

                    # mysql.connection.commit()

                    # Insert projects for this person

                    # Skip for now, Need some details on lead person and implement selects to get the cooresponding ids

                    # projects = person_data.get("projects", [])
                    # for project in projects:
                    #     project_title = project.get("project_title")
                    #     if project_title:
                    #         cursor.callproc(
                    #             "InsertIntoProject",
                    #             [
                    #                 project_title,
                    #                 project.get("project_description"),
                    #                 project.get("start_date"),
                    #                 project.get("end_date"),
                    #                 person_name,
                    #             ],
                    #         )

                    #         # Consume all result sets
                    #         while cursor.nextset():
                    #             pass

                    #         mysql.connection.commit()

                    #         # Insert worked-on relationship
                    #         cursor.callproc(
                    #             "sp_insert_workedon", [person_name, project_title]
                    #         )

                    # Consume all result sets
                    """
                    Note to self:
                    
                    A result set is a table of data that is generated when a database query is executed. 
                    It is a temporary table of rows and columns that contains the data matching the query's 
                    criteria and is typically navigated using a cursor.
                    
                    So, this loop iterates through all remaining result sets returned by a database query.
                    If you don't do this but try to use the cursor again, it can cause errors since result sets
                    still exist while you try to grab more
                    """
                    # while cursor.nextset():
                    #     pass

                    # mysql.connection.commit()

        except Exception as e:
            mysql.connection.rollback()
            print(f"Error during data insertion: {e}")
            raise
        finally:
            cursor.close()


# Some data needs formatting to be inserted using one method
def format_data():
    json_data = get_json_data("./data/roux_institute_data.json")
    """ 
    Example of Wyatt's data
        "Institution": [
        {
        "institution_name": "Roux Institute at Northeastern University",
        "institution_type": "Academic",
        "street": null,
        "city": "Portland",
        "state": "ME",
        "zipcode": null,
        "institution_phone": null
        }
    ],
    "Department": [
        {
        "institution_id": 1,
        "department_name": "General Faculty and Staff",
        "department_email": null,
        "department_phone": null
        }
    ],
    "Person": [
        {
        "person_name": "Eva Balog",
        "person_email": null,
        "person_phone": null,
        "bio": "Dr. Balog is currently on a sabbatical appointment as a Visiting Associate Professor at the Roux Institute and a Life Sciences Fellow with the Institute for Experiential AI. She is an Associate Professor of Chemistry at the University of New England and an inaugural member of UNE\u2019s Portland Laboratory for Biotechnology and Health Sciences and the Center for Cell Signaling Research. Dr. Balog received her Ph.D. in Molecular, Cell, and Developmental Biology from the University of California, Santa Cruz, and completed postdoctoral training at Los Alamos National Laboratory\u2019s Center for Integrated Nanotechnologies. Dr. Balog\u2019s research is focused on the biophysical characterization of engineered proteins for biomaterials and biotechnology applications, with an especial interest in protein-based tools for the study and control of cellular activities.",
        "expertise_1": null,
        "expertise_2": null,
        "expertise_3": null,
        "main_field": "Visiting Associate Professor",
        "department_id": null
        },
    """
    print(json_data)


def get_json_data(file_path: str):
    # util function that needs to read in all the json data and return it based on file path
    with open(file_path, "r") as f:
        return json.load(f)


if __name__ == "__main__":
    if not check_db():
        print("Database check failed; not starting Flask app.")
        import sys

        # ToDo, wouldn't be a bad idea to add a drop schema if exists here, since a half completed schema should not exist
        sys.exit(1)

    app.run()
