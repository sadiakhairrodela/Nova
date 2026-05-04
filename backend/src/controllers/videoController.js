const pool = require('../config/database');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');
const writeAuditLog = require('../services/auditService');

// Get all babies for a caregiver
exports.getBabiesByCaregiver = async (req, res) => {
  try {
    const { caregiverId } = req.params;
    const connection = await pool.getConnection();
    const [babies] = await connection.execute(
      'SELECT id, name, birth_date, gender, risk_group, notes FROM babies WHERE user_id = ? ORDER BY created_at DESC',
      [caregiverId]
    );
    connection.release();
    res.json(babies);
  } catch (error) {
    console.error('Error fetching babies:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create a new baby profile
exports.createBaby = async (req, res) => {
  try {
    const { userId, name, birthDate, gender, riskGroup, notes } = req.body;
    if (!userId || !name || !birthDate) {
      return res.status(400).json({ error: 'userId, name, and birthDate are required' });
    }
    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      'INSERT INTO babies (user_id, name, birth_date, gender, risk_group, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, birthDate, gender || null, riskGroup || 'standard', notes || null]
    );
    const [rows] = await connection.execute(
      'SELECT id, name, birth_date, gender, risk_group, notes FROM babies WHERE id = ?',
      [result.insertId]
    );
    connection.release();
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating baby:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update a baby profile
exports.updateBaby = async (req, res) => {
  try {
    const { babyId } = req.params;
    const { name, birthDate, gender, riskGroup, notes, userId } = req.body;
    const connection = await pool.getConnection();
    // Ownership check
    const [check] = await connection.execute('SELECT user_id FROM babies WHERE id = ?', [babyId]);
    if (!check.length || String(check[0].user_id) !== String(userId)) {
      connection.release();
      return res.status(403).json({ error: 'Not authorised' });
    }
    await connection.execute(
      'UPDATE babies SET name=?, birth_date=?, gender=?, risk_group=?, notes=? WHERE id=?',
      [name, birthDate, gender || null, riskGroup || 'standard', notes || null, babyId]
    );
    const [rows] = await connection.execute(
      'SELECT id, name, birth_date, gender, risk_group, notes FROM babies WHERE id = ?',
      [babyId]
    );
    connection.release();
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating baby:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete a baby profile (only if no submitted videos)
exports.deleteBaby = async (req, res) => {
  try {
    const { babyId } = req.params;
    const { userId } = req.body;
    const connection = await pool.getConnection();
    const [check] = await connection.execute('SELECT user_id FROM babies WHERE id = ?', [babyId]);
    if (!check.length || String(check[0].user_id) !== String(userId)) {
      connection.release();
      return res.status(403).json({ error: 'Not authorised' });
    }
    const [vids] = await connection.execute(
      "SELECT id FROM videos WHERE baby_id = ? AND status NOT IN ('draft')",
      [babyId]
    );
    if (vids.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Cannot delete: this baby has submitted videos on record.' });
    }
    await connection.execute('DELETE FROM videos WHERE baby_id = ?', [babyId]);
    await connection.execute('DELETE FROM babies WHERE id = ?', [babyId]);
    connection.release();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting baby:', error);
    res.status(500).json({ error: error.message });
  }
};



// Get videos for a baby
exports.getVideosByBaby = async (req, res) => {
  try {
    const { babyId } = req.params;
    
    const connection = await pool.getConnection();
    const [videos] = await connection.execute(
      `SELECT id, file_name, file_path, file_size, duration_seconds, status, 
              submitted_date, created_at FROM videos WHERE baby_id = ? ORDER BY created_at DESC`,
      [babyId]
    );
    connection.release();

    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: error.message });
  }
};

// Upload chunk of video
exports.uploadChunk = async (req, res) => {
  try {
    const chunkIndex = parseInt(req.body.chunkIndex, 10);
    const totalChunks = parseInt(req.body.totalChunks, 10);
    const videoId = req.body.videoId; // This is the database ID now
    const chunk = req.file;

    if (!chunk) {
      return res.status(400).json({ error: 'No chunk provided' });
    }

    // Create temp folder for chunks
    const chunksDir = path.join(process.env.CHUNKS_DIR || './uploads/chunks', `video_${videoId}`);
    if (!fs.existsSync(chunksDir)) {
      fs.mkdirSync(chunksDir, { recursive: true });
    }

    // Save chunk
    const chunkPath = path.join(chunksDir, `chunk_${chunkIndex}`);
    fs.renameSync(chunk.path, chunkPath);

    // Check if all chunks received
    const files = fs.readdirSync(chunksDir);
    const allChunksReceived = files.length === totalChunks;

    if (allChunksReceived) {
      // Combine chunks into single video file
      const finalFileName = `${videoId}.mp4`;
      const finalPath = path.join(process.env.VIDEOS_DIR || './uploads/videos', finalFileName);
      
      return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(finalPath);
        
        writeStream.on('finish', async () => {
          // Clean up chunks directory
          files.forEach(file => {
            const filePath = path.join(chunksDir, file);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          });
          if (fs.existsSync(chunksDir)) {
            fs.rmdirSync(chunksDir);
          }

          // Update the stored file_path in the DB to match the actual assembled file
          try {
            const conn = await pool.getConnection();
            await conn.execute(
              `UPDATE videos SET file_path = ? WHERE id = ?`,
              [`/uploads/videos/${finalFileName}`, videoId]
            );
            conn.release();
          } catch (dbErr) {
            console.error('Failed to update file_path in DB:', dbErr.message);
          }
          
          res.json({
            success: true,
            message: 'All chunks received and video combined',
            videoId,
            filePath: `/uploads/videos/${finalFileName}`
          });
          resolve();
        });

        writeStream.on('error', (error) => {
          res.status(500).json({ error: 'Error combining chunks: ' + error.message });
          reject(error);
        });
        
        for (let i = 0; i < totalChunks; i++) {
          const chunkPath = path.join(chunksDir, `chunk_${i}`);
          if (fs.existsSync(chunkPath)) {
            const chunkData = fs.readFileSync(chunkPath);
            writeStream.write(chunkData);
          }
        }
        writeStream.end();
      });
    } else {
      res.json({
        success: true,
        message: `Chunk ${chunkIndex} received. ${files.length}/${totalChunks} chunks uploaded`,
        progress: (files.length / totalChunks) * 100
      });
    }
  } catch (error) {
    console.error('Error uploading chunk:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create draft video entry
exports.createDraftVideo = async (req, res) => {
  try {
    const { babyId, fileName } = req.body;

    if (!babyId || !fileName) {
      return res.status(400).json({ error: 'Baby ID and file name required' });
    }

    const videoId = uuidv4();
    const filePath = `/uploads/videos/${videoId}.mp4`;

    const connection = await pool.getConnection();
    const [insertResult] = await connection.execute(
      `INSERT INTO videos (baby_id, file_name, file_path, status) 
       VALUES (?, ?, ?, 'draft')`,
      [babyId, fileName, filePath]
    );
    connection.release();

    res.json({
      videoId,
      dbId: insertResult.insertId,
      filePath
    });
  } catch (error) {
    console.error('Error creating draft video:', error);
    res.status(500).json({ error: error.message });
  }
};

// Submit video for review
exports.submitVideo = async (req, res) => {
  try {
    const { videoId } = req.params;

    const connection = await pool.getConnection();
    await connection.execute(
      `UPDATE videos SET status = 'submitted', submitted_date = NOW() 
       WHERE id = ?`,
      [videoId]
    );

    // Fetch caregiver info for notification
    const [rows] = await connection.execute(
      `SELECT u.id AS caregiverId, u.email, u.name, b.name AS baby_name
       FROM videos v
       JOIN babies b ON v.baby_id = b.id
       JOIN users u ON b.user_id = u.id
       WHERE v.id = ?`,
      [videoId]
    );
    connection.release();

    if (rows.length > 0) {
      const r = rows[0];
      emailService.notifyVideoReceived({
        caregiverId: r.caregiverId, caregiverEmail: r.email,
        caregiverName: r.name, babyName: r.baby_name,
      });
    }

    res.json({ success: true, message: 'Video submitted for review' });
  } catch (error) {
    console.error('Error submitting video:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all submitted videos for admin review
exports.getSubmittedVideos = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [videos] = await connection.execute(
      `SELECT 
        v.id, v.file_name, v.file_path, v.file_size, v.duration_seconds,
        v.status, v.submitted_date, b.id as baby_id, b.name as baby_name,
        b.gender, b.birth_date, b.risk_group, u.name as caregiver_name, u.email
       FROM videos v
       JOIN babies b ON v.baby_id = b.id
       JOIN users u ON b.user_id = u.id
       WHERE v.status IN ('submitted', 'under_review', 'rejected')
       ORDER BY v.submitted_date DESC`
    );
    connection.release();

    res.json(videos);
  } catch (error) {
    console.error('Error fetching submitted videos:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get video timeline for a baby (includes review notes)
exports.getVideoTimeline = async (req, res) => {
  try {
    const { babyId } = req.params;
    const connection = await pool.getConnection();
    const [videos] = await connection.execute(
      `SELECT v.id, v.file_name, v.file_path, v.file_size, v.duration_seconds AS duration,
              v.status, v.submitted_date, v.created_at,
              vr.reviewer_notes AS review_notes, vr.quality_score,
              vr.review_status
       FROM videos v
       LEFT JOIN video_reviews vr ON vr.video_id = v.id
       WHERE v.baby_id = ?
       ORDER BY v.created_at DESC`,
      [babyId]
    );
    connection.release();
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get video details with review info
exports.getVideoDetails = async (req, res) => {
  try {
    const { videoId } = req.params;

    const connection = await pool.getConnection();
    
    const [videoData] = await connection.execute(
      `SELECT 
        v.id, v.file_name, v.file_path, v.file_size, v.duration_seconds,
        v.status, v.submitted_date, b.id as baby_id, b.name as baby_name,
        b.gender, b.birth_date, b.risk_group, u.name as caregiver_name, u.email
       FROM videos v
       JOIN babies b ON v.baby_id = b.id
       JOIN users u ON b.user_id = u.id
       WHERE v.id = ?`,
      [videoId]
    );

    const [reviews] = await connection.execute(
      `SELECT id, review_status, reviewer_notes, quality_score, reviewed_at
       FROM video_reviews WHERE video_id = ?`,
      [videoId]
    );

    connection.release();

    if (videoData.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Audit: log video view by reviewer
    const viewerId = req.query.reviewerId || req.body.reviewerId;
    if (viewerId) {
      writeAuditLog({
        userId: viewerId, action: 'view', resourceType: 'video',
        resourceId: videoId, details: `Viewed video details: ${videoData[0].file_name}`, ip: req.ip,
      });
    }

    res.json({
      ...videoData[0],
      reviews
    });
  } catch (error) {
    console.error('Error fetching video details:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get admin dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const [stats] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role='caregiver') as total_caregivers,
        (SELECT COUNT(*) FROM babies) as total_babies,
        (SELECT COUNT(*) FROM videos) as total_videos,
        (SELECT COUNT(*) FROM videos WHERE status='submitted') as pending_review,
        (SELECT COUNT(*) FROM videos WHERE status='approved') as approved,
        (SELECT COUNT(*) FROM videos WHERE status='rejected') as rejected
    `);

    connection.release();

    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
};
