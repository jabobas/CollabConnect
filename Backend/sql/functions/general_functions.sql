CREATE FUNCTION person_current_departments(p_person_id BIGINT UNSIGNED)
RETURNS TEXT DETERMINISTIC
BEGIN
    RETURN (
        SELECT GROUP_CONCAT(d.department_name SEPARATOR ', ')
        FROM WorksIn w
        JOIN Department d ON d.department_id = w.department_id
        WHERE w.person_id = p_person_id
    );
END;

CREATE FUNCTION department_institution_name(p_department_id BIGINT UNSIGNED)
RETURNS VARCHAR(200) DETERMINISTIC
BEGIN
    RETURN (
        SELECT i.institution_name
        FROM Department d
        JOIN Institution i ON i.institution_id = d.institution_id
        WHERE d.department_id = p_department_id
    );
END;

CREATE FUNCTION person_current_institutions(p_person_id BIGINT UNSIGNED)
RETURNS TEXT DETERMINISTIC
BEGIN
    RETURN (
        SELECT GROUP_CONCAT(DISTINCT i.institution_name SEPARATOR ', ')
        FROM WorksIn w
        JOIN BelongsTo b ON b.department_id = w.department_id
        JOIN Institution i ON i.institution_id = b.institution_id
        WHERE w.person_id = p_person_id
          AND b.effective_start <= CURDATE()
          AND (b.effective_end IS NULL OR b.effective_end >= CURDATE())
    );
END;

CREATE FUNCTION tag_count(p_project_id BIGINT UNSIGNED)
RETURNS INT DETERMINISTIC
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM Project_Tag
        WHERE project_id = p_project_id
    );
END;

CREATE FUNCTION num_people_on_project(p_project_id BIGINT UNSIGNED)
RETURNS TEXT DETERMINISTIC
BEGIN
    RETURN (
        SELECT GROUP_CONCAT(person_name SEPARATOR ', ')
        FROM Person
        WHERE person_id IN (
            SELECT person_id FROM WorkedOn WHERE project_id = p_project_id
        )
    );
END;