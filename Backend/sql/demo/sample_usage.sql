-- Purpose: quick sanity checks for WorkedOn & BelongsTo stored procedures (MySQL).

START TRANSACTION;

-- Seed minimal data required for FK checks --------------------------------
INSERT INTO Institution (institution_id, institution_name)
VALUES (5, 'Demo Institution')
ON DUPLICATE KEY UPDATE institution_name = VALUES(institution_name);

INSERT INTO Department (department_id, institution_id, department_name)
VALUES (10, 5, 'Demo Department')
ON DUPLICATE KEY UPDATE department_name = VALUES(department_name);

INSERT INTO Person (person_id, person_name, person_email)
VALUES (1, 'Demo Person', 'demo.person@example.com')
ON DUPLICATE KEY UPDATE person_name = VALUES(person_name);

INSERT INTO Project (project_id, project_title, start_date, leadperson_id)
VALUES (1001, 'Demo Project', '2024-01-01', 1)
ON DUPLICATE KEY UPDATE project_title = VALUES(project_title);

-- WorkedOn demo -----------------------------------------------------------
CALL sp_insert_workedon(1, 1001, 'Data Engineer', '2024-01-15', NULL, 'Initial staffing');
CALL sp_update_workedon_role(1, 1001, '2024-01-15', 'Lead Data Engineer', 'Handing coordination duties');
CALL sp_close_workedon(1, 1001, '2024-01-15', '2024-03-31');
CALL sp_get_workedon_for_project(1001);
CALL sp_delete_workedon(1, 1001, '2024-01-15');

-- BelongsTo demo ----------------------------------------------------------
CALL sp_insert_belongsto(10, 5, '2023-08-01', NULL, 'Department formed via merger');
CALL sp_get_belongsto_history(10);
CALL sp_close_belongsto(10, 5, '2023-08-01', '2024-07-31');
CALL sp_get_current_institution_for_department(10);
CALL sp_delete_belongsto(10, 5, '2023-08-01');

ROLLBACK;
