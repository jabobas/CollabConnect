-- Filename: IUD_WorkedOn.sql
-- Purpose: sample insert, update, delete statements for the WorkedOn table.

-- Scenario setup
SET @workedon_person_id = 10;
SET @workedon_project_id = 1;
SET @workedon_start_date = '2024-03-01';

-- Insert a stint (end_date NULL means ongoing).
INSERT INTO WorkedOn (person_id, project_id, project_role, start_date, end_date)
VALUES (@workedon_person_id, @workedon_project_id, 'Developer', @workedon_start_date, NULL);

-- Update the role for the current stint.
UPDATE WorkedOn
SET project_role = 'Senior Developer'
WHERE person_id = @workedon_person_id
  AND project_id = @workedon_project_id
  AND start_date = @workedon_start_date;

-- Close the stint with an end date.
UPDATE WorkedOn
SET end_date = '2024-06-30'
WHERE person_id = @workedon_person_id
  AND project_id = @workedon_project_id
  AND start_date = @workedon_start_date;

-- Delete a specific stint.
DELETE FROM WorkedOn
WHERE person_id = @workedon_person_id
  AND project_id = @workedon_project_id
  AND start_date = @workedon_start_date;

-- Bulk clean-up examples (cascades remove WorkedOn when Person/Project is deleted).
DELETE FROM WorkedOn WHERE project_id = @workedon_project_id;
DELETE FROM WorkedOn WHERE person_id = @workedon_person_id;
