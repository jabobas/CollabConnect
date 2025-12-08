-- CRUD Stored Procedures for WorksIn table
-- This table represents the many-to-many relationship between Person and Department
-- Author: GitHub Copilot / Wyatt McCurdy (converted to MySQL)
-- Date: November 12, 2025

-- 1. Insert a new WorksIn relationship
CREATE PROCEDURE InsertWorksIn(
    IN p_person_id BIGINT UNSIGNED,
    IN p_department_id BIGINT UNSIGNED
)
BEGIN
    DECLARE person_count INT;
    DECLARE dept_count INT;
    
    -- Validate person and department exist
    SELECT COUNT(*) INTO person_count
    FROM Person
    WHERE person_id = p_person_id
    FOR UPDATE;
    
    IF person_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Person not found';
    END IF;
    
    SELECT COUNT(*) INTO dept_count
    FROM Department
    WHERE department_id = p_department_id
    FOR UPDATE;
    
    IF dept_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Department not found';
    END IF;
    
    INSERT IGNORE INTO WorksIn (person_id, department_id)
    VALUES (p_person_id, p_department_id);
END;

-- 2. Delete a WorksIn relationship by ID
CREATE PROCEDURE DeleteWorksIn(
    IN p_worksin_id BIGINT UNSIGNED
)
BEGIN
    DECLARE worksin_count INT;
    
    SELECT COUNT(*) INTO worksin_count
    FROM WorksIn
    WHERE worksin_id = p_worksin_id
    FOR UPDATE;
    
    IF worksin_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'WorksIn relationship not found';
    END IF;
    
    DELETE FROM WorksIn WHERE worksin_id = p_worksin_id;
END;

-- 3. Delete WorksIn relationship by Person and Department IDs
CREATE PROCEDURE DeleteWorksInByIds(
    IN p_person_id BIGINT UNSIGNED,
    IN p_department_id BIGINT UNSIGNED
)
BEGIN
    DECLARE worksin_count INT;
    
    SELECT COUNT(*) INTO worksin_count
    FROM WorksIn
    WHERE person_id = p_person_id AND department_id = p_department_id
    FOR UPDATE;
    
    IF worksin_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'WorksIn relationship not found';
    END IF;
    
    DELETE FROM WorksIn
    WHERE person_id = p_person_id AND department_id = p_department_id;
END;

-- 4. Get all WorksIn relationships
CREATE PROCEDURE GetAllWorksIn()
BEGIN
    SELECT w.worksin_id, w.person_id, p.person_name, w.department_id, d.department_name
    FROM WorksIn w
    INNER JOIN Person p ON w.person_id = p.person_id
    INNER JOIN Department d ON w.department_id = d.department_id;
END;
