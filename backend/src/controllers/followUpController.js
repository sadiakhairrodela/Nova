const pool = require('../config/database');

// GET /api/followup
exports.getAllFollowUps = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [tasks] = await conn.query(`
        SELECT ft.*,
               b.name AS baby_name,
               u.name AS clinician_name,
               c.name AS caregiver_name
        FROM follow_up_tasks ft
        JOIN babies b ON ft.baby_id      = b.id
        JOIN users  u ON ft.clinician_id = u.id
        JOIN users  c ON b.user_id       = c.id
        ORDER BY ft.due_date ASC
      `);
      res.json(tasks);
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/followup/babies
exports.getAllBabies = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [babies] = await conn.query(`
        SELECT b.*, u.name AS caregiver_name
        FROM babies b
        JOIN users u ON b.user_id = u.id
        ORDER BY b.name
      `);
      res.json(babies);
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/followup
exports.createFollowUp = async (req, res) => {
  const { babyId, clinicianId, taskType, title, description, dueDate } = req.body;
  if (!babyId || !clinicianId || !title || !dueDate)
    return res.status(400).json({ message: 'babyId, clinicianId, title and dueDate are required' });
  try {
    const conn = await pool.getConnection();
    try {
      const [r] = await conn.query(
        `INSERT INTO follow_up_tasks
           (baby_id, clinician_id, task_type, title, description, due_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [babyId, clinicianId, taskType || 'other', title, description || null, dueDate]
      );
      res.json({ success: true, taskId: r.insertId });
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PUT /api/followup/:id
exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const valid = ['pending', 'completed', 'overdue'];
  if (!valid.includes(status))
    return res.status(400).json({ message: 'Invalid status' });
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query('UPDATE follow_up_tasks SET status = ? WHERE id = ?', [status, id]);
      res.json({ success: true });
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};
