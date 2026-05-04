import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';

const STATUS_CFG = {
  open:      { color: 'bg-gray-100 text-gray-700',    label: 'Open' },
  in_review: { color: 'bg-yellow-100 text-yellow-700', label: 'In Review' },
  responded: { color: 'bg-blue-100 text-blue-700',    label: 'Responded' },
  closed:    { color: 'bg-green-100 text-green-700',  label: 'Closed' },
};

const timeAgo = (d) => {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const ExpertAdvicePage = () => {
  const { currentUser } = useContext(UserContext);
  const [queries, setQueries]       = useState([]);
  const [selected, setSelected]     = useState(null);
  const [replies, setReplies]       = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newQuery, setNewQuery]     = useState({ subject: '', content: '', videoId: '' });
  const [attachment, setAttachment] = useState(null);
  const [caregiverVideos, setCaregiverVideos] = useState([]);
  const [replyText, setReplyText]   = useState('');
  const [loading, setLoading]       = useState(true);

  useEffect(() => { loadQueries(); }, []);

  useEffect(() => {
    if (currentUser.role === 'caregiver') {
      axios.get(`/api/videos/babies/${currentUser.id}`)
        .then(res => {
          // For each baby, get their videos
          Promise.all(res.data.map(b => axios.get(`/api/videos/timeline/${b.id}`)))
            .then(results => {
              const all = results.flatMap(r => r.data);
              setCaregiverVideos(all);
            })
            .catch(console.error);
        })
        .catch(console.error);
    }
  }, [currentUser]);

  const loadQueries = async () => {
    try {
      const res = await axios.get('/api/advice/queries', {
        params: { userId: currentUser.id, role: currentUser.role }
      });
      setQueries(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openQuery = async (q) => {
    setSelected(q);
    const res = await axios.get(`/api/advice/queries/${q.id}/replies`);
    setReplies(res.data);
  };

  const createQuery = async () => {
    if (!newQuery.subject.trim() || !newQuery.content.trim()) return;
    const formData = new FormData();
    formData.append('caregiverId', currentUser.id);
    formData.append('subject', newQuery.subject);
    formData.append('content', newQuery.content);
    if (newQuery.videoId) formData.append('videoId', newQuery.videoId);
    if (attachment) formData.append('attachment', attachment);
    await axios.post('/api/advice/queries', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setNewQuery({ subject: '', content: '', videoId: '' });
    setAttachment(null);
    setShowCreate(false);
    loadQueries();
  };

  const addReply = async () => {
    if (!replyText.trim() || !selected) return;
    await axios.post(`/api/advice/queries/${selected.id}/replies`, {
      userId: currentUser.id, content: replyText
    });
    setReplyText('');
    const res = await axios.get(`/api/advice/queries/${selected.id}/replies`);
    setReplies(res.data);
    loadQueries();
  };

  const updateStatus = async (queryId, status) => {
    await axios.put(`/api/advice/queries/${queryId}/status`, { status });
    loadQueries();
    if (selected?.id === queryId) setSelected(p => ({ ...p, status }));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expert Advice Desk</h1>
          <p className="text-gray-500 mt-1">Submit questions to verified clinicians and track responses</p>
        </div>
        {currentUser.role === 'caregiver' && (
          <button onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">
            + Ask a Clinician
          </button>
        )}
      </div>

      {/* Create Query Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">Submit a Clinical Query</h2>
            <input type="text" placeholder="Subject…" value={newQuery.subject}
              onChange={e => setNewQuery(q => ({ ...q, subject: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <textarea placeholder="Describe your question in detail…" value={newQuery.content}
              onChange={e => setNewQuery(q => ({ ...q, content: e.target.value }))}
              rows={4} className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            {caregiverVideos.length > 0 && (
              <div className="mb-3">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Link to a Video Case (optional)</label>
                <select value={newQuery.videoId} onChange={e => setNewQuery(q => ({ ...q, videoId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="">— No video linked —</option>
                  {caregiverVideos.map(v => (
                    <option key={v.id} value={v.id}>{v.file_name} ({v.status})</option>
                  ))}
                </select>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Attach Supporting File (optional, max 10MB)</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={e => setAttachment(e.target.files[0] || null)}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100" />
              {attachment && <p className="text-xs text-gray-400 mt-1">Selected: {attachment.name}</p>}
            </div>
            <p className="text-xs text-orange-600 bg-orange-50 p-3 rounded-xl mb-4">
              ⚠️ This service is for platform guidance only. For medical emergencies, contact your healthcare provider immediately.
            </p>
            <div className="flex space-x-3">
              <button onClick={createQuery}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">Submit</button>
              <button onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Query list */}
        <div className="flex-1 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading…</div>
          ) : queries.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <span className="text-5xl block mb-4">💭</span>
              <p className="text-gray-500">No queries yet.</p>
            </div>
          ) : queries.map(q => {
            const sc = STATUS_CFG[q.status] || STATUS_CFG.open;
            return (
              <div key={q.id} onClick={() => openQuery(q)}
                className={`bg-white rounded-2xl border p-5 cursor-pointer hover:shadow-md transition ${
                  selected?.id === q.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sc.color}`}>{sc.label}</span>
                  <span className="text-xs text-gray-400">{timeAgo(q.created_at)}</span>
                </div>
                <h3 className="font-bold text-gray-900">{q.subject}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{q.content}</p>
                <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  <span>👤 {q.caregiver_name}</span>
                  <span>💬 {q.reply_count} replies</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Query detail */}
        {selected && (
          <div className="w-[420px] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col max-h-[700px]">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
                {currentUser.role === 'admin' && (
                  <select value={selected.status} onChange={e => updateStatus(selected.id, e.target.value)}
                    className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                )}
              </div>
              <h2 className="font-bold text-gray-900">{selected.subject}</h2>
              <p className="text-xs text-gray-400 mt-1">By {selected.caregiver_name} · {timeAgo(selected.created_at)}</p>
              {selected.video_name && (
                <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-2 py-1 mt-2 inline-block">
                  🎥 Linked video: {selected.video_name}
                </p>
              )}
              {selected.attachment_path && (
                <a href={selected.attachment_path} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-purple-600 bg-purple-50 rounded-lg px-2 py-1 mt-1 inline-block ml-1 hover:bg-purple-100">
                  📎 View Attachment
                </a>
              )}
              <p className="text-sm text-gray-600 mt-3 bg-gray-50 rounded-xl p-3 leading-relaxed">{selected.content}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {replies.map(r => (
                <div key={r.id} className={`rounded-xl p-3 ${r.author_role === 'admin' ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-xs text-gray-900">{r.author_name}</span>
                    {r.author_role === 'admin' && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">Clinician</span>
                    )}
                    <span className="text-xs text-gray-400">{timeAgo(r.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700">{r.content}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100">
              <div className="flex space-x-2">
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder="Write a reply…" rows={2}
                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                <button onClick={addReply}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">Reply</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertAdvicePage;
