const express = require('express');
const multer = require('multer');
const path = require('path');
const videoController = require('../controllers/videoController');

const router = express.Router();

// Configure multer for chunk uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.CHUNKS_DIR || './uploads/chunks');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Video routes
router.get('/babies/:caregiverId',   videoController.getBabiesByCaregiver);
router.post('/babies',               videoController.createBaby);
router.put('/babies/:babyId',        videoController.updateBaby);
router.delete('/babies/:babyId',     videoController.deleteBaby);
router.get('/baby/:babyId/videos',   videoController.getVideosByBaby);
router.get('/timeline/:babyId',    videoController.getVideoTimeline);
router.post('/draft', videoController.createDraftVideo);
router.post('/upload-chunk', upload.single('chunk'), videoController.uploadChunk);
router.put('/submit/:videoId', videoController.submitVideo);
router.get('/submitted', videoController.getSubmittedVideos);
router.get('/details/:videoId', videoController.getVideoDetails);
router.get('/dashboard/stats', videoController.getDashboardStats);

module.exports = router;
