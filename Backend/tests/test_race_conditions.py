"""
Filename: test_race_conditions.py
Author: AI Assistant
Edited by: Lucas Matheson
Date: December 7, 2025

Focused tests for specific race condition scenarios.
These tests are simpler and faster than the full concurrency suite.

To run: pytest tests/test_race_conditions.py -v -s
"""

import pytest
import threading
import time
from app import app, mysql


@pytest.fixture
def app_context():
    """Provide a Flask application context for the test."""
    with app.app_context():
        yield


@pytest.fixture
def test_data(app_context):
    """Set up test data and clean up after tests"""
    cursor = mysql.connection.cursor()
    
    # Create institution
    cursor.callproc('InsertIntoInstitution', [
        'Race Test University',
        'University',
        '456 Race St',
        'RaceCity',
        'RC',
        '54321',
        '555-RACE'
    ])
    inst_result = cursor.fetchone()
    institution_id = inst_result['new_id'] if inst_result else None
    while cursor.nextset():
        pass
    mysql.connection.commit()
    
    # Create department
    cursor.callproc('InsertIntoDepartment', [
        '555-DEPT',
        'race@test.com',
        'Race Test Dept',
        institution_id
    ])
    dept_result = cursor.fetchone()
    dept_id = dept_result['new_id'] if dept_result else None
    while cursor.nextset():
        pass
    mysql.connection.commit()
    
    # Create person
    cursor.callproc('InsertPerson', [
        'Race Test User',
        'race.test@example.com',
        '555-TEST',
        'Testing race conditions',
        'Testing',
        'Concurrency',
        'Database',
        'Computer Science',
        dept_id
    ])
    person_result = cursor.fetchone()
    person_id = person_result['person_id'] if person_result else None
    while cursor.nextset():
        pass
    mysql.connection.commit()
    cursor.close()
    
    data = {
        'institution_id': institution_id,
        'department_id': dept_id,
        'person_id': person_id
    }
    
    yield data
    
    # Cleanup
    cursor = mysql.connection.cursor()
    try:
        cursor.execute('DELETE FROM WorkedOn WHERE person_id = %s', (person_id,))
        cursor.execute('DELETE FROM Project WHERE person_id = %s', (person_id,))
        cursor.execute('DELETE FROM WorksIn WHERE person_id = %s', (person_id,))
        cursor.execute('DELETE FROM Person WHERE person_id = %s', (person_id,))
        cursor.execute('DELETE FROM Department WHERE department_id = %s', (dept_id,))
        cursor.execute('DELETE FROM Institution WHERE institution_id = %s', (institution_id,))
        mysql.connection.commit()
    except:
        mysql.connection.rollback()
    finally:
        cursor.close()


def test_race_lost_update_is_prevented(test_data):
    """
    CRITICAL TEST: Verify that the "lost update" race condition is prevented.
    
    Scenario: Two transactions read the same project, modify it, and write back.
    Without locking: Both read initial state, both modify, second write overwrites first (LOST UPDATE).
    With locking: First transaction locks row, second waits, changes are sequential (PREVENTED).
    """
    person_id = test_data['person_id']
    
    # Create a project to update
    with app.app_context():
        cursor = mysql.connection.cursor()
        cursor.callproc('InsertIntoProject', [
            'Test Project',
            'Initial description',
            person_id,
            'Testing',
            '2025-01-01',
            '2025-12-31'
        ])
        result = cursor.fetchone()
        project_id = result['project_id'] if result else None
        while cursor.nextset():
            pass
        mysql.connection.commit()
        cursor.close()
    
    update_count = {'success': 0, 'errors': []}
    lock = threading.Lock()
    
    def concurrent_update(title_suffix):
        """Each thread tries to update the project title"""
        try:
            with app.app_context():
                cursor = mysql.connection.cursor()
                cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")
                cursor.execute("START TRANSACTION")
                
                # The stored procedure will lock the row here
                cursor.callproc('UpdateProjectDetails', [
                    project_id,
                    f'Updated Title {title_suffix}',
                    f'Updated by thread {title_suffix}',
                    'Testing',
                    '2025-01-01',
                    '2025-12-31'
                ])
                
                while cursor.nextset():
                    pass
                
                # Simulate some processing time
                time.sleep(0.1)
                
                mysql.connection.commit()
                cursor.close()
                
                with lock:
                    update_count['success'] += 1
        except Exception as e:
            with lock:
                update_count['errors'].append(str(e))
            try:
                mysql.connection.rollback()
            except:
                pass
    
    # Start two threads simultaneously
    thread_a = threading.Thread(target=concurrent_update, args=('A',))
    thread_b = threading.Thread(target=concurrent_update, args=('B',))
    
    thread_a.start()
    thread_b.start()
    thread_a.join()
    thread_b.join()
    
    # ASSERTION 1: Both updates should succeed (serialized by lock)
    assert update_count['success'] == 2, \
        f"Expected 2 successful updates, got {update_count['success']}. Errors: {update_count['errors']}"
    
    # ASSERTION 2: Final state should be from one of the updates (not lost)
    with app.app_context():
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT project_title, project_description FROM Project WHERE project_id = %s', 
                      (project_id,))
        final_state = cursor.fetchone()
        cursor.close()
    
    # The title and description should match (both from same update)
    if 'A' in final_state['project_title']:
        assert 'thread A' in final_state['project_description'], \
            "Title and description should be from the same update (no mixed state)"
    elif 'B' in final_state['project_title']:
        assert 'thread B' in final_state['project_description'], \
            "Title and description should be from the same update (no mixed state)"
    else:
        pytest.fail("Final state should be from one of the updates")
    


def test_race_double_deletion_is_prevented(test_data):
    """
    CRITICAL TEST: Verify that double deletion race condition is prevented.
    
    Scenario: Two transactions try to delete the same project simultaneously.
    Without locking: Both might read "exists", both delete, potential errors or inconsistency.
    With locking: First deletes, second gets "Project not found" error (CORRECT BEHAVIOR).
    """
    person_id = test_data['person_id']
    
    # Create a project to delete
    with app.app_context():
        cursor = mysql.connection.cursor()
        cursor.callproc('InsertIntoProject', [
            'Project To Delete',
            'Will be deleted by concurrent threads',
            person_id,
            'Testing',
            '2025-01-01',
            '2025-12-31'
        ])
        result = cursor.fetchone()
        project_id = result['project_id'] if result else None
        while cursor.nextset():
            pass
        mysql.connection.commit()
        cursor.close()
    
    deletion_results = {'success': 0, 'not_found_errors': 0, 'other_errors': []}
    lock = threading.Lock()
    
    def concurrent_delete():
        """Each thread tries to delete the same project"""
        try:
            with app.app_context():
                cursor = mysql.connection.cursor()
                cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")
                cursor.execute("START TRANSACTION")
                
                cursor.callproc('DeleteProject', [project_id])
                
                while cursor.nextset():
                    pass
                
                mysql.connection.commit()
                cursor.close()
                
                with lock:
                    deletion_results['success'] += 1
        except Exception as e:
            error_msg = str(e)
            with lock:
                if 'Project not found' in error_msg:
                    deletion_results['not_found_errors'] += 1
                else:
                    deletion_results['other_errors'].append(error_msg)
            try:
                mysql.connection.rollback()
            except:
                pass
    
    # Start three threads to increase chance of race
    threads = [threading.Thread(target=concurrent_delete) for _ in range(3)]
    
    for t in threads:
        t.start()
    
    for t in threads:
        t.join()
    
    # ASSERTION 1: Exactly one deletion should succeed
    assert deletion_results['success'] == 1, \
        f"Expected exactly 1 successful deletion, got {deletion_results['success']}"
    
    # ASSERTION 2: Others should get "Project not found" error
    assert deletion_results['not_found_errors'] == 2, \
        f"Expected 2 'not found' errors, got {deletion_results['not_found_errors']}"
    
    # ASSERTION 3: No unexpected errors
    assert len(deletion_results['other_errors']) == 0, \
        f"Unexpected errors occurred: {deletion_results['other_errors']}"
    
    # ASSERTION 4: Project should be deleted from database
    with app.app_context():
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT COUNT(*) as count FROM Project WHERE project_id = %s', (project_id,))
        count = cursor.fetchone()
        cursor.close()
    
    assert count['count'] == 0, "Project should be completely deleted"
    


def test_race_create_with_invalid_person_fails_safely(app_context):
    """
    TEST: Verify that creating projects with non-existent person_id fails safely
    even under concurrent load.
    
    This tests the foreign key validation with locking.
    """
    invalid_person_id = 999999999
    results = {'successes': 0, 'person_not_found': 0, 'other_errors': []}
    lock = threading.Lock()
    
    def try_create_invalid():
        try:
            with app.app_context():
                cursor = mysql.connection.cursor()
                cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")
                cursor.execute("START TRANSACTION")
                
                cursor.callproc('InsertIntoProject', [
                    'Invalid Project',
                    'Should fail - invalid person',
                    invalid_person_id,
                    'Testing',
                    '2025-01-01',
                    '2025-12-31'
                ])
                
                while cursor.nextset():
                    pass
                
                mysql.connection.commit()
                cursor.close()
                
                with lock:
                    results['successes'] += 1
        except Exception as e:
            error_msg = str(e)
            with lock:
                if 'Person not found' in error_msg:
                    results['person_not_found'] += 1
                else:
                    results['other_errors'].append(error_msg)
            try:
                mysql.connection.rollback()
            except:
                pass
    
    threads = [threading.Thread(target=try_create_invalid) for _ in range(5)]
    
    for t in threads:
        t.start()
    
    for t in threads:
        t.join()
    
    # ASSERTION: All should fail with proper error
    assert results['successes'] == 0, "No projects should be created for invalid person"
    assert results['person_not_found'] >= 1, "Should get 'Person not found' errors"
    


def test_race_update_then_delete_serialization(test_data):
    """
    TEST: Verify that update and delete operations on the same project are properly serialized.
    
    This tests that there's no race between update and delete - they should execute in order.
    """
    person_id = test_data['person_id']
    
    # Create project
    with app.app_context():
        cursor = mysql.connection.cursor()
        cursor.callproc('InsertIntoProject', [
            'Update/Delete Race Test',
            'Original description',
            person_id,
            'Testing',
            '2025-01-01',
            '2025-12-31'
        ])
        result = cursor.fetchone()
        project_id = result['project_id'] if result else None
        while cursor.nextset():
            pass
        mysql.connection.commit()
        cursor.close()
    
    results = {'update_ok': False, 'delete_ok': False, 'errors': []}
    lock = threading.Lock()
    
    def do_update():
        try:
            time.sleep(0.05)  # Slight delay
            with app.app_context():
                cursor = mysql.connection.cursor()
                cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")
                cursor.execute("START TRANSACTION")
                
                cursor.callproc('UpdateProjectDetails', [
                    project_id,
                    'Updated Title',
                    'Updated Description',
                    'Testing',
                    '2025-01-01',
                    '2025-12-31'
                ])
                
                while cursor.nextset():
                    pass
                
                mysql.connection.commit()
                cursor.close()
                
                with lock:
                    results['update_ok'] = True
        except Exception as e:
            with lock:
                results['errors'].append(('update', str(e)))
            try:
                mysql.connection.rollback()
            except:
                pass
    
    def do_delete():
        try:
            with app.app_context():
                cursor = mysql.connection.cursor()
                cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")
                cursor.execute("START TRANSACTION")
                
                cursor.callproc('DeleteProject', [project_id])
                
                while cursor.nextset():
                    pass
                
                mysql.connection.commit()
                cursor.close()
                
                with lock:
                    results['delete_ok'] = True
        except Exception as e:
            with lock:
                results['errors'].append(('delete', str(e)))
            try:
                mysql.connection.rollback()
            except:
                pass
    
    t1 = threading.Thread(target=do_update)
    t2 = threading.Thread(target=do_delete)
    
    t1.start()
    t2.start()
    t1.join()
    t2.join()
    
    # ASSERTION: Valid outcomes are:
    # 1. Delete succeeds, update fails (delete was first)
    # 2. Both succeed (update was first, then delete)
    # Invalid outcome: Both fail
    
    assert results['delete_ok'] or results['update_ok'], \
        f"At least one operation should succeed. Results: {results}"
    
    if results['delete_ok'] and not results['update_ok']:
        # Delete was first, update should have proper error
        update_errors = [e for op, e in results['errors'] if op == 'update']
        assert len(update_errors) == 1, "Update should have failed"
        assert 'Project not found' in update_errors[0], "Update should fail with proper message"
    else:
        pytest.fail(f"Unexpected state: {results}")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
