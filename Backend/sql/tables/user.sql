-- User authentication table
-- Separate from Person to allow scraped researchers without login
-- Links to Person via person_id when user creates account or claims profile

CREATE TABLE IF NOT EXISTS user (
    user_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    person_id INT UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    FOREIGN KEY (person_id) REFERENCES person(person_id) ON DELETE SET NULL
);
