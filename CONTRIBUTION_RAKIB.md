# Contribution — Rakib Hossain

**GitHub:** Prantprant  
**Email:** rakib.hossain1@g.bracu.ac.bd  
**Branch:** `rakib-hossain`

---

## Modules Implemented

### Module 1.4 — Digital Consent & Data-Sharing Workflow
Caregivers must agree to privacy rules before any data is reviewed.
- Privacy policy acceptance screen
- Grant or revoke access to specific assessors/doctors
- Consent status tracked per user and enforced on review access

**Files:**
- `frontend/src/components/ConsentPage.js`
- `backend/src/controllers/consentController.js`
- `backend/src/routes/consentRoutes.js`

---

### Module 2.4 — Notification Center
Users manage notification preferences and receive automatic alerts.
- In-app notification list for all platform events
- Auto-triggered on: video received, review completed, re-record requested, follow-up due
- Per-user toggle: email notifications on/off per event type
- Email sending via nodemailer (SMTP)

**Files:**
- `frontend/src/components/NotificationCenter.js`
- `backend/src/controllers/notificationController.js`
- `backend/src/routes/notificationRoutes.js`
- `backend/src/services/emailService.js`

---

### Module 3.5 — Audit Log Dashboard
Records every key action across the platform, visible to admins only.
- Logs: view, approve, reject, download, create, delete
- Written automatically by the backend at point of action
- Each entry: user, action, resource type, resource ID, timestamp, IP address
- Filterable by date range and action type

**Files:**
- `frontend/src/components/AuditLog.js`
- `backend/src/controllers/auditController.js`
- `backend/src/routes/auditRoutes.js`
- `backend/src/services/auditService.js`

---

### Module 3.6 — Data Retention & Delete Request Workflow
Caregivers can formally request deletion of their data.
- Caregiver submits deletion request with reason
- Admin reviews: approve (purge all data) or reject
- System blocks deletion of babies with submitted videos on medical record
- Audit logs preserved after account deletion

**Files:**
- `frontend/src/components/DataRetention.js`
- `backend/src/controllers/deletionController.js`
- `backend/src/routes/deletionRoutes.js`

---

### Module 3.7 — AI-Assisted Support Chatbot
Local fine-tuned language model providing guided support to caregivers.
- Floating chat widget (caregiver-only, bottom-right corner)
- Powered by Qwen2-0.5B fine-tuned on 200 ddodle-specific Q&A pairs
- FAISS retrieval: top 3 relevant Q&A pairs used as context for generation
- Topics: recording tips, upload help, status meanings, consent, notifications, expert advice
- Non-diagnostic with clear safety disclaimers
- Fine-tuning result: 5 epochs, final loss 0.019 (fully converged)

**Files:**
- `frontend/src/components/Chatbot.js`
- `chatbot/app.py`
- `chatbot/finetune.py`
- `chatbot/requirements.txt`
- `rag_dataset.json`

---

## File Summary

### Frontend
| File | Module |
|---|---|
| `frontend/src/components/ConsentPage.js` | 1.4 |
| `frontend/src/components/NotificationCenter.js` | 2.4 |
| `frontend/src/components/AuditLog.js` | 3.5 |
| `frontend/src/components/DataRetention.js` | 3.6 |
| `frontend/src/components/Chatbot.js` | 3.7 |

### Backend
| File | Module |
|---|---|
| `backend/src/controllers/consentController.js` | 1.4 |
| `backend/src/routes/consentRoutes.js` | 1.4 |
| `backend/src/controllers/notificationController.js` | 2.4 |
| `backend/src/routes/notificationRoutes.js` | 2.4 |
| `backend/src/services/emailService.js` | 2.4 |
| `backend/src/controllers/auditController.js` | 3.5 |
| `backend/src/routes/auditRoutes.js` | 3.5 |
| `backend/src/services/auditService.js` | 3.5 |
| `backend/src/controllers/deletionController.js` | 3.6 |
| `backend/src/routes/deletionRoutes.js` | 3.6 |

### Chatbot (Python)
| File | Module |
|---|---|
| `chatbot/app.py` | 3.7 |
| `chatbot/finetune.py` | 3.7 |
| `chatbot/requirements.txt` | 3.7 |
| `rag_dataset.json` | 3.7 |
