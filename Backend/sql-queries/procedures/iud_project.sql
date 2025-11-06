-- Filename: IUD_Project.sql
-- The purpose of this file is to hold insert, update, delete statements for the project table.
-- Author: Abbas Jabor
-- Date: November 5, 2025

-- Insert project without tags (tags added separately to Project_Tag)
INSERT INTO Project (project_title, project_description, leadperson_id, person_id, start_date, end_date) 
VALUES ('E-commerce Platform', 'Build online shopping system', 1, '2024-01-01', '2024-06-30');

-- Insert project with NULL end date (ongoing project)
INSERT INTO Project (project_title, project_description, leadperson_id, person_id, start_date, end_date) 
VALUES ('Mobile Fitness App', 'Health tracking application', 2, '2024-02-01', NULL);

-- Get the last inserted project ID to use for tags
SET @new_project_id = LAST_INSERT_ID();

-- Update project title and description
UPDATE Project 
SET project_title = 'Enhanced E-commerce Platform', 
    project_description = 'Build advanced online shopping system with AI recommendations'
WHERE project_id = 1;

-- Update project dates
UPDATE Project 
SET start_date = '2024-01-15', 
    end_date = '2024-07-15'
WHERE project_id = 1;

-- Update project lead
UPDATE Project 
SET leadperson_id = 3 
WHERE project_id = 1;

-- Mark project as completed
UPDATE Project 
SET end_date = CURDATE() 
WHERE project_id = 1 AND end_date IS NULL;

-- Delete project (will fail if referenced in Project_Tag due to foreign key)
DELETE FROM Project WHERE project_id = 1;

-- Proper deletion: first remove from junction table, then delete project
DELETE FROM ProjectTag WHERE project_id = 1;
DELETE FROM Project WHERE project_id = 1;

