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
    DECLARE dept_count INT;
    DECLARE inst_count INT;
    
    -- Validate department and institution exist
    SELECT COUNT(*) INTO dept_count
    FROM Department
    WHERE department_id = p_department_id
    FOR UPDATE;
    
    IF dept_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Department not found';
    END IF;
    
    SELECT COUNT(*) INTO inst_count
    FROM Institution
    WHERE institution_id = p_institution_id
    FOR UPDATE;
    
    IF inst_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Institution not found';
    END IF;
    
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
    DECLARE rel_count INT;
    
    SELECT COUNT(*) INTO rel_count
    FROM BelongsTo
    WHERE department_id = p_department_id
      AND institution_id = p_institution_id
      AND effective_start = p_effective_start
    FOR UPDATE;
    
    IF rel_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'BelongsTo relationship not found';
    END IF;
    
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
    DECLARE rel_count INT;
    
    SELECT COUNT(*) INTO rel_count
    FROM BelongsTo
    WHERE department_id = p_department_id
      AND institution_id = p_institution_id
      AND effective_start = p_effective_start
    FOR UPDATE;
    
    IF rel_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'BelongsTo relationship not found';
    END IF;
    
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


