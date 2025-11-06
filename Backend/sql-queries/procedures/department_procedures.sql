CREATE PROCEDURE UpdateDepartmentDetails
    @DepartmentID INT,
    @DepartmentPhone VARCHAR(15),
    @DepartmentEmail VARCHAR(100),
    @DepartmentName VARCHAR(100)
AS
BEGIN
    UPDATE Departments
SET department_phone = @DepartmentPhone, department_email = @DepartmentEmail, department_name = @DepartmentName
WHERE department_id = @DepartmentID;
END;
GO

CREATE PROCEDURE DeleteDepartment
    @DepartmentID INT
AS
BEGIN
    DELETE FROM Departments
WHERE department_id = @DepartmentID;
END;

GO

CREATE PROCEDURE InsertIntoDepartment
    @DepartmentPhone VARCHAR(15),
    @DepartmentEmail VARCHAR(100),
    @DepartmentName VARCHAR(100)
AS
BEGIN
    INSERT INTO Departments
        (department_phone, department_email, department_name)
    VALUES
        (@DepartmentPhone, @DepartmentEmail, @DepartmentName);
END;
GO

CREATE PROCEDURE GetAllDepartments
AS
BEGIN
    SELECT *
    FROM Departments
END;
GO

CREATE PROCEDURE SelectDepartmentByID
    @DepartmentID INT
AS
BEGIN
    SELECT *
    FROM Departments
    WHERE department_id = @DepartmentID;
END;
GO

/*
 Example useage, say we use UpdateDepartmentDetails

 Example execution in SQL: 
    EXEC UpdateDepartmentDetails
    @DepartmentID = 1,
    @DepartmentPhone = '123-456-7890',
    @DepartmentEmail = 'hr@example.com',
    @DepartmentName = 'Human Resources';


Example use case in flask (Assuming we are allowed to use sql alchemy, which I don't see why not):
    @app.route('/call_procedure')
    def call_procedure():
        department_id = 1
        department_phone = '123-456-7890'
        department_email = 'department@example.com'
        department_name = 'Computer Science'
        procedure_name = 'UpdateDepartmentDetails'

        # This is a simple example constructing the CALL statement, this does not execute the statement
        # Also, this does not handle SQL injection, but we shall fix that during development
        # I just made a quick example here
        querystring = f"CALL {procedure_name}({department_id}, '{department_phone}', '{department_email}', '{department_name}')"

        # The query will be executed here
        result = db.engine.execute(SQLQuery(querystring))

        # Process the results
        rows = []
        for row in result:
            rows.append(dict(row)) # Convert rows to dictionaries for easier handling

        return {'data': rows}
*/