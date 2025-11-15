-- The purpose of this file is to instantiate index values in the Project, Tag, and Project_Tag tables.
-- By: Abbas Jabor
-- Date: November 2nd, 2025
-- Last Modified By: Abbas Jabor November 11, 2025

-- PROJECT INDEXES

-- This will be frequently used in searching or filtering projects by title.
CREATE INDEX idx_project_title ON Project(project_title);

-- This is to quickly find projects associated with a specific person.
CREATE INDEX idx_project_person ON Project(person_id);

-- Most projects have date ranges, so indexing both for range queries.
CREATE INDEX idx_project_dates ON Project(start_date, end_date);

-- This is used to search for projects, combining both title and description for full-text search.
-- Important for the expertise match operation.
CREATE FULLTEXT INDEX idx_project_search ON Project(project_title, project_description);

-- TAG INDEXES

-- Tag names are already the primary key, but adding this for clarity on full-text search capability.
-- Useful if tag descriptions or metadata are added in the future.

-- PROJECT_TAG INDEXES

-- Index for finding all tags associated with a project.
CREATE INDEX idx_projecttag_project ON Project_Tag(project_id);

-- Index for finding all projects associated with a specific tag.
CREATE INDEX idx_projecttag_tag ON Project_Tag(tag_name);

-- Composite index for efficient queries filtering by both tag and project.
CREATE INDEX idx_projecttag_composite ON Project_Tag(tag_name, project_id);