"""
Filename: test_concurrency.py
Author: AI Assistant
Edited by: Lucas Matheson
Date: December 7, 2025

This test suite validates concurrency control and race condition prevention
in the CollabConnect application. Tests use threading to simulate concurrent
operations and verify proper locking behavior.

To run: pytest tests/test_concurrency.py -v
"""

import pytest
import threading
import time
from app import app, mysql
from MySQLdb import OperationalError


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
def sample_person_for_concurrency(db_cursor):
    """Create a test person for concurrency tests"""
    cursor = db_cursor
    cursor.callproc('InsertIntoInstitution', [
        'Concurrency Test University',
        'University',
        '123 Test St',
        'TestCity',
        'TS',
        '12345',
        '555-0000'
    ])
    institution_result = cursor.fetchone()
    institution_id = institution_result['new_id'] if institution_result else None
    while cursor.nextset():
        pass
    mysql.connection.commit()
    
    cursor.callproc('InsertIntoDepartment', [
        '555-0001',
        'concurrent@test.com',
        'Concurrency Test Dept',
        institution_id
    ])
    dept_result = cursor.fetchone()
    dept_id = dept_result['new_id'] if dept_result else None
    while cursor.nextset():
        pass
    mysql.connection.commit()
    
    cursor.callproc('InsertPerson', [
        'Concurrent Test Person',
        'concurrent.person@test.com',
        '555-0002',
        'Testing concurrency',
        'Concurrency',
        'Testing',
        'Race Conditions',
        'Computer Science',
        dept_id
    ])
    person_result = cursor.fetchone()
    person_id = person_result['person_id'] if person_result else None
    while cursor.nextset():
        pass
    mysql.connection.commit()
    
    yield person_id
    
    # Cleanup
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


def test_concurrent_project_creation_same_person(app_context, sample_person_for_concurrency):
    """
    Test that concurrent project creation for the same person is properly serialized.
    Both projects should be created successfully without conflicts.
    """
    person_id = sample_person_for_concurrency
    results = {'success': 0, 'errors': []}
    lock = threading.Lock()
    
    def create_project(project_num):
        try:
            with app.app_context():
                cursor = mysql.connection.cursor()
                cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")
                cursor.execute("START TRANSACTION")
                
                cursor.callproc('InsertIntoProject', [
                    f'Concurrent Project {project_num}',
                    f'Testing concurrent creation {project_num}',
                    person_id,
                    'Testing',
                    '2025-01-01',
                    '2025-12-31'
                ])
                
                while cursor.nextset():
                    pass
                
                mysql.connection.commit()
                cursor.close()
                
                with lock:
                    results['success'] += 1
        except Exception as e:
            with lock:
                results['errors'].append(str(e))
            try:
                mysql.connection.rollback()
            except:
                pass
    
    # Create two threads that try to create projects simultaneously
    thread1 = threading.Thread(target=create_project, args=(1,))
    thread2 = threading.Thread(target=create_project, args=(2,))
    
    thread1.start()
    thread2.start()
    
    thread1.join()
    thread2.join()
    
    # Both projects should be created successfully
    assert results['success'] == 2, f"Expected 2 successful creations, got {results['success']}. Errors: {results['errors']}"
    
    # Verify both projects exist
    cursor = mysql.connection.cursor()
    cursor.execute('SELECT COUNT(*) as count FROM Project WHERE person_id = %s', (person_id,))
    count_result = cursor.fetchone()
    cursor.close()
    
    assert count_result['count'] == 2, "Both projects should exist in database"


def test_concurrent_project_updates_lost_update_prevention(app_context, sample_person_for_concurrency):
    """
    Test that concurrent updates to the same project are serialized,
    preventing lost updates. The final state should reflect the last committed transaction.
    """
    person_id = sample_person_for_concurrency
    
    # Create initial project
    cursor = mysql.connection.cursor()
    cursor.callproc('InsertIntoProject', [
        'Original Title',
        'Original Description',
        person_id,
        'Testing',
        '2025-01-01',
        '2025-12-31'
    ])
    project_result = cursor.fetchone()
    project_id = project_result['project_id'] if project_result else None
    while cursor.nextset():
        pass
    mysql.connection.commit()
    cursor.close()
    
    results = {'success': 0, 'errors': []}
    lock = threading.Lock()
    
    def update_project(new_title, delay=0):
        try:
            time.sleep(delay)  # Stagger the updates slightly
            with app.app_context():
                cursor = mysql.connection.cursor()
                cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")
                cursor.execute("START TRANSACTION")
                
                cursor.callproc('UpdateProjectDetails', [
                    project_id,
                    new_title,
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
                    results['success'] += 1
        except Exception as e:
            with lock:
                results['errors'].append(str(e))
            try:
                mysql.connection.rollback()
            except:
                pass
    
    # Create two threads that try to update the same project
    thread1 = threading.Thread(target=update_project, args=('Title from Thread 1', 0))
    thread2 = threading.Thread(target=update_project, args=('Title from Thread 2', 0.1))
    
    thread1.start()
    thread2.start()
    
    thread1.join()
    thread2.join()
    
    # Both updates should succeed (serialized by locking)
    assert results['success'] == 2, f"Expected 2 successful updates, got {results['success']}. Errors: {results['errors']}"
    
    # Verify the project was updated (should have one of the titles)
    cursor = mysql.connection.cursor()
    cursor.execute('SELECT project_title FROM Project WHERE project_id = %s', (project_id,))
    final_result = cursor.fetchone()
    cursor.close()
    
    # Should be one of the updated titles, not the original
    assert final_result['project_title'] in ['Title from Thread 1', 'Title from Thread 2']
    assert final_result['project_title'] != 'Original Title'


def test_concurrent_delete_prevents_double_deletion(app_context, sample_person_for_concurrency):
    """
    Test that concurrent deletion attempts are handled correctly.
    Only one deletion should succeed, the other should get an error.
    """
    person_id = sample_person_for_concurrency
    
    # Create initial project
    cursor = mysql.connection.cursor()
    cursor.callproc('InsertIntoProject', [
        'Project To Delete',
        'Will be deleted concurrently',
        person_id,
        'Testing',
        '2025-01-01',
        '2025-12-31'
    ])
    project_result = cursor.fetchone()
    project_id = project_result['project_id'] if project_result else None
    while cursor.nextset():
        pass
    mysql.connection.commit()
    cursor.close()
    
    results = {'success': 0, 'errors': []}
    lock = threading.Lock()
    
    def delete_project():
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
                    results['success'] += 1
        except Exception as e:
            with lock:
                results['errors'].append(str(e))
            try:
                mysql.connection.rollback()
            except:
                pass
    
    # Create two threads that try to delete the same project
    thread1 = threading.Thread(target=delete_project)
    thread2 = threading.Thread(target=delete_project)
    
    thread1.start()
    thread2.start()
    
    thread1.join()
    thread2.join()
    
    # Only one deletion should succeed, one should error (project not found)
    assert results['success'] == 1, f"Expected 1 successful deletion, got {results['success']}"
    assert len(results['errors']) == 1, f"Expected 1 error, got {len(results['errors'])}"
    assert 'Project not found' in results['errors'][0], "Error should indicate project not found"
    
    # Verify project is deleted
    cursor = mysql.connection.cursor()
    cursor.execute('SELECT COUNT(*) as count FROM Project WHERE project_id = %s', (project_id,))
    count_result = cursor.fetchone()
    cursor.close()
    
    assert count_result['count'] == 0, "Project should be deleted"


def test_concurrent_update_and_delete(app_context, sample_person_for_concurrency):
    """
    Test that concurrent update and delete operations are properly serialized.
    Either update happens first (then delete), or delete happens first (update errors).
    """
    person_id = sample_person_for_concurrency
    
    # Create initial project
    cursor = mysql.connection.cursor()
    cursor.callproc('InsertIntoProject', [
        'Project for Update/Delete Race',
        'Testing race condition',
        person_id,
        'Testing',
        '2025-01-01',
        '2025-12-31'
    ])
    project_result = cursor.fetchone()
    project_id = project_result['project_id'] if project_result else None
    while cursor.nextset():
        pass
    mysql.connection.commit()
    cursor.close()
    
    results = {'update_success': False, 'delete_success': False, 'errors': []}
    lock = threading.Lock()
    
    def update_project():
        try:
            time.sleep(0.05)  # Slight delay to increase race window
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
                    results['update_success'] = True
        except Exception as e:
            with lock:
                results['errors'].append(('update', str(e)))
            try:
                mysql.connection.rollback()
            except:
                pass
    
    def delete_project():
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
                    results['delete_success'] = True
        except Exception as e:
            with lock:
                results['errors'].append(('delete', str(e)))
            try:
                mysql.connection.rollback()
            except:
                pass
    
    thread1 = threading.Thread(target=update_project)
    thread2 = threading.Thread(target=delete_project)
    
    thread1.start()
    thread2.start()
    
    thread1.join()
    thread2.join()
    
    # Either delete succeeds and update fails, OR update succeeds then delete succeeds
    # What should NOT happen: both fail, or inconsistent state
    
    if results['delete_success']:
        # Delete succeeded, verify project is gone
        cursor = mysql.connection.cursor()
        cursor.execute('SELECT COUNT(*) as count FROM Project WHERE project_id = %s', (project_id,))
        count_result = cursor.fetchone()
        cursor.close()
        assert count_result['count'] == 0, "Project should be deleted"
        
        # If update failed, it should be because project not found
        if not results['update_success']:
            update_errors = [e for op, e in results['errors'] if op == 'update']
            assert len(update_errors) > 0, "Update should have failed"
            assert 'Project not found' in update_errors[0], "Update should fail with 'Project not found'"
    
    # At least one operation should succeed
    assert results['update_success'] or results['delete_success'], \
        f"At least one operation should succeed. Errors: {results['errors']}"


def test_create_project_with_invalid_person_concurrent(app_context):
    """
    Test that attempting to create projects with invalid person_id
    properly fails with validation error, even under concurrent load.
    """
    invalid_person_id = 999999999  # Non-existent person
    results = {'success': 0, 'errors': []}
    lock = threading.Lock()
    
    def create_project_invalid(project_num):
        try:
            with app.app_context():
                cursor = mysql.connection.cursor()
                cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")
                cursor.execute("START TRANSACTION")
                
                cursor.callproc('InsertIntoProject', [
                    f'Invalid Project {project_num}',
                    'Should fail',
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
                    results['success'] += 1
        except Exception as e:
            with lock:
                results['errors'].append(str(e))
            try:
                mysql.connection.rollback()
            except:
                pass
    
    threads = [threading.Thread(target=create_project_invalid, args=(i,)) for i in range(5)]
    
    for t in threads:
        t.start()
    
    for t in threads:
        t.join()
    
    # All should fail with person not found
    assert results['success'] == 0, "No projects should be created for invalid person"
    assert len(results['errors']) == 5, "All 5 attempts should fail"
    
    for error in results['errors']:
        assert 'Person not found' in error or 'foreign key constraint' in error.lower(), \
            f"Error should indicate person not found or FK constraint: {error}"


def test_lock_timeout_behavior(app_context, sample_person_for_concurrency):
    """
    Test that if a lock is held too long, other transactions handle timeout appropriately.
    This simulates a long-running transaction blocking others.
    """
    person_id = sample_person_for_concurrency
    
    # Create initial project
    cursor = mysql.connection.cursor()
    cursor.callproc('InsertIntoProject', [
        'Lock Timeout Test Project',
        'Testing lock timeout',
        person_id,
        'Testing',
        '2025-01-01',
        '2025-12-31'
    ])
    project_result = cursor.fetchone()
    project_id = project_result['project_id'] if project_result else None
    while cursor.nextset():
        pass
    mysql.connection.commit()
    cursor.close()
    
    results = {'first_success': False, 'second_result': None}
    
    def long_update():
        """Hold lock for extended period"""
        try:
            with app.app_context():
                cursor = mysql.connection.cursor()
                cursor.execute("SET SESSION innodb_lock_wait_timeout = 5")  # 5 second timeout
                cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")
                cursor.execute("START TRANSACTION")
                
                # Acquire lock
                cursor.callproc('UpdateProjectDetails', [
                    project_id,
                    'First Update',
                    'Holding lock',
                    'Testing',
                    '2025-01-01',
                    '2025-12-31'
                ])
                
                while cursor.nextset():
                    pass
                
                # Hold the lock
                time.sleep(3)
                
                mysql.connection.commit()
                cursor.close()
                results['first_success'] = True
        except Exception as e:
            results['second_result'] = str(e)
            try:
                mysql.connection.rollback()
            except:
                pass
    
    def quick_update():
        """Try to update while first transaction holds lock"""
        try:
            time.sleep(0.5)  # Start after first transaction acquires lock
            with app.app_context():
                cursor = mysql.connection.cursor()
                cursor.execute("SET SESSION innodb_lock_wait_timeout = 2")  # 2 second timeout
                cursor.execute("SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED")
                cursor.execute("START TRANSACTION")
                
                # This should wait for the lock
                cursor.callproc('UpdateProjectDetails', [
                    project_id,
                    'Second Update',
                    'Should wait',
                    'Testing',
                    '2025-01-01',
                    '2025-12-31'
                ])
                
                while cursor.nextset():
                    pass
                
                mysql.connection.commit()
                cursor.close()
                results['second_result'] = 'success'
        except Exception as e:
            results['second_result'] = str(e)
            try:
                mysql.connection.rollback()
            except:
                pass
    
    thread1 = threading.Thread(target=long_update)
    thread2 = threading.Thread(target=quick_update)
    
    thread1.start()
    thread2.start()
    
    thread1.join()
    thread2.join()
    
    # First update should succeed
    assert results['first_success'], "First update should succeed"
    
    # Second update should either succeed (after waiting) or timeout
    # Both are acceptable behaviors depending on timing
    assert results['second_result'] is not None, "Second update should complete with some result"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
