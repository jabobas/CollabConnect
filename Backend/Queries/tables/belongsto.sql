-- Author: Aubin Mugisha
-- Description: BelongsTo table tracks which departments belong to which institutions over time
-- Handles department transfers between institutions with effective start/end dates

CREATE TABLE IF NOT EXISTS BelongsTo (
    department_id    BIGINT UNSIGNED NOT NULL,
    institution_id   BIGINT UNSIGNED NOT NULL,
    effective_start  DATE            NOT NULL,
    effective_end    DATE            DEFAULT NULL,
    justification    VARCHAR(255)    DEFAULT NULL,
    PRIMARY KEY (department_id, institution_id, effective_start),
    CONSTRAINT ck_belongsto_dates CHECK (effective_end IS NULL OR effective_end >= effective_start),
    CONSTRAINT fk_belongsto_department
        FOREIGN KEY (department_id) REFERENCES Department(department_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_belongsto_institution
        FOREIGN KEY (institution_id) REFERENCES Institution(institution_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

