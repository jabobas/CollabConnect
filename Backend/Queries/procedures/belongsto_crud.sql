-- File: Backend/sql_queries/aubin/procedures/belongsto_crud.sql
-- Purpose: CRUD stored procedures for BelongsTo (MySQL 8.0).

DELIMITER $$

CREATE PROCEDURE sp_insert_belongsto (
    IN p_department_id   BIGINT UNSIGNED,
    IN p_institution_id  BIGINT UNSIGNED,
    IN p_effective_start DATE,
    IN p_effective_end   DATE,
    IN p_justification   VARCHAR(255)
)
BEGIN
    INSERT INTO BelongsTo (department_id, institution_id, effective_start, effective_end, justification)
    VALUES (p_department_id, p_institution_id, p_effective_start, p_effective_end, p_justification)
    ON DUPLICATE KEY UPDATE
        effective_end  = VALUES(effective_end),
        justification  = VALUES(justification);
END$$

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
END$$

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
END$$

CREATE PROCEDURE sp_get_belongsto_history (
    IN p_department_id BIGINT UNSIGNED
)
BEGIN
    SELECT department_id,
           institution_id,
           effective_start,
           effective_end,
           justification
    FROM BelongsTo
    WHERE department_id = p_department_id
    ORDER BY effective_start DESC;
END$$

CREATE PROCEDURE sp_get_current_institution_for_department (
    IN p_department_id BIGINT UNSIGNED
)
BEGIN
    SELECT department_id,
           institution_id,
           effective_start,
           effective_end,
           justification
    FROM BelongsTo
    WHERE department_id = p_department_id
      AND (effective_end IS NULL OR effective_end >= CURRENT_DATE())
    ORDER BY effective_start DESC
    LIMIT 1;
END$$

DELIMITER ;

