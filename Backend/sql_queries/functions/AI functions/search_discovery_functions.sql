-- Filename: search_discovery_functions.sql
-- The purpose of this file is to hold search and discovery functions.
-- Author: Abbas Jabor
-- Date: November 12, 2025

-- ============================================
-- SEARCH & DISCOVERY FUNCTIONS
-- ============================================

-- Procedure: Search projects by expertise/tags with filtering
CREATE PROCEDURE SearchProjectsByExpertise(
    IN tagList VARCHAR(500),
    IN institutionFilter BIGINT UNSIGNED DEFAULT NULL,
    IN departmentFilter BIGINT UNSIGNED DEFAULT NULL,
    IN statusFilter VARCHAR(20) DEFAULT NULL,
    IN limit_count INT DEFAULT 20
)
BEGIN
    SELECT 
        p.project_id,
        p.project_title,
        p.project_description,
        p.start_date,
        p.end_date,
        CASE WHEN p.end_date IS NULL THEN 'Active' ELSE 'Completed' END AS project_status,
        per_lead.person_name AS lead_person,
        d.department_name,
        i.institution_name,
        COUNT(DISTINCT wo.person_id) AS team_size,
        GROUP_CONCAT(DISTINCT pt.tag_name ORDER BY pt.tag_name) AS project_tags,
        MATCH(p.project_title, p.project_description) AGAINST(tagList IN BOOLEAN MODE) AS relevance_score
    FROM Project p
    LEFT JOIN Person per_lead ON p.leadperson_id = per_lead.person_id
    LEFT JOIN Person per ON p.person_id = per.person_id
    LEFT JOIN Department d ON per.department_id = d.department_id
    LEFT JOIN Institution i ON d.institution_id = i.institution_id
    LEFT JOIN WorkedOn wo ON p.project_id = wo.project_id
    LEFT JOIN Project_Tag pt ON p.project_id = pt.project_id
    WHERE (
        EXISTS (
            SELECT 1 FROM Project_Tag pt2
            WHERE pt2.project_id = p.project_id
            AND FIND_IN_SET(pt2.tag_name, REPLACE(tagList, ' ', ',')) > 0
        )
        OR MATCH(p.project_title, p.project_description) AGAINST(tagList IN BOOLEAN MODE)
    )
    AND (institutionFilter IS NULL OR i.institution_id = institutionFilter)
    AND (departmentFilter IS NULL OR d.department_id = departmentFilter)
    AND (statusFilter IS NULL OR (
        (statusFilter = 'Active' AND p.end_date IS NULL)
        OR (statusFilter = 'Completed' AND p.end_date IS NOT NULL)
    ))
    GROUP BY p.project_id
    ORDER BY relevance_score DESC, p.start_date DESC
    LIMIT limit_count;
END;

-- Procedure: Search people by expertise with filtering
CREATE PROCEDURE SearchPeopleByExpertise(
    IN expertiseTerms VARCHAR(500),
    IN institutionFilter BIGINT UNSIGNED DEFAULT NULL,
    IN departmentFilter BIGINT UNSIGNED DEFAULT NULL,
    IN availabilityFilter VARCHAR(20) DEFAULT NULL,
    IN limit_count INT DEFAULT 20
)
BEGIN
    SELECT 
        p.person_id,
        p.person_name,
        p.person_email,
        p.person_phone,
        d.department_name,
        i.institution_name,
        p.expertise_1,
        p.expertise_2,
        p.expertise_3,
        p.main_field,
        COUNT(DISTINCT wo.project_id) AS project_count,
        COUNT(DISTINCT CASE WHEN wo.end_date IS NULL THEN wo.project_id END) AS active_projects,
        GetActiveProjectCount(p.person_id) AS current_workload
    FROM Person p
    LEFT JOIN Department d ON p.department_id = d.department_id
    LEFT JOIN Institution i ON d.institution_id = i.institution_id
    LEFT JOIN WorkedOn wo ON p.person_id = wo.person_id
    WHERE (p.expertise_1 LIKE CONCAT('%', expertiseTerms, '%')
       OR p.expertise_2 LIKE CONCAT('%', expertiseTerms, '%')
       OR p.expertise_3 LIKE CONCAT('%', expertiseTerms, '%')
       OR p.main_field LIKE CONCAT('%', expertiseTerms, '%')
       OR p.bio LIKE CONCAT('%', expertiseTerms, '%'))
    AND (institutionFilter IS NULL OR i.institution_id = institutionFilter)
    AND (departmentFilter IS NULL OR d.department_id = departmentFilter)
    AND (availabilityFilter IS NULL OR (
        (availabilityFilter = 'Available' AND GetActiveProjectCount(p.person_id) < 3)
        OR (availabilityFilter = 'Experienced' AND COUNT(DISTINCT wo.project_id) >= 3)
    ))
    GROUP BY p.person_id
    ORDER BY project_count DESC, active_projects ASC
    LIMIT limit_count;
END;

-- Procedure: Get comprehensive person profile with network
CREATE PROCEDURE GetPersonProfileWithNetwork(IN personID BIGINT UNSIGNED)
BEGIN
    SELECT 
        p.person_id,
        p.person_name,
        p.person_email,
        p.person_phone,
        p.bio,
        p.expertise_1,
        p.expertise_2,
        p.expertise_3,
        p.main_field,
        d.department_name,
        i.institution_name,
        COUNT(DISTINCT wo.project_id) AS total_projects,
        COUNT(DISTINCT CASE WHEN wo.end_date IS NULL THEN wo.project_id END) AS active_projects,
        COUNT(DISTINCT CASE WHEN wo.end_date IS NOT NULL THEN wo.project_id END) AS completed_projects,
        GetActiveProjectCount(p.person_id) AS current_workload,
        COUNT(DISTINCT CASE 
            WHEN wo.project_id IN (
                SELECT DISTINCT wo2.project_id
                FROM WorkedOn wo2
                WHERE wo2.person_id != p.person_id
            ) THEN wo.project_id 
        END) AS collaborative_projects,
        COUNT(DISTINCT CASE 
            WHEN wo.person_id IN (
                SELECT DISTINCT wo2.person_id
                FROM WorkedOn wo2
                JOIN WorkedOn wo1 ON wo2.project_id = wo1.project_id
                WHERE wo1.person_id = p.person_id
                AND wo2.person_id != p.person_id
            ) THEN wo.person_id 
        END) AS unique_collaborators,
        MIN(wo.start_date) AS first_project_start,
        MAX(COALESCE(wo.end_date, CURDATE())) AS most_recent_activity
    FROM Person p
    LEFT JOIN Department d ON p.department_id = d.department_id
    LEFT JOIN Institution i ON d.institution_id = i.institution_id
    LEFT JOIN WorkedOn wo ON p.person_id = wo.person_id
    WHERE p.person_id = personID
    GROUP BY p.person_id;
END;

-- Procedure: Get project recommendations for a person
CREATE PROCEDURE GetProjectRecommendations(
    IN personID BIGINT UNSIGNED,
    IN limit_count INT DEFAULT 10
)
BEGIN
    SELECT DISTINCT
        p.project_id,
        p.project_title,
        p.project_description,
        p.start_date,
        p.end_date,
        per_lead.person_name AS lead_person,
        d.department_name,
        i.institution_name,
        COUNT(DISTINCT wo.person_id) AS team_size,
        GROUP_CONCAT(DISTINCT pt.tag_name ORDER BY pt.tag_name) AS project_tags,
        GetExpertiseMatchScore(personID, GROUP_CONCAT(pt.tag_name)) AS match_score
    FROM Project p
    LEFT JOIN Person per_lead ON p.leadperson_id = per_lead.person_id
    LEFT JOIN Person per ON p.person_id = per.person_id
    LEFT JOIN Department d ON per.department_id = d.department_id
    LEFT JOIN Institution i ON d.institution_id = i.institution_id
    LEFT JOIN WorkedOn wo ON p.project_id = wo.project_id
    LEFT JOIN Project_Tag pt ON p.project_id = pt.project_id
    WHERE p.end_date IS NULL  -- Only active projects
    AND NOT EXISTS (
        SELECT 1 FROM WorkedOn wo2
        WHERE wo2.person_id = personID
        AND wo2.project_id = p.project_id
    )
    AND GetExpertiseMatchScore(personID, GROUP_CONCAT(pt.tag_name)) > 0
    GROUP BY p.project_id
    HAVING match_score > 0
    ORDER BY match_score DESC
    LIMIT limit_count;
END;

-- Procedure: Global search across projects and people
CREATE PROCEDURE GlobalSearch(
    IN searchTerm VARCHAR(255),
    IN limit_count INT DEFAULT 15
)
BEGIN
    SELECT 
        'Project' AS result_type,
        p.project_id AS id,
        p.project_title AS title,
        p.project_description AS description,
        NULL AS person_email,
        d.department_name,
        i.institution_name
    FROM Project p
    LEFT JOIN Person per ON p.person_id = per.person_id
    LEFT JOIN Department d ON per.department_id = d.department_id
    LEFT JOIN Institution i ON d.institution_id = i.institution_id
    WHERE p.project_title LIKE CONCAT('%', searchTerm, '%')
       OR p.project_description LIKE CONCAT('%', searchTerm, '%')
    
    UNION ALL
    
    SELECT 
        'Person' AS result_type,
        p.person_id AS id,
        p.person_name AS title,
        CONCAT(p.expertise_1, ', ', p.expertise_2, ', ', p.expertise_3) AS description,
        p.person_email,
        d.department_name,
        i.institution_name
    FROM Person p
    LEFT JOIN Department d ON p.department_id = d.department_id
    LEFT JOIN Institution i ON d.institution_id = i.institution_id
    WHERE p.person_name LIKE CONCAT('%', searchTerm, '%')
       OR p.expertise_1 LIKE CONCAT('%', searchTerm, '%')
       OR p.expertise_2 LIKE CONCAT('%', searchTerm, '%')
       OR p.expertise_3 LIKE CONCAT('%', searchTerm, '%')
       OR p.main_field LIKE CONCAT('%', searchTerm, '%')
    
    LIMIT limit_count;
END;
