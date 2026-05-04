const pool = require('../config/database');
const emailService = require('../services/emailService');
const writeAuditLog = require('../services/auditService');

// Submit review for a video
exports.submitReview = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { reviewStatus, reviewerNotes, qualityScore, reviewerId, riskFlag, followUpRecommendation } = req.body;

    if (!reviewStatus || !reviewerId) {
      return res.status(400).json({ error: 'Review status and reviewer ID required' });
    }

    const connection = await pool.getConnection();

    // Check if review already exists
    const [existingReview] = await connection.execute(
      'SELECT id FROM video_reviews WHERE video_id = ? AND reviewer_id = ?',
      [videoId, reviewerId]
    );

    if (existingReview.length > 0) {
      // Update existing review
      await connection.execute(
        `UPDATE video_reviews 
         SET review_status = ?, reviewer_notes = ?, quality_score = ?, risk_flag = ?, follow_up_recommendation = ?, reviewed_at = NOW()
         WHERE video_id = ? AND reviewer_id = ?`,
        [reviewStatus, reviewerNotes || '', qualityScore || 0, riskFlag || 'none', followUpRecommendation || '', videoId, reviewerId]
      );
    } else {
      // Create new review
      await connection.execute(
        `INSERT INTO video_reviews (video_id, reviewer_id, review_status, reviewer_notes, quality_score, risk_flag, follow_up_recommendation, reviewed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [videoId, reviewerId, reviewStatus, reviewerNotes || '', qualityScore || 0, riskFlag || 'none', followUpRecommendation || '']
      );
    }

    // Update video status based on review
    let videoStatus = 'under_review';
    if (reviewStatus === 'approved') {
      videoStatus = 'approved';
    } else if (reviewStatus === 'rejected') {
      videoStatus = 'rejected';
    }

    await connection.execute(
      'UPDATE videos SET status = ? WHERE id = ?',
      [videoStatus, videoId]
    );

    // Fetch caregiver info for email notification
    const [info] = await connection.execute(
      `SELECT u.id AS caregiverId, u.email, u.name, b.name AS baby_name
       FROM videos v
       JOIN babies b ON v.baby_id = b.id
       JOIN users u ON b.user_id = u.id
       WHERE v.id = ?`,
      [videoId]
    );

    connection.release();

    if (info.length > 0) {
      const r = info[0];
      if (reviewStatus === 'rejected') {
        emailService.notifyReRecordRequested({
          caregiverId: r.caregiverId, caregiverEmail: r.email,
          caregiverName: r.name, babyName: r.baby_name,
        });
      } else {
        emailService.notifyReviewCompleted({
          caregiverId: r.caregiverId, caregiverEmail: r.email,
          caregiverName: r.name, babyName: r.baby_name, status: reviewStatus,
        });
      }
    }

    // Audit log
    writeAuditLog({
      userId: reviewerId,
      action: reviewStatus === 'approved' ? 'approve' : 'reject',
      resourceType: 'video',
      resourceId: videoId,
      details: `Review submitted: ${reviewStatus}. Risk: ${riskFlag || 'none'}`,
      ip: req.ip,
    });

    res.json({
      success: true,
      message: 'Review submitted successfully',
      videoId,
      status: videoStatus
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all reviews for a video
exports.getVideoReviews = async (req, res) => {
  try {
    const { videoId } = req.params;

    const connection = await pool.getConnection();
    const [reviews] = await connection.execute(
      `SELECT r.*, u.name as reviewer_name, u.email as reviewer_email
       FROM video_reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.video_id = ?
       ORDER BY r.reviewed_at DESC`,
      [videoId]
    );
    connection.release();

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get review statistics
exports.getReviewStats = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_reviews,
        SUM(CASE WHEN review_status='approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN review_status='rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN review_status='pending_revision' THEN 1 ELSE 0 END) as pending_count,
        AVG(quality_score) as avg_quality_score
      FROM video_reviews
    `);
    connection.release();

    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/reviews/log-download — called by frontend when a PDF is downloaded
exports.logReportDownload = async (req, res) => {
  const { userId, videoId, babyName } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  writeAuditLog({
    userId, action: 'download', resourceType: 'report',
    resourceId: videoId || null,
    details: `Downloaded screening report${babyName ? ' for ' + babyName : ''}`,
    ip: req.ip,
  });
  res.json({ success: true });
};

// Get all reviewed videos with full info (for screening reports)
exports.getAllReviewedVideos = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [reviews] = await connection.execute(
      `SELECT vr.id, vr.video_id, vr.reviewer_id, vr.review_status, vr.reviewer_notes,
              vr.quality_score, vr.risk_flag, vr.follow_up_recommendation, vr.reviewed_at, vr.created_at,
              v.file_name, v.file_path, v.duration_seconds, v.submitted_date,
              b.name AS baby_name, b.birth_date, b.gender, b.risk_group,
              u.name AS caregiver_name, u.email AS caregiver_email,
              r.name AS reviewer_name
       FROM video_reviews vr
       JOIN videos v  ON vr.video_id    = v.id
       JOIN babies b  ON v.baby_id      = b.id
       JOIN users  u  ON b.user_id      = u.id
       JOIN users  r  ON vr.reviewer_id = r.id
       ORDER BY vr.reviewed_at DESC`
    );
    connection.release();
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
