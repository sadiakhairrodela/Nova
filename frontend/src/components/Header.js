import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const CAREGIVER_NAV = [
  { to: '/',             label: '🏠 Home' },
  { to: '/babies',       label: '👶 Baby Profiles' },
  { to: '/timeline',     label: '📋 Timeline' },
  { to: '/community',    label: '👥 Community' },
  { to: '/consent',      label: '✅ Consent' },
  { to: '/advice',       label: '💬 Expert Advice' },
  { to: '/notifications',label: '🔔 Notifications' },
  { to: '/privacy',      label: '🔒 Privacy' },
];

const ADMIN_NAV = [
  { to: '/',             label: '🏠 Dashboard' },
  { to: '/reports',      label: '📄 Reports' },
  { to: '/followup',     label: '📅 Follow-ups' },
  { to: '/advice',       label: '💬 Expert Advice' },
  { to: '/audit',        label: '📊 Audit Log' },
  { to: '/privacy',      label: '🗑️ Data Retention' },
  { to: '/notifications',label: '🔔 Notifications' },
];

const Header = ({ currentUser }) => {
  const { logout }   = useContext(UserContext);
  const location     = useLocation();
  const navItems     = currentUser.role === 'admin' ? ADMIN_NAV : CAREGIVER_NAV;
  const roleEmoji    = currentUser.role === 'admin' ? '👨‍💼' : '👩‍🍼';
  const roleLabel    = currentUser.role === 'admin' ? 'Review Specialist' : 'Caregiver';

  return (
    <header className="sticky top-0 z-40 shadow-md">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <span className="text-2xl">👶</span>
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">ddodle</h1>
              <p className="text-xs text-blue-100">Baby Assessment System</p>
            </div>
          </Link>

          <div className="flex items-center space-x-5">
            <div className="text-right">
              <p className="font-semibold text-sm">{currentUser.name}</p>
              <p className="text-xs text-blue-100">{roleEmoji} {roleLabel}</p>
            </div>
            <div className="w-px h-8 bg-blue-400 opacity-50"></div>
            <button
              onClick={() => { if (window.confirm('Sign out of ddodle?')) logout(); }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition flex items-center space-x-1.5">
              <span>🚪</span><span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-hide">
            {navItems.map(item => {
              const active = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;

