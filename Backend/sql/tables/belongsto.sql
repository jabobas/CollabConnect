-- File: Backend/sql_queries/aubin/tables/belongsto.sql
-- Purpose: track the Department -> Institution relationship history in MySQL.
-- Depends on: Department (department_id PK), Institution (institution_id PK)

CREATE TABLE IF NOT EXISTS BelongsTo (
    department_id    BIGINT UNSIGNED NOT NULL,
    institution_id   BIGINT UNSIGNED NOT NULL,
    effective_start  DATE            NOT NULL,
    effective_end    DATE            DEFAULT NULL,
    PRIMARY KEY (department_id, institution_id, effective_start),
    CONSTRAINT ck_belongsto_dates CHECK (effective_end IS NULL OR effective_end >= effective_start),
    CONSTRAINT fk_belongsto_department
        FOREIGN KEY (department_id) REFERENCES Department(department_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_belongsto_institution
        FOREIGN KEY (institution_id) REFERENCES Institution(institution_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

