const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Get all users (admin + caregivers)
router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT id, name, email, phone, role FROM users ORDER BY role, name'
    );
    connection.release();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT id, name, email, phone, role FROM users WHERE id = ?',
      [userId]
    );
    connection.release();
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
