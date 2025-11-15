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
    INSERT IGNORE INTO WorksIn (person_id, department_id)
    VALUES (p_person_id, p_department_id);
END;

-- 2. Delete a WorksIn relationship by ID
CREATE PROCEDURE DeleteWorksIn(
    IN p_worksin_id BIGINT UNSIGNED
)
BEGIN
    DELETE FROM WorksIn WHERE worksin_id = p_worksin_id;
END;

-- 3. Delete WorksIn relationship by Person and Department IDs
CREATE PROCEDURE DeleteWorksInByIds(
    IN p_person_id BIGINT UNSIGNED,
    IN p_department_id BIGINT UNSIGNED
)
BEGIN
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
