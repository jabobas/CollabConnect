"""
JSON to Database Loader - Loads unified JSON schema into MySQL
Reads JSON files produced by scrapers (NIH, USM, etc.) and populates the database.

Usage:
    python json_loader.py --input Backend/scrapers/data/nih_projects.json
    python json_loader.py --input Backend/scrapers/data/usm_data.json --dry-run
"""

import argparse
import configparser
import json
import os
import sys
from typing import Dict, List, Optional

import mysql.connector
from mysql.connector import MySQLConnection


def load_db_config() -> Dict[str, str]:
    """Read MySQL config from Backend/config.ini."""
    config = configparser.ConfigParser()
    config_path = os.path.join(os.path.dirname(__file__), "..", "config.ini")
    config.read(config_path)

    return {
        "host": config.get("Database", "db_host", fallback=os.getenv("MYSQL_HOST", "127.0.0.1")),
        "port": config.getint("Database", "db_port", fallback=int(os.getenv("MYSQL_PORT", "3306"))),
        "user": config.get("Database", "db_user", fallback=os.getenv("MYSQL_USER", "root")),
        "password": config.get("Database", "db_password", fallback=os.getenv("MYSQL_PASSWORD", "")),
        "database": config.get("Database", "db_name", fallback=os.getenv("MYSQL_DB", "collab_connect_db")),
    }


def ensure_mapping_tables(conn: MySQLConnection) -> None:
    """Create mapping tables if they don't exist."""
    cursor = conn.cursor()
    try:
        # Person mapping by email
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS PersonEmailMap (
                person_email VARCHAR(100) PRIMARY KEY,
                person_id BIGINT UNSIGNED NOT NULL,
                FOREIGN KEY (person_id) REFERENCES Person(person_id)
                    ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB;
            """
        )
        # Project mapping by title
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS ProjectTitleMap (
                project_title VARCHAR(200) PRIMARY KEY,
                project_id BIGINT UNSIGNED NOT NULL,
                FOREIGN KEY (project_id) REFERENCES Project(project_id)
                    ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB;
            """
        )
        # Institution mapping by name
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS InstitutionNameMap (
                institution_name VARCHAR(100) PRIMARY KEY,
                institution_id BIGINT UNSIGNED NOT NULL,
                FOREIGN KEY (institution_id) REFERENCES Institution(institution_id)
                    ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB;
            """
        )
        # Department mapping by name
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS DepartmentNameMap (
                department_name VARCHAR(100) PRIMARY KEY,
                department_id BIGINT UNSIGNED NOT NULL,
                FOREIGN KEY (department_id) REFERENCES Department(department_id)
                    ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB;
            """
        )
        conn.commit()
        print("✓ Mapping tables ready")
    finally:
        cursor.close()


def get_or_create_institution(cursor, inst: Dict) -> Optional[int]:
    """Get or create institution, return institution_id."""
    name = inst.get("institution_name")
    if not name:
        return None
    
    # Check mapping table
    cursor.execute(
        "SELECT institution_id FROM InstitutionNameMap WHERE institution_name = %s",
        (name,),
    )
    row = cursor.fetchone()
    if row:
        return row[0]
    
    # Insert new institution
    cursor.execute(
        """
        INSERT INTO Institution (institution_name, institution_type, street, city, state, zipcode, institution_phone)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (
            name,
            inst.get("institution_type"),
            inst.get("street"),
            inst.get("city"),
            inst.get("state"),
            inst.get("zipcode"),
            inst.get("institution_phone"),
        ),
    )
    institution_id = cursor.lastrowid
    
    # Add to mapping
    cursor.execute(
        "INSERT INTO InstitutionNameMap (institution_name, institution_id) VALUES (%s, %s)",
        (name, institution_id),
    )
    
    return institution_id


def get_or_create_department(cursor, dept: Dict, institution_id: int) -> Optional[int]:
    """Get or create department, return department_id."""
    name = dept.get("department_name")
    if not name:
        return None
    
    # Check mapping table
    cursor.execute(
        "SELECT department_id FROM DepartmentNameMap WHERE department_name = %s",
        (name,),
    )
    row = cursor.fetchone()
    if row:
        return row[0]
    
    # Insert new department
    cursor.execute(
        """
        INSERT INTO Department (institution_id, department_name, department_email, department_phone)
        VALUES (%s, %s, %s, %s)
        """,
        (
            institution_id,
            name,
            dept.get("department_email"),
            dept.get("department_phone"),
        ),
    )
    department_id = cursor.lastrowid
    
    # Add to mapping
    cursor.execute(
        "INSERT INTO DepartmentNameMap (department_name, department_id) VALUES (%s, %s)",
        (name, department_id),
    )
    
    return department_id


def get_or_create_person(cursor, person: Dict) -> Optional[int]:
    """Get or create person, return person_id."""
    email = person.get("person_email")
    if not email:
        return None
    
    # Check mapping table
    cursor.execute(
        "SELECT person_id FROM PersonEmailMap WHERE person_email = %s",
        (email,),
    )
    row = cursor.fetchone()
    if row:
        return row[0]
    
    # Insert new person
    cursor.execute(
        """
        INSERT INTO Person (person_name, person_email, person_phone, bio)
        VALUES (%s, %s, %s, %s)
        """,
        (
            person.get("person_name"),
            email,
            person.get("person_phone"),
            person.get("bio"),
        ),
    )
    person_id = cursor.lastrowid
    
    # Add to mapping
    cursor.execute(
        "INSERT INTO PersonEmailMap (person_email, person_id) VALUES (%s, %s)",
        (email, person_id),
    )
    
    return person_id


def get_or_create_project(cursor, project: Dict) -> Optional[int]:
    """Get or create project, return project_id."""
    title = project.get("project_title")
    if not title:
        return None
    
    # Check mapping table
    cursor.execute(
        "SELECT project_id FROM ProjectTitleMap WHERE project_title = %s",
        (title,),
    )
    row = cursor.fetchone()
    if row:
        return row[0]
    
    # Insert new project
    cursor.execute(
        """
        INSERT INTO Project (project_title, project_description, project_tags, leadperson_id, start_date, end_date)
        VALUES (%s, %s, %s, NULL, %s, %s)
        """,
        (
            title,
            project.get("project_description"),
            project.get("project_tags"),
            project.get("start_date"),
            project.get("end_date"),
        ),
    )
    project_id = cursor.lastrowid
    
    # Add to mapping
    cursor.execute(
        "INSERT INTO ProjectTitleMap (project_title, project_id) VALUES (%s, %s)",
        (title, project_id),
    )
    
    return project_id


def load_institutions_and_people(conn: MySQLConnection, data: Dict) -> None:
    """Load institutions, departments, and people from unified JSON."""
    cursor = conn.cursor()
    try:
        institutions = data.get("institutions", [])
        
        for inst in institutions:
            institution_id = get_or_create_institution(cursor, inst)
            if not institution_id:
                continue
            
            departments = inst.get("departments", [])
            for dept in departments:
                department_id = get_or_create_department(cursor, dept, institution_id)
                if not department_id:
                    continue
                
                people = dept.get("people", [])
                for person in people:
                    get_or_create_person(cursor, person)
        
        conn.commit()
        print(f"✓ Loaded {len(institutions)} institutions with nested departments and people")
    finally:
        cursor.close()


def load_projects(conn: MySQLConnection, data: Dict) -> None:
    """Load projects from unified JSON."""
    cursor = conn.cursor()
    try:
        projects = data.get("projects", [])
        
        for project in projects:
            get_or_create_project(cursor, project)
        
        conn.commit()
        print(f"✓ Loaded {len(projects)} projects")
    finally:
        cursor.close()


def load_workedon(conn: MySQLConnection, data: Dict) -> None:
    """Load WorkedOn relationships via stored procedure."""
    cursor = conn.cursor()
    workedon_rows = data.get("workedon", [])
    inserted = 0
    skipped = 0
    
    try:
        for row in workedon_rows:
            person_email = row.get("person_email")
            project_title = row.get("project_title")
            
            # Lookup person_id
            cursor.execute(
                "SELECT person_id FROM PersonEmailMap WHERE person_email = %s",
                (person_email,),
            )
            person_row = cursor.fetchone()
            if not person_row:
                skipped += 1
                continue
            person_id = person_row[0]
            
            # Lookup project_id
            cursor.execute(
                "SELECT project_id FROM ProjectTitleMap WHERE project_title = %s",
                (project_title,),
            )
            project_row = cursor.fetchone()
            if not project_row:
                skipped += 1
                continue
            project_id = project_row[0]
            
            # Call stored procedure
            cursor.callproc(
                "sp_insert_workedon",
                [
                    person_id,
                    project_id,
                    row.get("project_role"),
                    row.get("start_date"),
                    row.get("end_date"),
                    row.get("notes"),
                ],
            )
            inserted += 1
        
        conn.commit()
        print(f"✓ Loaded {inserted} WorkedOn relationships (skipped {skipped} unmatched)")
    finally:
        cursor.close()


def load_belongsto(conn: MySQLConnection, data: Dict) -> None:
    """Load BelongsTo relationships via stored procedure."""
    cursor = conn.cursor()
    belongsto_rows = data.get("belongsto", [])
    inserted = 0
    skipped = 0
    
    try:
        for row in belongsto_rows:
            dept_name = row.get("department_name")
            inst_name = row.get("institution_name")
            
            # Lookup department_id
            cursor.execute(
                "SELECT department_id FROM DepartmentNameMap WHERE department_name = %s",
                (dept_name,),
            )
            dept_row = cursor.fetchone()
            if not dept_row:
                skipped += 1
                continue
            dept_id = dept_row[0]
            
            # Lookup institution_id
            cursor.execute(
                "SELECT institution_id FROM InstitutionNameMap WHERE institution_name = %s",
                (inst_name,),
            )
            inst_row = cursor.fetchone()
            if not inst_row:
                skipped += 1
                continue
            inst_id = inst_row[0]
            
            # Call stored procedure
            cursor.callproc(
                "sp_insert_belongsto",
                [
                    dept_id,
                    inst_id,
                    row.get("effective_start"),
                    row.get("effective_end"),
                    row.get("justification"),
                ],
            )
            inserted += 1
        
        conn.commit()
        print(f"✓ Loaded {inserted} BelongsTo relationships (skipped {skipped} unmatched)")
    finally:
        cursor.close()


def main():
    parser = argparse.ArgumentParser(description="Load unified JSON into database")
    parser.add_argument(
        "--input",
        type=str,
        required=True,
        help="Path to unified JSON file (e.g., Backend/scrapers/data/nih_projects.json)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse JSON but don't insert into database",
    )
    
    args = parser.parse_args()
    
    # Load JSON
    if not os.path.exists(args.input):
        print(f"✗ File not found: {args.input}", file=sys.stderr)
        sys.exit(1)
    
    print(f"Loading JSON from {args.input}...")
    with open(args.input, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    print(f"✓ JSON loaded: source={data.get('source')}, scraped_at={data.get('scraped_at')}")
    
    if args.dry_run:
        print("✓ Dry run complete (no DB changes)")
        sys.exit(0)
    
    # Connect to database
    try:
        mysql_params = load_db_config()
        conn = mysql.connector.connect(**mysql_params)
        print(f"✓ Connected to MySQL database: {mysql_params['database']}")
    except mysql.connector.Error as e:
        print(f"✗ Database connection error: {e}", file=sys.stderr)
        sys.exit(1)
    
    try:
        # Ensure mapping tables exist
        ensure_mapping_tables(conn)
        
        # Load in order: institutions/people → projects → workedon/belongsto
        print("\nLoading institutions, departments, and people...")
        load_institutions_and_people(conn, data)
        
        print("\nLoading projects...")
        load_projects(conn, data)
        
        print("\nLoading WorkedOn relationships...")
        load_workedon(conn, data)
        
        print("\nLoading BelongsTo relationships...")
        load_belongsto(conn, data)
        
        print("\n✓ All data loaded successfully")
        
    except mysql.connector.Error as e:
        print(f"\n✗ Database error: {e}", file=sys.stderr)
        conn.rollback()
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Error: {e}", file=sys.stderr)
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
