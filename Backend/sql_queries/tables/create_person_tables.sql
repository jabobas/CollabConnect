-- Person entity and related tables

-- Main person table
CREATE TABLE IF NOT EXISTS person (
    person_id int NOT NULL PRIMARY KEY,
    person_name text NOT NULL,
    person_email text UNIQUE,
    person_phone text,
    bio text,
    expertise_one text,
    expertise_two text,
    expertise_three text
);
