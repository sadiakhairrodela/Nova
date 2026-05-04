import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';

const timeAgo = (d) => {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const CommunityPage = () => {
  const { currentUser } = useContext(UserContext);
  const [posts, setPosts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [comments, setComments] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/community/posts');
      setPosts(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const selectPost = async (post) => {
    setSelected(post);
    const res = await axios.get(`/api/community/posts/${post.id}/comments`);
    setComments(res.data);
  };

  const createPost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    await axios.post('/api/community/posts', { userId: currentUser.id, ...newPost });
    setNewPost({ title: '', content: '' });
    setShowCreate(false);
    loadPosts();
  };

  const addComment = async () => {
    if (!newComment.trim() || !selected) return;
    await axios.post(`/api/community/posts/${selected.id}/comments`, {
      userId: currentUser.id, content: newComment
    });
    setNewComment('');
    const res = await axios.get(`/api/community/posts/${selected.id}/comments`);
    setComments(res.data);
    setPosts(prev => prev.map(p =>
      p.id === selected.id ? { ...p, comment_count: p.comment_count + 1 } : p
    ));
  };

  const toggleReaction = async (e, postId) => {
    e.stopPropagation();
    const res = await axios.post(`/api/community/posts/${postId}/react`, {
      userId: currentUser.id, reactionType: 'like'
    });
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return { ...p, reaction_count: p.reaction_count + (res.data.action === 'added' ? 1 : -1) };
    }));
  };

  const deletePost = async (e, postId) => {
    e.stopPropagation();
    if (!window.confirm('Remove this post?')) return;
    await axios.delete(`/api/community/posts/${postId}`);
    if (selected?.id === postId) setSelected(null);
    loadPosts();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community Forum</h1>
          <p className="text-gray-500 mt-1">Connect with caregivers, share experiences, ask questions</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">
          + New Post
        </button>
      </div>

      {/* Create Post Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Create a Post</h2>
            <input type="text" placeholder="Title…" value={newPost.title}
              onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <textarea placeholder="Share your experience or question…"
              value={newPost.content}
              onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
              rows={5}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <div className="flex space-x-3">
              <button onClick={createPost}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">Post</button>
              <button onClick={() => { setShowCreate(false); setNewPost({ title: '', content: '' }); }}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Posts list */}
        <div className="flex-1 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading…</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <span className="text-5xl block mb-4">💬</span>
              <p className="text-gray-500 text-lg">No posts yet. Be the first to share!</p>
            </div>
          ) : posts.map(post => (
            <div key={post.id} onClick={() => selectPost(post)}
              className={`bg-white rounded-2xl shadow-sm border p-5 cursor-pointer hover:shadow-md transition ${
                selected?.id === post.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                    {post.author_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{post.author_name}</p>
                    <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
                  </div>
                </div>
                {currentUser.role === 'admin' && (
                  <button onClick={e => deletePost(e, post.id)}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition">Remove</button>
                )}
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{post.title}</h3>
              <p className="text-gray-600 text-sm line-clamp-2">{post.content}</p>
              <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-gray-100">
                <button onClick={e => toggleReaction(e, post.id)}
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600 transition">
                  <span>👍</span><span>{post.reaction_count}</span>
                </button>
                <span className="flex items-center space-x-1 text-sm text-gray-500">
                  <span>💬</span><span>{post.comment_count}</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Post detail panel */}
        {selected && (
          <div className="w-96 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col max-h-[680px]">
            <div className="p-5 border-b border-gray-100">
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-sm mb-3 block">← Back</button>
              <h2 className="font-bold text-gray-900 text-lg">{selected.title}</h2>
              <p className="text-xs text-gray-400 mt-1">{selected.author_name} · {timeAgo(selected.created_at)}</p>
              <p className="text-gray-700 text-sm mt-3 leading-relaxed">{selected.content}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Comments ({comments.length})</p>
              {comments.map(c => (
                <div key={c.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-xs text-gray-800">{c.author_name}</span>
                    <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600">{c.content}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100">
              <div className="flex space-x-2">
                <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addComment()}
                  placeholder="Write a comment…"
                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={addComment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">Post</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
