import React, { useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';

const Login = () => {
  const { setCurrentUser } = useContext(UserContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate credentials against backend
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      if (response.data.success && response.data.user) {
        // Save user to context and localStorage
        setCurrentUser(response.data.user);
        localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-block bg-blue-100 p-4 rounded-2xl mb-4">
              <span className="text-5xl">👶</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">ddodle</h1>
            <p className="text-gray-600 mt-2 text-lg">Baby Video Assessment System</p>
            <div className="mt-4 h-1 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto"></div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-700 font-medium">❌ {error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                📧 Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition text-gray-900 placeholder-gray-500"
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                🔒 Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition text-gray-900 placeholder-gray-500"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900 transition"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl disabled:from-gray-400 disabled:to-gray-400 transition duration-200 text-lg transform hover:scale-105 active:scale-95"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <span className="inline-block animate-spin">⏳</span>
                  <span>Signing in...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <span>🔓 Sign In</span>
                </span>
              )}
            </button>
          </form>

          {/* Demo Credentials Info */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600 mb-4 font-medium">Demo Credentials:</p>
            <div className="space-y-2 text-xs bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-700">
                <span className="font-semibold">Caregiver:</span> maria.garcia@email.com / password123
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Admin:</span> dr.patel@ddodle.local / adminpass123
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-600">
              🔒 Your credentials are secure and encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
