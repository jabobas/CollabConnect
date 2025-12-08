-- Filename: tag_procedures.sql
-- The purpose of this file is to hold INSERT, UPDATE, DELETE procedures for the Tag table.
-- Author: Abbas Jabor
-- Edited by: Lucas Matheson
-- Date: November 11, 2025

CREATE PROCEDURE InsertIntoTag(IN TagName VARCHAR(50))
BEGIN
    INSERT INTO Tag (tag_name) VALUES (TagName);
END;

CREATE PROCEDURE InsertMultipleTags(
    IN Tag1 VARCHAR(50),
    IN Tag2 VARCHAR(50),
    IN Tag3 VARCHAR(50),
    IN Tag4 VARCHAR(50),
    IN Tag5 VARCHAR(50)
)
BEGIN
    IF Tag1 IS NOT NULL THEN
        INSERT INTO Tag (tag_name) VALUES (Tag1);
    END IF;
    IF Tag2 IS NOT NULL THEN
        INSERT INTO Tag (tag_name) VALUES (Tag2);
    END IF;
    IF Tag3 IS NOT NULL THEN
        INSERT INTO Tag (tag_name) VALUES (Tag3);
    END IF;
    IF Tag4 IS NOT NULL THEN
        INSERT INTO Tag (tag_name) VALUES (Tag4);
    END IF;
    IF Tag5 IS NOT NULL THEN
        INSERT INTO Tag (tag_name) VALUES (Tag5);
    END IF;
END;

CREATE PROCEDURE UpdateTagName(
    IN OldTagName VARCHAR(50),
    IN NewTagName VARCHAR(50)
)
BEGIN
    DECLARE tag_count INT;
    
    -- Lock the tag row to prevent concurrent modifications
    SELECT COUNT(*) INTO tag_count
    FROM Tag
    WHERE tag_name = OldTagName
    FOR UPDATE;
    
    -- Validate tag exists
    IF tag_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tag not found';
    END IF;
    
    -- Also lock Project_Tag rows that reference this tag
    SELECT COUNT(*) FROM Project_Tag WHERE tag_name = OldTagName FOR UPDATE;
    
    UPDATE Tag SET tag_name = NewTagName WHERE tag_name = OldTagName;
END;

CREATE PROCEDURE DeleteTag(IN TagName VARCHAR(50))
BEGIN
    DECLARE tag_count INT;
    
    -- Lock the tag row to prevent concurrent deletions
    SELECT COUNT(*) INTO tag_count
    FROM Tag
    WHERE tag_name = TagName
    FOR UPDATE;
    
    -- Validate tag exists
    IF tag_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tag not found';
    END IF;
    
    -- Lock related Project_Tag rows
    SELECT COUNT(*) FROM Project_Tag WHERE tag_name = TagName FOR UPDATE;
    
    DELETE FROM Project_Tag WHERE tag_name = TagName;
    DELETE FROM Tag WHERE tag_name = TagName;
END;

CREATE PROCEDURE DeleteTagSafe(IN TagName VARCHAR(50))
BEGIN
    -- This procedure will fail if the tag is used in Project_Tag due to foreign key constraint
    DELETE FROM Tag WHERE tag_name = TagName;
END;

CREATE PROCEDURE GetAllTags()
BEGIN
    SELECT * FROM Tag;
END;

CREATE PROCEDURE SelectTagByName(IN TagName VARCHAR(50))
BEGIN
    SELECT * FROM Tag WHERE tag_name = TagName;
END;

CREATE PROCEDURE GetTagCount()
BEGIN
    SELECT COUNT(*) as tag_count FROM Tag;
END;

CREATE PROCEDURE GetTagUsageCount(IN TagName VARCHAR(50))
BEGIN
    SELECT COUNT(*) as usage_count FROM Project_Tag WHERE tag_name = TagName;
END;
