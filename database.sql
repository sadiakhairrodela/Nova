-- ============================================================
-- ddodle PROJECT - BABY VIDEO ASSESSMENT SYSTEM
-- Database for University Showcase (Simplified MVP)
-- ============================================================

-- Create Database
CREATE DATABASE IF NOT EXISTS ddodle_project;
USE ddodle_project;

-- ============================================================
-- TABLE: USERS (Caregivers and Admins)
-- ============================================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role ENUM('caregiver', 'admin') NOT NULL DEFAULT 'caregiver',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: BABIES (Baby profiles created by caregivers)
-- ============================================================
CREATE TABLE babies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  birth_date DATE NOT NULL,
  gender ENUM('male', 'female', 'other') DEFAULT 'other',
  risk_group VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: VIDEOS (Uploaded videos for assessment)
-- ============================================================
CREATE TABLE videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  baby_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  duration_seconds INT,
  status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected') DEFAULT 'draft',
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_date DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (baby_id) REFERENCES babies(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_baby_id (baby_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: VIDEO_REVIEWS (Admin/Assessor reviews)
-- ============================================================
CREATE TABLE video_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  video_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  review_status ENUM('approved', 'rejected', 'pending_revision') DEFAULT 'pending_revision',
  reviewer_notes TEXT,
  quality_score INT DEFAULT 0,
  reviewed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE KEY unique_video_review (video_id, reviewer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SAMPLE DATA: USERS
-- ============================================================
INSERT INTO users (name, email, phone, role) VALUES
('Admin Dashboard', 'admin@ddodle.local', '+1-555-0100', 'admin'),
('Sarah Johnson', 'sarah.johnson@email.com', '+1-555-0101', 'caregiver'),
('Maria Garcia', 'maria.garcia@email.com', '+1-555-0102', 'caregiver'),
('Emily Chen', 'emily.chen@email.com', '+1-555-0103', 'caregiver'),
('Dr. Priya Patel', 'dr.patel@ddodle.local', '+1-555-0110', 'admin');

-- ============================================================
-- SAMPLE DATA: BABIES
-- ============================================================
INSERT INTO babies (user_id, name, birth_date, gender, risk_group, notes) VALUES
(2, 'Liam Johnson', '2025-10-15', 'male', 'low-risk', 'Healthy baby, routine checkup'),
(2, 'Sophia Johnson', '2025-08-22', 'female', 'low-risk', 'Born via normal delivery'),
(3, 'Lucas Garcia', '2025-11-01', 'male', 'moderate-risk', 'Premature birth at 36 weeks'),
(3, 'Isabella Garcia', '2025-06-30', 'female', 'low-risk', 'Twin baby, healthy'),
(4, 'Noah Chen', '2025-09-18', 'male', 'moderate-risk', 'Low birth weight - needs monitoring'),
(4, 'Olivia Chen', '2025-07-12', 'female', 'low-risk', 'Healthy development');

-- ============================================================
-- SAMPLE DATA: VIDEOS (3-10 videos per baby)
-- ============================================================
-- Baby 1: Liam Johnson (4 videos)
INSERT INTO videos (baby_id, file_name, file_path, file_size, duration_seconds, status, submitted_date) VALUES
(1, 'liam_assessment_001.mp4', '/uploads/videos/baby_1/liam_assessment_001.mp4', 52428800, 180, 'approved', '2026-04-01 10:30:00'),
(1, 'liam_exercise_routine.mp4', '/uploads/videos/baby_1/liam_exercise_routine.mp4', 45875200, 160, 'approved', '2026-04-02 14:15:00'),
(1, 'liam_developmental_check.mp4', '/uploads/videos/baby_1/liam_developmental_check.mp4', 61865984, 210, 'under_review', '2026-04-05 09:45:00'),
(1, 'liam_followup_002.mp4', '/uploads/videos/baby_1/liam_followup_002.mp4', 48234496, 175, 'submitted', '2026-04-06 11:20:00');

-- Baby 2: Sophia Johnson (3 videos)
INSERT INTO videos (baby_id, file_name, file_path, file_size, duration_seconds, status, submitted_date) VALUES
(2, 'sophia_initial_screening.mp4', '/uploads/videos/baby_2/sophia_initial_screening.mp4', 39845888, 145, 'approved', '2026-03-28 13:00:00'),
(2, 'sophia_posture_check.mp4', '/uploads/videos/baby_2/sophia_posture_check.mp4', 55738368, 195, 'rejected', '2026-04-03 15:30:00'),
(2, 'sophia_resubmission.mp4', '/uploads/videos/baby_2/sophia_resubmission.mp4', 57671680, 205, 'submitted', '2026-04-04 10:00:00');

-- Baby 3: Lucas Garcia (5 videos)
INSERT INTO videos (baby_id, file_name, file_path, file_size, duration_seconds, status, submitted_date) VALUES
(3, 'lucas_premature_eval_001.mp4', '/uploads/videos/baby_3/lucas_premature_eval_001.mp4', 64487424, 225, 'approved', '2026-03-25 16:45:00'),
(3, 'lucas_motor_skills_test.mp4', '/uploads/videos/baby_3/lucas_motor_skills_test.mp4', 71827456, 250, 'approved', '2026-04-01 08:15:00'),
(3, 'lucas_feeding_assessment.mp4', '/uploads/videos/baby_3/lucas_feeding_assessment.mp4', 48775168, 170, 'under_review', '2026-04-05 12:30:00'),
(3, 'lucas_interaction_test.mp4', '/uploads/videos/baby_3/lucas_interaction_test.mp4', 52526976, 185, 'submitted', '2026-04-06 14:00:00'),
(3, 'lucas_followup_checkup.mp4', '/uploads/videos/baby_3/lucas_followup_checkup.mp4', 61619200, 215, 'draft', NULL);

-- Baby 4: Isabella Garcia (4 videos)
INSERT INTO videos (baby_id, file_name, file_path, file_size, duration_seconds, status, submitted_date) VALUES
(4, 'isabella_twin_screening.mp4', '/uploads/videos/baby_4/isabella_twin_screening.mp4', 50331648, 180, 'approved', '2026-03-30 11:00:00'),
(4, 'isabella_reflex_check.mp4', '/uploads/videos/baby_4/isabella_reflex_check.mp4', 45875200, 165, 'approved', '2026-04-02 09:30:00'),
(4, 'isabella_milestone_eval.mp4', '/uploads/videos/baby_4/isabella_milestone_eval.mp4', 53477376, 190, 'under_review', '2026-04-05 10:15:00'),
(4, 'isabella_routine_check.mp4', '/uploads/videos/baby_4/isabella_routine_check.mp4', 56623104, 200, 'submitted', '2026-04-06 16:45:00');

-- Baby 5: Noah Chen (6 videos - more monitoring due to low birth weight)
INSERT INTO videos (baby_id, file_name, file_path, file_size, duration_seconds, status, submitted_date) VALUES
(5, 'noah_lwbw_monitoring_001.mp4', '/uploads/videos/baby_5/noah_lwbw_monitoring_001.mp4', 58720256, 205, 'approved', '2026-03-22 14:20:00'),
(5, 'noah_growth_assessment.mp4', '/uploads/videos/baby_5/noah_growth_assessment.mp4', 62685184, 220, 'approved', '2026-04-01 13:45:00'),
(5, 'noah_nutrition_review.mp4', '/uploads/videos/baby_5/noah_nutrition_review.mp4', 55050240, 195, 'under_review', '2026-04-04 15:10:00'),
(5, 'noah_muscle_tone_test.mp4', '/uploads/videos/baby_5/noah_muscle_tone_test.mp4', 51380224, 180, 'submitted', '2026-04-06 10:30:00'),
(5, 'noah_weekly_update.mp4', '/uploads/videos/baby_5/noah_weekly_update.mp4', 47185920, 170, 'draft', NULL),
(5, 'noah_followup_intensive.mp4', '/uploads/videos/baby_5/noah_followup_intensive.mp4', 63441920, 225, 'submitted', '2026-04-06 17:00:00');

-- Baby 6: Olivia Chen (3 videos)
INSERT INTO videos (baby_id, file_name, file_path, file_size, duration_seconds, status, submitted_date) VALUES
(6, 'olivia_routine_assessment.mp4', '/uploads/videos/baby_6/olivia_routine_assessment.mp4', 49283072, 175, 'approved', '2026-03-31 12:00:00'),
(6, 'olivia_development_check.mp4', '/uploads/videos/baby_6/olivia_development_check.mp4', 54525952, 195, 'under_review', '2026-04-05 14:30:00'),
(6, 'olivia_behavioral_obs.mp4', '/uploads/videos/baby_6/olivia_behavioral_obs.mp4', 52428800, 185, 'submitted', '2026-04-06 15:15:00');

-- ============================================================
-- SAMPLE DATA: VIDEO_REVIEWS
-- ============================================================
INSERT INTO video_reviews (video_id, reviewer_id, review_status, reviewer_notes, quality_score, reviewed_at) VALUES
(1, 1, 'approved', 'Good video quality. Baby is calm and well-positioned. Entire body visible. Duration sufficient for assessment. Clear lighting and audio. Ready for clinical review.', 85, '2026-04-01 11:30:00'),
(2, 1, 'approved', 'Excellent quality submission. Baby demonstrates good posture and control. All required angles captured. Recommended for case file.', 90, '2026-04-02 15:15:00'),
(4, 1, 'approved', 'Quality meets standards. Baby properly clothed and positioned. Good lighting throughout.', 82, '2026-04-03 09:00:00'),
(5, 1, 'approved', 'Good initial screening video. Baby alert and responsive. Proper setup. Approved for assessment queue.', 80, '2026-03-29 10:30:00'),
(6, 5, 'rejected', 'VIDEO QUALITY ISSUES: Baby partially out of frame in several sections. Insufficient lighting. Background too cluttered. Please re-record with better positioning and lighting.', 45, '2026-04-03 16:20:00'),
(7, 1, 'approved', 'Successfully addresses previous quality concerns. Clear, well-lit recording. Baby properly positioned throughout. Excellent resubmission.', 88, '2026-04-04 11:45:00'),
(8, 1, 'approved', 'Strong quality. Premature infant assessment. Good muscle tone observation. Clear developmental markers visible.', 87, '2026-04-02 09:30:00'),
(9, 1, 'approved', 'Comprehensive motor skills assessment. Good quality capture. Baby demonstrates age-appropriate movements.', 84, '2026-04-02 14:15:00'),
(11, 1, 'approved', 'Interaction test well-documented. Clear baby responses captured. Quality sufficient for developmental tracking.', 81, '2026-04-03 13:00:00'),
(12, 1, 'approved', 'Twin screening excellent. Both babies visible and properly assessed. Good comparative data.', 86, '2026-04-03 10:45:00'),
(13, 1, 'approved', 'Reflex checks clearly documented. Good positioning. Professional setup.', 83, '2026-04-03 15:30:00'),
(15, 1, 'approved', 'Low birth weight infant monitored closely. Good clinical detail. Muscle development visible. Approved for case tracking.', 85, '2026-03-23 15:00:00'),
(16, 1, 'approved', 'Growth assessment comprehensive. Quality metrics excellent. Professional execution.', 88, '2026-04-02 14:30:00'),
(18, 1, 'approved', 'High-risk infant monitoring adequate. Good visual documentation of development. Approved for continued surveillance.', 80, '2026-04-03 16:00:00'),
(19, 1, 'approved', 'Routine assessment, healthy development evident. Standard quality met. Case approved.', 79, '2026-04-01 13:15:00');

-- ============================================================
-- SUMMARY STATISTICS (for reference)
-- ============================================================
-- Total Users: 5 (1 admin + 4 caregivers + 1 senior admin)
-- Total Babies: 6
-- Total Videos: 25 (Approved: 13, Under Review: 5, Submitted: 5, Rejected: 1, Draft: 1)
-- Avg Video Size: ~52.2 MB
-- Avg Video Duration: ~190 seconds (3+ minutes)
-- ============================================================

-- Create indexes for better performance
CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_baby_user_id ON babies(user_id);
CREATE INDEX idx_video_baby_id ON videos(baby_id);
CREATE INDEX idx_video_status ON videos(status);
CREATE INDEX idx_review_video_id ON video_reviews(video_id);
CREATE INDEX idx_review_reviewer_id ON video_reviews(reviewer_id);
CREATE INDEX idx_review_status ON video_reviews(review_status);

-- ============================================================
-- Database ready for MERN stack application
-- Import this SQL into your XAMPP MySQL database
-- ============================================================
