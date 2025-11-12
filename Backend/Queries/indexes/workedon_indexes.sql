-- Purpose: supporting indexes for WorkedOn queries (MySQL).

CREATE INDEX idx_workedon_project_dates
    ON WorkedOn (project_id, start_date DESC);

CREATE INDEX idx_workedon_person_dates
    ON WorkedOn (person_id, start_date DESC);

CREATE INDEX idx_workedon_active
    ON WorkedOn (end_date);
