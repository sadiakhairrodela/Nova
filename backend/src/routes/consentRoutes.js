const express = require('express');
const router  = express.Router();
const c = require('../controllers/consentController');

router.post('/give',          c.giveConsent);
router.post('/withdraw',      c.withdrawConsent);
router.post('/access/grant',  c.grantAccess);
router.post('/access/revoke', c.revokeAccess);
// Parameterised route last to avoid swallowing named paths
router.get('/:userId',        c.getConsent);

module.exports = router;
