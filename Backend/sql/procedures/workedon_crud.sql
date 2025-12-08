-- Author: Aubin Mugisha
-- Description: Stored procedures for inserting, updating, and deleting WorkedOn relationships


CREATE PROCEDURE sp_insert_workedon (
    IN p_person_id    BIGINT UNSIGNED,
    IN p_project_id   BIGINT UNSIGNED,
    IN p_project_role VARCHAR(100),
    IN p_start_date   DATE,
    IN p_end_date     DATE
)
BEGIN
    DECLARE person_count INT;
    DECLARE project_count INT;
    
    -- Lock person row to validate existence
    SELECT COUNT(*) INTO person_count
    FROM Person
    WHERE person_id = p_person_id
    FOR UPDATE;
    
    IF person_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Person not found';
    END IF;
    
    -- Lock project row to validate existence
    SELECT COUNT(*) INTO project_count
    FROM Project
    WHERE project_id = p_project_id
    FOR UPDATE;
    
    IF project_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Project not found';
    END IF;
    
    INSERT INTO WorkedOn (person_id, project_id, project_role, start_date, end_date)
    VALUES (p_person_id, p_project_id, p_project_role, p_start_date, p_end_date)
    ON DUPLICATE KEY UPDATE
        project_role = VALUES(project_role),
        end_date     = VALUES(end_date);
END;

CREATE PROCEDURE sp_update_workedon_role (
    IN p_person_id    BIGINT UNSIGNED,
    IN p_project_id   BIGINT UNSIGNED,
    IN p_start_date   DATE,
    IN p_project_role VARCHAR(100)
)
BEGIN
    DECLARE workedon_count INT;
    
    -- Lock the WorkedOn relationship
    SELECT COUNT(*) INTO workedon_count
    FROM WorkedOn
    WHERE person_id = p_person_id
      AND project_id = p_project_id
      AND start_date = p_start_date
    FOR UPDATE;
    
    IF workedon_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'WorkedOn relationship not found';
    END IF;
    
    UPDATE WorkedOn
    SET project_role = p_project_role
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
    DECLARE workedon_count INT;
    
    -- Lock the WorkedOn relationship
    SELECT COUNT(*) INTO workedon_count
    FROM WorkedOn
    WHERE person_id = p_person_id
      AND project_id = p_project_id
      AND start_date = p_start_date
    FOR UPDATE;
    
    IF workedon_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'WorkedOn relationship not found';
    END IF;
    
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
    DECLARE workedon_count INT;
    
    -- Lock the WorkedOn relationship
    SELECT COUNT(*) INTO workedon_count
    FROM WorkedOn
    WHERE person_id = p_person_id
      AND project_id = p_project_id
      AND start_date = p_start_date
    FOR UPDATE;
    
    IF workedon_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'WorkedOn relationship not found';
    END IF;
    
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
           w.end_date
    FROM WorkedOn w
    WHERE w.project_id = p_project_id
    ORDER BY w.start_date;
END;


