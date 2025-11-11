-- File: Backend/sql_queries/aubin/tables/workedon.sql
-- Purpose: canonical WorkedOn table definition for MySQL deployments.
-- Depends on: Person (person_id PK), Project (project_id PK)

CREATE TABLE IF NOT EXISTS WorkedOn (
    person_id      BIGINT UNSIGNED NOT NULL,
    project_id     BIGINT UNSIGNED NOT NULL,
    project_role   VARCHAR(100)    NOT NULL,
    start_date     DATE            NOT NULL,
    end_date       DATE            DEFAULT NULL,
    notes          VARCHAR(255)    DEFAULT NULL,
    PRIMARY KEY (person_id, project_id, start_date),
    CONSTRAINT ck_workedon_dates CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT fk_workedon_person
        FOREIGN KEY (person_id) REFERENCES Person(person_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_workedon_project
        FOREIGN KEY (project_id) REFERENCES Project(project_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

