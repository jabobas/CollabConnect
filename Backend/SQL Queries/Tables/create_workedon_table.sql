-- WorkedOn relationship table between Person and Project
-- Requires: person (create_person_tables.sql) and project tables to exist.

CREATE TABLE WorkedOn (
    person_id BIGINT UNSIGNED NOT NULL,
    project_id BIGINT UNSIGNED NOT NULL,
    project_role VARCHAR(80) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    PRIMARY KEY (person_id, project_id, start_date),
    CONSTRAINT ck_workedon_dates CHECK (end_date IS NULL OR end_date >= start_date),
    FOREIGN KEY (person_id) REFERENCES Person(person_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES Project(project_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- Helpful indexes for common lookups
CREATE INDEX idx_worked_on_project ON WorkedOn(project_id, start_date);
CREATE INDEX idx_worked_on_person_dates ON WorkedOn(person_id, start_date);
