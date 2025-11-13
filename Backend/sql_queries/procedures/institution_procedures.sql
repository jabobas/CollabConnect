-- Filename: institution_procedures.sql
-- The purpose of this file is to hold INSERT, UPDATE, DELETE, and SELECT procedures for the Institution table.
-- Author: Lucas Matheson
-- Date: November 12, 2025

DELIMITER $$

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
END$$

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
    UPDATE Institution
    SET institution_type = InstitutionType,
        street = Street,
        city = City,
        state = State,
        zipcode = Zipcode,
        institution_phone = InstitutionPhone
    WHERE institution_name = InstitutionName;
END$$

CREATE PROCEDURE UpdateInstitutionPhone(
    IN InstitutionName VARCHAR(100),
    IN NewPhone VARCHAR(15)
)
BEGIN
    UPDATE Institution
    SET institution_phone = NewPhone
    WHERE institution_name = InstitutionName;
END$$

CREATE PROCEDURE UpdateInstitutionType(
    IN InstitutionName VARCHAR(100),
    IN NewType VARCHAR(50)
)
BEGIN
    UPDATE Institution
    SET institution_type = NewType
    WHERE institution_name = InstitutionName;
END$$

CREATE PROCEDURE UpdateInstitutionAddress(
    IN InstitutionName VARCHAR(100),
    IN NewStreet VARCHAR(100),
    IN NewCity VARCHAR(50),
    IN NewState VARCHAR(50),
    IN NewZipcode VARCHAR(10)
)
BEGIN
    UPDATE Institution
    SET street = NewStreet,
        city = NewCity,
        state = NewState,
        zipcode = NewZipcode
    WHERE institution_name = InstitutionName;
END$$

CREATE PROCEDURE DeleteInstitution(IN InstitutionName VARCHAR(100))
BEGIN
    DELETE FROM Institution WHERE institution_name = InstitutionName;
END$$

CREATE PROCEDURE GetAllInstitutions()
BEGIN
    SELECT * FROM Institution;
END$$

CREATE PROCEDURE SelectInstitutionByName(IN InstitutionName VARCHAR(100))
BEGIN
    SELECT * FROM Institution WHERE institution_name = InstitutionName;
END$$
