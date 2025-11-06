-- The purpose of this file is to instantiate index values in the project table. 
-- By: Abbas Jabor
-- Date: November 2nd, 2025
-- Last Modified By: Abbas Jabor November 2nd, 2025

-- This will be frequently used in searching or filtering.
CREATE INDEX idx_project_title ON Project(project_title);

-- This is to quickly find projects lead by a person.
CREATE INDEX idx_project_leadperson ON Project(leadperson_id);

-- Most projects have date ranges.
CREATE INDEX idx_project_dates ON Project(start_date, end_date);

-- When sorting projects by a the lead person you want to make sure you want the recent projects first.
CREATE INDEX idx_project_leadperson_dates ON Project(leadperson_id, start_date DESC);

-- This is for when you're searching based on the tags of a project. 
-- This is an important part in the expertise match operation.
-- (Might be changed if the implementation of a "tag" entity is established)
CREATE FULLTEXT INDEX idx_project_tags ON Project(project_tags);

-- This is used to search for projects, combining both title and description to do so is common.
CREATE FULLTEXT INDEX idx_project_search ON Project(project_title, project_description);