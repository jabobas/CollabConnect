-- File: Backend/sql_queries/aubin/procedures/workedon_crud.sql
-- Purpose: CRUD stored procedures for WorkedOn (MySQL 8.0).


CREATE PROCEDURE sp_insert_workedon (
    IN p_person_id    BIGINT UNSIGNED,
    IN p_project_id   BIGINT UNSIGNED,
    IN p_project_role VARCHAR(100),
    IN p_start_date   DATE,
    IN p_end_date     DATE,
    IN p_notes        VARCHAR(255)
)
BEGIN
    INSERT INTO WorkedOn (person_id, project_id, project_role, start_date, end_date, notes)
    VALUES (p_person_id, p_project_id, p_project_role, p_start_date, p_end_date, p_notes)
    ON DUPLICATE KEY UPDATE
        project_role = VALUES(project_role),
        end_date     = VALUES(end_date),
        notes        = VALUES(notes);
END;

CREATE PROCEDURE sp_update_workedon_role (
    IN p_person_id    BIGINT UNSIGNED,
    IN p_project_id   BIGINT UNSIGNED,
    IN p_start_date   DATE,
    IN p_project_role VARCHAR(100),
    IN p_notes        VARCHAR(255)
)
BEGIN
    UPDATE WorkedOn
    SET project_role = p_project_role,
        notes        = p_notes
    WHERE person_id = p_person_id
      AND project_id = p_project_id
      AND start_date = p_start_date;
END;

CREATE PROCEDURE sp_close_workedon (
    IN p_person_id  BIGINT UNSIGNED,
    IN p_project_id BIGINT UNSIGNED,
    IN p_start_date DATE,
    IN p_end_date   DATE
)
BEGIN
    UPDATE WorkedOn
    SET end_date = p_end_date
    WHERE person_id = p_person_id
      AND project_id = p_project_id
      AND start_date = p_start_date;
END;

CREATE PROCEDURE sp_delete_workedon (
    IN p_person_id  BIGINT UNSIGNED,
    IN p_project_id BIGINT UNSIGNED,
    IN p_start_date DATE
)
BEGIN
    DELETE FROM WorkedOn
    WHERE person_id = p_person_id
      AND project_id = p_project_id
      AND start_date = p_start_date;
END;

CREATE PROCEDURE sp_get_workedon_for_project (
    IN p_project_id BIGINT UNSIGNED
)
BEGIN
    SELECT w.person_id,
           w.project_id,
           w.project_role,
           w.start_date,
           w.end_date,
           w.notes
    FROM WorkedOn w
    WHERE w.project_id = p_project_id
    ORDER BY w.start_date;
END;


