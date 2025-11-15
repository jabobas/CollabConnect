-- Filename: collaboration_network_functions.sql
-- The purpose of this file is to hold collaboration network analysis functions.
-- Author: Abbas Jabor, All Copilot
-- Date: November 12, 2025

-- ============================================
-- COLLABORATION NETWORK FUNCTIONS
-- ============================================

-- Function: Calculate total projects two people worked together on
CREATE FUNCTION GetCollaborationCount(
    person1ID BIGINT UNSIGNED,
    person2ID BIGINT UNSIGNED
) RETURNS INT READS SQL DATA
BEGIN
    DECLARE count_projects INT DEFAULT 0;
    
    SELECT COUNT(DISTINCT wo1.project_id)
    INTO count_projects
    FROM WorkedOn wo1
    JOIN WorkedOn wo2 ON wo1.project_id = wo2.project_id
    WHERE wo1.person_id = person1ID
    AND wo2.person_id = person2ID
    AND person1ID < person2ID;
    
    RETURN count_projects;
END;

-- Procedure: Get collaboration network for a specific person
CREATE PROCEDURE GetPersonCollaborationNetwork(
    IN personID BIGINT UNSIGNED,
    IN maxDegrees INT DEFAULT 1
)
BEGIN
    IF maxDegrees = 1 THEN
        -- First degree collaborators (direct collaborations)
        SELECT 
            p2.person_id,
            p2.person_name,
            p2.person_email,
            d.department_name,
            i.institution_name,
            COUNT(DISTINCT wo1.project_id) AS projects_together,
            GROUP_CONCAT(DISTINCT p.project_title) AS shared_projects
        FROM WorkedOn wo1
        JOIN WorkedOn wo2 ON wo1.project_id = wo2.project_id
        JOIN Person p2 ON wo2.person_id = p2.person_id
        JOIN Project p ON wo1.project_id = p.project_id
        LEFT JOIN Department d ON p2.department_id = d.department_id
        LEFT JOIN Institution i ON d.institution_id = i.institution_id
        WHERE wo1.person_id = personID
        AND wo2.person_id != personID
        GROUP BY p2.person_id
        ORDER BY projects_together DESC;
    
    ELSEIF maxDegrees = 2 THEN
        -- Second degree collaborators (collaborators of collaborators)
        SELECT DISTINCT
            p3.person_id,
            p3.person_name,
            p3.person_email,
            d.department_name,
            i.institution_name,
            1 AS degree_of_separation
        FROM WorkedOn wo1
        JOIN WorkedOn wo2 ON wo1.project_id = wo2.project_id
        JOIN WorkedOn wo3 ON wo2.person_id = wo3.person_id
        JOIN Person p3 ON wo3.person_id = p3.person_id
        LEFT JOIN Department d ON p3.department_id = d.department_id
        LEFT JOIN Institution i ON d.institution_id = i.institution_id
        WHERE wo1.person_id = personID
        AND wo2.person_id != personID
        AND wo3.person_id != personID
        AND wo3.person_id NOT IN (
            SELECT DISTINCT wo2b.person_id
            FROM WorkedOn wo2b
            WHERE wo2b.person_id IN (
                SELECT wo2c.person_id
                FROM WorkedOn wo1c
                JOIN WorkedOn wo2c ON wo1c.project_id = wo2c.project_id
                WHERE wo1c.person_id = personID
            )
        )
        LIMIT 20;
    END IF;
END;

-- Procedure: Find teams that worked together
CREATE PROCEDURE FindTeamsWorkedTogether(
    IN person1ID BIGINT UNSIGNED,
    IN person2ID BIGINT UNSIGNED
)
BEGIN
    SELECT 
        p.project_id,
        p.project_title,
        p.project_description,
        p.start_date,
        p.end_date,
        COUNT(DISTINCT wo.person_id) AS team_size,
        GROUP_CONCAT(DISTINCT per.person_name ORDER BY per.person_name) AS team_members,
        GROUP_CONCAT(DISTINCT pt.tag_name) AS project_tags
    FROM Project p
    JOIN WorkedOn wo ON p.project_id = wo.project_id
    JOIN Person per ON wo.person_id = per.person_id
    LEFT JOIN Project_Tag pt ON p.project_id = pt.project_id
    WHERE p.project_id IN (
        SELECT wo1.project_id
        FROM WorkedOn wo1
        WHERE wo1.person_id = person1ID
    )
    AND p.project_id IN (
        SELECT wo2.project_id
        FROM WorkedOn wo2
        WHERE wo2.person_id = person2ID
    )
    GROUP BY p.project_id
    ORDER BY p.start_date DESC;
END;

-- Procedure: Get most connected people (collaboration hubs)
CREATE PROCEDURE GetMostConnectedPeople(
    IN limit_count INT DEFAULT 10
)
BEGIN
    SELECT 
        p.person_id,
        p.person_name,
        p.person_email,
        d.department_name,
        i.institution_name,
        COUNT(DISTINCT wo.project_id) AS projects_count,
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
            ) THEN wo.person_id 
        END) AS unique_collaborators
    FROM Person p
    LEFT JOIN Department d ON p.department_id = d.department_id
    LEFT JOIN Institution i ON d.institution_id = i.institution_id
    LEFT JOIN WorkedOn wo ON p.person_id = wo.person_id
    GROUP BY p.person_id
    ORDER BY unique_collaborators DESC, projects_count DESC
    LIMIT limit_count;
END;
