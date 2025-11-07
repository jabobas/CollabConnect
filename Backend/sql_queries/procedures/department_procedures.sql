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
    IN DepartmentName VARCHAR(100)
)
BEGIN
    INSERT INTO Department (department_phone, department_email, department_name)
    VALUES (DepartmentPhone, DepartmentEmail, DepartmentName);
END;

CREATE PROCEDURE GetAllDepartments()
BEGIN
    SELECT * FROM Department;
END;

CREATE PROCEDURE SelectDepartmentByID(IN DepartmentID INT)
BEGIN
    SELECT * FROM Department WHERE department_id = DepartmentID;
END;