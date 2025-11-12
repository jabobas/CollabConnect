-- Filename: expertise_matching_functions.sql
-- The purpose of this file is to hold expertise matching and recommendation functions. 
-- Author: Abbas Jabor
-- Date: November 12, 2025

-- ============================================
-- EXPERTISE MATCHING FUNCTIONS
-- ============================================

-- Function: Calculate expertise match score between a person and project tags
CREATE FUNCTION GetExpertiseMatchScore(
    personID BIGINT UNSIGNED,
    tagList VARCHAR(500)
) RETURNS INT DETERMINISTIC READS SQL DATA
BEGIN
    DECLARE score INT DEFAULT 0;
    DECLARE expertiseFields VARCHAR(300);
    
    -- Get all expertise fields for the person
    SELECT CONCAT_WS(',', expertise_1, expertise_2, expertise_3, main_field)
    INTO expertiseFields
    FROM Person
    WHERE person_id = personID;
    
    -- Score each tag if found in person's expertise
    IF expertiseFields LIKE CONCAT('%', 'machine learning', '%') AND tagList LIKE '%machine learning%' THEN
        SET score = score + 3;
    END IF;
    IF expertiseFields LIKE CONCAT('%', 'data analysis', '%') AND tagList LIKE '%data analysis%' THEN
        SET score = score + 3;
    END IF;
    IF expertiseFields LIKE CONCAT('%', 'web development', '%') AND tagList LIKE '%web development%' THEN
        SET score = score + 3;
    END IF;
    IF expertiseFields LIKE CONCAT('%', 'database', '%') AND tagList LIKE '%database%' THEN
        SET score = score + 2;
    END IF;
    IF expertiseFields LIKE CONCAT('%', 'ui-ux', '%') AND tagList LIKE '%ui-ux%' THEN
        SET score = score + 2;
    END IF;
    IF expertiseFields LIKE CONCAT('%', 'mobile-app', '%') AND tagList LIKE '%mobile-app%' THEN
        SET score = score + 2;
    END IF;
    IF expertiseFields LIKE CONCAT('%', 'python', '%') AND tagList LIKE '%python%' THEN
        SET score = score + 1;
    END IF;
    IF expertiseFields LIKE CONCAT('%', 'java', '%') AND tagList LIKE '%java%' THEN
        SET score = score + 1;
    END IF;
    
    RETURN score;
END;

-- Procedure: Get expertise matches for a project
CREATE PROCEDURE GetExpertiseMatches(
    IN projectID BIGINT UNSIGNED,
    IN minScore INT DEFAULT 1
)
BEGIN
    SELECT 
        p.person_id,
        p.person_name,
        p.person_email,
        d.department_name,
        i.institution_name,
        p.expertise_1,
        p.expertise_2,
        p.expertise_3,
        p.main_field,
        GetExpertiseMatchScore(p.person_id, GROUP_CONCAT(pt.tag_name)) AS expertise_score,
        COUNT(DISTINCT wo.project_id) AS project_experience,
        CASE WHEN wo2.person_id IS NOT NULL THEN 'YES' ELSE 'NO' END AS already_on_project
    FROM Person p
    LEFT JOIN Department d ON p.department_id = d.department_id
    LEFT JOIN Institution i ON d.institution_id = i.institution_id
    LEFT JOIN WorkedOn wo ON p.person_id = wo.person_id
    LEFT JOIN WorkedOn wo2 ON p.person_id = wo2.person_id AND wo2.project_id = projectID
    LEFT JOIN (
        SELECT project_id, GROUP_CONCAT(tag_name) as tags
        FROM Project_Tag
        WHERE project_id = projectID
        GROUP BY project_id
    ) pt ON 1=1
    GROUP BY p.person_id
    HAVING expertise_score >= minScore
    ORDER BY expertise_score DESC, project_experience DESC;
END;

-- Procedure: Find best collaborators for a specific expertise
CREATE PROCEDURE FindExpertsByExpertise(
    IN expertiseTerm VARCHAR(100),
    IN departmentID BIGINT UNSIGNED DEFAULT NULL,
    IN limit_count INT DEFAULT 10
)
BEGIN
    SELECT 
        p.person_id,
        p.person_name,
        p.person_email,
        d.department_name,
        i.institution_name,
        p.expertise_1,
        p.expertise_2,
        p.expertise_3,
        p.main_field,
        COUNT(DISTINCT wo.project_id) AS project_count,
        COUNT(DISTINCT CASE WHEN wo.end_date IS NULL THEN wo.project_id END) AS active_projects
    FROM Person p
    LEFT JOIN Department d ON p.department_id = d.department_id
    LEFT JOIN Institution i ON d.institution_id = i.institution_id
    LEFT JOIN WorkedOn wo ON p.person_id = wo.person_id
    WHERE (p.expertise_1 LIKE CONCAT('%', expertiseTerm, '%')
       OR p.expertise_2 LIKE CONCAT('%', expertiseTerm, '%')
       OR p.expertise_3 LIKE CONCAT('%', expertiseTerm, '%')
       OR p.main_field LIKE CONCAT('%', expertiseTerm, '%'))
    AND (departmentID IS NULL OR p.department_id = departmentID)
    GROUP BY p.person_id
    ORDER BY project_count DESC, active_projects ASC
    LIMIT limit_count;
END;
