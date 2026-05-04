const nodemailer = require('nodemailer');
const pool = require('../config/database');

// Create transporter from .env config
// Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM in backend/.env
// Example (Gmail): SMTP_HOST=smtp.gmail.com, SMTP_PORT=587, SMTP_USER=you@gmail.com, SMTP_PASS=app-password
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

// Send a single email (silently fails if SMTP not configured)
async function sendEmail(to, subject, html) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Email skipped — SMTP not configured] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    console.log(`[Email sent] To: ${to} | Subject: ${subject}`);
  } catch (err) {
    console.error(`[Email error] ${err.message}`);
  }
}

// Get a user's notification preferences
async function getPrefs(userId) {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.execute(
      'SELECT * FROM notification_preferences WHERE user_id = ?', [userId]
    );
    conn.release();
    return rows[0] || null;
  } catch { return null; }
}

// Insert an in-app notification and optionally send email
async function notify({ userId, userEmail, userName, type, title, message, emailSubject, emailHtml }) {
  // Save in-app notification
  try {
    const conn = await pool.getConnection();
    await conn.execute(
      'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
      [userId, type, title, message]
    );
    conn.release();
  } catch (err) {
    console.error('[Notification insert error]', err.message);
  }

  // Check preferences before sending email
  const prefs = await getPrefs(userId);
  const emailEnabled = prefs ? prefs.email_enabled : true;
  const eventEnabled = prefs ? (prefs[type] !== undefined ? prefs[type] : true) : true;

  if (emailEnabled && eventEnabled && userEmail) {
    const defaultHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#2563eb;padding:20px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">ddodle Baby Assessment System</h1>
        </div>
        <div style="padding:24px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:0 0 8px 8px">
          <p style="color:#111827">Hi ${userName || 'there'},</p>
          <p style="color:#374151">${message}</p>
          <p style="color:#6b7280;font-size:13px;margin-top:24px">
            You are receiving this because you have notifications enabled in ddodle.<br>
            Log in at <a href="http://localhost:3000">http://localhost:3000</a> to view details.
          </p>
        </div>
      </div>`;
    await sendEmail(userEmail, emailSubject || title, emailHtml || defaultHtml);
  }
}

// ── Event helpers ──────────────────────────────────────────────

exports.notifyVideoReceived = async ({ caregiverId, caregiverEmail, caregiverName, babyName }) => {
  await notify({
    userId: caregiverId, userEmail: caregiverEmail, userName: caregiverName,
    type: 'video_received',
    title: 'Video Received',
    message: `Your video for ${babyName} has been received and is awaiting review.`,
    emailSubject: `ddodle: Video received for ${babyName}`,
  });
};

exports.notifyReviewCompleted = async ({ caregiverId, caregiverEmail, caregiverName, babyName, status }) => {
  const label = status === 'approved' ? 'approved ✅' : 'marked for re-recording 🔄';
  await notify({
    userId: caregiverId, userEmail: caregiverEmail, userName: caregiverName,
    type: 'review_completed',
    title: 'Review Completed',
    message: `The video review for ${babyName} is complete. Your video has been ${label}.`,
    emailSubject: `ddodle: Review completed for ${babyName}`,
  });
};

exports.notifyReRecordRequested = async ({ caregiverId, caregiverEmail, caregiverName, babyName }) => {
  await notify({
    userId: caregiverId, userEmail: caregiverEmail, userName: caregiverName,
    type: 'rerecord_requested',
    title: 'Re-record Requested',
    message: `A re-recording has been requested for ${babyName}'s video. Please upload a new video.`,
    emailSubject: `ddodle: Re-record requested for ${babyName}`,
  });
};

exports.notifyFollowUpDue = async ({ caregiverId, caregiverEmail, caregiverName, babyName, taskTitle, dueDate }) => {
  await notify({
    userId: caregiverId, userEmail: caregiverEmail, userName: caregiverName,
    type: 'follow_up_due',
    title: 'Follow-up Due',
    message: `Reminder: "${taskTitle}" for ${babyName} is due on ${dueDate}.`,
    emailSubject: `ddodle: Follow-up due for ${babyName}`,
  });
};
