-- File: Backend/sql_queries/indexes/worksin_indexes.sql
-- Purpose: Secondary indexes for WorksIn junction table to optimize many-to-many queries.
-- By: Wyatt McCurdy
-- Date: November 12, 2025

-- WORKSIN INDEXES

-- Index for finding all departments a person works in
-- Commonly used to display a person's departmental affiliations
CREATE INDEX idx_worksin_person ON WorksIn(person_id);

-- Index for finding all people who work in a specific department
-- Used for department roster queries and listings
CREATE INDEX idx_worksin_department ON WorksIn(department_id);

-- Composite index for efficient bidirectional lookups
-- Optimizes queries that filter by both person and department
CREATE INDEX idx_worksin_composite ON WorksIn(person_id, department_id);

-- Note: The table already has a unique constraint on (person_id, department_id)
-- which implicitly creates an index, but explicit indexes above provide
-- better query optimization for different query patterns.
