-- wyatt mccurdy - with help from microsofts github copilot :{
-- Nov 9, 2025
-- basic stored procedures for the Person entity

DELIMITER $$

-- 1. Insert new person
CREATE PROCEDURE InsertPerson(
    IN p_person_name VARCHAR(150),
    IN p_person_email VARCHAR(150),
    IN p_person_phone VARCHAR(15),
    IN p_bio TEXT,
    IN p_expertise1 VARCHAR(50),
    IN p_expertise2 VARCHAR(50),
    IN p_expertise3 VARCHAR(50),
    IN p_main_field VARCHAR(50),
    IN p_department_id BIGINT
)
BEGIN
    INSERT INTO Person
        (person_name, person_email, person_phone, bio, expertise_1, expertise_2, expertise_3, main_field, department_id)
    VALUES
        (@PersonName, @PersonEmail, @PersonPhone, @Bio, @Expertise1, @Expertise2, @Expertise3, @MainField, @DepartmentId);
END$$

-- 2. Delete person
CREATE PROCEDURE DeletePerson(
    IN p_person_id BIGINT
)
BEGIN
    DELETE FROM Person
    WHERE person_id = @PersonId;
END$$ 

-- 3. Get all people
CREATE PROCEDURE GetAllPeople()
BEGIN 
    SELECT * 
    FROM Person
END$$

-- 4. Update person given arguments for fields and new values
CREATE PROCEDURE UpdatePerson(
    IN p_person_id BIGINT,
    IN p_person_name VARCHAR(150),
    IN p_person_email VARCHAR(150),
    IN p_person_phone VARCHAR(11),
    IN p_bio TEXT,
    IN p_expertise1 VARCHAR(50),
    IN p_expertise2 VARCHAR(50),
    IN p_expertise3 VARCHAR(50),
    IN p_main_field VARCHAR(50),
    IN p_department_id BIGINT
)
BEGIN
    -- Ensure the person exists
    IF NOT EXISTS (SELECT 1 FROM Person WHERE person_id = p_person_id)
    THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Person with id not found.';
    END IF;

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

-- Additional things it could be useful to add
-- Get all people with a shared expertise
-- Get all people in a department
-- Get all people in a shared institution