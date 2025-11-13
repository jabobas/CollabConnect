#!/usr/bin/env python3
"""
Insert Roux Institute data into CollabConnect database.

This script reads the roux_institute_data.json file and inserts the data
into the CollabConnect database. It handles the proper insertion order to
respect foreign key constraints.

Author: Wyatt McCurdy
Date: November 12, 2025
"""

import json
import sys
import configparser
import mysql.connector
from pathlib import Path


def load_config():
    """Load database configuration from config.ini"""
    config = configparser.ConfigParser()
    config_path = Path(__file__).parent / 'config.ini'
    
    if not config_path.exists():
        print(f"Error: config.ini not found at {config_path}")
        print("Please copy config.ini.example to config.ini and configure it.")
        sys.exit(1)
    
    config.read(config_path)
    return {
        'host': config.get('Database', 'db_host', fallback='127.0.0.1'),
        'port': config.getint('Database', 'db_port', fallback=3306),
        'user': config.get('Database', 'db_user', fallback='root'),
        'password': config.get('Database', 'db_password', fallback=''),
        'database': config.get('Database', 'db_name', fallback='collab_connect_db')
    }


def connect_db(config):
    """Connect to the MySQL database"""
    try:
        conn = mysql.connector.connect(
            host=config['host'],
            port=config['port'],
            user=config['user'],
            password=config['password'],
            database=config['database']
        )
        print(f"✓ Connected to database '{config['database']}'")
        return conn
    except mysql.connector.Error as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)


def load_json_data(json_path):
    """Load the Roux Institute data from JSON file"""
    try:
        with open(json_path, 'r') as f:
            data = json.load(f)
        print(f"✓ Loaded data from {json_path}")
        return data
    except FileNotFoundError:
        print(f"Error: File not found: {json_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        sys.exit(1)


def insert_institutions(cursor, institutions):
    """Insert institution records"""
    if not institutions:
        print("No institutions to insert")
        return {}
    
    print(f"\nInserting {len(institutions)} institution(s)...")
    institution_ids = {}
    
    for inst in institutions:
        try:
            cursor.execute("""
                INSERT INTO Institution 
                (institution_name, institution_type, street, city, state, zipcode, institution_phone)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                inst['institution_name'],
                inst.get('institution_type'),
                inst.get('street'),
                inst.get('city'),
                inst.get('state'),
                inst.get('zipcode'),
                inst.get('institution_phone')
            ))
            institution_ids[inst['institution_name']] = cursor.lastrowid
            print(f"  ✓ Inserted institution: {inst['institution_name']} (ID: {cursor.lastrowid})")
        except mysql.connector.Error as e:
            print(f"  ✗ Error inserting institution {inst['institution_name']}: {e}")
    
    return institution_ids


def insert_departments(cursor, departments, institution_ids):
    """Insert department records"""
    if not departments:
        print("\nNo departments to insert")
        return {}
    
    print(f"\nInserting {len(departments)} department(s)...")
    department_ids = {}
    
    for idx, dept in enumerate(departments, start=1):
        try:
            # Use the actual institution_id from the inserted institutions
            # Assuming there's only one institution (Roux Institute)
            actual_institution_id = list(institution_ids.values())[0] if institution_ids else dept['institution_id']
            
            cursor.execute("""
                INSERT INTO Department 
                (institution_id, department_name, department_email, department_phone)
                VALUES (%s, %s, %s, %s)
            """, (
                actual_institution_id,
                dept['department_name'],
                dept.get('department_email'),
                dept.get('department_phone')
            ))
            department_ids[idx] = cursor.lastrowid
            print(f"  ✓ Inserted department: {dept['department_name']} (ID: {cursor.lastrowid})")
        except mysql.connector.Error as e:
            print(f"  ✗ Error inserting department {dept['department_name']}: {e}")
    
    return department_ids


def insert_people(cursor, people, department_ids):
    """Insert person records"""
    if not people:
        print("\nNo people to insert")
        return {}
    
    print(f"\nInserting {len(people)} person/people...")
    person_ids = {}
    
    for idx, person in enumerate(people, start=1):
        try:
            cursor.execute("""
                INSERT INTO Person 
                (person_name, person_email, person_phone, bio, 
                 expertise_1, expertise_2, expertise_3, main_field, department_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                person['person_name'],
                person.get('person_email'),
                person.get('person_phone'),
                person.get('bio'),
                person.get('expertise_1'),
                person.get('expertise_2'),
                person.get('expertise_3'),
                person['main_field'],
                None  # department_id is kept NULL, using WorksIn instead
            ))
            person_ids[idx] = cursor.lastrowid
            print(f"  ✓ Inserted person: {person['person_name']} (ID: {cursor.lastrowid})")
        except mysql.connector.Error as e:
            print(f"  ✗ Error inserting person {person['person_name']}: {e}")
    
    return person_ids


def insert_worksin(cursor, worksin_records, person_ids, department_ids):
    """Insert WorksIn junction table records"""
    if not worksin_records:
        print("\nNo WorksIn relationships to insert")
        return
    
    print(f"\nInserting {len(worksin_records)} WorksIn relationship(s)...")
    success_count = 0
    
    for record in worksin_records:
        try:
            # Map the JSON person_id and department_id to actual database IDs
            json_person_id = record['person_id']
            json_dept_id = record['department_id']
            
            actual_person_id = person_ids.get(json_person_id)
            actual_dept_id = department_ids.get(json_dept_id)
            
            if not actual_person_id or not actual_dept_id:
                print(f"  ✗ Skipping WorksIn: person_id {json_person_id} or dept_id {json_dept_id} not found")
                continue
            
            cursor.execute("""
                INSERT INTO WorksIn (person_id, department_id)
                VALUES (%s, %s)
            """, (actual_person_id, actual_dept_id))
            success_count += 1
        except mysql.connector.Error as e:
            print(f"  ✗ Error inserting WorksIn record: {e}")
    
    print(f"  ✓ Successfully inserted {success_count} WorksIn relationship(s)")


def insert_tags(cursor, tags):
    """Insert tag records"""
    if not tags:
        print("\nNo tags to insert")
        return
    
    print(f"\nInserting {len(tags)} tag(s)...")
    success_count = 0
    
    for tag in tags:
        try:
            cursor.execute("""
                INSERT INTO Tag (tag_name)
                VALUES (%s)
            """, (tag['tag_name'],))
            success_count += 1
            print(f"  ✓ Inserted tag: {tag['tag_name']}")
        except mysql.connector.Error as e:
            print(f"  ✗ Error inserting tag {tag['tag_name']}: {e}")
    
    print(f"  ✓ Successfully inserted {success_count} tag(s)")


def verify_insertion(cursor):
    """Verify the data was inserted correctly"""
    print("\n" + "="*60)
    print("VERIFICATION SUMMARY")
    print("="*60)
    
    tables = ['Institution', 'Department', 'Person', 'WorksIn', 'Tag']
    
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"{table:20s}: {count:5d} record(s)")


def main():
    """Main execution function"""
    print("="*60)
    print("CollabConnect - Roux Institute Data Insertion")
    print("="*60)
    
    # Load configuration and data
    config = load_config()
    
    # Intelligently choose data file - prefer expertise-enhanced version
    data_dir = Path(__file__).parent / 'data'
    expertise_path = data_dir / 'roux_institute_data_with_expertise.json'
    original_path = data_dir / 'roux_institute_data.json'
    
    if expertise_path.exists():
        print("\nℹ  Using expertise-enhanced data file")
        print("   (Generated by insertion_and_cleaning/extract_expertise.py)")
        data_path = expertise_path
    else:
        print("\nℹ  Using original data file")
        print("   (Run insertion_and_cleaning/extract_expertise.py to add expertise fields)")
        data_path = original_path
    
    data = load_json_data(data_path)
    
    # Connect to database
    conn = connect_db(config)
    cursor = conn.cursor()
    
    try:
        # Insert data in proper order to respect foreign key constraints
        institution_ids = insert_institutions(cursor, data.get('Institution', []))
        department_ids = insert_departments(cursor, data.get('Department', []), institution_ids)
        person_ids = insert_people(cursor, data.get('Person', []), department_ids)
        insert_worksin(cursor, data.get('WorksIn', []), person_ids, department_ids)
        insert_tags(cursor, data.get('Tag', []))
        
        # Commit all changes
        conn.commit()
        print("\n✓ All changes committed to database")
        
        # Verify insertion
        verify_insertion(cursor)
        
        print("\n" + "="*60)
        print("✓ Data insertion completed successfully!")
        print("="*60)
        
    except Exception as e:
        conn.rollback()
        print(f"\n✗ Error occurred, rolling back changes: {e}")
        sys.exit(1)
    finally:
        cursor.close()
        conn.close()


if __name__ == '__main__':
    main()
