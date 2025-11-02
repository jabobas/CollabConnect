-- chatgpt created an additional table for me here - person_expertise
-- however, it might actually be an improvement
-- it might be more "proper" to have a table for a person's expertise
-- better practice to avoid multivalued attributes

-- Main person table
CREATE TABLE IF NOT EXISTS person (
    person_id int NOT NULL UNIQUE PRIMARY KEY ,
    person_name text NOT NULL,
    person_email text UNIQUE,
    person_phone text,
    bio text
);

-- Table to hold multivalued expertise entries per person
CREATE TABLE IF NOT EXISTS person_expertise (
    person_id int NOT NULL REFERENCES person(person_id),
    expertise text NOT NULL,
    PRIMARY KEY (person_id, expertise)
);