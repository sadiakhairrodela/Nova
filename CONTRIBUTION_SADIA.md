# Contribution — Sadia Khair Rodela

**GitHub:** sadiakhairrodela  
**Email:** sadia.khair.rodela@g.bracu.ac.bd  
**Branch:** `sadia-rodela`

---

## Modules Implemented

### Module 1.1 — Baby Profiles
Caregivers can create and manage profiles for each baby.
- Add details: name, birth date, gender, risk group, contact notes
- Auto-calculated age (months/years)
- Edit and delete support (delete blocked if baby has submitted videos)
- One caregiver account can manage multiple babies

**Files:**
- `frontend/src/components/BabyProfiles.js`
- `backend/src/controllers/videoController.js` (baby CRUD functions: `createBaby`, `updateBaby`, `deleteBaby`, `getBabies`)
- `backend/src/routes/videoRoutes.js` (routes: POST/PUT/DELETE /api/videos/babies)

---

### Module 1.2 — Community Space
Moderated community forum for caregivers.
- Create posts, ask questions, share experiences
- Comment and react (like / heart / support)
- Admin moderation (remove posts)

**Files:**
- `frontend/src/components/CommunityPage.js`
- `backend/src/controllers/communityController.js`
- `backend/src/routes/communityRoutes.js`

---

### Module 2.1 — Video Upload with Quality Check
Step-by-step guided video recording and upload.
- On-screen recording instructions (calm baby, full body, minimum length)
- Quality check before submission (rejects poor-quality videos)
- Re-record allowed if quality fails

**Files:**
- `frontend/src/components/VideoUploader.js`
- `backend/src/controllers/videoController.js` (upload functions: `createDraft`, `uploadChunk`, `submitVideo`)
- `backend/src/routes/videoRoutes.js`

---

### Module 3.1 — Chunked Upload with Retry
Reliable upload for slow/unstable connections.
- Video split into 1MB chunks in the browser
- Each chunk uploaded separately with progress bar
- Automatic retry: up to 3 attempts per chunk (1.5s / 3s / 4.5s backoff)
- Guarantees submission even on weak connections

**Files:**
- `frontend/src/components/VideoUploader.js` (chunking + retry logic)
- `backend/src/controllers/videoController.js` (chunk assembly)

---

### Module 3.2 — Video Timeline
Chronological view of all caregiver videos with status tracking.
- Status badges: Draft, Submitted, Under Review, Reviewed, Re-record Needed
- Inline HTML5 video player per card
- Replace video button for rejected/re-record-needed videos

**Files:**
- `frontend/src/components/VideoTimeline.js`
- `backend/src/controllers/videoController.js` (`getTimeline` function)
- `backend/src/routes/videoRoutes.js`

---

## File Summary

### Frontend
| File | Module |
|---|---|
| `frontend/src/components/BabyProfiles.js` | 1.1 |
| `frontend/src/components/CommunityPage.js` | 1.2 |
| `frontend/src/components/VideoUploader.js` | 2.1, 3.1 |
| `frontend/src/components/VideoTimeline.js` | 3.2 |

### Backend
| File | Module |
|---|---|
| `backend/src/controllers/videoController.js` | 1.1, 2.1, 3.1, 3.2 |
| `backend/src/routes/videoRoutes.js` | 1.1, 2.1, 3.1, 3.2 |
| `backend/src/controllers/communityController.js` | 1.2 |
| `backend/src/routes/communityRoutes.js` | 1.2 |
