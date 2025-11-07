-- The purpose of this file is to hold relevant SQL statements for the Project relation. AI was used to create this.
-- I provide descriptions on what each does in their headers.
-- By: Abbas Jabor, Deepseek
-- Date: November 2nd, 2025
-- Last Modified By: Abbas Jabor November 2nd, 2025

-- Find projects by expertise tag - this statement is aassuming the tag is not an entity
SELECT 
    project_id,
    project_title,
    project_description,
    project_tags
FROM Project
WHERE project_tags LIKE '%machine learning%';

-- List all the collaborators on a project
-- Looking at the WorkedOn table and by clarifying the project_id you can just get the 
-- collaborators information.
SELECT 
    per.person_name,
    per.person_email,
    wo.project_role,
    wo.start_date,
    wo.end_date
FROM WorkedOn wo
JOIN Person per ON wo.person_id = per.person_id
WHERE wo.project_id = 1;  -- replace with actual project_id

-- Count the number of collaborators on a project
-- This will give you the number of collaborators on each project.
SELECT 
    p.project_id,
    p.project_title,
    COUNT(wo.person_id) AS collaborator_count
FROM Project p
LEFT JOIN WorkedOn wo ON p.project_id = wo.project_id
GROUP BY p.project_id, p.project_title;

-- Find projects led by a specific person using the id
SELECT 
    project_id,
    project_title,
    start_date,
    end_date
FROM Project
WHERE leadperson_id = 1;  -- replace with the person_id

-- Find project led by a specific person using a name
-- same thing as above but uses a nested select statement to instead use the name
SELECT 
    project_id,
    project_title,
    start_date,
    end_date
FROM Project
WHERE leadperson_id = 
	(SELECT person_id 
	FROM person 
	WHERE person.name = 'abbas');
    
-- Search Projects by title or description
-- the keyword 'like' will look for the pattern or string you're looking for in a title or description
SELECT 
    project_id,
    project_title,
    project_description
FROM Project
WHERE project_title LIKE '%data analysis%'
   OR project_description LIKE '%data analysis%';
   
-- Visualization Statements
-- Expertise Match Score - Find Best Collaborators on a Project - Again this is assuming that the tags are not an entity
-- What this is doing is giving a score based on the expertise terms in a person entity
-- It also counts the number of projects a person is/was involved in
-- Then it displays an ordered list of people based on their scores.
-- This query uses the expertise tags of the person already, but can probably be modified to 
-- include more than 3 tags and different scoring and allow the user to search for the tags they want.
SELECT 
    p.person_id,
    p.person_name,
    p.person_email,
    d.department_name,
    i.institution_name,
    -- Calculate match score based on expertise overlap
        (
        (CASE WHEN p.expertise LIKE '%machine learning%' THEN 3 ELSE 0 END) +
        (CASE WHEN p.expertise LIKE '%data analysis%' THEN 2 ELSE 0 END) +
        (CASE WHEN p.expertise LIKE '%python%' THEN 1 ELSE 0 END)
    ) AS expertise_match_score,
    COUNT(DISTINCT wo.project_id) AS project_experience
FROM Person p
JOIN Department d ON p.department_id = d.department_id
JOIN Institution i ON d.institution_id = i.institution_id
LEFT JOIN WorkedOn wo ON p.person_id = wo.person_id
WHERE p.expertise LIKE '%machine learning%' 
   OR p.expertise LIKE '%data analysis%'
   OR p.expertise LIKE '%python%'
GROUP BY p.person_id, p.person_name, p.person_email, d.department_name, i.institution_name
ORDER BY expertise_match_score DESC, project_experience DESC;

-- Collaboration Network - Find People Who Worked Together
-- Matches people who worked together though their workedon project id
SELECT 
    p1.person_name AS person1,
    p2.person_name AS person2,
    COUNT(DISTINCT wo1.project_id) AS projects_together
FROM WorkedOn wo1
JOIN WorkedOn wo2 ON wo1.project_id = wo2.project_id
JOIN Person p1 ON wo1.person_id = p1.person_id
JOIN Person p2 ON wo2.person_id = p2.person_id
WHERE wo1.person_id < wo2.person_id  -- Avoid duplicates and self-joins
GROUP BY p1.person_id, p2.person_id
HAVING projects_together >= 1
ORDER BY projects_together DESC;