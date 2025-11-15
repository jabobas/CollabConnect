-- Filename: availability_capacity_functions.sql
-- The purpose of this file is to hold availability and capacity planning functions.
-- Author: Abbas Jabor, All Copilot 
-- Date: November 12, 2025

-- ============================================
-- AVAILABILITY & CAPACITY PLANNING FUNCTIONS
-- ============================================

-- Function: Check if person is available on a given date
CREATE FUNCTION IsPersonAvailable(
    personID BIGINT UNSIGNED,
    checkDate DATE
) RETURNS BOOLEAN READS SQL DATA
BEGIN
    DECLARE is_available BOOLEAN DEFAULT TRUE;
    
    -- Check if person has any active projects on the given date
    IF EXISTS (
        SELECT 1 FROM WorkedOn
        WHERE person_id = personID
        AND (checkDate BETWEEN start_date AND COALESCE(end_date, CURDATE()))
    ) THEN
        SET is_available = FALSE;
    END IF;
    
    RETURN is_available;
END;

-- Function: Get number of active projects for a person
CREATE FUNCTION GetActiveProjectCount(personID BIGINT UNSIGNED) RETURNS INT READS SQL DATA
BEGIN
    DECLARE active_count INT DEFAULT 0;
    
    SELECT COUNT(DISTINCT project_id)
    INTO active_count
    FROM WorkedOn
    WHERE person_id = personID
    AND end_date IS NULL;
    
    RETURN active_count;
END;

-- Procedure: Get person availability with project details
CREATE PROCEDURE GetPersonAvailability(
    IN personID BIGINT UNSIGNED,
    IN asOfDate DATE
)
BEGIN
    SELECT 
        p.person_id,
        p.person_name,
        p.person_email,
        d.department_name,
        GetActiveProjectCount(p.person_id) AS active_project_count,
        CASE 
            WHEN GetActiveProjectCount(p.person_id) = 0 THEN 'Fully Available'
            WHEN GetActiveProjectCount(p.person_id) = 1 THEN 'Limited Availability'
            ELSE 'Fully Committed'
        END AS availability_status,
        GROUP_CONCAT(
            CONCAT(pr.project_title, ' (', wo.project_role, ', ends: ', COALESCE(wo.end_date, 'Ongoing'), ')')
            ORDER BY COALESCE(wo.end_date, CURDATE())
        ) AS current_projects
    FROM Person p
    LEFT JOIN Department d ON p.department_id = d.department_id
    LEFT JOIN WorkedOn wo ON p.person_id = wo.person_id
    LEFT JOIN Project pr ON wo.project_id = pr.project_id
    WHERE p.person_id = personID
    AND (wo.end_date IS NULL OR wo.end_date >= asOfDate)
    GROUP BY p.person_id;
END;

-- Procedure: Get team capacity for a specific skill
CREATE PROCEDURE GetTeamCapacity(
    IN departmentID BIGINT UNSIGNED,
    IN skillRequired VARCHAR(50)
)
BEGIN
    SELECT 
        d.department_id,
        d.department_name,
        COUNT(DISTINCT p.person_id) AS total_team_members,
        COUNT(DISTINCT CASE 
            WHEN (p.expertise_1 LIKE CONCAT('%', skillRequired, '%')
               OR p.expertise_2 LIKE CONCAT('%', skillRequired, '%')
               OR p.expertise_3 LIKE CONCAT('%', skillRequired, '%')
               OR p.main_field LIKE CONCAT('%', skillRequired, '%'))
            THEN p.person_id 
        END) AS experts_in_skill,
        COUNT(DISTINCT CASE 
            WHEN GetActiveProjectCount(p.person_id) = 0 THEN p.person_id
        END) AS fully_available,
        COUNT(DISTINCT CASE 
            WHEN GetActiveProjectCount(p.person_id) = 0
            AND (p.expertise_1 LIKE CONCAT('%', skillRequired, '%')
              OR p.expertise_2 LIKE CONCAT('%', skillRequired, '%')
              OR p.expertise_3 LIKE CONCAT('%', skillRequired, '%')
              OR p.main_field LIKE CONCAT('%', skillRequired, '%'))
            THEN p.person_id
        END) AS available_experts,
        GROUP_CONCAT(DISTINCT CONCAT(p.person_name, ' (Available)') 
            ORDER BY p.person_name SEPARATOR ', ') AS available_team_members
    FROM Department d
    LEFT JOIN Person p ON d.department_id = p.department_id
    WHERE d.department_id = departmentID
    GROUP BY d.department_id;
END;

-- Procedure: Check for conflicting assignments
CREATE PROCEDURE CheckConflictingAssignments(
    IN personID BIGINT UNSIGNED,
    IN proposedProjectID BIGINT UNSIGNED,
    IN proposedStartDate DATE,
    IN proposedEndDate DATE
)
BEGIN
    SELECT 
        p.person_id,
        p.person_name,
        pr.project_id,
        pr.project_title,
        wo.project_role,
        wo.start_date,
        wo.end_date,
        CASE 
            WHEN (proposedStartDate <= COALESCE(wo.end_date, CURDATE()) 
              AND proposedEndDate >= wo.start_date)
            THEN 'CONFLICT'
            ELSE 'NO CONFLICT'
        END AS overlap_status
    FROM Person p
    LEFT JOIN WorkedOn wo ON p.person_id = wo.person_id
    LEFT JOIN Project pr ON wo.project_id = pr.project_id
    WHERE p.person_id = personID
    AND wo.project_id != COALESCE(proposedProjectID, 0)
    HAVING overlap_status = 'CONFLICT'
    ORDER BY wo.start_date;
END;

-- Procedure: Find most available people for a project
CREATE PROCEDURE FindAvailablePeople(
    IN projectStartDate DATE,
    IN projectEndDate DATE,
    IN requiredSkill VARCHAR(100) DEFAULT NULL,
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
        GetActiveProjectCount(p.person_id) AS active_projects,
        COUNT(DISTINCT wo_past.project_id) AS past_project_count
    FROM Person p
    LEFT JOIN Department d ON p.department_id = d.department_id
    LEFT JOIN Institution i ON d.institution_id = i.institution_id
    LEFT JOIN WorkedOn wo_past ON p.person_id = wo_past.person_id
    WHERE NOT EXISTS (
        SELECT 1 FROM WorkedOn wo
        WHERE wo.person_id = p.person_id
        AND (projectStartDate <= COALESCE(wo.end_date, CURDATE())
        AND projectEndDate >= wo.start_date)
    )
    AND (departmentID IS NULL OR p.department_id = departmentID)
    AND (requiredSkill IS NULL 
         OR p.expertise_1 LIKE CONCAT('%', requiredSkill, '%')
         OR p.expertise_2 LIKE CONCAT('%', requiredSkill, '%')
         OR p.expertise_3 LIKE CONCAT('%', requiredSkill, '%')
         OR p.main_field LIKE CONCAT('%', requiredSkill, '%'))
    GROUP BY p.person_id
    ORDER BY active_projects ASC, past_project_count DESC
    LIMIT limit_count;
END;
