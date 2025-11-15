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
        "./sql/procedures/worksin_crud.sql",
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
        "./data/processed/nih_maine_data_formatted.json",
        "./data/processed/nih_projects_formatted.json"
    ]
    
    # Track department-institution relationships and earliest project dates for BelongsTo
    department_institution_map = {}  # {dept_id: inst_id}
    department_earliest_dates = {}   # {dept_id: earliest_start_date}
    
    # Track inserted emails/names to prevent duplicates
    global_inserted_emails = set()

    def _normalize_institutions(json_data):
        """
        Normalize json_data into a list of dicts with keys:
            { "institution": <dict>, "departments": <dict_or_list> }
        Handles these common shapes:
          - {"institution": {...}, "departments": {...}}                => 1 item
          - {"institution": [{...}, {...}], "departments": ...}         => multiple (departments may be per-item)
          - {"institutions": [{...}, {...}]}                            => multiple
          - [ {...}, {...} ]                                            => list of institution-like dicts
          - {"some keys for an institution": ...}                       => treated as single institution
        """
        insts = []

        # Case: top-level dict
        if isinstance(json_data, dict):
            # explicit "institution" key
            if "institution" in json_data:
                inst = json_data["institution"]
                top_depts = json_data.get("departments", {})

                if isinstance(inst, list):
                    for item in inst:
                        if isinstance(item, dict):
                            inst_entry = item
                            depts = item.get("departments", top_depts)
                        else:
                            inst_entry = {"institution_name": item}
                            depts = top_depts
                        insts.append({"institution": inst_entry, "departments": depts})
                else:
                    insts.append({"institution": inst if isinstance(inst, dict) else {"institution_name": inst},
                                  "departments": top_depts})

            elif "institutions" in json_data:
                for item in json_data["institutions"] or []:
                    if isinstance(item, dict):
                        insts.append({"institution": item.get("institution", item),
                                      "departments": item.get("departments", item.get("departments", {}))})
                    else:
                        insts.append({"institution": {"institution_name": item}, "departments": {}})
            else:

                insts.append({"institution": json_data, "departments": json_data.get("departments", {})})

        elif isinstance(json_data, list):
            for item in json_data:
                if isinstance(item, dict):
                    insts.append({"institution": item.get("institution", item),
                                  "departments": item.get("departments", item.get("departments", {}))})
                else:
                    insts.append({"institution": {"institution_name": item}, "departments": {}})
        else:

            insts.append({"institution": {}, "departments": {}})

        return insts

    for path in file_paths:

        json_data = get_json_data(path)
        print('get file')
        try:
            # Use default cursor (tuple cursor) instead of DictCursor for stored procedures
            # This is because the inserts return the id of the last inserted tuple to be used
            # in the next inserts.
            cursor = mysql.connection.cursor(MySQLdb.cursors.Cursor)

            # Normalize to a list of institutions (handles single or multiple)
            institution_entries = _normalize_institutions(json_data)

            for inst_entry in institution_entries:
            
                institution = inst_entry.get("institution", {}) or {}
                departments = inst_entry.get("departments", {}) or {}
                if not institution.get("institution_name"):
                    print(f"Skipping institution with no name: {institution}")
                    continue
                institution_id = None
                department_id = None

                # Insert institution data (skip if empty)
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
                # departments may be a dict keyed by dept_key or a list of dept dicts; handle both
                if isinstance(departments, dict):
                    dept_items = departments.items()
                elif isinstance(departments, list):
                    # convert list of dept dicts to (name, dict) pairs, using department_name when available
                    dept_items = []
                    for d in departments:
                        if isinstance(d, dict):
                            key = d.get("department_name") or d.get("department_email") or str(len(dept_items))
                            dept_items.append((key, d))
                else:
                    dept_items = []

                for dept_key, dept_data in dept_items:
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
                        # Track department-institution relationship for BelongsTo
                        if institution_id:
                            department_institution_map[department_id] = institution_id

                    # Consume all result sets
                    while cursor.nextset():
                        pass

                    mysql.connection.commit()

                    # Insert people in this department
                    people = dept_data.get("people", {}) or {}
                    # support people as list or dict
                    if isinstance(people, dict):
                        people_items = people.items()
                    elif isinstance(people, list):
                        people_items = []
                        for p in people:
                            if isinstance(p, dict):
                                pname = p.get("person_name") or p.get("name") or str(len(people_items))
                                people_items.append((pname, p))
                    else:
                        people_items = []

                    for person_name, person_data in people_items:
                        email = person_data.get("person_email")
                        
                        # Check for duplicates using email or name
                        if email and email in global_inserted_emails:
                            continue
                        if not email and person_name in global_inserted_emails:
                            continue
                        
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
                                email,
                                phone_num,
                                person_data.get("bio"),
                                person_data.get("expertise_1"),
                                person_data.get("expertise_2"),
                                person_data.get("expertise_3"),
                                person_data["main_field"] if person_data["main_field"] is not None else "main_field",
                                department_id,
                            ),
                        )

                        # Get person_id from stored procedure
                        row = cursor.fetchone()
                        person_id = row[0] if row else None
                        
                        # Track this person to prevent duplicates
                        if email:
                            global_inserted_emails.add(email)
                        else:
                            global_inserted_emails.add(person_name)

                        # Consume all result sets
                        while cursor.nextset():
                            pass

                        mysql.connection.commit()
                        
                        # Insert WorksIn relationship (person works in this department)
                        if person_id and department_id:
                            cursor.callproc(
                                "InsertWorksIn",
                                [person_id, department_id]
                            )
                            
                            # Consume all result sets
                            while cursor.nextset():
                                pass
                            
                            mysql.connection.commit()
                        
                        # Insert projects and WorkedOn relationships
                        projects = person_data.get("projects", [])
                        if projects and person_id:
                            for project in projects:
                                project_title = project.get("project_title")
                                start_date = project.get("start_date")
                                
                                # Skip projects without title or start_date (required fields)
                                if not project_title or not start_date:
                                    continue
                                
                                # Parse dates
                                end_date = project.get("end_date")
                                
                                # Handle year-only dates
                                if start_date and len(str(start_date)) == 4:
                                    start_date = f"{start_date}-01-01"
                                if end_date and len(str(end_date)) == 4:
                                    end_date = f"{end_date}-12-31"
                                
                                # Insert project
                                cursor.callproc(
                                    "InsertIntoProject",
                                    [
                                        project_title,
                                        project.get("project_description"),
                                        person_id, 
                                        start_date,
                                        end_date,
                                    ],
                                )
                                
                                # Get project_id
                                row = cursor.fetchone()
                                project_id = row[0] if row else None
                                
                                # Consume all result sets
                                while cursor.nextset():
                                    pass
                                
                                mysql.connection.commit()
                                
                                # Track earliest project date for BelongsTo
                                if start_date and department_id:
                                    current_earliest = department_earliest_dates.get(department_id)
                                    if not current_earliest or start_date < current_earliest:
                                        department_earliest_dates[department_id] = start_date
                                
                                # Insert WorkedOn relationship
                                if project_id:
                                    # Get role from project data, fallback to person data, then default
                                    project_role = project.get("project_role") or person_data.get("project_role") or "Researcher"
                                    
                                    cursor.callproc(
                                        "sp_insert_workedon",
                                        [
                                            person_id,
                                            project_id,
                                            project_role,
                                            start_date,
                                            end_date,
                                        ],
                                    )
                                    
                                    # Consume all result sets
                                    while cursor.nextset():
                                        pass
                                    
                                    mysql.connection.commit()

        except Exception as e:
            mysql.connection.rollback()
            print(f"Error during data insertion: {e}")
            print(person_name, ' ', person_data["main_field"])
            raise
        finally:
            cursor.close()
    
    # Insert BelongsTo relationships after all data is loaded
    print("Inserting BelongsTo relationships...")
    cursor = mysql.connection.cursor(MySQLdb.cursors.Cursor)
    try:
        for dept_id, inst_id in department_institution_map.items():
            effective_start = department_earliest_dates.get(dept_id, "2000-01-01")
            
            cursor.callproc(
                "sp_insert_belongsto",
                [
                    dept_id,
                    inst_id,
                    effective_start,
                    None,  # effective_end is NULL (still active)
                ],
            )
            
            # Consume all result sets
            while cursor.nextset():
                pass
            
            mysql.connection.commit()
        
        print(f"Inserted {len(department_institution_map)} BelongsTo relationships")
        
    except Exception as e:
        mysql.connection.rollback()
        print(f"Error inserting BelongsTo relationships: {e}")
        raise
    finally:
        cursor.close()

def get_json_data(file_path: str):
    # util function that needs to read in all the json data and return it based on file path
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


if __name__ == "__main__":
    if not check_db():
        print("Database check failed; not starting Flask app.")
        import sys

        # ToDo, wouldn't be a bad idea to add a drop schema if exists here, since a half completed schema should not exist
        sys.exit(1)

    app.run()
