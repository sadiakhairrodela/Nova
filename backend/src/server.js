/**
 * ddodle Project - Express Backend Server
 * Baby Video Assessment System
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const videoRoutes        = require('./routes/videoRoutes');
const reviewRoutes       = require('./routes/reviewRoutes');
const userRoutes         = require('./routes/userRoutes');
const authRoutes         = require('./routes/authRoutes');
const communityRoutes    = require('./routes/communityRoutes');
const consentRoutes      = require('./routes/consentRoutes');
const expertAdviceRoutes = require('./routes/expertAdviceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const followUpRoutes     = require('./routes/followUpRoutes');
const auditRoutes        = require('./routes/auditRoutes');
const deletionRoutes     = require('./routes/deletionRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded videos statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================================
// ROUTES
// ============================================================

app.use('/api/auth',          authRoutes);
app.use('/api/videos',        videoRoutes);
app.use('/api/reviews',       reviewRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/community',     communityRoutes);
app.use('/api/consent',       consentRoutes);
app.use('/api/advice',        expertAdviceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/followup',      followUpRoutes);
app.use('/api/audit',         auditRoutes);
app.use('/api/deletion',      deletionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running ✅' });
});

// ============================================================
// ERROR HANDLING
// ============================================================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   ddodle Backend Started Successfully  ║
╠════════════════════════════════════════╣
║ Server running on: http://localhost:${PORT}  ║
║ Environment: ${process.env.NODE_ENV || 'development'}              ║
║ Database: ${process.env.DB_NAME}          ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
