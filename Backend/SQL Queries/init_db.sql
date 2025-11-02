-- Usage:
--   psql -d postgres -f /home/wyatt/Documents/code/CollabConnect/init_db.sql
--   psql -v DB_NAME=mydb -d postgres -f /home/wyatt/Documents/code/CollabConnect/init_db.sql

\if :{?DB_NAME}
\else
\set DB_NAME collabconnect
\endif

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE ' || quote_ident(:'DB_NAME')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'DB_NAME')\gexec

-- Connect to the target database
\connect :DB_NAME

-- Run schema scripts in order
\i /home/wyatt/Documents/code/CollabConnect/create_person_tables.sql
\i /home/wyatt/Documents/code/CollabConnect/create_institution_tables.sql

-- Validation: list created objects
\echo
\echo '== Validation: listing objects =='
\echo 'Current database:'
SELECT current_database();

\echo
\echo 'Tables:'
\dt

\echo
\echo 'Type: institution_address_type'
\dT+ institution_address_type

\echo
\echo 'Describe tables:'
\d person
\d institution
\d works_in

-- Smoke test (rolled back): insert sample rows and verify join
\echo
\echo '== Smoke test: insert/join/rollback =='
BEGIN;
INSERT INTO person (person_id, person_name, person_email)
VALUES (1000001, 'Test Person', 'test_person_1000001@example.com');

INSERT INTO institution (
    institution_id, institution_name, institution_type, institution_phone, institution_address
) VALUES (
    2000001, 'Test Institution', 'Test', '555-0100',
    ROW('Nowhere City', '123 Main St', 'ST', '00000')::institution_address_type
);

INSERT INTO works_in (person_id, institution_id)
VALUES (1000001, 2000001);

\echo 'Joined rows from person -> works_in -> institution:'
SELECT p.person_name, i.institution_name
FROM person p
JOIN works_in w ON w.person_id = p.person_id
JOIN institution i ON i.institution_id = w.institution_id
WHERE p.person_id = 1000001 AND i.institution_id = 2000001;

ROLLBACK;
\echo 'Smoke test rolled back successfully.'
