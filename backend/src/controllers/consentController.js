const pool = require('../config/database');

// GET /api/consent/:userId
exports.getConsent = async (req, res) => {
  const { userId } = req.params;
  try {
    const conn = await pool.getConnection();
    try {
      const [records] = await conn.query(
        'SELECT * FROM consent_records WHERE user_id = ?',
        [userId]
      );
      const [accessList] = await conn.query(`
        SELECT ca.id, ca.granted_to_id, ca.granted_at,
               u.name, u.email, u.role
        FROM consent_access ca
        JOIN users u ON ca.granted_to_id = u.id
        WHERE ca.user_id = ?
      `, [userId]);
      res.json({ consent: records[0] || null, accessList });
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/consent/give
exports.giveConsent = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId is required' });
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query(`
        INSERT INTO consent_records (user_id, consented, consented_at)
        VALUES (?, 1, NOW())
        ON DUPLICATE KEY UPDATE consented = 1, consented_at = NOW(), withdrawn_at = NULL
      `, [userId]);
      res.json({ success: true });
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/consent/withdraw
exports.withdrawConsent = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId is required' });
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'UPDATE consent_records SET consented = 0, withdrawn_at = NOW() WHERE user_id = ?',
        [userId]
      );
      res.json({ success: true });
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/consent/access/grant
exports.grantAccess = async (req, res) => {
  const { userId, grantedToEmail } = req.body;
  if (!userId || !grantedToEmail)
    return res.status(400).json({ message: 'userId and grantedToEmail are required' });
  try {
    const conn = await pool.getConnection();
    try {
      const [users] = await conn.query(
        'SELECT id, name FROM users WHERE email = ?', [grantedToEmail]
      );
      if (!users.length)
        return res.status(404).json({ message: 'No user found with that email' });
      const grantedToId = users[0].id;
      if (grantedToId === parseInt(userId))
        return res.status(400).json({ message: 'Cannot grant access to yourself' });
      await conn.query(
        'INSERT IGNORE INTO consent_access (user_id, granted_to_id) VALUES (?, ?)',
        [userId, grantedToId]
      );
      res.json({ success: true, grantedTo: users[0].name });
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/consent/access/revoke
exports.revokeAccess = async (req, res) => {
  const { userId, revokeFromId } = req.body;
  if (!userId || !revokeFromId)
    return res.status(400).json({ message: 'userId and revokeFromId are required' });
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'DELETE FROM consent_access WHERE user_id = ? AND granted_to_id = ?',
        [userId, revokeFromId]
      );
      res.json({ success: true });
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};
