-- Filename: IUD_ProjectTag.sql
-- The purpose of this file is to hold insert,update,delete sql statements for the ProjectTag table.
-- Author: Abbas Jabor
-- Date: Novemeber 5, 2025

-- Add tags to a project
INSERT INTO ProjectTag (project_id, tag_name) VALUES 
(1, 'web-development'),
(1, 'database'),
(1, 'ai-ml');

-- Add tags to multiple projects
INSERT INTO ProjectTag (project_id, tag_name) VALUES 
(2, 'mobile-app'),
(2, 'ui-ux'),
(3, 'web-development'),
(3, 'ui-ux');

-- To "update" tags, you typically DELETE and re-INSERT
-- Remove all tags from a project
DELETE FROM ProjectTag WHERE project_id = 1;

-- Add new set of tags
INSERT INTO ProjectTag (project_id, tag_name) VALUES 
(1, 'mobile-app'),
(1, 'cloud-computing');

-- Remove specific tag from a project
DELETE FROM ProjectTag WHERE project_id = 1 AND tag_name = 'web-development';

-- Remove all tags from a project
DELETE FROM ProjectTag WHERE project_id = 1;