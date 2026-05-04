import React from 'react';

const LandingPage = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Navbar */}
      <nav className="px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-500 p-2 rounded-lg">
            <span className="text-2xl">👶</span>
          </div>
          <span className="text-2xl font-bold">ddodle</span>
        </div>
        <button
          onClick={onGetStarted}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition"
        >
          Get Started
        </button>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Side */}
        <div>
          <div className="inline-block bg-blue-500 bg-opacity-20 text-blue-200 px-4 py-1 rounded-full text-sm font-semibold mb-6">
            Healthcare Innovation
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Professional Baby Assessment System
          </h1>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            ddodle provides a comprehensive platform for parents to securely upload and share baby assessment videos with healthcare professionals. Track development, manage reviews, and ensure quality care.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-blue-500 hover:bg-blue-600 rounded-lg font-bold text-lg transition duration-200 transform hover:scale-105"
            >
              Start Now
            </button>
            <button className="px-8 py-4 border-2 border-blue-400 hover:bg-blue-500 hover:bg-opacity-10 rounded-lg font-bold text-lg transition duration-200">
              Learn More
            </button>
          </div>
        </div>

        {/* Right Side - Features */}
        <div className="space-y-6">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="text-3xl mb-3">🎥</div>
            <h3 className="text-xl font-bold mb-2">Secure Upload</h3>
            <p className="text-gray-300">Upload videos with chunked transfer for reliable delivery on slow connections</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="text-3xl mb-3">✅</div>
            <h3 className="text-xl font-bold mb-2">Professional Review</h3>
            <p className="text-gray-300">Healthcare professionals review videos with detailed notes and recommendations</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-6 rounded-xl border border-white border-opacity-20">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-xl font-bold mb-2">Track Progress</h3>
            <p className="text-gray-300">Monitor your baby's development with comprehensive status tracking</p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white bg-opacity-5 backdrop-blur-sm border-y border-white border-opacity-10 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-400">1000+</div>
            <p className="text-gray-400 mt-2">Babies Tracked</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-400">500+</div>
            <p className="text-gray-400 mt-2">Healthcare Professionals</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-400">10K+</div>
            <p className="text-gray-400 mt-2">Videos Reviewed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
