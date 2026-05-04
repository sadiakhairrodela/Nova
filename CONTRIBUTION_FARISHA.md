# Contribution — Farisha Hossain

**GitHub:** ackermaninbytes  
**Email:** farisha.hossain192@gmail.com  
**Branch:** `farisha-hossain`

---

## Modules Implemented

### Module 1.3 — Video Submission Queue for Assessors
Assessors can see and manage incoming submitted videos.
- Dashboard listing all submitted videos with baby ID, age, submission time, status
- Accept video to begin review
- Inline video player in the review panel

**Files:**
- `frontend/src/components/AdminDashboard.js`
- `backend/src/controllers/videoController.js` (getSubmittedVideos, getVideoDetails)
- `backend/src/routes/videoRoutes.js`

---

### Module 2.2 — Video Review Form
Assessors write structured reviews while watching videos.
- Inline video player + review form in one screen
- Fields: observation notes, quality score (1-10), risk flag (None/Low/High), follow-up recommendation
- Decision: Usable (Approve) or Not Usable (Reject)
- Email notification sent to caregiver on completion

**Files:**
- `frontend/src/components/AdminDashboard.js` (review panel)
- `backend/src/controllers/reviewController.js`
- `backend/src/routes/reviewRoutes.js`

---

### Module 2.3 — Expert Advice Desk
Caregivers submit structured queries to verified clinicians.
- Link query to a specific video submission
- Attach supporting files (referral note, PDF, image — max 10MB)
- Status tracking: Open, In Review, Responded, Closed
- Clinicians reply via threaded messages
- Full audit trail of all query activity

**Files:**
- `frontend/src/components/ExpertAdvicePage.js`
- `backend/src/controllers/expertAdviceController.js`
- `backend/src/routes/expertAdviceRoutes.js`

---

### Module 3.3 — Screening Reports with PDF Download
Clinicians generate downloadable screening reports per video review.
- Full report panel: reviewer notes, risk flag badge, recommended next steps
- One-click PDF download using jsPDF + jspdf-autotable
- PDF includes: baby info table, risk flag row, reviewer notes, recommended next steps
- PDF download automatically logged in the audit trail

**Files:**
- `frontend/src/components/ScreeningReport.js`
- `backend/src/controllers/reviewController.js` (logReportDownload)
- `backend/src/routes/reviewRoutes.js` (POST /api/reviews/log-download)

---

### Module 3.4 — Follow-up Task Manager
Clinicians set and manage follow-up tasks per baby.
- Task fields: title, description, due date, priority (low/medium/high), linked baby
- Status workflow: pending, in_progress, completed
- Filter tabs: All / Pending / In Progress / Completed / Overdue
- Overdue detection based on due date vs today

**Files:**
- `frontend/src/components/FollowUpManager.js`
- `backend/src/controllers/followUpController.js`
- `backend/src/routes/followUpRoutes.js`

---

## File Summary

### Frontend
| File | Module |
|---|---|
| `frontend/src/components/AdminDashboard.js` | 1.3, 2.2 |
| `frontend/src/components/ExpertAdvicePage.js` | 2.3 |
| `frontend/src/components/ScreeningReport.js` | 3.3 |
| `frontend/src/components/FollowUpManager.js` | 3.4 |

### Backend
| File | Module |
|---|---|
| `backend/src/controllers/reviewController.js` | 2.2, 3.3 |
| `backend/src/routes/reviewRoutes.js` | 2.2, 3.3 |
| `backend/src/controllers/expertAdviceController.js` | 2.3 |
| `backend/src/routes/expertAdviceRoutes.js` | 2.3 |
| `backend/src/controllers/followUpController.js` | 3.4 |
| `backend/src/routes/followUpRoutes.js` | 3.4 |
