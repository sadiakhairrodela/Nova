-- ================================================================
-- ddodle Project — Database Additions
-- Run this file AFTER importing the base database.sql
-- Adds all tables required for the full feature set
-- ================================================================

USE ddodle_project;

-- ================================================================
-- MODULE 1.2 — Community Forum
-- ================================================================

CREATE TABLE IF NOT EXISTS community_posts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          NOT NULL,
  title       VARCHAR(255) NOT NULL,
  content     TEXT         NOT NULL,
  status      ENUM('active','removed') DEFAULT 'active',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  post_id    INT  NOT NULL,
  user_id    INT  NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id)  REFERENCES community_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id)           ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_reactions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  post_id       INT NOT NULL,
  user_id       INT NOT NULL,
  reaction_type ENUM('like','heart','support') DEFAULT 'like',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_reaction (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)           ON DELETE CASCADE
);

-- ================================================================
-- MODULE 1.4 — Digital Consent & Data-Sharing
-- ================================================================

CREATE TABLE IF NOT EXISTS consent_records (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT         NOT NULL UNIQUE,
  consented    TINYINT(1)  DEFAULT 0,
  consented_at DATETIME,
  withdrawn_at DATETIME,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS consent_access (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT      NOT NULL,
  granted_to_id  INT      NOT NULL,
  granted_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_access (user_id, granted_to_id),
  FOREIGN KEY (user_id)       REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_to_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================================
-- MODULE 2.3 — Expert Advice Desk
-- ================================================================

CREATE TABLE IF NOT EXISTS expert_queries (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  caregiver_id  INT NOT NULL,
  clinician_id  INT,
  video_id      INT,
  subject       VARCHAR(255) NOT NULL,
  content       TEXT         NOT NULL,
  status        ENUM('open','in_review','responded','closed') DEFAULT 'open',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (caregiver_id) REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (clinician_id) REFERENCES users(id)  ON DELETE SET NULL,
  FOREIGN KEY (video_id)     REFERENCES videos(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS expert_replies (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  query_id   INT  NOT NULL,
  user_id    INT  NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (query_id) REFERENCES expert_queries(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id)          ON DELETE CASCADE
);

-- ================================================================
-- MODULE 2.4 — Notification Center
-- ================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT  NOT NULL,
  type       ENUM('video_received','re_record_requested','review_completed',
                  'follow_up_due','query_response','general') DEFAULT 'general',
  message    TEXT         NOT NULL,
  is_read    TINYINT(1)   DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  user_id             INT        NOT NULL UNIQUE,
  email_enabled       TINYINT(1) DEFAULT 1,
  sms_enabled         TINYINT(1) DEFAULT 0,
  video_received      TINYINT(1) DEFAULT 1,
  re_record_requested TINYINT(1) DEFAULT 1,
  review_completed    TINYINT(1) DEFAULT 1,
  follow_up_due       TINYINT(1) DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================================
-- MODULE 3.4 — Follow-up Task Management
-- ================================================================

CREATE TABLE IF NOT EXISTS follow_up_tasks (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  baby_id      INT          NOT NULL,
  clinician_id INT          NOT NULL,
  task_type    ENUM('assessment','clinic_visit','recheck','other') DEFAULT 'other',
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  due_date     DATE         NOT NULL,
  status       ENUM('pending','completed','overdue') DEFAULT 'pending',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (baby_id)      REFERENCES babies(id) ON DELETE CASCADE,
  FOREIGN KEY (clinician_id) REFERENCES users(id)  ON DELETE CASCADE
);

-- ================================================================
-- MODULE 3.5 — Audit Log Dashboard
-- ================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  action        ENUM('view','download','update','delete','login','logout',
                     'approve','reject','create') NOT NULL,
  resource_type ENUM('video','report','profile','audit','user',
                     'query','consent') NOT NULL,
  resource_id   INT,
  details       TEXT,
  ip_address    VARCHAR(50),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================================
-- MODULE 3.6 — Data Retention & Delete Requests
-- ================================================================

CREATE TABLE IF NOT EXISTS deletion_requests (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT  NOT NULL,
  reason         TEXT NOT NULL,
  status         ENUM('pending','approved','rejected','purged') DEFAULT 'pending',
  admin_notes    TEXT,
  reviewed_by    INT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ================================================================
-- Sample seed data
-- ================================================================

-- A welcome notification for all caregivers
INSERT IGNORE INTO notifications (user_id, type, message)
SELECT id, 'general',
  'Welcome to ddodle! Start by uploading a video for your baby.'
FROM users WHERE role = 'caregiver';

-- Default notification preferences for all users
INSERT IGNORE INTO notification_preferences (user_id)
SELECT id FROM users;

-- A sample community post
INSERT IGNORE INTO community_posts (user_id, title, content) VALUES (
  (SELECT id FROM users WHERE role='caregiver' LIMIT 1),
  'Welcome to the ddodle Community!',
  'This is a space for caregivers to share experiences, ask questions, and support each other. Feel free to introduce yourself!'
);
