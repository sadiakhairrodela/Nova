import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';

const ACTION_COLOR = {
  view:     'bg-blue-100 text-blue-700',
  download: 'bg-indigo-100 text-indigo-700',
  update:   'bg-yellow-100 text-yellow-700',
  delete:   'bg-red-100 text-red-700',
  login:    'bg-green-100 text-green-700',
  logout:   'bg-gray-100 text-gray-700',
  approve:  'bg-emerald-100 text-emerald-700',
  reject:   'bg-rose-100 text-rose-700',
  create:   'bg-purple-100 text-purple-700',
};

const AuditLog = () => {
  const { currentUser } = useContext(UserContext);
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: '', resourceType: '' });

  const loadLogs = async (f = filters) => {
    try {
      setLoading(true);
      const params = {};
      if (f.action)       params.action       = f.action;
      if (f.resourceType) params.resourceType  = f.resourceType;
      const res = await axios.get('/api/audit', { params });
      setLogs(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadLogs(); }, []);

  const applyFilter = (key, val) => {
    const next = { ...filters, [key]: val };
    setFilters(next);
    loadLogs(next);
  };

  const exportCSV = () => {
    const headers = ['ID', 'User', 'Role', 'Action', 'Resource', 'Resource ID', 'Details', 'Timestamp'];
    const rows = logs.map(l => [
      l.id, l.user_name, l.user_role, l.action,
      l.resource_type, l.resource_id || '', l.details || '',
      new Date(l.created_at).toLocaleString()
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Log Dashboard</h1>
          <p className="text-gray-500 mt-1">Track all system actions performed by users</p>
        </div>
        <button onClick={exportCSV}
          className="px-4 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition">
          ⬇ Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Action</label>
          <select value={filters.action} onChange={e => applyFilter('action', e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Actions</option>
            {['view','download','update','delete','login','logout','approve','reject','create'].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Resource</label>
          <select value={filters.resourceType} onChange={e => applyFilter('resourceType', e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Resources</option>
            {['video','report','profile','audit','user','query','consent'].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={() => { setFilters({ action: '', resourceType: '' }); loadLogs({ action: '', resourceType: '' }); }}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200 transition">
            Clear Filters
          </button>
        </div>
        <div className="ml-auto flex items-end">
          <span className="text-sm text-gray-500">{logs.length} records</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <span className="text-5xl block mb-4">📊</span>
          <p className="text-gray-500">No audit records found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['#', 'User', 'Role', 'Action', 'Resource', 'Details', 'Timestamp'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log, i) => (
                  <tr key={log.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-3 text-gray-400 text-xs">{log.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{log.user_name}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{log.user_role}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ACTION_COLOR[log.action] || 'bg-gray-100 text-gray-600'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{log.resource_type}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate" title={log.details}>{log.details || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
