const pool = require('../config/database');

// GET /api/deletion  (admin — all requests)
exports.getRequests = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(`
        SELECT dr.*,
               u.name  AS user_name,
               u.email AS user_email,
               a.name  AS reviewed_by_name
        FROM deletion_requests dr
        JOIN  users u ON dr.user_id     = u.id
        LEFT JOIN users a ON dr.reviewed_by = a.id
        ORDER BY dr.created_at DESC
      `);
      res.json(rows);
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/deletion/user/:userId  (caregiver — own requests)
exports.getUserRequests = async (req, res) => {
  const { userId } = req.params;
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        'SELECT * FROM deletion_requests WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      res.json(rows);
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/deletion
exports.submitRequest = async (req, res) => {
  const { userId, reason } = req.body;
  if (!userId || !reason)
    return res.status(400).json({ message: 'userId and reason are required' });
  try {
    const conn = await pool.getConnection();
    try {
      const [r] = await conn.query(
        'INSERT INTO deletion_requests (user_id, reason) VALUES (?, ?)',
        [userId, reason]
      );
      res.json({ success: true, requestId: r.insertId });
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/deletion/:id  (admin)
exports.updateRequest = async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes, reviewedBy } = req.body;
  const valid = ['pending', 'approved', 'rejected', 'purged'];
  if (!valid.includes(status))
    return res.status(400).json({ message: 'Invalid status' });
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'UPDATE deletion_requests SET status = ?, admin_notes = ?, reviewed_by = ? WHERE id = ?',
        [status, adminNotes || null, reviewedBy || null, id]
      );
      res.json({ success: true });
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};
