-- DROP DATABASE IF EXISTS `CollabConnect`;
-- CREATE DATABASE `CollabConnect`;
USE `collab_connect_db`;

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
    -- type and constraints are still uncertain
    education TEXT,
    -- type and constraints are still uncertain
    published_papers TEXT,
    -- expertise tags: might be making an expertise entity
    expertise TEXT,
    department_id BIGINT UNSIGNED,
    FOREIGN KEY (department_id) REFERENCES Department(department_id)
);

-- 4. Project (depends on Person for lead)
CREATE TABLE Project (
    project_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_title VARCHAR(200) NOT NULL,
    project_description TEXT,
    -- expertise tags: might be making an expertise entity
    project_tags TEXT,
    leadperson_id BIGINT UNSIGNED,
    start_date DATE NOT NULL,
    end_date DATE,
    
    FOREIGN KEY (leadperson_id) REFERENCES Person(person_id)
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
