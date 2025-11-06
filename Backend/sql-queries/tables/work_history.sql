Create table WorkHistory (
    work_history_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, 
    person_id BIGINT UNSIGNED NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    role VARCHAR(120) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL
);
