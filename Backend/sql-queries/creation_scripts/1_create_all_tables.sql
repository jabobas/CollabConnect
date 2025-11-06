-- Filename: 1. Create Tables For CollabConnect.sql
-- The purpose of this file is to make hte database schema of CollabConnect
-- Author: Abbas Jabor
-- Date: November 5, 2025

-- Code review by Lucas Matheson
-- Anything I say is either I need clarification on or suggestions for improvement, nothing is a you better change it or i will be mad kinda thing
-- I promise this is out of love no hate <3
-- This is typically done during a pull request, I'll start doing it there if yall want me to continue these
DROP DATABASE IF EXISTS `CollabConnect`;
CREATE DATABASE `CollabConnect`;
USE `CollabConnect`;

-- 1. Institution (independent table)
-- Why is zip code 20 characters long? Zip codes are only 5 or 9 characters long
-- Also something that just came to me, are we doing just Maine or international institutions too? 
-- Also the longest state name is 13 characters (Massachusetts), so 80 characters seems a bit overkill to me
-- another way to do it to save storage we can CHAR(2) for state and just store the abbreviations
-- A phone number of 30 characters seems a bit long too, even with country code and extensions I don't see it going over 15 characters
CREATE TABLE Institution (
    institution_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    institution_name VARCHAR(200) NOT NULL,
    institution_type VARCHAR(100),
    street VARCHAR(200),
    city VARCHAR(80),
    state VARCHAR(80),
    zipcode VARCHAR(20),
    institution_phone VARCHAR(30)
);

-- 2. Department (depends on Institution)
-- Note for the future, we could have functions to check for valid email/phone formats
CREATE TABLE Department (
    department_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    institution_id BIGINT UNSIGNED NOT NULL,
    department_name VARCHAR(150) NOT NULL,
    department_email VARCHAR(150) UNIQUE,
    department_phone VARCHAR(15),
    FOREIGN KEY (institution_id) REFERENCES Institution(institution_id)
);

-- 3. Person (depends on Department)
-- Are we assuming one person belongs to one department only? Which means also one institution only?
-- Behrooz has done some work for Rochester Institute of Technology and USM, how would we represent that here?
-- Also, having 3 separate expertise fields seems a bit limiting, what if someone has more than 3 areas of expertise?
-- I may be remembering this wrong, but I think we discussed expertise being the same as tags. If that's the case there needs to be a way to 
-- ensure expertise are linked to the Tag table to ensure consistency. Same with main_field if that's also a tag.
-- Same phone comment as earlier
CREATE TABLE Person (
    person_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    person_name VARCHAR(150) NOT NULL,
    person_email VARCHAR(150) UNIQUE NOT NULL,
    person_phone VARCHAR(30),
    bio TEXT,
    expertise_1 VARCHAR(50),
    expertise_2 VARCHAR(50),
    expertise_3 VARCHAR(50),
    main_field VARCHAR(50) NOT NULL,
    department_id BIGINT UNSIGNED,
    FOREIGN KEY (department_id) REFERENCES Department(department_id)
);
-- having a table with one column is typically not a good database design
-- However, having a Tag table like this will allow us to have a controlled amount of tags, just ensure
-- strict access to insert into this table only from an admin. 
CREATE TABLE Tag (
	tag_name VARCHAR(50) PRIMARY KEY
);
-- 4. Project (depends on Person for lead)
-- Is there only one lead per project? I'm not in research so correct me if I'm wrong, but I think
-- there can typically be more than one lead per project
-- Also, does each project have only one tag? I would assume projects can have multiple tags
CREATE TABLE Project (
    project_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_title VARCHAR(200) NOT NULL,
    project_description TEXT,
    leadperson_id BIGINT UNSIGNED,
    tag_name VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE,
    person_id BIGINT UNSIGNED NOT NULL,
    FOREIGN KEY (tag_name) REFERENCES Tag(tag_name),
    FOREIGN KEY (leadperson_id) REFERENCES Person(person_id),
    FOREIGN KEY (person_id) REFERENCES Person(person_id)
);

-- I'm guessing this is a junction table for Project and Tag, if so then why is there a tag_name in Project table? is that more of a general tag?
-- Also needs to be put into ER diagram, currently not reflected
CREATE TABLE Project_Tag (
    project_id BIGINT UNSIGNED,
    tag_name VARCHAR(50),
    PRIMARY KEY (project_id, tag_name),
    FOREIGN KEY (project_id) REFERENCES Project(project_id),
    FOREIGN KEY (tag_name) REFERENCES Tag(tag_name)
);


-- These next two tables have been removed as of our previous meeting, but keeping the code here for reference in case we want to add them later
-- 5. WorkedOn (table for Person-Project M:N relationship)
-- CREATE TABLE WorkedOn (
--     person_id BIGINT UNSIGNED NOT NULL,
--     project_id BIGINT UNSIGNED NOT NULL,
--     project_role VARCHAR(80) NOT NULL,
--     start_date DATE NOT NULL,
--     end_date DATE,
--     PRIMARY KEY (person_id, project_id),
--     FOREIGN KEY (person_id) REFERENCES Person(person_id),
--     FOREIGN KEY (project_id) REFERENCES Project(project_id)
-- );

-- 6. WorkHistory (depends on Person) might not be necessary.

-- CREATE TABLE WorkHistory (
--     workhistory_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
--     person_id BIGINT UNSIGNED NOT NULL,
--     company_name VARCHAR(200) NOT NULL,
--     work_role VARCHAR(120) NOT NULL,
--     start_date DATE NOT NULL,
--     end_date DATE,
--     FOREIGN KEY (person_id) REFERENCES Person(person_id)
-- );


/*
    Final Notes:
    We have a good starting point with these tables. I think they cover the main entities we need for CollabConnect based on our discussions.
    After going over all the tables theres only a couple changes I would suggest, but not required by any means. Have of it is just clarification questions.
    That being stated, in our next meeting we should update the ER diagram and data dictionary to reflect these changes.
        Or make a readme file to live in the sql-queries directory to explain the schema in detail. if not im gonna anyway haha
    
    An important note I didn't speak on, we do not have on cascade delete/update rules set up for foreign keys. 
    We should discuss and decide on those to ensure data integrity.
    Example, if we delete a department, what happens to the person that works in the department? should they be deleted too or set to NULL department_id?
    We can also set up so you cannot delete a department if there are people linked to it. Same idea with the project table.
