-- Composite type for the institution address
DO $$
BEGIN
    CREATE TYPE institution_address_type AS (
        city text,
        street text,
        state text,
        zip_code text
    );
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

-- Institution entity
CREATE TABLE IF NOT EXISTS institution (
    institution_id int NOT NULL PRIMARY KEY,
    institution_name text NOT NULL,
    institution_type text,
    institution_phone text,
    institution_address institution_address_type NOT NULL
);

-- Relation: WorksIn (Person -> Institution)
-- Requires: person table exists (from create_person_tables.sql)
CREATE TABLE IF NOT EXISTS works_in (
    person_id int NOT NULL REFERENCES person(person_id),
    institution_id int NOT NULL REFERENCES institution(institution_id),
    PRIMARY KEY (person_id, institution_id)
);
