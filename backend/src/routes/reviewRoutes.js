const express = require('express');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

// Review routes
router.get('/all',            reviewController.getAllReviewedVideos);
router.get('/stats/overview', reviewController.getReviewStats);
router.post('/submit/:videoId', reviewController.submitReview);
router.post('/log-download',  reviewController.logReportDownload);
router.get('/:videoId',       reviewController.getVideoReviews);

module.exports = router;
