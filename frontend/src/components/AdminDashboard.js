import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';

const AdminDashboard = () => {
  const { currentUser } = useContext(UserContext);
  const [stats, setStats] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoDetails, setVideoDetails] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [qualityScore, setQualityScore] = useState(75);
  const [riskFlag, setRiskFlag] = useState('none');
  const [followUpRec, setFollowUpRec] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      fetchStats();
      fetchVideos();
    }
  }, [currentUser]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/videos/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      const response = await axios.get('/api/videos/submitted');
      setVideos(response.data);
    } catch (error) {
      setMessage('Error loading videos: ' + error.message);
    }
  };

  const fetchVideoDetails = async (videoId) => {
    try {
      const response = await axios.get(`/api/videos/details/${videoId}`, {
        params: { reviewerId: currentUser.id }
      });
      setVideoDetails(response.data);
    } catch (error) {
      setMessage('Error loading video details: ' + error.message);
    }
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    fetchVideoDetails(video.id);
    setReviewNotes('');
    setQualityScore(75);
    setRiskFlag('none');
    setFollowUpRec('');
  };

  const submitReview = async (reviewStatus) => {
    if (!selectedVideo || !currentUser) return;

    setSubmitting(true);
    try {
      await axios.post(`/api/reviews/submit/${selectedVideo.id}`, {
        reviewStatus,
        reviewerNotes: reviewNotes,
        qualityScore: parseInt(qualityScore),
        riskFlag,
        followUpRecommendation: followUpRec,
        reviewerId: currentUser.id
      });

      setMessage(`✅ Video ${reviewStatus.toUpperCase()} successfully!`);
      setSelectedVideo(null);
      setVideoDetails(null);
      setTimeout(() => {
        fetchVideos();
        fetchStats();
        setMessage('');
      }, 1500);
    } catch (error) {
      setMessage('❌ Error submitting review: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const filteredVideos = filter === 'all' 
    ? videos 
    : videos.filter(v => v.status === filter);

  if (!currentUser) {
    return <div className="p-8 text-center">Please select a user first</div>;
  }

  if (currentUser.role !== 'admin') {
    return <div className="p-8 text-center">This section is for admins only</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <span className="text-3xl">👨‍💼</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Review Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage and review baby assessment videos</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <p className="text-gray-600 text-sm font-semibold uppercase">Caregivers</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{stats.total_caregivers}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <p className="text-gray-600 text-sm font-semibold uppercase">Babies</p>
              <p className="text-4xl font-bold text-purple-600 mt-2">{stats.total_babies}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
              <p className="text-gray-600 text-sm font-semibold uppercase">Videos</p>
              <p className="text-4xl font-bold text-indigo-600 mt-2">{stats.total_videos}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <p className="text-gray-600 text-sm font-semibold uppercase">Pending</p>
              <p className="text-4xl font-bold text-yellow-600 mt-2">{stats.pending_review}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <p className="text-gray-600 text-sm font-semibold uppercase">Approved</p>
              <p className="text-4xl font-bold text-green-600 mt-2">{stats.approved}</p>
            </div>
          </div>
        )}

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm font-medium ${
              message.includes('✅')
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video List Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden sticky top-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
                <h2 className="text-xl font-bold">📹 Videos to Review</h2>
              </div>

              {/* Filter */}
              <div className="p-4 border-b border-gray-200">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Videos</option>
                  <option value="submitted">📤 Submitted</option>
                  <option value="under_review">👁️ Under Review</option>
                  <option value="approved">✅ Approved</option>
                  <option value="rejected">❌ Rejected</option>
                </select>
              </div>

              {/* Video List */}
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {filteredVideos.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">No videos found</div>
                ) : (
                  filteredVideos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => handleVideoSelect(video)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition border-l-4 ${
                        selectedVideo?.id === video.id
                          ? 'border-red-500 bg-red-50'
                          : 'border-transparent'
                      }`}
                    >
                      <p className="font-semibold text-gray-900 text-sm">{video.baby_name}</p>
                      <p className="text-xs text-gray-600 mt-1 truncate">{video.file_name}</p>
                      <div className="mt-2">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-bold ${getStatusColor(video.status)}`}
                        >
                          {video.status}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Details and Review Panel */}
          <div className="lg:col-span-2">
            {selectedVideo && videoDetails ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                  <h2 className="text-2xl font-bold">👶 Baby Information</h2>
                </div>

                {/* Content */}
                <div className="p-8">
                  {/* Baby Info Card */}
                  <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-600 font-semibold uppercase">Baby Name</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{videoDetails.baby_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-semibold uppercase">Gender</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1 capitalize">{videoDetails.gender}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-semibold uppercase">Age</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {Math.floor((new Date() - new Date(videoDetails.birth_date)) / (1000 * 60 * 60 * 24 * 30))} months
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-semibold uppercase">Risk Group</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">{videoDetails.risk_group}</p>
                      </div>
                    </div>
                  </div>

                  {/* Video Player */}
                  {videoDetails.file_path && (
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">▶ Watch Video</h3>
                      <div className="rounded-xl overflow-hidden border border-gray-200 bg-black">
                        <video
                          key={videoDetails.file_path}
                          controls
                          className="w-full max-h-80"
                          src={videoDetails.file_path}
                          onError={e => { e.target.parentElement.innerHTML = '<p class="text-center text-sm text-gray-400 py-8">Video file not available.</p>'; }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Video Info */}
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">🎬 Video Details</h3>
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-gray-600 font-semibold">File Name</p>
                          <p className="text-sm text-gray-900 font-mono mt-1 break-words">{videoDetails.file_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-semibold">File Size</p>
                          <p className="text-sm text-gray-900 mt-1">{(videoDetails.file_size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-semibold">Duration</p>
                          <p className="text-sm text-gray-900 mt-1">
                            {Math.floor(videoDetails.duration_seconds / 60)}m {videoDetails.duration_seconds % 60}s
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-semibold">Submitted</p>
                          <p className="text-sm text-gray-900 mt-1">
                            {new Date(videoDetails.submitted_date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Caregiver Info */}
                  <div className="mb-8 p-6 bg-purple-50 rounded-xl border border-purple-200">
                    <p className="text-sm text-gray-600 font-semibold uppercase">Caregiver</p>
                    <p className="text-xl font-bold text-gray-900 mt-2">{videoDetails.caregiver_name}</p>
                    <p className="text-sm text-gray-600 mt-1">{videoDetails.email}</p>
                  </div>

                  {/* Review Form */}
                  <h3 className="text-lg font-bold text-gray-900 mb-4">📝 Your Review</h3>
                  <div className="space-y-6 mb-6">
                    {/* Usability Decision */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Usability</label>
                        <div className="flex gap-3">
                          <button onClick={() => {}} disabled
                            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-500 cursor-default">
                            Decided on submit ↓
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Use Approve (Usable) or Reject (Not Usable) below</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Risk Flag</label>
                        <select value={riskFlag} onChange={e => setRiskFlag(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm">
                          <option value="none">🟢 None</option>
                          <option value="low">🟡 Low Risk</option>
                          <option value="high">🔴 High Risk</option>
                        </select>
                      </div>
                    </div>
                    {/* Quality Score */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Quality Score: <span className="text-red-600">{qualityScore}/100</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={qualityScore}
                        onChange={(e) => setQualityScore(e.target.value)}
                        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-red-600"
                      />
                      <div className="flex justify-between text-xs text-gray-600 mt-2">
                        <span>Poor</span>
                        <span>Good</span>
                        <span>Excellent</span>
                      </div>
                    </div>

                    {/* Review Notes */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Observation Notes
                      </label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Document your observations and concerns..."
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                        rows="4"
                      />
                    </div>

                    {/* Follow-up Recommendation */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Follow-up Recommendation
                      </label>
                      <textarea
                        value={followUpRec}
                        onChange={(e) => setFollowUpRec(e.target.value)}
                        placeholder="Recommended next steps (e.g., clinic visit, re-assessment date, referral)..."
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                        rows="3"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => submitReview('approved')}
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-6 rounded-xl disabled:from-gray-400 disabled:to-gray-400 transition duration-200 transform hover:scale-105"
                    >
                      {submitting ? '⏳ Processing...' : '✅ Usable (Approve)'}
                    </button>
                    <button
                      onClick={() => submitReview('rejected')}
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-6 rounded-xl disabled:from-gray-400 disabled:to-gray-400 transition duration-200 transform hover:scale-105"
                    >
                      {submitting ? '⏳ Processing...' : '❌ Not Usable (Reject)'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-16 text-center">
                <div className="text-6xl mb-4">📹</div>
                <p className="text-gray-600 text-lg font-medium">Select a video to review</p>
                <p className="text-gray-500 text-sm mt-2">Choose from the list on the left to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
