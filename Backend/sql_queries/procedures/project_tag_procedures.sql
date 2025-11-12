-- Filename: project_tag_procedures.sql
-- The purpose of this file is to hold INSERT, UPDATE, DELETE procedures for the Project_Tag junction table.
-- Author: Abbas Jabor
-- Date: November 11, 2025

CREATE PROCEDURE AddTagToProject(
    IN ProjectID BIGINT UNSIGNED,
    IN TagName VARCHAR(50)
)
BEGIN
    INSERT INTO Project_Tag (project_id, tag_name)
    VALUES (ProjectID, TagName);
END;

CREATE PROCEDURE AddMultipleTagsToProject(
    IN ProjectID BIGINT UNSIGNED,
    IN TagNameList VARCHAR(500)
)
BEGIN
    -- This procedure would require dynamic SQL for bulk insertion
    -- Alternative: call AddTagToProject multiple times from application layer
    -- INSERT INTO Project_Tag (project_id, tag_name) VALUES 
    -- This should be handled at application level for better flexibility
END;

CREATE PROCEDURE RemoveTagFromProject(
    IN ProjectID BIGINT UNSIGNED,
    IN TagName VARCHAR(50)
)
BEGIN
    DELETE FROM Project_Tag
    WHERE project_id = ProjectID AND tag_name = TagName;
END;

CREATE PROCEDURE RemoveAllTagsFromProject(IN ProjectID BIGINT UNSIGNED)
BEGIN
    DELETE FROM Project_Tag WHERE project_id = ProjectID;
END;

CREATE PROCEDURE GetProjectTags(IN ProjectID BIGINT UNSIGNED)
BEGIN
    SELECT tag_name FROM Project_Tag WHERE project_id = ProjectID;
END;

CREATE PROCEDURE GetProjectsByTag(IN TagName VARCHAR(50))
BEGIN
    SELECT DISTINCT p.* FROM Project p
    INNER JOIN Project_Tag pt ON p.project_id = pt.project_id
    WHERE pt.tag_name = TagName;
END;

CREATE PROCEDURE GetAllProjectTags()
BEGIN
    SELECT * FROM Project_Tag;
END;

CREATE PROCEDURE ReplaceProjectTags(
    IN ProjectID BIGINT UNSIGNED,
    IN NewTagName VARCHAR(50)
)
BEGIN
    -- Remove all existing tags for the project
    DELETE FROM Project_Tag WHERE project_id = ProjectID;
    -- Add the new tag
    INSERT INTO Project_Tag (project_id, tag_name) VALUES (ProjectID, NewTagName);
END;
