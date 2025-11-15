CREATE PROCEDURE UpdateDepartmentDetails(
    IN DepartmentID INT,
    IN DepartmentPhone VARCHAR(15),
    IN DepartmentEmail VARCHAR(100),
    IN DepartmentName VARCHAR(100)
)
BEGIN
    UPDATE Department
    SET department_phone = DepartmentPhone,
        department_email = DepartmentEmail,
        department_name = DepartmentName
    WHERE department_id = DepartmentID;
END;

CREATE PROCEDURE DeleteDepartment(IN DepartmentID INT)
BEGIN
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