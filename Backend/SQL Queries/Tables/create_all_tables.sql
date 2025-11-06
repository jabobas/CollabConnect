-- Filename: 1. Create Tables For CollabConnect.sql
-- The purpose of this file is to make hte database schema of CollabConnect
-- Author: Abbas Jabor
-- Date: November 5, 2025
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
    department_email VARCHAR(150),
    department_phone VARCHAR(20),
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
CREATE TABLE Project_Tag (
    project_id BIGINT UNSIGNED,
    tag_name VARCHAR(50),
    PRIMARY KEY (project_id, tag_name),
    FOREIGN KEY (project_id) REFERENCES Project(project_id),
    FOREIGN KEY (tag_name) REFERENCES Tag(tag_name)
);

-- 5. WorkedOn (table for Person-Project M:N relationship)
CREATE TABLE WorkedOn (
    person_id BIGINT UNSIGNED NOT NULL,
    project_id BIGINT UNSIGNED NOT NULL,
    project_role VARCHAR(80) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    PRIMARY KEY (person_id, project_id),
    FOREIGN KEY (person_id) REFERENCES Person(person_id),
    FOREIGN KEY (project_id) REFERENCES Project(project_id)
);

-- 6. WorkHistory (depends on Person) might not be necessary.
CREATE TABLE WorkHistory (
    workhistory_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    person_id BIGINT UNSIGNED NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    work_role VARCHAR(120) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    FOREIGN KEY (person_id) REFERENCES Person(person_id)
);