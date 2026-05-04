import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const STATUS_CFG = {
  draft:            { label: 'Draft',            color: 'bg-gray-100 text-gray-600',     icon: '📝', dot: 'bg-gray-400' },
  submitted:        { label: 'Submitted',         color: 'bg-blue-100 text-blue-700',     icon: '📤', dot: 'bg-blue-500' },
  under_review:     { label: 'Under Review',      color: 'bg-yellow-100 text-yellow-700', icon: '🔍', dot: 'bg-yellow-500' },
  approved:         { label: 'Approved',          color: 'bg-green-100 text-green-700',   icon: '✅', dot: 'bg-green-500' },
  rejected:         { label: 'Re-record Needed',  color: 'bg-red-100 text-red-700',       icon: '🔄', dot: 'bg-red-500' },
  re_record_needed: { label: 'Re-record Needed',  color: 'bg-orange-100 text-orange-700', icon: '🔄', dot: 'bg-orange-500' },
};

const VideoTimeline = () => {
  const { currentUser } = useContext(UserContext);
  const [babies, setBabies]           = useState([]);
  const [selectedBaby, setSelectedBaby] = useState('');
  const [videos, setVideos]           = useState([]);
  const [loadingBabies, setLoadingBabies] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [playingId, setPlayingId]     = useState(null);

  useEffect(() => {
    axios.get(`/api/videos/babies/${currentUser.id}`)
      .then(res => {
        setBabies(res.data);
        if (res.data.length > 0) setSelectedBaby(String(res.data[0].id));
      })
      .catch(console.error)
      .finally(() => setLoadingBabies(false));
  }, []);

  useEffect(() => {
    if (!selectedBaby) { setVideos([]); return; }
    setLoadingVideos(true);
    axios.get(`/api/videos/timeline/${selectedBaby}`)
      .then(res => setVideos(res.data))
      .catch(console.error)
      .finally(() => setLoadingVideos(false));
  }, [selectedBaby]);

  if (loadingBabies) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Timeline</h1>
      <p className="text-gray-500 mb-8">Track the status of all your submitted videos</p>

      {babies.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <span className="text-5xl block mb-4">👶</span>
          <p className="text-gray-500 text-lg">No babies registered yet. Upload a video to get started.</p>
        </div>
      ) : (
        <>
          {/* Baby selector */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Baby</label>
            <select value={selectedBaby} onChange={e => setSelectedBaby(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900">
              {babies.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {loadingVideos ? (
            <div className="text-center py-12 text-gray-400">Loading…</div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <span className="text-5xl block mb-4">🎥</span>
              <p className="text-gray-500">No videos submitted for this baby yet.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gray-200 z-0"></div>

              <div className="space-y-6">
                {videos.map(v => {
                  const sc = STATUS_CFG[v.status] || { label: v.status, color: 'bg-gray-100 text-gray-600', icon: '📹', dot: 'bg-gray-400' };
                  const date = new Date(v.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  });
                  return (
                    <div key={v.id} className="relative flex items-start space-x-6 pl-16 z-10">
                      {/* Timeline dot */}
                      <div className={`absolute left-5 w-6 h-6 rounded-full border-4 border-white shadow-md ${sc.dot} flex items-center justify-center z-10`}></div>

                      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sc.color}`}>
                            {sc.icon} {sc.label}
                          </span>
                          <span className="text-xs text-gray-400">{date}</span>
                        </div>
                        <h3 className="font-bold text-gray-900">{v.file_name || `Video #${v.id}`}</h3>
                        {v.duration && (
                          <p className="text-sm text-gray-500 mt-1">Duration: {Math.round(v.duration)}s</p>
                        )}
                        {v.review_notes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-xs font-semibold text-blue-700 mb-1">Reviewer Notes</p>
                            <p className="text-sm text-blue-800">{v.review_notes}</p>
                          </div>
                        )}
                        {(v.status === 'rejected' || v.status === 're_record_needed') && (
                          <div className="mt-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                            <p className="text-sm text-orange-700 font-medium mb-2">
                              🔄 A re-recording has been requested.
                            </p>
                            <Link to="/"
                              className="inline-block px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition">
                              📤 Upload Replacement Video
                            </Link>
                          </div>
                        )}
                        {v.quality_score != null && (
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Quality score:</span>
                            <div className="flex space-x-0.5">
                              {[...Array(10)].map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full ${i < v.quality_score ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-gray-700">{v.quality_score}/10</span>
                          </div>
                        )}
                        {v.file_path && (
                          <div className="mt-4">
                            <button
                              onClick={() => setPlayingId(playingId === v.id ? null : v.id)}
                              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition">
                              <span>{playingId === v.id ? '✕ Close Video' : '▶ Play Video'}</span>
                            </button>
                            {playingId === v.id && (
                              <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
                                <video
                                  controls
                                  autoPlay
                                  className="w-full max-h-72 bg-black"
                                  src={v.file_path}
                                  onError={e => { e.target.poster = ''; e.target.parentElement.innerHTML = '<p class="text-center text-sm text-gray-400 py-6">Video file not found.</p>'; }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoTimeline;
