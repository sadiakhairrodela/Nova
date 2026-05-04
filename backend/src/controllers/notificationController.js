const pool = require('../config/database');

// GET /api/notifications/:userId
exports.getNotifications = async (req, res) => {
  const { userId } = req.params;
  try {
    const conn = await pool.getConnection();
    try {
      const [notifications] = await conn.query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
        [userId]
      );
      const [[{ cnt }]] = await conn.query(
        'SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND is_read = 0',
        [userId]
      );
      res.json({ notifications, unreadCount: cnt });
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/notifications/read
exports.markRead = async (req, res) => {
  const { userId, notificationId } = req.body;
  try {
    const conn = await pool.getConnection();
    try {
      if (notificationId) {
        await conn.query(
          'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
          [notificationId, userId]
        );
      } else {
        await conn.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
      }
      res.json({ success: true });
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/notifications/prefs/:userId
exports.getPreferences = async (req, res) => {
  const { userId } = req.params;
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        'SELECT * FROM notification_preferences WHERE user_id = ?', [userId]
      );
      if (!rows.length) {
        await conn.query('INSERT INTO notification_preferences (user_id) VALUES (?)', [userId]);
        const [newRows] = await conn.query(
          'SELECT * FROM notification_preferences WHERE user_id = ?', [userId]
        );
        return res.json(newRows[0]);
      }
      res.json(rows[0]);
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/notifications/prefs
exports.updatePreferences = async (req, res) => {
  const { userId, email_enabled, sms_enabled, video_received,
          re_record_requested, review_completed, follow_up_due } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId is required' });
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query(`
        INSERT INTO notification_preferences
          (user_id, email_enabled, sms_enabled, video_received,
           re_record_requested, review_completed, follow_up_due)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          email_enabled       = VALUES(email_enabled),
          sms_enabled         = VALUES(sms_enabled),
          video_received      = VALUES(video_received),
          re_record_requested = VALUES(re_record_requested),
          review_completed    = VALUES(review_completed),
          follow_up_due       = VALUES(follow_up_due)
      `, [
        userId,
        email_enabled       ? 1 : 0,
        sms_enabled         ? 1 : 0,
        video_received      ? 1 : 0,
        re_record_requested ? 1 : 0,
        review_completed    ? 1 : 0,
        follow_up_due       ? 1 : 0
      ]);
      res.json({ success: true });
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};
