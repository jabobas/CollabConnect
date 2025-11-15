-- Author: Aubin Mugisha
-- Description: Stored procedures for managing BelongsTo department-institution relationships
-- Handles inserting, closing (setting end date), and deleting records

CREATE PROCEDURE sp_insert_belongsto (
    IN p_department_id   BIGINT UNSIGNED,
    IN p_institution_id  BIGINT UNSIGNED,
    IN p_effective_start DATE,
    IN p_effective_end   DATE
)
BEGIN
    INSERT INTO BelongsTo (department_id, institution_id, effective_start, effective_end)
    VALUES (p_department_id, p_institution_id, p_effective_start, p_effective_end)
    ON DUPLICATE KEY UPDATE
        effective_end  = VALUES(effective_end);
END;

CREATE PROCEDURE sp_close_belongsto (
    IN p_department_id   BIGINT UNSIGNED,
    IN p_institution_id  BIGINT UNSIGNED,
    IN p_effective_start DATE,
    IN p_effective_end   DATE
)
BEGIN
    UPDATE BelongsTo
    SET effective_end = p_effective_end
    WHERE department_id = p_department_id
      AND institution_id = p_institution_id
      AND effective_start = p_effective_start;
END;

CREATE PROCEDURE sp_delete_belongsto (
    IN p_department_id   BIGINT UNSIGNED,
    IN p_institution_id  BIGINT UNSIGNED,
    IN p_effective_start DATE
)
BEGIN
    DELETE FROM BelongsTo
    WHERE department_id = p_department_id
      AND institution_id = p_institution_id
      AND effective_start = p_effective_start;
END;

CREATE PROCEDURE sp_get_belongsto_history (
    IN p_department_id BIGINT UNSIGNED
)
BEGIN
    SELECT department_id,
           institution_id,
           effective_start,
           effective_end
    FROM BelongsTo
    WHERE department_id = p_department_id
    ORDER BY effective_start DESC;
END;

CREATE PROCEDURE sp_get_current_institution_for_department (
    IN p_department_id BIGINT UNSIGNED
)
BEGIN
    SELECT department_id,
           institution_id,
           effective_start,
           effective_end
    FROM BelongsTo
    WHERE department_id = p_department_id
      AND (effective_end IS NULL OR effective_end >= CURRENT_DATE())
    ORDER BY effective_start DESC
    LIMIT 1;
END;


