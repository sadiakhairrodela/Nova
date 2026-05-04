const express = require('express');
const router  = express.Router();
const c = require('../controllers/deletionController');

router.get('/user/:userId', c.getUserRequests);
router.get('/',             c.getRequests);
router.post('/',            c.submitRequest);
router.put('/:id',          c.updateRequest);

module.exports = router;
