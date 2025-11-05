-- Filename: Create Tag,Project,ProjectTag tables.sql
-- This file will make the basic tables for tag, project, and projecttag
-- Author: Abbas Jabor
-- Date: November 5, 2025

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
CREATE TABLE ProjectTag (
    project_id BIGINT UNSIGNED,
    tag_name VARCHAR(50),
    PRIMARY KEY (project_id, tag_name),
    FOREIGN KEY (project_id) REFERENCES Project(project_id),
    FOREIGN KEY (tag_name) REFERENCES Tag(tag_name)
);