import React, { useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';

const VideoUploader = () => {
  const { currentUser } = useContext(UserContext);
  const [babies, setBabies] = useState([]);
  const [selectedBaby, setSelectedBaby] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [userVideos, setUserVideos] = useState([]);
  const [showVideoList, setShowVideoList] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');

  React.useEffect(() => {
    if (currentUser && currentUser.role === 'caregiver') {
      fetchBabies();
    }
  }, [currentUser]);

  const fetchBabies = async () => {
    try {
      const response = await axios.get(`/api/videos/babies/${currentUser.id}`);
      setBabies(response.data);
    } catch (error) {
      setMessage('Error loading babies: ' + error.message);
    }
  };

  const fetchVideosList = async (babyId) => {
    try {
      const response = await axios.get(`/api/videos/baby/${babyId}/videos`);
      setUserVideos(response.data);
      setShowVideoList(true);
    } catch (error) {
      setMessage('Error loading videos: ' + error.message);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setMessage('');
    } else {
      setMessage('Please select a valid video file');
    }
  };

  const uploadVideoInChunks = async (file, babyId) => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const MAX_RETRIES = 3;

    const uploadChunkWithRetry = async (chunk, index, videoId, retries = 0) => {
      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunkIndex', index);
      formData.append('totalChunks', totalChunks);
      formData.append('videoId', videoId);
      try {
        const response = await axios.post('/api/videos/upload-chunk', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const chunkProgress = (progressEvent.loaded / progressEvent.total) * 100;
            const totalProgress = (index + chunkProgress / 100) / totalChunks * 100;
            setUploadProgress(Math.round(totalProgress));
            setMessage(`Uploading... ${Math.round(totalProgress)}% (Part ${index + 1}/${totalChunks})`);
          }
        });
        return response;
      } catch (err) {
        if (retries < MAX_RETRIES) {
          setMessage(`Part ${index + 1} failed, retrying (${retries + 1}/${MAX_RETRIES})...`);
          await new Promise(r => setTimeout(r, 1500 * (retries + 1)));
          return uploadChunkWithRetry(chunk, index, videoId, retries + 1);
        }
        throw new Error(`Part ${index + 1} failed after ${MAX_RETRIES} retries: ${err.message}`);
      }
    };

    try {
      setMessage('Creating video entry...');
      const draftResponse = await axios.post('/api/videos/draft', {
        babyId,
        fileName: file.name
      });
      const { dbId: videoId } = draftResponse.data;
      setMessage('Preparing upload...');

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        const response = await uploadChunkWithRetry(chunk, i, videoId);
        if (response.data.success && response.data.filePath) {
          await submitVideo(videoId, babyId, file.name);
        }
      }

      setMessage('✅ Video uploaded successfully! Waiting for review...');
      setVideoFile(null);
      setUploadProgress(0);
      setTimeout(() => { fetchVideosList(babyId); }, 1000);
    } catch (error) {
      setMessage('❌ Upload failed: ' + error.message + '. Please try again.');
      setUploadProgress(0);
    }
  };

  const submitVideo = async (videoId, babyId, fileName) => {
    try {
      await axios.put(`/api/videos/submit/${videoId}`);
      setMessage('✅ Video submitted for review!');
    } catch (error) {
      console.error('Error submitting video:', error);
    }
  };

  const handleUpload = async () => {
    if (!selectedBaby || !videoFile) {
      setMessage('Please select a baby and video file');
      return;
    }

    setUploading(true);
    await uploadVideoInChunks(videoFile, selectedBaby);
    setUploading(false);
  };

  if (!currentUser) {
    return <div className="p-8 text-center">Please select a user first</div>;
  }

  if (currentUser.role !== 'caregiver') {
    return <div className="p-8 text-center">This section is for caregivers only</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <span className="text-3xl">🎥</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Upload Assessment Video</h1>
              <p className="text-gray-600 mt-1">Securely upload videos for professional review</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex space-x-1 bg-white rounded-lg shadow p-1">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📤 Upload New
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              if (selectedBaby) {
                fetchVideosList(selectedBaby);
              }
            }}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📋 My Videos
          </button>
        </div>

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                {/* Baby Selection */}
                <div className="mb-8">
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    Select Baby
                  </label>
                  <select
                    value={selectedBaby || ''}
                    onChange={(e) => setSelectedBaby(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  >
                    <option value="">Choose your baby...</option>
                    {babies.map((baby) => (
                      <option key={baby.id} value={baby.id}>
                        👶 {baby.name} · Age: {Math.floor((new Date() - new Date(baby.birth_date)) / (1000 * 60 * 60 * 24 * 30))} months
                      </option>
                    ))}
                  </select>
                </div>

                {/* File Upload Area */}
                <div className="mb-8">
                  <label className="block text-lg font-semibold text-gray-900 mb-3">
                    Video File
                  </label>
                  <div className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
                    videoFile
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                  } ${!selectedBaby ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      disabled={!selectedBaby}
                      className="hidden"
                      id="video-input"
                    />
                    <label htmlFor="video-input" className="cursor-pointer">
                      <div className="text-4xl mb-2">{videoFile ? '✅' : '🎬'}</div>
                      <div className="text-xl font-semibold text-gray-900">
                        {videoFile ? 'Video Selected' : 'Select Video File'}
                      </div>
                      <p className="text-gray-600 mt-1">Click to browse or drag and drop</p>
                    </label>
                    {videoFile && (
                      <div className="mt-4 text-left bg-white rounded-lg p-4">
                        <p className="font-semibold text-gray-900">{videoFile.name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Size: {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Button */}
                <button
                  onClick={handleUpload}
                  disabled={!videoFile || uploading || !selectedBaby}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl disabled:from-gray-400 disabled:to-gray-400 transition duration-200 text-lg transform hover:scale-105"
                >
                  {uploading ? `⏳ Uploading ${uploadProgress}%` : '🚀 Upload Video'}
                </button>

                {/* Progress Bar */}
                {uploading && (
                  <div className="mt-6">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-blue-400 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="mt-3 text-sm text-gray-600 text-center font-semibold">
                      {uploadProgress}% Complete
                    </p>
                  </div>
                )}

                {/* Message */}
                {message && (
                  <div
                    className={`mt-6 p-4 rounded-lg text-sm font-medium ${
                      message.includes('✅')
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : message.includes('❌')
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : 'bg-blue-100 text-blue-700 border border-blue-300'
                    }`}
                  >
                    {message}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Guidelines */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 sticky top-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">✅ Video Guidelines</h3>
                <ul className="space-y-4">
                  <li className="flex items-start space-x-3">
                    <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                    <span className="text-sm text-gray-700">Baby is calm and alert</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                    <span className="text-sm text-gray-700">Proper clothing visible</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                    <span className="text-sm text-gray-700">Entire body visible</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                    <span className="text-sm text-gray-700">3-5 minutes long</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                    <span className="text-sm text-gray-700">Good lighting and audio</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                    <span className="text-sm text-gray-700">Clear background</span>
                  </li>
                </ul>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    Your videos are securely uploaded and reviewed by certified professionals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            {!selectedBaby ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">Select a baby to view videos</p>
              </div>
            ) : userVideos.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📹</div>
                <p className="text-gray-600 text-lg">No videos uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userVideos.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center justify-between p-5 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">🎬</div>
                      <div>
                        <p className="font-semibold text-gray-900">{video.file_name}</p>
                        <p className="text-sm text-gray-600">
                          {(video.file_size / 1024 / 1024).toFixed(2)} MB · {Math.round(video.duration_seconds / 60)}m
                        </p>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-bold ${
                          video.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : video.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : video.status === 'under_review'
                            ? 'bg-yellow-100 text-yellow-700'
                            : video.status === 'submitted'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {video.status === 'draft' ? '📝 Draft' : video.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUploader;
