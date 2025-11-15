-- Filename: project_analytics_functions.sql
-- The purpose of this file is to hold project analytics and insights functions.
-- Author: Abbas Jabor, All copilot
-- Date: November 12, 2025

-- ============================================
-- PROJECT ANALYTICS FUNCTIONS
-- ============================================

-- Function: Get project duration in days
CREATE FUNCTION GetProjectDuration(projectID BIGINT UNSIGNED) RETURNS INT READS SQL DATA
BEGIN
    DECLARE duration INT DEFAULT 0;
    DECLARE project_end_date DATE;
    
    SELECT CASE 
        WHEN end_date IS NULL THEN DATEDIFF(CURDATE(), start_date)
        ELSE DATEDIFF(end_date, start_date)
    END INTO duration
    FROM Project
    WHERE project_id = projectID;
    
    RETURN COALESCE(duration, 0);
END;

-- Procedure: Get comprehensive project metrics
CREATE PROCEDURE GetProjectMetrics(IN projectID BIGINT UNSIGNED)
BEGIN
    SELECT 
        p.project_id,
        p.project_title,
        p.project_description,
        p.start_date,
        p.end_date,
        GetProjectDuration(p.project_id) AS project_duration_days,
        CASE WHEN p.end_date IS NULL THEN 'Active' ELSE 'Completed' END AS project_status,
        per_lead.person_name AS lead_person,
        d.department_name,
        i.institution_name,
        COUNT(DISTINCT wo.person_id) AS team_size,
        COUNT(DISTINCT CASE WHEN wo.end_date IS NULL THEN wo.person_id END) AS active_team_members,
        COUNT(DISTINCT pt.tag_name) AS tag_count,
        GROUP_CONCAT(DISTINCT pt.tag_name ORDER BY pt.tag_name) AS project_tags,
        GROUP_CONCAT(DISTINCT CONCAT(per.person_name, ' (', wo.project_role, ')') ORDER BY per.person_name) AS team_composition,
        COUNT(DISTINCT per.person_id) AS unique_expertise_count
    FROM Project p
    LEFT JOIN Person per_lead ON p.leadperson_id = per_lead.person_id
    LEFT JOIN Person per ON p.person_id = per.person_id
    LEFT JOIN Department d ON per.department_id = d.department_id
    LEFT JOIN Institution i ON d.institution_id = i.institution_id
    LEFT JOIN WorkedOn wo ON p.project_id = wo.project_id
    LEFT JOIN Person per_wo ON wo.person_id = per_wo.person_id
    LEFT JOIN Project_Tag pt ON p.project_id = pt.project_id
    WHERE p.project_id = projectID
    GROUP BY p.project_id;
END;

-- Procedure: Get department productivity metrics
CREATE PROCEDURE GetDepartmentProductivity(
    IN departmentID BIGINT UNSIGNED,
    IN startDate DATE,
    IN endDate DATE
)
BEGIN
    SELECT 
        d.department_id,
        d.department_name,
        i.institution_name,
        COUNT(DISTINCT p.project_id) AS total_projects,
        COUNT(DISTINCT CASE WHEN p.end_date IS NULL THEN p.project_id END) AS active_projects,
        COUNT(DISTINCT CASE WHEN p.end_date IS NOT NULL THEN p.project_id END) AS completed_projects,
        COUNT(DISTINCT per.person_id) AS team_members,
        COUNT(DISTINCT wo.person_id) AS people_on_projects,
        AVG(GetProjectDuration(p.project_id)) AS avg_project_duration_days,
        COUNT(DISTINCT pt.tag_name) AS expertise_areas,
        GROUP_CONCAT(DISTINCT pt.tag_name ORDER BY pt.tag_name LIMIT 10) AS primary_expertise_areas
    FROM Department d
    LEFT JOIN Institution i ON d.institution_id = i.institution_id
    LEFT JOIN Person per ON d.department_id = per.department_id
    LEFT JOIN Project p ON per.person_id = p.person_id 
        OR per.person_id IN (SELECT person_id FROM WorkedOn WHERE project_id = p.project_id)
    LEFT JOIN WorkedOn wo ON p.project_id = wo.project_id
    LEFT JOIN Project_Tag pt ON p.project_id = pt.project_id
    WHERE d.department_id = departmentID
    AND (startDate IS NULL OR p.start_date >= startDate)
    AND (endDate IS NULL OR p.start_date <= endDate)
    GROUP BY d.department_id;
END;

-- Procedure: Get institution research output
CREATE PROCEDURE GetInstitutionResearch(IN institutionID BIGINT UNSIGNED)
BEGIN
    SELECT 
        i.institution_id,
        i.institution_name,
        COUNT(DISTINCT d.department_id) AS department_count,
        COUNT(DISTINCT per.person_id) AS total_researchers,
        COUNT(DISTINCT p.project_id) AS total_projects,
        COUNT(DISTINCT CASE WHEN p.end_date IS NULL THEN p.project_id END) AS active_projects,
        COUNT(DISTINCT pt.tag_name) AS research_areas,
        GROUP_CONCAT(DISTINCT pt.tag_name ORDER BY pt.tag_name) AS all_research_areas,
        AVG(GetProjectDuration(p.project_id)) AS avg_project_duration_days,
        COUNT(DISTINCT wo.person_id) AS researchers_on_projects,
        MIN(p.start_date) AS earliest_project_start,
        MAX(p.end_date) AS latest_project_end
    FROM Institution i
    LEFT JOIN Department d ON i.institution_id = d.institution_id
    LEFT JOIN Person per ON d.department_id = per.department_id
    LEFT JOIN Project p ON per.person_id = p.person_id 
        OR per.person_id IN (SELECT person_id FROM WorkedOn WHERE project_id = p.project_id)
    LEFT JOIN Project_Tag pt ON p.project_id = pt.project_id
    LEFT JOIN WorkedOn wo ON p.project_id = wo.project_id
    WHERE i.institution_id = institutionID
    GROUP BY i.institution_id;
END;

-- Procedure: Get top projects by team size and engagement
CREATE PROCEDURE GetTopProjectsByEngagement(
    IN limit_count INT DEFAULT 10
)
BEGIN
    SELECT 
        p.project_id,
        p.project_title,
        p.start_date,
        p.end_date,
        COUNT(DISTINCT wo.person_id) AS team_size,
        COUNT(DISTINCT pt.tag_name) AS tag_count,
        GetProjectDuration(p.project_id) AS duration_days,
        per_lead.person_name AS lead_person,
        d.department_name,
        i.institution_name
    FROM Project p
    LEFT JOIN WorkedOn wo ON p.project_id = wo.project_id
    LEFT JOIN Project_Tag pt ON p.project_id = pt.project_id
    LEFT JOIN Person per_lead ON p.leadperson_id = per_lead.person_id
    LEFT JOIN Person per ON p.person_id = per.person_id
    LEFT JOIN Department d ON per.department_id = d.department_id
    LEFT JOIN Institution i ON d.institution_id = i.institution_id
    GROUP BY p.project_id
    ORDER BY team_size DESC, duration_days DESC
    LIMIT limit_count;
END;
