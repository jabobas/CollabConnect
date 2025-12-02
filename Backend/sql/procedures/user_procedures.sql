-- User CRUD procedures

-- Insert new user (signup)
CREATE PROCEDURE InsertUser(
    IN p_email VARCHAR(255),
    IN p_password_hash VARCHAR(255)
)
BEGIN
    INSERT INTO User (email, password_hash)
    VALUES (p_email, p_password_hash);
    
    SELECT LAST_INSERT_ID() AS user_id;
END;

-- Get user by email (for login)
CREATE PROCEDURE SelectUserByEmail(
    IN p_email VARCHAR(255)
)
BEGIN
    SELECT 
        user_id,
        person_id,
        email,
        password_hash,
        created_at,
        last_login
    FROM User
    WHERE email = p_email;
END;

-- Get user by ID
CREATE PROCEDURE SelectUserById(
    IN p_user_id INT
)
BEGIN
    SELECT 
        u.user_id,
        u.person_id,
        u.email,
        u.created_at,
        u.last_login,
        p.person_name,
        p.person_email,
        p.person_phone,
        p.bio,
        p.expertise_1,
        p.expertise_2,
        p.expertise_3,
        p.main_field,
        p.department_id,
        d.department_name,
        i.institution_name
    FROM User u
    LEFT JOIN Person p ON u.person_id = p.person_id
    LEFT JOIN Department d ON p.department_id = d.department_id
    LEFT JOIN BelongsTo bt ON d.department_id = bt.department_id
    LEFT JOIN Institution i ON bt.institution_id = i.institution_id
    WHERE u.user_id = p_user_id;
END;



-- Update last login timestamp
CREATE PROCEDURE UpdateUserLastLogin(
    IN p_user_id INT
)
BEGIN
    UPDATE User
    SET last_login = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id;
END;

-- Link user to existing person (claim profile)
CREATE PROCEDURE LinkUserToPerson(
    IN p_user_id INT,
    IN p_person_id INT
)
BEGIN
    DECLARE person_claimed INT DEFAULT 0;
    
    -- Check if person is already claimed
    SELECT COUNT(*) INTO person_claimed
    FROM User
    WHERE person_id = p_person_id;
    
    IF person_claimed > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'This profile has already been claimed by another user';
    ELSE
        UPDATE User
        SET person_id = p_person_id
        WHERE user_id = p_user_id;
        
        SELECT 'success' AS status;
    END IF;
END;



-- Delete user
CREATE PROCEDURE DeleteUser(
    IN p_user_id INT
)
BEGIN
    DELETE FROM User
    WHERE user_id = p_user_id;
    
    SELECT ROW_COUNT() AS rows_affected;
END;
