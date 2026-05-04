const express = require('express');
const router  = express.Router();
const c = require('../controllers/followUpController');

router.get('/babies', c.getAllBabies);
router.get('/',       c.getAllFollowUps);
router.post('/',      c.createFollowUp);
router.put('/:id',    c.updateStatus);

module.exports = router;
