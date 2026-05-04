const pool = require('../config/database');

// GET /api/audit?action=&resourceType=&limit=
exports.getLogs = async (req, res) => {
  const { action, resourceType, limit = 200 } = req.query;
  try {
    const conn = await pool.getConnection();
    try {
      let sql = `
        SELECT al.*, u.name AS user_name, u.role AS user_role
        FROM audit_logs al
        JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;
      const params = [];
      if (action)       { sql += ' AND al.action = ?';        params.push(action); }
      if (resourceType) { sql += ' AND al.resource_type = ?'; params.push(resourceType); }
      sql += ' ORDER BY al.created_at DESC LIMIT ?';
      params.push(parseInt(limit));

      const [logs] = await conn.query(sql, params);
      res.json(logs);
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/audit
exports.createLog = async (req, res) => {
  const { userId, action, resourceType, resourceId, details } = req.body;
  if (!userId || !action || !resourceType)
    return res.status(400).json({ message: 'userId, action and resourceType are required' });
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, action, resourceType, resourceId || null, details || null]
      );
      res.json({ success: true });
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};
