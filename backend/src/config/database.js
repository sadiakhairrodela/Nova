const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rodela_project',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true
});

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL Database Connected Successfully!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database Connection Error:', err.message);
  });

module.exports = pool;
