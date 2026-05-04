import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';

const STATUS_CFG = {
  pending:  { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
  approved: { color: 'bg-blue-100 text-blue-700',    label: 'Approved' },
  rejected: { color: 'bg-gray-100 text-gray-700',    label: 'Rejected' },
  purged:   { color: 'bg-red-100 text-red-700',      label: 'Purged' },
};

const DataRetention = () => {
  const { currentUser } = useContext(UserContext);
  const isAdmin = currentUser.role === 'admin';

  const [requests, setRequests] = useState([]);
  const [reason, setReason]     = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState({ text: '', type: '' });

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const url = isAdmin
        ? '/api/deletion'
        : `/api/deletion/user/${currentUser.id}`;
      const res = await axios.get(url);
      setRequests(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const submitRequest = async () => {
    if (!reason.trim()) return;
    try {
      await axios.post('/api/deletion', { userId: currentUser.id, reason });
      setReason('');
      flash('✅ Deletion request submitted. An admin will review it shortly.');
      load();
    } catch (e) { flash('❌ Failed to submit request.', 'error'); }
  };

  const updateRequest = async (id, status) => {
    if (!window.confirm(`Mark this request as "${status}"?`)) return;
    try {
      await axios.put(`/api/deletion/${id}`, {
        status, adminNotes: adminNote || null, reviewedBy: currentUser.id
      });
      setAdminNote('');
      flash(`Request marked as ${status}.`);
      load();
    } catch (e) { flash('❌ Error updating request.', 'error'); }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {isAdmin ? 'Data Retention Management' : 'Privacy & Data Deletion'}
      </h1>
      <p className="text-gray-500 mb-8">
        {isAdmin
          ? 'Review and action caregiver data deletion requests.'
          : 'Request deletion of your data. Your request will be reviewed by an admin.'}
      </p>

      {msg.text && (
        <div className={`mb-6 p-4 rounded-xl text-sm border ${
          msg.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                                 'bg-green-50 border-green-200 text-green-800'}`}>
          {msg.text}
        </div>
      )}

      {/* Caregiver: submit request */}
      {!isAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="font-bold text-gray-900 mb-4">🗑️ Request Data Deletion</h2>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-orange-800">
              <strong>⚠️ Important:</strong> Requesting deletion will remove all your data from ddodle, including baby profiles and videos.
              This action is reviewed by an administrator before being executed.
            </p>
          </div>
          <textarea
            placeholder="Please state your reason for requesting deletion…"
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          <button onClick={submitRequest}
            className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition">
            Submit Deletion Request
          </button>
        </div>
      )}

      {/* Requests list */}
      <div>
        <h2 className="font-bold text-gray-900 text-lg mb-4">
          {isAdmin ? `All Requests (${requests.length})` : 'My Requests'}
        </h2>

        {requests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <span className="text-4xl block mb-3">📂</span>
            <p className="text-gray-500">{isAdmin ? 'No deletion requests.' : 'You have no pending requests.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(r => {
              const sc = STATUS_CFG[r.status] || STATUS_CFG.pending;
              return (
                <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      {isAdmin && (
                        <p className="font-bold text-gray-900">{r.user_name}
                          <span className="ml-2 text-sm text-gray-400 font-normal">{r.user_email}</span>
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">"{r.reason}"</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Submitted: {new Date(r.created_at).toLocaleDateString()}
                        {r.reviewed_by_name && ` · Reviewed by: ${r.reviewed_by_name}`}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${sc.color}`}>{sc.label}</span>
                  </div>
                  {r.admin_notes && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                      <span className="font-semibold">Admin note: </span>{r.admin_notes}
                    </div>
                  )}
                  {isAdmin && r.status === 'pending' && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <input type="text" placeholder="Optional admin note…" value={adminNote}
                        onChange={e => setAdminNote(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      <div className="flex space-x-2">
                        <button onClick={() => updateRequest(r.id, 'approved')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition">
                          Approve
                        </button>
                        <button onClick={() => updateRequest(r.id, 'rejected')}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition">
                          Reject
                        </button>
                        <button onClick={() => updateRequest(r.id, 'purged')}
                          className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition">
                          Purge Data
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataRetention;
