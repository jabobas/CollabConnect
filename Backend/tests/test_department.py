
"""
Filename: db_init.py
Author: Lucas Matheson
Edited by: Lucas Matheson
Date: November 15, 2025

This is the unit test that will check to ensure all the procedures for department
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


def test_insert_department(db_cursor, sample_institution, sample_department):
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

    
    # Assert that the insert returned a valid ID
    assert dept_id is not None
    assert isinstance(dept_id, int)

    mysql.connection.commit()



    
    
def test_update_institution_details(db_cursor, sample_department):
    """Unit test for UpdateInstitutionDetails procedure."""
    dept = call_procedure(db_cursor, "SelectDepartmentByName", [sample_department["department_name"]])

    
    # Update the department
    new_name = "Updated Name"
    new_email = "newmail@lucas.com"
    new_phone = "555-1234"
    
    call_procedure(
        db_cursor,
        "UpdateDepartmentDetails",
        [
            [dept['department_id']],
            new_phone,
            new_email,
            new_name,
        ]
    )
    mysql.connection.commit()
    
    # Verify the update
    dept = call_procedure(db_cursor, "SelectDepartmentByName", [new_name])

    assert dept is not None
    assert dept['department_name'] == new_name
    assert dept['department_email'] == new_email
    assert dept['department_phone'] == new_phone
    # If we make it here, updates are a success, change entry back to default
    
    call_procedure(
        db_cursor,
        "UpdateDepartmentDetails",
        [
            dept['department_id'],
            sample_department['department_phone'],
            sample_department['department_email'],
            sample_department['department_name'],
        ]
    )
    mysql.connection.commit()
    

# Ensure delete tests are last if not inserting and deleting each time
def test_delete_select_deptartment(db_cursor, sample_institution, sample_department):
    """Unit test for DeleteDepartment and SelectDepartment procedure."""
    dept = call_procedure(db_cursor, "SelectDepartmentByName", [sample_department["department_name"]])
    # Run checks on department select
    assert dept['department_name'] == sample_department["department_name"]
    assert dept['department_email'] == sample_department["department_email"]
    # I need the id for this
    call_procedure(db_cursor, "DeleteDepartment", [dept['department_id']])
    
    # Delete the institution
    call_procedure(db_cursor, "DeleteInstitution", [sample_institution["institution_name"]])
    


    mysql.connection.commit()
    
    # Verify deletion
    result = call_procedure(db_cursor, "SelectDepartmentByName", [sample_department["department_name"]])

    
    assert result is None