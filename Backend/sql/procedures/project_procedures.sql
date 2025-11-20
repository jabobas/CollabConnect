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
    UPDATE Project
    SET project_title = ProjectTitle
    WHERE project_id = ProjectID;
END;

CREATE PROCEDURE UpdateProjectDescription(
    IN ProjectID BIGINT UNSIGNED,
    IN ProjectDescription TEXT
)
BEGIN
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
    UPDATE Project
    SET start_date = StartDate,
        end_date = EndDate
    WHERE project_id = ProjectID;
END;

CREATE PROCEDURE CompleteProject(
    IN ProjectID BIGINT UNSIGNED
)
BEGIN
    UPDATE Project
    SET end_date = CURDATE()
    WHERE project_id = ProjectID AND end_date IS NULL;
END;

CREATE PROCEDURE DeleteProject(IN ProjectID BIGINT UNSIGNED)
BEGIN
    DELETE FROM Project_Tag WHERE project_id = ProjectID;
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
    SELECT count(*) as num_projects, pro.person_id, per.person_name from workedon w 
    left join project pro on w.project_id = pro.project_id
    left join person per on w.person_id = per.person_id
    GROUP BY pro.person_id, per.person_name;
END;