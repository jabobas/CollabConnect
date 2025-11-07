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
CREATE TABLE Department (
    department_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    institution_id BIGINT UNSIGNED NOT NULL,
    department_name VARCHAR(150) NOT NULL,
    department_email VARCHAR(150) UNIQUE,
    department_phone VARCHAR(15),
    FOREIGN KEY (institution_id) REFERENCES Institution(institution_id)
);

-- 3. Person (depends on Department)
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

CREATE TABLE Tag (
	tag_name VARCHAR(50) PRIMARY KEY
);

-- 4. Project (depends on Person for lead)
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

--  If a project is deleted, delete all associated workedon entries
CREATE TABLE Project_Tag (
    project_id BIGINT UNSIGNED,
    tag_name VARCHAR(50),
    PRIMARY KEY (project_id, tag_name),
    FOREIGN KEY (project_id) REFERENCES Project(project_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_name) REFERENCES Tag(tag_name) ON DELETE CASCADE
);


-- If the lead person on a project is deleted, set leadperson_id to NULL
-- Since a project can exist without a lead person
ALTER TABLE Project
  ADD CONSTRAINT fk_project_leadperson
    FOREIGN KEY (leadperson_id) REFERENCES Person(person_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- Use this if we say that a department should not exist without an institution
-- ALTER TABLE Department
--   ADD CONSTRAINT fk_department_institution
--     FOREIGN KEY (institution_id) REFERENCES Institution(institution_id)
--     ON DELETE CASCADE
--     ON UPDATE CASCADE;

-- If we want to restrict deletion of an institution if departments exists for that institution
-- Im going with this one for now
-- ALTER TABLE Department
--   ADD CONSTRAINT fk_department_institution
--     FOREIGN KEY (institution_id) REFERENCES Institution(institution_id)
--     ON DELETE RESTRICT
--     ON UPDATE CASCADE;

-- If a project is deleted, set the lead person to NULL
ALTER TABLE Project
  ADD CONSTRAINT fk_project_leadperson FOREIGN KEY (leadperson_id) 
  REFERENCES Person(person_id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE Department
  ADD CONSTRAINT fk_department_institution FOREIGN KEY (institution_id) 
  REFERENCES Institution(institution_id) 
  ON DELETE RESTRICT 
  ON UPDATE CASCADE;