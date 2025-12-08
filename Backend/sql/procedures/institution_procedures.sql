-- Filename: institution_procedures.sql
-- The purpose of this file is to hold INSERT, UPDATE, DELETE, and SELECT procedures for the Institution table.
-- Author: Lucas Matheson
-- Date: November 12, 2025

CREATE PROCEDURE InsertIntoInstitution(
    IN InstitutionName VARCHAR(100),
    IN InstitutionType VARCHAR(50),
    IN Street VARCHAR(100),
    IN City VARCHAR(50),
    IN State VARCHAR(50),
    IN Zipcode VARCHAR(10),
    IN InstitutionPhone VARCHAR(15)
)
BEGIN
    INSERT INTO Institution (institution_name, institution_type, street, city, state, zipcode, institution_phone)
    VALUES (InstitutionName, InstitutionType, Street, City, State, Zipcode, InstitutionPhone);
    SELECT LAST_INSERT_ID() AS new_id;
END;

CREATE PROCEDURE UpdateInstitutionDetails(
    IN InstitutionName VARCHAR(100),
    IN InstitutionType VARCHAR(50),
    IN Street VARCHAR(100),
    IN City VARCHAR(50),
    IN State VARCHAR(50),
    IN Zipcode VARCHAR(10),
    IN InstitutionPhone VARCHAR(15)
)
BEGIN
    DECLARE inst_count INT;
    
    -- Lock the institution row
    SELECT COUNT(*) INTO inst_count
    FROM Institution
    WHERE institution_name = InstitutionName
    FOR UPDATE;
    
    IF inst_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Institution not found';
    END IF;
    
    UPDATE Institution
    SET institution_type = InstitutionType,
        street = Street,
        city = City,
        state = State,
        zipcode = Zipcode,
        institution_phone = InstitutionPhone
    WHERE institution_name = InstitutionName;
END;

CREATE PROCEDURE UpdateInstitutionPhone(
    IN InstitutionName VARCHAR(100),
    IN NewPhone VARCHAR(15)
)
BEGIN
    DECLARE inst_count INT;
    
    SELECT COUNT(*) INTO inst_count
    FROM Institution
    WHERE institution_name = InstitutionName
    FOR UPDATE;
    
    IF inst_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Institution not found';
    END IF;
    
    UPDATE Institution
    SET institution_phone = NewPhone
    WHERE institution_name = InstitutionName;
END;

CREATE PROCEDURE UpdateInstitutionType(
    IN InstitutionName VARCHAR(100),
    IN NewType VARCHAR(50)
)
BEGIN
    DECLARE inst_count INT;
    
    SELECT COUNT(*) INTO inst_count
    FROM Institution
    WHERE institution_name = InstitutionName
    FOR UPDATE;
    
    IF inst_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Institution not found';
    END IF;
    
    UPDATE Institution
    SET institution_type = NewType
    WHERE institution_name = InstitutionName;
END;

CREATE PROCEDURE UpdateInstitutionAddress(
    IN InstitutionName VARCHAR(100),
    IN NewStreet VARCHAR(100),
    IN NewCity VARCHAR(50),
    IN NewState VARCHAR(50),
    IN NewZipcode VARCHAR(10)
)
BEGIN
    DECLARE inst_count INT;
    
    SELECT COUNT(*) INTO inst_count
    FROM Institution
    WHERE institution_name = InstitutionName
    FOR UPDATE;
    
    IF inst_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Institution not found';
    END IF;
    
    UPDATE Institution
    SET street = NewStreet,
        city = NewCity,
        state = NewState,
        zipcode = NewZipcode
    WHERE institution_name = InstitutionName;
END;

CREATE PROCEDURE DeleteInstitution(IN InstitutionName VARCHAR(100))
BEGIN
    DECLARE inst_count INT;
    
    SELECT COUNT(*) INTO inst_count
    FROM Institution
    WHERE institution_name = InstitutionName
    FOR UPDATE;
    
    IF inst_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Institution not found';
    END IF;
    
    -- Lock related rows
    SELECT COUNT(*) FROM Department WHERE institution_id IN 
        (SELECT institution_id FROM Institution WHERE institution_name = InstitutionName)
    FOR UPDATE;
    
    DELETE FROM Institution WHERE institution_name = InstitutionName;
END;

CREATE PROCEDURE GetAllInstitutions()
BEGIN
    SELECT * FROM Institution;
END;

CREATE PROCEDURE SelectInstitutionByName(IN InstitutionName VARCHAR(100))
BEGIN
    SELECT * FROM Institution WHERE institution_name = InstitutionName;
END;

CREATE PROCEDURE GetDepartmentsAndPeopleByInstitutionId(IN InstitutionId BIGINT UNSIGNED)
BEGIN
    SELECT dept.*, p.*, inst.* FROM Institution as inst 
    LEFT JOIN Department as dept on 
    dept.institution_id = inst.institution_id
    LEFT JOIN Person as p ON
    p.department_id = dept.department_id
    WHERE inst.institution_id = InstitutionId;
END;

CREATE PROCEDURE GetAllInstitutionsDepartmentsAndPeople()
BEGIN
    SELECT * FROM Institution as inst 
    LEFT JOIN Department as dept on 
    dept.institution_id = inst.institution_id
    LEFT JOIN Person as p ON
    p.department_id = dept.department_id;
END;