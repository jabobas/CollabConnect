CREATE PROCEDURE UpdateDepartmentDetails(
    IN DepartmentID INT,
    IN DepartmentPhone VARCHAR(15),
    IN DepartmentEmail VARCHAR(100),
    IN DepartmentName VARCHAR(100)
)
BEGIN
    DECLARE dept_count INT;
    
    -- Lock the department row to prevent concurrent modifications
    SELECT COUNT(*) INTO dept_count
    FROM Department
    WHERE department_id = DepartmentID
    FOR UPDATE;
    
    -- Validate department exists
    IF dept_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Department not found';
    END IF;
    
    UPDATE Department
    SET department_phone = DepartmentPhone,
        department_email = DepartmentEmail,
        department_name = DepartmentName
    WHERE department_id = DepartmentID;
END;

CREATE PROCEDURE DeleteDepartment(IN DepartmentID INT)
BEGIN
    DECLARE dept_count INT;
    
    -- Lock the department row to prevent concurrent deletions
    SELECT COUNT(*) INTO dept_count
    FROM Department
    WHERE department_id = DepartmentID
    FOR UPDATE;
    
    -- Validate department exists
    IF dept_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Department not found';
    END IF;
    
    -- Lock related rows
    SELECT COUNT(*) FROM Person WHERE department_id = DepartmentID FOR UPDATE;
    SELECT COUNT(*) FROM WorksIn WHERE department_id = DepartmentID FOR UPDATE;
    SELECT COUNT(*) FROM BelongsTo WHERE department_id = DepartmentID FOR UPDATE;
    
    DELETE FROM Department WHERE department_id = DepartmentID;
END;

CREATE PROCEDURE InsertIntoDepartment(
    IN DepartmentPhone VARCHAR(15),
    IN DepartmentEmail VARCHAR(100),
    IN DepartmentName VARCHAR(100),
    IN InstitutionId BIGINT
)
BEGIN
    INSERT INTO Department (department_phone, department_email, department_name, institution_id)
    VALUES (DepartmentPhone, DepartmentEmail, DepartmentName, InstitutionId);
    SELECT LAST_INSERT_ID() AS new_id;
END;

CREATE PROCEDURE SelectDepartmentByName(
    IN DepartmentName VARCHAR(100)
)
BEGIN
    SELECT * FROM Department WHERE department_name = DepartmentName;
END;