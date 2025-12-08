-- Filename: project_procedures.sql
-- The purpose of this file is to hold INSERT, UPDATE, DELETE procedures for the Project table.
-- Author: Abbas Jabor
-- Date: November 11, 2025

CREATE PROCEDURE InsertIntoProject(
    IN ProjectTitle VARCHAR(200),
    IN ProjectDescription TEXT,
    IN PersonID BIGINT UNSIGNED,
    IN TagName VARCHAR(100),
    IN StartDate DATE,
    IN EndDate DATE
)
BEGIN
    DECLARE person_count INT;
    
    -- Lock the person row to prevent race conditions and validate existence
    SELECT COUNT(*) INTO person_count
    FROM Person 
    WHERE person_id = PersonID
    FOR UPDATE;
    
    -- Validate person exists
    IF person_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Person not found';
    END IF;
    
    -- Insert the project
    INSERT INTO Project (project_title, project_description, tag_name, person_id, start_date, end_date)
    VALUES (ProjectTitle, ProjectDescription, TagName, PersonID, StartDate, EndDate);

    SELECT LAST_INSERT_ID() AS project_id;
END;

CREATE PROCEDURE UpdateProjectDetails(
    IN ProjectID BIGINT UNSIGNED,
    IN ProjectTitle VARCHAR(200),
    IN ProjectDescription TEXT,
    IN TagName VARCHAR(100),
    IN StartDate DATE,
    IN EndDate DATE
)
BEGIN
    DECLARE project_count INT;
    
    -- Lock the project row to prevent concurrent modifications and validate existence
    SELECT COUNT(*) INTO project_count
    FROM Project
    WHERE project_id = ProjectID
    FOR UPDATE;
    
    -- Validate project exists
    IF project_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Project not found';
    END IF;
    
    -- Update the project
    UPDATE Project
    SET project_title = ProjectTitle,
        project_description = ProjectDescription,
        tag_name = TagName,
        start_date = StartDate,
        end_date = EndDate
    WHERE project_id = ProjectID;
END;

CREATE PROCEDURE UpdateProjectTitle(
    IN ProjectID BIGINT UNSIGNED,
    IN ProjectTitle VARCHAR(200)
)
BEGIN
    DECLARE project_count INT;
    
    -- Lock the project row to prevent concurrent modifications
    SELECT COUNT(*) INTO project_count
    FROM Project
    WHERE project_id = ProjectID
    FOR UPDATE;
    
    -- Validate project exists
    IF project_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Project not found';
    END IF;
    
    UPDATE Project
    SET project_title = ProjectTitle
    WHERE project_id = ProjectID;
END;

CREATE PROCEDURE UpdateProjectDescription(
    IN ProjectID BIGINT UNSIGNED,
    IN ProjectDescription TEXT
)
BEGIN
    DECLARE project_count INT;
    
    -- Lock the project row to prevent concurrent modifications
    SELECT COUNT(*) INTO project_count
    FROM Project
    WHERE project_id = ProjectID
    FOR UPDATE;
    
    -- Validate project exists
    IF project_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Project not found';
    END IF;
    
    UPDATE Project
    SET project_description = ProjectDescription
    WHERE project_id = ProjectID;
END;

CREATE PROCEDURE UpdateProjectDates(
    IN ProjectID BIGINT UNSIGNED,
    IN StartDate DATE,
    IN EndDate DATE
)
BEGIN
    DECLARE project_count INT;
    
    -- Lock the project row to prevent concurrent modifications
    SELECT COUNT(*) INTO project_count
    FROM Project
    WHERE project_id = ProjectID
    FOR UPDATE;
    
    -- Validate project exists
    IF project_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Project not found';
    END IF;
    
    UPDATE Project
    SET start_date = StartDate,
        end_date = EndDate
    WHERE project_id = ProjectID;
END;

CREATE PROCEDURE CompleteProject(
    IN ProjectID BIGINT UNSIGNED
)
BEGIN
    DECLARE project_count INT;
    
    -- Lock the project row to prevent concurrent modifications
    SELECT COUNT(*) INTO project_count
    FROM Project
    WHERE project_id = ProjectID AND end_date IS NULL
    FOR UPDATE;
    
    -- Validate project exists and is not already completed
    IF project_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Project not found or already completed';
    END IF;
    
    UPDATE Project
    SET end_date = CURDATE()
    WHERE project_id = ProjectID AND end_date IS NULL;
END;

CREATE PROCEDURE DeleteProject(IN ProjectID BIGINT UNSIGNED)
BEGIN
    DECLARE project_count INT;
    
    -- Lock the project row to prevent concurrent deletions and validate existence
    SELECT COUNT(*) INTO project_count
    FROM Project
    WHERE project_id = ProjectID
    FOR UPDATE;
    
    -- Validate project exists
    IF project_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Project not found';
    END IF;
    
    -- Lock related WorkedOn rows to prevent race conditions
    SELECT COUNT(*) FROM WorkedOn WHERE project_id = ProjectID FOR UPDATE;
    
    -- Lock related Project_Tag rows to prevent race conditions
    SELECT COUNT(*) FROM Project_Tag WHERE project_id = ProjectID FOR UPDATE;
    
    -- Delete related records first (cascading delete)
    DELETE FROM Project_Tag WHERE project_id = ProjectID;
    DELETE FROM WorkedOn WHERE project_id = ProjectID;
    
    -- Delete the project
    DELETE FROM Project WHERE project_id = ProjectID;
END;

CREATE PROCEDURE GetAllProjects()
BEGIN
    SELECT * FROM Project;
END;

CREATE PROCEDURE SelectProjectByID(IN ProjectID BIGINT UNSIGNED)
BEGIN
    SELECT * FROM Project WHERE project_id = ProjectID;
END;

CREATE PROCEDURE SelectProjectsByPersonID(IN PersonID BIGINT UNSIGNED)
BEGIN
    SELECT * FROM Project WHERE person_id = PersonID;
END;

CREATE PROCEDURE SelectActiveProjects()
BEGIN
    SELECT * FROM Project WHERE end_date IS NULL;
END;

CREATE PROCEDURE SelectNumProjectsPerPerson()
BEGIN 
    SELECT count(*) as num_projects, pro.person_id, per.person_name from WorkedOn w 
    left join Project pro on w.project_id = pro.project_id
    left join Person per on w.person_id = per.person_id
    GROUP BY pro.person_id, per.person_name;
END;