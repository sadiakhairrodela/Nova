const express = require('express');
const router  = express.Router();
const c = require('../controllers/auditController');

router.get('/',  c.getLogs);
router.post('/', c.createLog);

module.exports = router;
