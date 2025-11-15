-- CRUD Stored Procedures for WorksIn table
-- This table represents the many-to-many relationship between Person and Department
-- Author: GitHub Copilot / Wyatt McCurdy
-- Date: November 12, 2025

-- 1. Insert a new WorksIn relationship
CREATE PROCEDURE InsertWorksIn
    @PersonId BIGINT,
    @DepartmentId BIGINT
AS
BEGIN
    -- Check if the person exists
    IF NOT EXISTS (SELECT 1 FROM Person WHERE person_id = @PersonId)
    BEGIN
        RAISERROR('Person with id %d not found.', 16, 1, @PersonId);
        RETURN;
    END

    -- Check if the department exists
    IF NOT EXISTS (SELECT 1 FROM Department WHERE department_id = @DepartmentId)
    BEGIN
        RAISERROR('Department with id %d not found.', 16, 1, @DepartmentId);
        RETURN;
    END

    -- Check if the relationship already exists
    IF EXISTS (SELECT 1 FROM WorksIn WHERE person_id = @PersonId AND department_id = @DepartmentId)
    BEGIN
        RAISERROR('WorksIn relationship already exists for person %d and department %d.', 16, 1, @PersonId, @DepartmentId);
        RETURN;
    END;

    -- Insert the new relationship
    INSERT INTO WorksIn (person_id, department_id)
    VALUES (@PersonId, @DepartmentId);
END;

-- 2. Delete a WorksIn relationship
CREATE PROCEDURE DeleteWorksIn
    @WorksinId BIGINT
AS
BEGIN
    -- Check if the WorksIn record exists
    IF NOT EXISTS (SELECT 1 FROM WorksIn WHERE worksin_id = @WorksinId)
    BEGIN
        RAISERROR('WorksIn record with id %d not found.', 16, 1, @WorksinId);
        RETURN;
    END

    DELETE FROM WorksIn
    WHERE worksin_id = @WorksinId;
END;

-- 3. Delete WorksIn relationship by Person and Department IDs
CREATE PROCEDURE DeleteWorksInByIds
    @PersonId BIGINT,
    @DepartmentId BIGINT
AS
BEGIN
    -- Check if the relationship exists
    IF NOT EXISTS (SELECT 1 FROM WorksIn WHERE person_id = @PersonId AND department_id = @DepartmentId)
    BEGIN
        RAISERROR('WorksIn relationship not found for person %d and department %d.', 16, 1, @PersonId, @DepartmentId);
        RETURN;
    END

    DELETE FROM WorksIn
    WHERE person_id = @PersonId AND department_id = @DepartmentId;
END;

-- 4. Get all WorksIn relationships
CREATE PROCEDURE GetAllWorksIn
AS
BEGIN
    SELECT 
        w.worksin_id,
        w.person_id,
        p.person_name,
        w.department_id,
        d.department_name
    FROM WorksIn w
    INNER JOIN Person p ON w.person_id = p.person_id
    INNER JOIN Department d ON w.department_id = d.department_id;
END;

-- 5. Get WorksIn relationships by Person ID
CREATE PROCEDURE GetWorksInByPerson
    @PersonId BIGINT
AS
BEGIN
    -- Check if the person exists
    IF NOT EXISTS (SELECT 1 FROM Person WHERE person_id = @PersonId)
    BEGIN
        RAISERROR('Person with id %d not found.', 16, 1, @PersonId);
        RETURN;
    END

    SELECT 
        w.worksin_id,
        w.person_id,
        p.person_name,
        w.department_id,
        d.department_name,
        d.department_email
    FROM WorksIn w
    INNER JOIN Person p ON w.person_id = p.person_id
    INNER JOIN Department d ON w.department_id = d.department_id
    WHERE w.person_id = @PersonId;
END;

-- 6. Get WorksIn relationships by Department ID
CREATE PROCEDURE GetWorksInByDepartment
    @DepartmentId BIGINT
AS
BEGIN
    -- Check if the department exists
    IF NOT EXISTS (SELECT 1 FROM Department WHERE department_id = @DepartmentId)
    BEGIN
        RAISERROR('Department with id %d not found.', 16, 1, @DepartmentId);
        RETURN;
    END

    SELECT 
        w.worksin_id,
        w.person_id,
        p.person_name,
        p.person_email,
        w.department_id,
        d.department_name
    FROM WorksIn w
    INNER JOIN Person p ON w.person_id = p.person_id
    INNER JOIN Department d ON w.department_id = d.department_id
    WHERE w.department_id = @DepartmentId;
END;

-- 7. Get a specific WorksIn relationship by ID
CREATE PROCEDURE GetWorksInById
    @WorksinId BIGINT
AS
BEGIN
    -- Check if the WorksIn record exists
    IF NOT EXISTS (SELECT 1 FROM WorksIn WHERE worksin_id = @WorksinId)
    BEGIN
        RAISERROR('WorksIn record with id %d not found.', 16, 1, @WorksinId);
        RETURN;
    END

    SELECT 
        w.worksin_id,
        w.person_id,
        p.person_name,
        w.department_id,
        d.department_name
    FROM WorksIn w
    INNER JOIN Person p ON w.person_id = p.person_id
    INNER JOIN Department d ON w.department_id = d.department_id
    WHERE w.worksin_id = @WorksinId;
END;

------------------------------------------------
-- Additional useful procedures
------------------------------------------------

-- 8. Check if a WorksIn relationship exists
CREATE PROCEDURE CheckWorksInExists
    @PersonId BIGINT,
    @DepartmentId BIGINT
AS
BEGIN
    IF EXISTS (SELECT 1 FROM WorksIn WHERE person_id = @PersonId AND department_id = @DepartmentId)
    BEGIN
        SELECT 1 AS RelationshipExists;
    END
    ELSE
    BEGIN
        SELECT 0 AS RelationshipExists;
    END
END;

-- 9. Get count of departments a person works in
CREATE PROCEDURE GetDepartmentCountByPerson
    @PersonId BIGINT
AS
BEGIN
    SELECT COUNT(*) AS DepartmentCount
    FROM WorksIn
    WHERE person_id = @PersonId;
END;

-- 10. Get count of people working in a department
CREATE PROCEDURE GetPersonCountByDepartment
    @DepartmentId BIGINT
AS
BEGIN
    SELECT COUNT(*) AS PersonCount
    FROM WorksIn
    WHERE department_id = @DepartmentId;
END;
