CREATE TABLE Department (
    department_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    institution_id BIGINT UNSIGNED NOT NULL,
    department_name VARCHAR(150) NOT NULL,
    department_email VARCHAR(150) UNIQUE,
    department_phone VARCHAR(15),
    FOREIGN KEY (institution_id) REFERENCES Institution(institution_id)
);
    