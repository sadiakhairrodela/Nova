const express = require('express');
const router  = express.Router();
const c = require('../controllers/notificationController');

// Specific routes before parameterised ones
router.post('/read',           c.markRead);
router.get('/prefs/:userId',   c.getPreferences);
router.put('/prefs',           c.updatePreferences);
router.get('/:userId',         c.getNotifications);

module.exports = router;
