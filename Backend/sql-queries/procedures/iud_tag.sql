-- Filename: IUD_Tag.sql
-- The purpose of this file is to hold insert, update, and delete sql statements for the Tag table
-- Author: Abbas Jabor
-- Version: November 5, 2025

-- Insert single tag
INSERT INTO Tag (tag_name) VALUES ('web-development');

-- Insert multiple tags
INSERT INTO Tag (tag_name) VALUES 
('mobile-app'),
('database'),
('ai-ml'),
('ui-ux');

-- Update a tag name
UPDATE Tag SET tag_name = 'web-dev' WHERE tag_name = 'web-development';

-- Delete a tag (will fail if tag is used in ProjectTag due to foreign key constraint)
DELETE FROM Tag WHERE tag_name = 'web-development';

-- To delete a tag that's being used, first remove from ProjectTag:
DELETE FROM ProjectTag WHERE tag_name = 'web-development';
DELETE FROM Tag WHERE tag_name = 'web-development';