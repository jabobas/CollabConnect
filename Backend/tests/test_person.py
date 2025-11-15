
"""
Filename: db_init.py
Author: Lucas Matheson
Edited by: Lucas Matheson
Date: November 15, 2025

This is the unit test that will check to ensure all the procedures for person
are running accordingly. This also checks to ensure the cursor is connected to 
the database.

To run - pytest
    - Note these run upon each db_init
"""


import pytest
from app import app, mysql

# This function decorator indicates a setup / teardown function for pytesting
@pytest.fixture
def app_context():
    """Provide a Flask application context for the test."""
    with app.app_context():
        yield


@pytest.fixture
def db_cursor(app_context):
    """Provide a database cursor that's properly initialized within app context"""
    cursor = mysql.connection.cursor()
    yield cursor
    cursor.close()


@pytest.fixture
def sample_institution():
    """ Defines the sample data for the test"""
    return {
        "institution_name": 'test institution',
        "institution_type": "Test",
        "street": "99 Remove Rd",
        "city": "Removeville",
        "state": "RV",
        "zipcode": "54321",
        "institution_phone": "555-5432",
    }

@pytest.fixture
def sample_department():
    """ Defines the sample data for the test"""
    return {
        "department_phone": '(123) 456 7890',
        "department_email": "test@test.com",
        "department_name": "test dept",
    }

@pytest.fixture
def sample_person():
    """ Defines the sample data for the test"""
    return {
        "person_name": 'Mr. Test',
        "person_email": "test@test.com",
        "person_phone": "(123) 456 7890",
        "bio": 'test bio',
        "expertise_1": "test expertise_1",
        "expertise_2": "test expertise_2",
        "expertise_3": 'test expertise_3',
        "main_field": "test field",
    }

def call_procedure(cursor, proc_name, params):
    """
    Helper function to call stored procedure and handle results.
    
    This is a better way to handle mulitple procedure calls instead of
    chaining multiple .callproc's  
    """
    cursor.callproc(proc_name, params)
    try:
        result = cursor.fetchone()
    except:
        result = None
    while cursor.nextset():
        pass
    return result

def test_insert_person(db_cursor, sample_institution, sample_department, sample_person):
    """Unit test for InsertIntoInstitution procedure."""
    # You need an instituiton to insert a department
    result_institution = call_procedure(
        db_cursor,
        "InsertIntoInstitution",
        [
            sample_institution["institution_name"],
            sample_institution["institution_type"],
            sample_institution["street"],
            sample_institution["city"],
            sample_institution["state"],
            sample_institution["zipcode"],
            sample_institution["institution_phone"],
        ]
    )
    mysql.connection.commit()

    institution_id = result_institution['new_id'] if result_institution else None
    
    # You need an department to insert a person
    result_department = call_procedure(
        db_cursor,
        "InsertIntoDepartment",
        [
            sample_department["department_phone"],
            sample_department["department_email"],
            sample_department["department_name"],
            institution_id
        ]
    )
    mysql.connection.commit()
    dept_id = result_department['new_id'] if result_department else None

    result_person = call_procedure(
        db_cursor,
        "InsertPerson",
        [
            sample_person["person_name"],
            sample_person["person_email"],
            sample_person["person_phone"],
            sample_person["bio"],
            sample_person["expertise_1"],
            sample_person["expertise_2"],
            sample_person["expertise_3"],
            sample_person["main_field"],
            dept_id
        ]
    )
    mysql.connection.commit()
    person_id = result_person['person_id'] if result_person else None

    # Assert that the insert returned a valid ID
    assert person_id is not None
    assert isinstance(person_id, int)

    mysql.connection.commit()

    
# Ensure delete tests are last if not inserting and deleting each time
def test_delete_select_deptartment(db_cursor, sample_institution, sample_department, sample_person):
    """Unit test for DeleteDepartment and SelectDepartment procedure."""
    
    
    person = call_procedure(db_cursor, "SelectPersonByName", [sample_person["person_name"]])
  
    dept = call_procedure(db_cursor, "SelectDepartmentByName", [sample_department["department_name"]])
    # Run checks on person select
    assert person['person_name'] == sample_person["person_name"]
    assert person['person_email'] == sample_person["person_email"]
    assert person['person_phone'] == sample_person["person_phone"]
    assert person['bio'] == sample_person["bio"]
    assert person['expertise_1'] == sample_person["expertise_1"]
    assert person['expertise_2'] == sample_person["expertise_2"]
    assert person['expertise_3'] == sample_person["expertise_3"]
    assert person['main_field'] == sample_person["main_field"]
    
    call_procedure(db_cursor, "DeletePerson", [person['person_id']])

    call_procedure(db_cursor, "DeleteDepartment", [dept['department_id']])
    
    call_procedure(db_cursor, "DeleteInstitution", [sample_institution["institution_name"]])
    
    mysql.connection.commit()
    
    # Verify deletion
    result = call_procedure(db_cursor, "SelectPersonByName", [sample_person["person_name"]])

    
    assert result is None