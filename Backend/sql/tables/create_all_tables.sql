-- Filename: 1. Create Tables For CollabConnect.sql
-- The purpose of this file is to make the database schema of CollabConnect
-- Author: Abbas Jabor
-- Edited by: Lucas Matheson
-- Date: November 5, 2025
-- This is the file used to create the tables in db_init

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
    CONSTRAINT fk_department_institution FOREIGN KEY (institution_id)
        REFERENCES Institution(institution_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- 3. Person (depends on Department)
CREATE TABLE Person (
    person_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    person_name VARCHAR(150) NOT NULL,
    person_email VARCHAR(150),
    person_phone VARCHAR(30),
    bio TEXT,
    expertise_1 VARCHAR(100),
    expertise_2 VARCHAR(100),
    expertise_3 VARCHAR(100),
    main_field VARCHAR(100) NOT NULL,
    department_id BIGINT UNSIGNED,
    FOREIGN KEY (department_id) REFERENCES Department(department_id)
);

-- 4. Project (no tag table, no tag FK)
CREATE TABLE Project (
    project_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_title VARCHAR(200) NOT NULL,
    project_description TEXT,
    tag_name VARCHAR(100),
    start_date DATE NULL,
    end_date DATE,
    person_id BIGINT UNSIGNED NULL,
    CONSTRAINT fk_project_person FOREIGN KEY (person_id) REFERENCES Person(person_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- PROJECT-TAG MANY-TO-MANY (tag_name stored as VARCHAR)
CREATE TABLE Project_Tag (
    project_id BIGINT UNSIGNED NOT NULL,
    tag_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (project_id, tag_name),
    FOREIGN KEY (project_id) REFERENCES Project(project_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS BelongsTo (
    department_id    BIGINT UNSIGNED NOT NULL,
    institution_id   BIGINT UNSIGNED NOT NULL,
    effective_start  DATE            NOT NULL,
    effective_end    DATE            DEFAULT NULL,
    PRIMARY KEY (department_id, institution_id, effective_start),
    CONSTRAINT ck_belongsto_dates CHECK (effective_end IS NULL OR effective_end >= effective_start),
    CONSTRAINT fk_belongsto_department
        FOREIGN KEY (department_id) REFERENCES Department(department_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_belongsto_institution
        FOREIGN KEY (institution_id) REFERENCES Institution(institution_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS WorkedOn (
    person_id      BIGINT UNSIGNED NOT NULL,
    project_id     BIGINT UNSIGNED NOT NULL,
    project_role   VARCHAR(100)    NOT NULL,
    start_date     DATE            NULL,
    end_date       DATE            DEFAULT NULL,
    PRIMARY KEY (person_id, project_id, project_role),
    CONSTRAINT ck_workedon_dates CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT fk_workedon_person
        FOREIGN KEY (person_id) REFERENCES Person(person_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_workedon_project
        FOREIGN KEY (project_id) REFERENCES Project(project_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- 3.5. WorksIn
CREATE TABLE WorksIn (
    worksin_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    person_id BIGINT UNSIGNED NOT NULL,
    department_id BIGINT UNSIGNED NOT NULL,
    UNIQUE KEY uq_person_department (person_id, department_id),
    FOREIGN KEY (person_id) REFERENCES Person(person_id),
    FOREIGN KEY (department_id) REFERENCES Department(department_id)
);
