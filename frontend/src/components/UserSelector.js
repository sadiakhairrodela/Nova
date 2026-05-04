import React, { useContext } from 'react';
import { UserContext } from '../context/UserContext';

const UserSelector = ({ onSelectUser }) => {
  const { users } = useContext(UserContext);

  const caregivers = users.filter(u => u.role === 'caregiver');
  const admins = users.filter(u => u.role === 'admin');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white px-8 py-8">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-4xl">👶</span>
            <h2 className="text-4xl font-bold">ddodle</h2>
          </div>
          <p className="text-blue-100 mt-2 text-lg">Baby Video Assessment System</p>
          <p className="text-blue-200 mt-4 font-medium">Select your account to begin</p>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-180px)] p-8 bg-gray-50">
          {/* Caregivers Section */}
          <div className="mb-12">
            <div className="flex items-center space-x-2 mb-6">
              <div className="bg-blue-100 p-2 rounded-lg">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Caregivers</h3>
                <p className="text-sm text-gray-600">Upload and manage baby videos</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {caregivers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  className="text-left p-6 bg-white rounded-2xl border-2 border-blue-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 group transform hover:scale-105 hover:bg-blue-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-blue-100 p-3 rounded-xl group-hover:bg-blue-200 transition">
                      <span className="text-2xl">👩‍🍼</span>
                    </div>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                      Caregiver
                    </span>
                  </div>
                  <div className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition">
                    {user.name}
                  </div>
                  <div className="text-sm text-gray-600 mt-2 flex items-center space-x-2">
                    <span>📧</span>
                    <span>{user.email}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-2 flex items-center space-x-2">
                    <span>📱</span>
                    <span>{user.phone}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center space-x-4 my-8">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500 font-medium text-sm">OR</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Admins Section */}
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="bg-red-100 p-2 rounded-lg">
                <span className="text-2xl">👨‍💼</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Review Specialists</h3>
                <p className="text-sm text-gray-600">Review and assess baby videos</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {admins.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  className="text-left p-6 bg-white rounded-2xl border-2 border-red-200 hover:border-red-500 hover:shadow-lg transition-all duration-200 group transform hover:scale-105 hover:bg-red-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-red-100 p-3 rounded-xl group-hover:bg-red-200 transition">
                      <span className="text-2xl">🔍</span>
                    </div>
                    <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                      Reviewer
                    </span>
                  </div>
                  <div className="font-bold text-gray-900 text-lg group-hover:text-red-600 transition">
                    {user.name}
                  </div>
                  <div className="text-sm text-gray-600 mt-2 flex items-center space-x-2">
                    <span>📧</span>
                    <span>{user.email}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-xs font-semibold text-red-600 inline-block bg-red-50 px-3 py-1 rounded-full">
                      ✓ Reviewer Access
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-8 py-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-600">
            🔒 Your account is secure and all videos are encrypted
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserSelector;
