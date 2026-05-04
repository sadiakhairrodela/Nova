import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';

const TYPE_CFG = {
  video_received:      { icon: '📹', color: 'bg-blue-50 border-blue-200' },
  re_record_requested: { icon: '🔄', color: 'bg-orange-50 border-orange-200' },
  review_completed:    { icon: '✅', color: 'bg-green-50 border-green-200' },
  follow_up_due:       { icon: '📅', color: 'bg-purple-50 border-purple-200' },
  query_response:      { icon: '💬', color: 'bg-indigo-50 border-indigo-200' },
  general:             { icon: '🔔', color: 'bg-gray-50 border-gray-200' },
};

const timeAgo = (d) => {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const Toggle = ({ value, onChange }) => (
  <button onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-300'}`}>
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const NotificationCenter = () => {
  const { currentUser } = useContext(UserContext);
  const [notifications, setNotifications] = useState([]);
  const [prefs, setPrefs]   = useState(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('notifications');

  useEffect(() => {
    loadNotifications();
    loadPrefs();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await axios.get(`/api/notifications/${currentUser.id}`);
      setNotifications(res.data.notifications);
      setUnread(res.data.unreadCount);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadPrefs = async () => {
    try {
      const res = await axios.get(`/api/notifications/prefs/${currentUser.id}`);
      setPrefs(res.data);
    } catch (e) { console.error(e); }
  };

  const markRead = async (id) => {
    await axios.post('/api/notifications/read', { userId: currentUser.id, notificationId: id });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await axios.post('/api/notifications/read', { userId: currentUser.id });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setUnread(0);
  };

  const updatePref = async (key, val) => {
    const updated = { ...prefs, [key]: val };
    setPrefs(updated);
    await axios.put('/api/notifications/prefs', { userId: currentUser.id, ...updated });
  };

  const PREF_CHANNELS = [
    { key: 'email_enabled', label: '📧 Email Notifications',    desc: 'Receive updates by email' },
    { key: 'sms_enabled',   label: '📱 SMS Notifications',      desc: 'Receive text message alerts' },
  ];
  const PREF_EVENTS = [
    { key: 'video_received',      label: 'Video Received',       desc: 'When your video submission is received' },
    { key: 're_record_requested', label: 'Re-record Requested',  desc: 'When a re-submission is needed' },
    { key: 'review_completed',    label: 'Review Completed',     desc: 'When your video has been reviewed' },
    { key: 'follow_up_due',       label: 'Follow-up Due',        desc: 'Upcoming appointment reminders' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notification Center</h1>
          <p className="text-gray-500 mt-1">{unread > 0 ? `${unread} unread notification${unread !== 1 ? 's' : ''}` : 'All caught up!'}</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
            Mark All Read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-6">
        {['notifications', 'preferences'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition ${
              tab === t ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'notifications' ? `🔔 Notifications${unread > 0 ? ` (${unread})` : ''}` : '⚙️ Preferences'}
          </button>
        ))}
      </div>

      {tab === 'notifications' ? (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <span className="text-5xl block mb-4">🔔</span>
              <p className="text-gray-500">No notifications yet.</p>
            </div>
          ) : notifications.map(n => {
            const cfg = TYPE_CFG[n.type] || TYPE_CFG.general;
            return (
              <div key={n.id}
                className={`rounded-2xl border p-4 flex items-start space-x-4 transition ${cfg.color} ${!n.is_read ? 'shadow-sm' : 'opacity-60'}`}>
                <span className="text-2xl mt-0.5 flex-shrink-0">{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <button onClick={() => markRead(n.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap flex-shrink-0">
                    Mark read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {prefs ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Delivery Channels</h3>
                <div className="space-y-3">
                  {PREF_CHANNELS.map(p => (
                    <div key={p.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{p.label}</p>
                        <p className="text-xs text-gray-500">{p.desc}</p>
                      </div>
                      <Toggle value={!!prefs[p.key]} onChange={() => updatePref(p.key, prefs[p.key] ? 0 : 1)} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Notification Events</h3>
                <div className="space-y-3">
                  {PREF_EVENTS.map(p => (
                    <div key={p.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{p.label}</p>
                        <p className="text-xs text-gray-500">{p.desc}</p>
                      </div>
                      <Toggle value={!!prefs[p.key]} onChange={() => updatePref(p.key, prefs[p.key] ? 0 : 1)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : <div className="text-center py-8 text-gray-400">Loading preferences…</div>}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
