const pool = require('../config/database');

// GET /api/advice/queries?userId=&role=
exports.getQueries = async (req, res) => {
  const { userId, role } = req.query;
  try {
    const conn = await pool.getConnection();
    try {
      const base = `
        SELECT eq.*,
               u.name AS caregiver_name,
               c.name AS clinician_name,
               v.file_name AS video_name,
               (SELECT COUNT(*) FROM expert_replies er WHERE er.query_id = eq.id) AS reply_count
        FROM expert_queries eq
        JOIN  users u ON eq.caregiver_id = u.id
        LEFT JOIN users c ON eq.clinician_id = c.id
        LEFT JOIN videos v ON eq.video_id  = v.id
      `;
      let rows;
      if (role === 'admin') {
        [rows] = await conn.query(base + ' ORDER BY eq.created_at DESC');
      } else {
        [rows] = await conn.query(
          base + ' WHERE eq.caregiver_id = ? ORDER BY eq.created_at DESC',
          [userId]
        );
      }
      res.json(rows);
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/advice/queries
exports.createQuery = async (req, res) => {
  const { caregiverId, subject, content, videoId } = req.body;
  if (!caregiverId || !subject || !content)
    return res.status(400).json({ message: 'caregiverId, subject and content are required' });
  const attachmentPath = req.file ? `/uploads/attachments/${req.file.filename}` : null;
  try {
    const conn = await pool.getConnection();
    try {
      const [r] = await conn.query(
        'INSERT INTO expert_queries (caregiver_id, subject, content, video_id, attachment_path) VALUES (?, ?, ?, ?, ?)',
        [caregiverId, subject, content, videoId || null, attachmentPath]
      );
      res.json({ success: true, queryId: r.insertId });
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/advice/queries/:queryId/replies
exports.getReplies = async (req, res) => {
  const { queryId } = req.params;
  try {
    const conn = await pool.getConnection();
    try {
      const [replies] = await conn.query(`
        SELECT er.*, u.name AS author_name, u.role AS author_role
        FROM expert_replies er
        JOIN users u ON er.user_id = u.id
        WHERE er.query_id = ?
        ORDER BY er.created_at ASC
      `, [queryId]);
      res.json(replies);
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/advice/queries/:queryId/replies
exports.addReply = async (req, res) => {
  const { queryId } = req.params;
  const { userId, content } = req.body;
  if (!userId || !content)
    return res.status(400).json({ message: 'userId and content are required' });
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'INSERT INTO expert_replies (query_id, user_id, content) VALUES (?, ?, ?)',
        [queryId, userId, content]
      );
      const [userRow] = await conn.query('SELECT role FROM users WHERE id = ?', [userId]);
      const newStatus = userRow[0]?.role === 'admin' ? 'responded' : 'in_review';
      await conn.query('UPDATE expert_queries SET status = ? WHERE id = ?', [newStatus, queryId]);
      res.json({ success: true });
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/advice/queries/:queryId/status
exports.updateStatus = async (req, res) => {
  const { queryId } = req.params;
  const { status } = req.body;
  const valid = ['open', 'in_review', 'responded', 'closed'];
  if (!valid.includes(status))
    return res.status(400).json({ message: 'Invalid status value' });
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query('UPDATE expert_queries SET status = ? WHERE id = ?', [status, queryId]);
      res.json({ success: true });
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};
