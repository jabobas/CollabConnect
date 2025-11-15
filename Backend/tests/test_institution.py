
"""
Filename: db_init.py
Author: Lucas Matheson
Edited by: Lucas Matheson
Date: November 15, 2025

This is the unit test that will check to ensure all the procedures for instituion
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


def test_insert_institution(db_cursor, sample_institution):
    """Unit test for InsertIntoInstitution procedure."""
    
    result = call_procedure(
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
    
    institution_id = result['new_id'] if result else None
    
    # Assert that the insert returned a valid ID
    assert institution_id is not None
    assert isinstance(institution_id, int)

    mysql.connection.commit()


def test_select_institution_by_name(db_cursor, sample_institution):
    """Unit test for SelectInstitutionByName procedure."""
    
    # Insert test data
    call_procedure(
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
    
    # Test SelectInstitutionByName
    result = call_procedure(
        db_cursor,
        "SelectInstitutionByName",
        [sample_institution["institution_name"]]
    )
    
    # Assert the data was retrieved correctly
    assert result is not None
    assert result['institution_name'] == sample_institution['institution_name']
    assert result['institution_type'] == sample_institution['institution_type']
    assert result['city'] == sample_institution['city']
    assert result['state'] == sample_institution['state']
    
    # Cleanup
    call_procedure(db_cursor, "DeleteInstitution", [sample_institution["institution_name"]])
    mysql.connection.commit()


def test_get_all_institutions(db_cursor, sample_institution):
    """Unit test for GetAllInstitutions procedure."""
    
    # Insert test data
    call_procedure(
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
    
    # Test GetAllInstitutions - call procedure directly since it returns multiple rows
    db_cursor.callproc("GetAllInstitutions", [])
    results = db_cursor.fetchall()
    
    # Consume any remaining result sets
    while db_cursor.nextset():
        pass
    
    # Assert we got results and our test institution is in there
    assert len(results) > 0
    institution_names = [inst['institution_name'] for inst in results]
    assert sample_institution['institution_name'] in institution_names
    
    # Cleanup
    call_procedure(db_cursor, "DeleteInstitution", [sample_institution["institution_name"]])
    mysql.connection.commit()


def test_update_institution_details(db_cursor, sample_institution):
    """Unit test for UpdateInstitutionDetails procedure."""
    
    # Insert test data
    call_procedure(
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
    
    # Update the institution
    new_type = "Updated Type"
    new_street = "123 New St"
    new_city = "Newtown"
    new_state = "NS"
    new_zipcode = "12345"
    new_phone = "555-1234"
    
    call_procedure(
        db_cursor,
        "UpdateInstitutionDetails",
        [
            sample_institution["institution_name"],
            new_type,
            new_street,
            new_city,
            new_state,
            new_zipcode,
            new_phone,
        ]
    )
    mysql.connection.commit()
    
    # Verify the update
    result = call_procedure(
        db_cursor,
        "SelectInstitutionByName",
        [sample_institution["institution_name"]]
    )
    
    assert result is not None
    assert result['institution_type'] == new_type
    assert result['street'] == new_street
    assert result['city'] == new_city
    assert result['state'] == new_state
    assert result['zipcode'] == new_zipcode
    assert result['institution_phone'] == new_phone
    
    # Cleanup
    call_procedure(db_cursor, "DeleteInstitution", [sample_institution["institution_name"]])
    mysql.connection.commit()


def test_update_institution_phone(db_cursor, sample_institution):
    """Unit test for UpdateInstitutionPhone procedure."""
    
    # Insert test data
    call_procedure(
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
    
    # Update phone
    new_phone = "555-9999"
    call_procedure(
        db_cursor,
        "UpdateInstitutionPhone",
        [sample_institution["institution_name"], new_phone]
    )
    mysql.connection.commit()
    
    # Verify the update
    result = call_procedure(
        db_cursor,
        "SelectInstitutionByName",
        [sample_institution["institution_name"]]
    )
    
    assert result is not None
    assert result['institution_phone'] == new_phone
    
    # Cleanup
    call_procedure(db_cursor, "DeleteInstitution", [sample_institution["institution_name"]])
    mysql.connection.commit()


def test_update_institution_type(db_cursor, sample_institution):
    """Unit test for UpdateInstitutionType procedure."""
    
    # Insert test data
    call_procedure(
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
    
    # Update type
    new_type = "University"
    call_procedure(
        db_cursor,
        "UpdateInstitutionType",
        [sample_institution["institution_name"], new_type]
    )
    mysql.connection.commit()
    
    # Verify the update
    result = call_procedure(
        db_cursor,
        "SelectInstitutionByName",
        [sample_institution["institution_name"]]
    )
    
    assert result is not None
    assert result['institution_type'] == new_type
    
    # Cleanup
    call_procedure(db_cursor, "DeleteInstitution", [sample_institution["institution_name"]])
    mysql.connection.commit()


def test_update_institution_address(db_cursor, sample_institution):
    """Unit test for UpdateInstitutionAddress procedure."""
    
    # Insert test data
    call_procedure(
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
    
    # Update address
    new_street = "456 Updated Ave"
    new_city = "Updateville"
    new_state = "UP"
    new_zipcode = "67890"
    
    call_procedure(
        db_cursor,
        "UpdateInstitutionAddress",
        [
            sample_institution["institution_name"],
            new_street,
            new_city,
            new_state,
            new_zipcode,
        ]
    )
    mysql.connection.commit()
    
    # Verify the update
    result = call_procedure(
        db_cursor,
        "SelectInstitutionByName",
        [sample_institution["institution_name"]]
    )
    
    assert result is not None
    assert result['street'] == new_street
    assert result['city'] == new_city
    assert result['state'] == new_state
    assert result['zipcode'] == new_zipcode
    
    # Cleanup
    call_procedure(db_cursor, "DeleteInstitution", [sample_institution["institution_name"]])
    mysql.connection.commit()


def test_delete_institution(db_cursor, sample_institution):
    """Unit test for DeleteInstitution procedure."""
    
    # Delete the institution
    call_procedure(db_cursor, "DeleteInstitution", [sample_institution["institution_name"]])
    mysql.connection.commit()
    
    # Verify deletion
    result = call_procedure(
        db_cursor,
        "SelectInstitutionByName",
        [sample_institution["institution_name"]]
    )
    
    assert result is None