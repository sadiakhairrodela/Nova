const pool = require('../config/database');

// Simple password validation (in production, use bcrypt)
const validatePassword = (inputPassword, storedPassword) => {
  // For demo purposes, we're storing plain passwords
  // In production, use bcrypt to hash and compare
  return inputPassword === storedPassword;
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const connection = await pool.getConnection();

    try {
      // Query user by email
      const [users] = await connection.query(
        'SELECT id, name, email, role, phone FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const user = users[0];

      // In production, compare hashed passwords using bcrypt
      // For demo, check against known demo passwords
      const demoCredentials = {
        'maria.garcia@email.com': 'password123',
        'sarah.johnson@email.com': 'password123',
        'emily.chen@email.com': 'password123',
        'admin@ddodle.local': 'adminpass123',
        'dr.patel@ddodle.local': 'adminpass123'
      };

      if (demoCredentials[email] && demoCredentials[email] === password) {
        return res.json({
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone
          }
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed: ' + error.message
    });
  }
};

exports.logout = async (req, res) => {
  // Clear session/token if using authentication
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};
