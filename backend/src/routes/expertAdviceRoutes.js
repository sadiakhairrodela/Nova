const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const c = require('../controllers/expertAdviceController');

const attachDir = path.join(__dirname, '../../uploads/attachments');
if (!fs.existsSync(attachDir)) fs.mkdirSync(attachDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, attachDir),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/queries',                      c.getQueries);
router.post('/queries', upload.single('attachment'), c.createQuery);
router.get('/queries/:queryId/replies',     c.getReplies);
router.post('/queries/:queryId/replies',    c.addReply);
router.put('/queries/:queryId/status',      c.updateStatus);

module.exports = router;
