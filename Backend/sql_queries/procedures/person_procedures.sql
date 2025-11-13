-- wyatt mccurdy - with help from microsofts github copilot :{
-- Nov 9, 2025
-- basic stored procedures for the Person entity

-- 1. Insert new person
CREATE PROCEDURE InsertPerson
    @PersonName VARCHAR(150),
    @PersonEmail VARCHAR(150),
    @PersonPhone VARCHAR(11),
    @Bio TEXT,
    @Expertise1 VARCHAR(50),
    @Expertise2 VARCHAR(50),
    @Expertise3 VARCHAR(50),
    @MainField VARCHAR(50),
    @DepartmentId BIGINT

AS
BEGIN
    INSERT INTO Person
        (person_name, person_email, person_phone, bio, expertise_1, expertise_2, expertise_3, main_field, department_id)
    VALUES
        (@PersonName, @PersonEmail, @PersonPhone, @Bio, @Expertise1, @Expertise2, @Expertise3, @MainField, @DepartmentId);
END$$

-- 2. Delete person
CREATE PROCEDURE DeletePerson
    @PersonId BIGINT
AS
BEGIN
    DELETE FROM Person
    WHERE person_id = @PersonId;
END$$ 

-- 3. Get all people
CREATE PROCEDURE GetAllPeople
AS 
BEGIN 
    SELECT * 
    FROM Person
END$$

-- 4. Update person given arguments for fields and new values
CREATE PROCEDURE UpdatePerson
    @PersonId BIGINT,
    @PersonName VARCHAR(150) = NULL,
    @PersonEmail VARCHAR(150) = NULL,
    @PersonPhone VARCHAR(11) = NULL,
    @Bio TEXT = NULL,
    @Expertise1 VARCHAR(50) = NULL,
    @Expertise2 VARCHAR(50) = NULL,
    @Expertise3 VARCHAR(50) = NULL,
    @MainField VARCHAR(50) = NULL,
    @DepartmentId BIGINT = NULL
AS
BEGIN
    -- Ensure the person exists
    IF NOT EXISTS (SELECT 1 FROM Person WHERE person_id = @PersonId)
    BEGIN
        RAISERROR('Person with id %d not found.', 16, 1, @PersonId);
        RETURN;
    END

    -- Update only provided fields; NULL parameters leave columns unchanged
    UPDATE Person
    SET
        person_name   = COALESCE(@PersonName, person_name),
        person_email  = COALESCE(@PersonEmail, person_email),
        person_phone  = COALESCE(@PersonPhone, person_phone),
        bio           = COALESCE(@Bio, bio),
        expertise_1   = COALESCE(@Expertise1, expertise_1),
        expertise_2   = COALESCE(@Expertise2, expertise_2),
        expertise_3   = COALESCE(@Expertise3, expertise_3),
        main_field    = COALESCE(@MainField, main_field),
        department_id = COALESCE(@DepartmentId, department_id)
    WHERE person_id = @PersonId;
END$$

------------------------------------------------
-- Additional things it could be useful to add
-- Get all people with a shared expertise
-- Get all people in a department
-- Get all people in a shared institution