import json
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

    original_db = app.config.get("MYSQL_DB")
    
    try:
        # Temporarily set no DB to check for existence
        app.config["MYSQL_DB"] = None

        with app.app_context():
            cursor = mysql.connection.cursor()
            
            try:
                cursor.execute("""
                    SELECT SCHEMA_NAME
                    FROM INFORMATION_SCHEMA.SCHEMATA
                    WHERE SCHEMA_NAME = %s
                """, ('collab_connect_db',))
                
                db_exists = cursor.fetchone() is not None

                if db_exists:
                    print("Database 'collab_connect_db' already exists")
                    app.config["MYSQL_DB"] = config.get(
                        "Database", "db_name", fallback="collab_connect_db"
                    )
                else:
                    create_db()
                    app.config["MYSQL_DB"] = config.get(
                        "Database", "db_name", fallback="collab_connect_db"
                    )
                    print("Database 'collab_connect_db' created successfully")

                return True
                
            finally:
                cursor.close()

    except Exception as e:
        print(f"Database check/creation failed: {e}")
        print("Ensure that the MySQL server is running and the connection details are correct.")
        # Restore original config on failure
        app.config["MYSQL_DB"] = original_db
        return False


def create_db():
    """Create database schema and initialize with tables, procedures, and data."""
    print("Creating database")
    
    cursor = mysql.connection.cursor()
    
    try:
        # Create database
        cursor.execute("CREATE SCHEMA collab_connect_db")
        cursor.execute("USE collab_connect_db")
        mysql.connection.commit()

        create_tables(cursor)
        
        create_procedures()
        
        insert_initial_data()
        
        create_indexes()
        
    except Exception as e:
        print(f"Error during database creation: {e}")
        # Database creation failed, drop the schema as the db should not exist half complete
        try:
            cursor.execute("DROP SCHEMA IF EXISTS collab_connect_db")
            mysql.connection.commit()
            print("Rolled back partial database creation")
        except Exception as cleanup_error:
            print("Error during cleanup: ", cleanup_error)
        raise
    finally:
        cursor.close()


def create_tables(cursor):

    try:
        with open("./sql/tables/create_all_tables.sql", "r") as f:
            sql_script = f.read()

        # Split by semicolon and execute each statement
        statements = [stmt.strip() for stmt in sql_script.split(";") if stmt.strip()]

        for statement in statements:
            cursor.execute(statement)

        mysql.connection.commit()
        print("Tables created successfully")
        
    except FileNotFoundError:
        print("Error: SQL script file not found at ./sql/tables/create_all_tables.sql")
        raise
    except Exception as e:
        print(f"Error creating tables: {e}")
        raise


def create_procedures():

    print("Creating stored procedures...")
    
    procedure_files = [
        "./sql/procedures/department_procedures.sql",
        "./sql/procedures/institution_procedures.sql",
        "./sql/procedures/person_procedures.sql",
        "./sql/procedures/project_procedures.sql",
        "./sql/procedures/belongsto_crud.sql",
        "./sql/procedures/project_tag_procedures.sql",
        "./sql/procedures/tag_procedures.sql",
        "./sql/procedures/workedon_crud.sql",
    ]
    
    cursor = mysql.connection.cursor()
    
    try:
        for file_path in procedure_files:
            with open(file_path, "r") as f:
                sql_script = f.read()
            
            # Find all CREATE PROCEDURE statements
            pattern = r"CREATE\s+PROCEDURE[\s\S]*?END;"
            procedures = re.findall(pattern, sql_script, flags=re.IGNORECASE)
            
            for procedure in procedures:
                cursor.execute(procedure)
                mysql.connection.commit()
                
    except Exception as e:
        print(f"Error creating procedures: {e}")
        raise
    finally:
        cursor.close()


def create_indexes():
    print("Creating indexes...")
    cursor = mysql.connection.cursor()
    index_file_paths = [
        "./sql/indexes/belongsto_indexes.sql",
        "./sql/indexes/department_indexes.sql",
        "./sql/indexes/general_indexes.sql",
        "./sql/indexes/person_indexes.sql",
        "./sql/indexes/workedon_indexes.sql",
        "./sql/indexes/worksin_indexes.sql",
    ]
    try:
        for file_path in index_file_paths:
            with open(file_path, "r") as f:

                sql_script = f.read()


            statements = sql_script.split(";")


            for statement in statements:
                create_index = statement.strip()
                if create_index:
                    cursor.execute(create_index)

            # Commit all the changes
            mysql.connection.commit()
    finally:
        cursor.close()



def insert_initial_data():
    print("Inserting initial data...")
    file_paths = [
        "./data/processed/post_cleaning_usm_data.json",
        "./data/processed/post_formatting_roux_data.json",
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
