const express = require('express');
const router  = express.Router();
const c = require('../controllers/communityController');

router.get('/posts',                    c.getPosts);
router.post('/posts',                   c.createPost);
router.delete('/posts/:postId',         c.deletePost);
router.get('/posts/:postId/comments',   c.getComments);
router.post('/posts/:postId/comments',  c.addComment);
router.post('/posts/:postId/react',     c.toggleReaction);

module.exports = router;
