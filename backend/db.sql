
-- URL Shortener Database Schema


DROP DATABASE IF EXISTS url_shortener_db;
CREATE DATABASE url_shortener_db;
USE url_shortener_db;


-- Users Table


CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- URLs Table

CREATE TABLE urls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    original_url TEXT NOT NULL,
    short_code VARCHAR(50) NOT NULL UNIQUE,
    click_count INT DEFAULT 0,

    user_id INT NOT NULL,
    expires_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Detailed Clicks Table
CREATE TABLE url_clicks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url_id INT NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    referrer VARCHAR(255) NULL,
    device_type VARCHAR(50) NULL,
    browser VARCHAR(50) NULL,
    os VARCHAR(50) NULL,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
);

-- Performance Indexes
CREATE INDEX idx_urls_short_code ON urls(short_code);
CREATE INDEX idx_urls_user_id ON urls(user_id);
CREATE INDEX idx_clicks_url_id ON url_clicks(url_id);
CREATE INDEX idx_clicks_clicked_at ON url_clicks(clicked_at);

    user_id INT NULL,
    expires_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_urls_short_code ON urls(short_code);
CREATE INDEX idx_urls_user_id ON urls(user_id);
CREATE INDEX idx_urls_click_count ON urls(click_count);
CREATE INDEX idx_urls_expires_at ON urls(expires_at);

