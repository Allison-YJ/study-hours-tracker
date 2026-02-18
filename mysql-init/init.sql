
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS study_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    study_date DATE NOT NULL,
    duration_minutes INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS analytics_state (
    id INT PRIMARY KEY,
    last_processed_session_id INT DEFAULT 0
);

-- Seed user: demo / demo1234
-- Password hash generated using bcrypt
INSERT INTO users (username, password_hash) 
VALUES ('demo', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L6s5S6ueJ3O96Vq')
ON DUPLICATE KEY UPDATE username=username;

INSERT INTO analytics_state (id, last_processed_session_id) VALUES (1, 0)
ON DUPLICATE KEY UPDATE id=id;
