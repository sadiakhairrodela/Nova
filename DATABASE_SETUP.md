# Database Setup Guide - RODELA Project

## Two Ways to Seed Data

### Option 1: Direct SQL Import (Recommended for Initial Setup)
**Best for:** First-time XAMPP setup

1. Open **phpMyAdmin** at `http://localhost/phpmyadmin`
2. Create a new database named `rodela_project` (if not exists)
3. Click **Import** tab
4. Upload `database.sql`
5. Click **Go**
✅ Done! Database is ready.

---

### Option 2: Node.js Seed Script (Recommended for Development)
**Best for:** Resetting data during testing

#### Prerequisites:
- Node.js installed
- Backend project initialized with npm
- MySQL running in XAMPP
- `.env` file with credentials

#### Setup:

1. **Install dependencies** (in your backend folder):
   ```bash
   npm install mysql2 dotenv
   ```

2. **Create `.env` file** in backend root:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=rodela_project
   ```

3. **Run seed script**:
   ```bash
   node seed.js
   ```

   Output will show:
   ```
   🌱 Starting database seed...
   🗑️  Clearing existing data...
   ✅ Data cleared

   👤 Inserting users...
   ✅ Inserted 5 users

   👶 Inserting babies...
   ✅ Inserted 6 babies

   🎥 Inserting videos...
   ✅ Inserted 25 videos

   📝 Inserting video reviews...
   ✅ Inserted 15 video reviews

   📊 Seed Complete!
   ```

#### Add to package.json (Optional):
```json
{
  "scripts": {
    "seed": "node seed.js"
  }
}
```

Then run: `npm run seed`

---

## Database Schema Overview

**Tables:**
- `users` → Caregivers & Admins (5 records)
- `babies` → Baby profiles (6 records)
- `videos` → Video submissions (25 records)
- `video_reviews` → Admin reviews (15 records)

**Status Types:**
- `draft` - Caregiver hasn't submitted yet
- `submitted` - Waiting for admin review
- `under_review` - Admin is reviewing
- `approved` - Passed quality check
- `rejected` - Needs resubmission

---

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Unknown database" | Run Option 1 first to create database |
| Connection refused | Make sure XAMPP MySQL is running |
| permission denied | Check `.env` credentials match XAMPP setup |
| Foreign key error | Ensure `babies` table exists before seeding |

---

Ready to build the backend? Let me know!
