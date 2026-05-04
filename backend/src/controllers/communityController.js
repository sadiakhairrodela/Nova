const pool = require('../config/database');

// GET /api/community/posts
exports.getPosts = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [posts] = await conn.query(`
        SELECT
          cp.*,
          u.name AS author_name,
          u.role AS author_role,
          (SELECT COUNT(*) FROM community_comments cc WHERE cc.post_id = cp.id) AS comment_count,
          (SELECT COUNT(*) FROM community_reactions cr WHERE cr.post_id = cp.id) AS reaction_count
        FROM community_posts cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.status = 'active'
        ORDER BY cp.created_at DESC
      `);
      res.json(posts);
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/community/posts
exports.createPost = async (req, res) => {
  const { userId, title, content } = req.body;
  if (!userId || !title || !content)
    return res.status(400).json({ message: 'userId, title and content are required' });
  try {
    const conn = await pool.getConnection();
    try {
      const [r] = await conn.query(
        'INSERT INTO community_posts (user_id, title, content) VALUES (?, ?, ?)',
        [userId, title, content]
      );
      res.json({ success: true, postId: r.insertId });
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// DELETE /api/community/posts/:postId
exports.deletePost = async (req, res) => {
  const { postId } = req.params;
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query("UPDATE community_posts SET status = 'removed' WHERE id = ?", [postId]);
      res.json({ success: true });
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/community/posts/:postId/comments
exports.getComments = async (req, res) => {
  const { postId } = req.params;
  try {
    const conn = await pool.getConnection();
    try {
      const [comments] = await conn.query(`
        SELECT cc.*, u.name AS author_name, u.role AS author_role
        FROM community_comments cc
        JOIN users u ON cc.user_id = u.id
        WHERE cc.post_id = ?
        ORDER BY cc.created_at ASC
      `, [postId]);
      res.json(comments);
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/community/posts/:postId/comments
exports.addComment = async (req, res) => {
  const { postId } = req.params;
  const { userId, content } = req.body;
  if (!userId || !content)
    return res.status(400).json({ message: 'userId and content are required' });
  try {
    const conn = await pool.getConnection();
    try {
      const [r] = await conn.query(
        'INSERT INTO community_comments (post_id, user_id, content) VALUES (?, ?, ?)',
        [postId, userId, content]
      );
      res.json({ success: true, commentId: r.insertId });
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/community/posts/:postId/react
exports.toggleReaction = async (req, res) => {
  const { postId } = req.params;
  const { userId, reactionType } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId is required' });
  try {
    const conn = await pool.getConnection();
    try {
      const [existing] = await conn.query(
        'SELECT id FROM community_reactions WHERE post_id = ? AND user_id = ?',
        [postId, userId]
      );
      let action;
      if (existing.length > 0) {
        await conn.query(
          'DELETE FROM community_reactions WHERE post_id = ? AND user_id = ?',
          [postId, userId]
        );
        action = 'removed';
      } else {
        await conn.query(
          'INSERT INTO community_reactions (post_id, user_id, reaction_type) VALUES (?, ?, ?)',
          [postId, userId, reactionType || 'like']
        );
        action = 'added';
      }
      res.json({ success: true, action });
    } finally { conn.release(); }
  } catch (err) { res.status(500).json({ message: err.message }); }
};
