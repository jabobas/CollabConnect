-- File: Backend/sql_queries/indexes/person_indexes.sql
-- Purpose: Secondary indexes for Person table to optimize common query patterns.
-- By: Wyatt McCurdy
-- Date: November 12, 2025

-- PERSON INDEXES

-- Index for searching people by name (commonly used in search functionality)
CREATE INDEX idx_person_name ON Person(person_name);

-- Index for searching people by email (used for authentication and unique lookups)
CREATE INDEX idx_person_email ON Person(person_email);

-- Index for filtering people by their main field of expertise
CREATE INDEX idx_person_main_field ON Person(main_field);

-- Index for department-based queries (finding all people in a department)
CREATE INDEX idx_person_department ON Person(department_id);

-- Composite index for department and main field queries
-- Useful for finding people in a specific department with a specific expertise
CREATE INDEX idx_person_dept_field ON Person(department_id, main_field);

-- Full-text search index for searching across person names and bios
-- Essential for the expertise matching and people search features
CREATE FULLTEXT INDEX idx_person_search ON Person(person_name, bio);

-- Full-text search index for expertise fields
-- Enables searching people by their specific areas of expertise
CREATE FULLTEXT INDEX idx_person_expertise ON Person(expertise_1, expertise_2, expertise_3);

-- Composite index for main field and name (useful for sorting)
CREATE INDEX idx_person_field_name ON Person(main_field, person_name);
