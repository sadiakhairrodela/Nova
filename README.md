# ddodle — Baby Video Assessment System

A full-stack web platform for remote baby developmental video assessment, built as a university showcase project. Caregivers upload videos of their babies; clinicians/assessors review them and provide structured reports, follow-up tasks, and expert advice — all within a single secure platform.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [Database Schema](#4-database-schema)
5. [Feature Modules](#5-feature-modules)
6. [API Reference](#6-api-reference)
7. [How to Run](#7-how-to-run)
8. [Demo Credentials](#8-demo-credentials)
9. [File Structure](#9-file-structure)
10. [Known Issues and Notes](#10-known-issues--notes)

---

## 1. Project Overview

ddodle is a three-part system:

| Layer | Technology | Port |
|-------|-----------|------|
| Frontend (React app) | React 18 + Tailwind CSS | 3000 |
| Backend (REST API) | Node.js + Express | 5000 |
| AI Chatbot (Python) | FastAPI + Qwen2-0.5B | 8000 |
| Database | MySQL via XAMPP | 3306 |

**Two user roles:**
- **Caregiver** — parent/guardian who creates baby profiles, uploads assessment videos, receives results, and communicates with clinicians
- **Admin (Assessor/Clinician)** — reviews videos, writes reports, manages follow-up tasks, monitors audit logs

---

## 2. Tech Stack

### Frontend
- **React 18** with React Router v6 for client-side routing
- **Tailwind CSS** for all styling (no separate CSS files)
- **Axios** for HTTP requests to backend (proxied through localhost:5000)
- **jsPDF + jspdf-autotable** for PDF report generation in the browser
- **react-scripts** (Create React App)

### Backend
- **Node.js + Express** REST API
- **mysql2/promise** for async MySQL connection pooling (10 connections)
- **multer** for file uploads (video chunks, expert advice attachments)
- **nodemailer** for email notifications (SMTP, optional)
- **uuid** for generating unique video IDs during chunked upload

### AI Chatbot
- **FastAPI + uvicorn** as the Python web server
- **Qwen2-0.5B** (Alibaba) — local generative language model, fine-tuned on the ddodle Q&A dataset
- **sentence-transformers (all-MiniLM-L6-v2)** — embeds questions for dataset retrieval
- **FAISS (IndexFlatIP)** — vector similarity search over 200 Q&A pairs
- Architecture: the FAISS index retrieves top 3 relevant Q&A pairs, then Qwen2-0.5B generates a grounded natural-language answer from that context

### Database
- **MySQL** (XAMPP on Windows)
- Database name: ddodle_project
- 16 tables total (4 base tables + 12 added via database_additions.sql)

---

## 3. System Architecture

The frontend React app runs on port 3000. All /api/* requests are proxied to the backend on port 5000 (configured in frontend/package.json). The chatbot runs independently on port 8000 and is called directly from the frontend (not proxied).

**Backend route map:**

| Route prefix | Purpose |
|---|---|
| /api/auth | Login and user listing |
| /api/videos | Baby profiles, chunked upload, timeline |
| /api/reviews | Video review, screening reports |
| /api/community | Posts, comments, reactions |
| /api/consent | Consent records, access grants |
| /api/advice | Expert queries, clinician replies |
| /api/notifications | In-app alerts, preferences |
| /api/followup | Follow-up tasks |
| /api/audit | Audit log entries |
| /api/deletion | Data deletion requests |

**Video upload flow (chunked):**
1. Frontend splits video file into 1MB chunks
2. Sends POST /api/videos/draft to create a placeholder row in the DB
3. Sends each chunk to POST /api/videos/upload-chunk (with automatic retry — up to 3 attempts per chunk with 1.5s / 3s / 4.5s backoff)
4. After all chunks sent: PUT /api/videos/submit/:videoId
5. Backend assembles chunks, saves the final .mp4 file, updates file_path in DB

---

## 4. Database Schema

### Base tables (database.sql)

| Table | Purpose |
|---|---|
| users | Both caregivers and admins. Role column: caregiver or admin |
| babies | Baby profiles linked to a caregiver user_id |
| videos | Uploaded videos. Status: draft, submitted, under_review, approved, rejected |
| video_reviews | Review form results: notes, quality score, risk_flag, follow_up_recommendation |

### Additional tables (database_additions.sql)

| Table | Module | Purpose |
|---|---|---|
| community_posts | 1.2 | Forum posts |
| community_comments | 1.2 | Comments on posts |
| community_reactions | 1.2 | Like / heart / support reactions |
| consent_records | 1.4 | Whether caregiver has accepted the privacy policy |
| consent_access | 1.4 | Which assessors/doctors the caregiver has granted access to |
| expert_queries | 2.3 | Caregiver questions submitted to clinicians |
| expert_replies | 2.3 | Clinician threaded replies |
| notifications | 2.4 | In-app notification messages |
| notification_preferences | 2.4 | Per-user email on/off settings |
| follow_up_tasks | 3.4 | Tasks linked to babies with due dates |
| audit_logs | 3.5 | Who did what to which resource and when |
| deletion_requests | 3.6 | Formal caregiver data deletion requests |

### Key relationships

- users has many babies
- babies has many videos
- videos has one video_review
- users has many community_posts
- community_posts has many community_comments
- users has one consent_record
- users has many consent_access grants
- expert_queries optionally links to a video
- babies has many follow_up_tasks
- users has many audit_log entries

---

## 5. Feature Modules

### Module 1 — Caregiver Core

**1.1 Baby Profiles (/babies)**
Caregivers create and manage profiles for each baby. Fields: name, birth date, gender, risk group (standard / low / moderate / high), notes. One account can hold multiple babies. Age is auto-calculated from birth date. Edit and delete supported (delete is blocked if the baby has submitted videos on record).

**1.2 Community Space (/community)**
Caregivers post questions and share experiences. Others can comment and react with like, heart, or support. Admins can remove posts.

**1.3 Video Submission Queue (admin home /)**
Admin dashboard shows all submitted videos in a queue with baby name, age, submission time, and status. Admin clicks a video to open the inline review panel with a video player.

**1.4 Digital Consent (/consent)**
Caregivers must accept the privacy policy before any data is reviewed. They can grant or revoke access to specific assessors or doctors at any time. Consent status is saved per user.

### Module 2 — Assessment Workflow

**2.1 Video Upload (caregiver home /)**
Step-by-step recording instructions are shown on screen. The system checks video quality before submission (baby calm, full body visible, minimum length). Upload happens in chunks with a progress bar. If any chunk fails, it retries up to 3 times with exponential backoff.

**2.2 Video Review Form (admin)**
Admin watches the uploaded video inline in the review panel. Fills in observation notes, risk flag (None / Low / High), follow-up recommendation, and a quality score 1-10. Clicks Usable (Approve) or Not Usable (Reject). Email notification is sent to the caregiver on completion if SMTP is configured.

**2.3 Expert Advice Desk (/advice)**
Caregivers submit structured queries to clinicians. The form allows linking the query to a specific video case and attaching a file (PDF / image, max 10MB). Query status tracks: Open, In Review, Responded, Closed. Clinicians reply with threaded messages. An audit trail is maintained for all activity.

**2.4 Notification Center (/notifications)**
In-app notification list for all platform events. Triggered automatically on: video received, review completed, re-record requested, follow-up due. Caregivers can toggle email notifications on/off per event type.

### Module 3 — Advanced Features

**3.1 Chunked Upload with Retry**
The video file is split into 1MB chunks in the browser. Each chunk is uploaded separately and can be individually retried on failure (3 attempts, backoff: 1.5s, 3s, 4.5s). A progress bar shows percentage complete. This allows reliable upload even on slow or unstable connections.

**3.2 Video Timeline (/timeline)**
Shows all of a caregiver's videos chronologically with status badges: Draft, Submitted, Under Review, Reviewed, Re-record Needed. Each card has a Play Video toggle that opens an inline HTML5 video player. Rejected cards show an Upload Replacement Video button.

**3.3 Screening Reports (/reports — admin only)**
Lists all reviewed videos. Clicking any video shows a full detail panel with reviewer notes, risk flag badge (red/yellow/green), and recommended next steps. The Download PDF button generates a formatted PDF document containing: baby info, review details table with risk flag, reviewer notes section, and recommended next steps section. PDF downloads are automatically logged in the audit trail.

**3.4 Follow-up Task Manager (/followup — admin only)**
Admins create tasks linked to babies with title, description, due date, and priority. Status workflow: pending, in_progress, completed. Tasks past their due date appear in the Overdue tab. Filter tabs: All / Pending / In Progress / Completed / Overdue.

**3.5 Audit Log Dashboard (/audit — admin only)**
Records every key action automatically: view, approve, reject, download, create, delete. Written by the backend at the point of the action. Each entry shows: user, action, resource type, resource ID, timestamp, IP address. Filterable by date range and action type.

**3.6 Data Retention and Delete (/privacy)**
Caregivers submit a formal deletion request with a reason. Admins review requests and can approve (purge all data) or reject. The system blocks deletion of babies who have submitted videos on medical record. Audit logs are preserved even after account deletion.

**3.7 AI Chatbot (floating button, bottom-right, caregiver only)**
A floating chat widget powered by a fine-tuned local language model.

Model: Qwen2-0.5B (Alibaba) fine-tuned for 5 epochs on 200 ddodle-specific Q&A pairs.

How it works:
1. User types a question
2. MiniLM embeds the question and FAISS finds the top 3 most similar Q&A pairs from the knowledge base
3. Those 3 pairs are passed as context in a ChatML-formatted prompt to Qwen2-0.5B
4. Qwen generates a natural-language answer grounded in that context

Topics: video recording, upload, status meanings, baby profiles, consent, notifications, expert advice, community, privacy, troubleshooting.

The chatbot is non-diagnostic. It deflects medical questions with a safety disclaimer and redirects to the Expert Advice Desk for anything outside its knowledge base.

Fine-tuning results:
- Epoch 1: loss 1.946
- Epoch 2: loss 0.790
- Epoch 3: loss 0.282
- Epoch 4: loss 0.078
- Epoch 5: loss 0.019 (converged)

---

## 6. API Reference

### Auth

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | /api/auth/login | { email } | Login. Returns user object |
| GET | /api/auth/users | — | List all users (demo selector) |

### Videos and Babies

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/videos/babies/:caregiverId | All babies for a caregiver |
| POST | /api/videos/babies | Create baby profile |
| PUT | /api/videos/babies/:babyId | Update baby profile |
| DELETE | /api/videos/babies/:babyId | Delete baby profile |
| POST | /api/videos/draft | Create draft video record |
| POST | /api/videos/upload-chunk | Upload one chunk (multipart) |
| PUT | /api/videos/submit/:videoId | Mark video as submitted |
| GET | /api/videos/timeline/:babyId | Video timeline for a baby |
| GET | /api/videos/details/:videoId | Full video + review info |
| GET | /api/videos/submitted | All submitted videos (admin queue) |

### Reviews

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/reviews/submit/:videoId | Submit a review |
| GET | /api/reviews/all | All reviewed videos |
| GET | /api/reviews/stats/overview | Review statistics |
| POST | /api/reviews/log-download | Log PDF download in audit trail |
| GET | /api/reviews/:videoId | Reviews for a specific video |

### Chatbot

| Method | Endpoint | Description |
|---|---|---|
| POST | http://localhost:8000/chat | { question } — returns answer, category, confidence |
| GET | http://localhost:8000/health | Model info, index size, device |

---

## 7. How to Run

### Prerequisites
- Node.js v18 or higher
- Python 3.10 or higher
- XAMPP with MySQL (or any MySQL 8 server)
- npm and pip installed

### Step 1 — Database setup
1. Start XAMPP Control Panel and click Start next to MySQL
2. Open phpMyAdmin at http://localhost/phpmyadmin
3. Create a database called ddodle_project
4. Import database.sql first
5. Import database_additions.sql second
6. Run the seeder from the project root: node seed.js

### Step 2 — Backend
```
cd backend
npm install
npm start
```
Runs on http://localhost:5000

Create backend/.env with:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ddodle_project
DB_PORT=3306
PORT=5000
CORS_ORIGIN=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

### Step 3 — Frontend
```
cd frontend
npm install
npm start
```
Runs on http://localhost:3000

### Step 4 — Chatbot
```
cd chatbot
pip install -r requirements.txt
python app.py
```
Runs on http://localhost:8000. The first run downloads Qwen2-0.5B weights (~1GB). Subsequent starts are instant (cached in ~/.cache/huggingface). The fine-tuned model is already saved in chatbot/finetuned_model/ and will be loaded automatically.

To re-run fine-tuning:
```
cd chatbot
python finetune.py
```

---

## 8. Demo Credentials

| Role | Email | Password |
|---|---|---|
| Caregiver | maria.garcia@email.com | password123 |
| Admin | dr.patel@ddodle.local | adminpass123 |

Note: The Login page is a demo user selector — it lists all users in the database and lets you click any one to log in. There is no real password hashing for this showcase.

---

## 9. File Structure

```
rodela_project/
├── database.sql                 Base schema (4 tables)
├── database_additions.sql       Additional 12 tables
├── rag_dataset.json             200 Q&A pairs for chatbot
├── seed.js                      Demo data seeder
│
├── backend/
│   ├── src/
│   │   ├── server.js            Express app entry point
│   │   ├── config/database.js   MySQL connection pool
│   │   ├── controllers/         Business logic per feature
│   │   │   ├── videoController.js
│   │   │   ├── reviewController.js
│   │   │   ├── communityController.js
│   │   │   ├── consentController.js
│   │   │   ├── expertAdviceController.js
│   │   │   ├── notificationController.js
│   │   │   ├── followUpController.js
│   │   │   ├── auditController.js
│   │   │   └── deletionController.js
│   │   ├── routes/              Express route definitions
│   │   └── services/
│   │       ├── emailService.js  nodemailer sending
│   │       └── auditService.js  Audit log write helper
│   └── uploads/
│       ├── videos/              Final assembled video files
│       ├── chunks/              Temporary chunk files
│       └── attachments/         Expert advice attachments
│
├── frontend/
│   └── src/
│       ├── App.js               Routes + role-based navigation
│       ├── context/UserContext.js  Global logged-in user state
│       └── components/
│           ├── Login.js             Demo login selector
│           ├── Header.js            Navigation bar
│           ├── BabyProfiles.js      Module 1.1
│           ├── CommunityPage.js     Module 1.2
│           ├── AdminDashboard.js    Modules 1.3 + 2.2
│           ├── ConsentPage.js       Module 1.4
│           ├── VideoUploader.js     Modules 2.1 + 3.1
│           ├── ExpertAdvicePage.js  Module 2.3
│           ├── NotificationCenter.js  Module 2.4
│           ├── VideoTimeline.js     Module 3.2
│           ├── ScreeningReport.js   Module 3.3
│           ├── FollowUpManager.js   Module 3.4
│           ├── AuditLog.js          Module 3.5
│           ├── DataRetention.js     Module 3.6
│           └── Chatbot.js           Module 3.7
│
└── chatbot/
    ├── app.py                   FastAPI chatbot server
    ├── finetune.py              SFT fine-tuning script
    ├── requirements.txt         Python dependencies
    └── finetuned_model/         Saved fine-tuned Qwen2-0.5B weights
```

---

## 10. Known Issues and Notes

**MySQL ECONNREFUSED**
The most common startup error. It means MySQL is not running. Fix: Open XAMPP Control Panel and click Start next to MySQL, then restart the backend with npm start.

**Video file_path mismatch**
When a video draft is created, a UUID-based path is stored temporarily. After chunk assembly, the backend automatically updates file_path to the correct filename (e.g. 26.mp4). This happens in the background and requires no manual action.

**Chatbot response speed**
Qwen2-0.5B takes 3–8 seconds per response on CPU. If a CUDA GPU is available, the model uses it automatically and responds in under 2 seconds. Check http://localhost:8000/health to see which device is being used.

**Email notifications**
Nodemailer is fully wired up but emails only send if SMTP_USER and SMTP_PASS are set in backend/.env. Without those, in-app notifications still work correctly — emails are silently skipped.

**Login system**
This is a demo platform. Login uses a user-picker, not real authentication. There is no password hashing or JWT. This is intentional for university showcase purposes.

**re_record_needed vs rejected**
These two statuses are treated the same way in the UI. Both show the Replace Video button on the timeline. In the database the review_status column (on video_reviews) and the videos.status column are updated separately.

---

*ddodle — Baby Video Assessment Platform. Built for university showcase.*
