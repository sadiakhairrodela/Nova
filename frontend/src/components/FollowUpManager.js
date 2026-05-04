import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';

const STATUS_COLOR = {
  pending:     'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed:   'bg-green-100 text-green-700',
  overdue:     'bg-red-100 text-red-700',
};

const TYPE_ICON = {
  assessment:  '🔬',
  clinic_visit:'🏥',
  recheck:     '🔄',
  other:       '📋',
};

const FollowUpManager = () => {
  const { currentUser } = useContext(UserContext);
  const [tasks, setTasks]           = useState([]);
  const [babies, setBabies]         = useState([]);
  const [filter, setFilter]         = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    babyId: '', taskType: 'other', title: '', description: '', dueDate: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/followup'),
      axios.get('/api/followup/babies'),
    ]).then(([t, b]) => {
      setTasks(t.data);
      setBabies(b.data);
      if (b.data.length > 0) setForm(f => ({ ...f, babyId: String(b.data[0].id) }));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadTasks = () => axios.get('/api/followup').then(r => setTasks(r.data));

  const createTask = async () => {
    if (!form.babyId || !form.title || !form.dueDate) return;
    await axios.post('/api/followup', { ...form, clinicianId: currentUser.id });
    setForm(f => ({ ...f, title: '', description: '', dueDate: '' }));
    setShowCreate(false);
    loadTasks();
  };

  const updateStatus = async (id, status) => {
    await axios.put(`/api/followup/${id}`, { status });
    loadTasks();
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Follow-up Manager</h1>
          <p className="text-gray-500 mt-1">Set and track assessment tasks for each baby</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">
          + Add Task
        </button>
      </div>

      {/* Create task modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">New Follow-up Task</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Baby</label>
                <select value={form.babyId} onChange={e => setForm(f => ({ ...f, babyId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {babies.map(b => <option key={b.id} value={b.id}>{b.name} ({b.caregiver_name})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Task Type</label>
                <select value={form.taskType} onChange={e => setForm(f => ({ ...f, taskType: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="assessment">🔬 Assessment</option>
                  <option value="clinic_visit">🏥 Clinic Visit</option>
                  <option value="recheck">🔄 Recheck</option>
                  <option value="other">📋 Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input type="text" placeholder="Task title…" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description (optional)</label>
                <textarea placeholder="Additional notes…" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex space-x-3 mt-5">
              <button onClick={createTask}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">Create</button>
              <button onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex space-x-2 mb-6">
        {['all', 'pending', 'in_progress', 'completed', 'overdue'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition ${
              filter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {s} {s !== 'all' ? `(${tasks.filter(t => t.status === s).length})` : `(${tasks.length})`}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <span className="text-5xl block mb-4">📅</span>
          <p className="text-gray-500">No tasks found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(t => (
            <div key={t.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl mt-0.5">{TYPE_ICON[t.task_type] || '📋'}</span>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-bold text-gray-900">{t.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[t.status]}`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">👶 {t.baby_name} · 👤 {t.caregiver_name}</p>
                    {t.description && <p className="text-sm text-gray-600 mt-1">{t.description}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      Due: <span className="font-semibold text-gray-600">{new Date(t.due_date).toLocaleDateString()}</span>
                      &nbsp;· Assigned by: {t.clinician_name}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 flex-shrink-0">
                  {t.status !== 'completed' && (
                    <button onClick={() => updateStatus(t.id, 'completed')}
                      className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-semibold transition">
                      Complete
                    </button>
                  )}
                  {t.status === 'pending' && (
                    <button onClick={() => updateStatus(t.id, 'in_progress')}
                      className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold transition">
                      In Progress
                    </button>
                  )}
                  {t.status === 'pending' && (
                    <button onClick={() => updateStatus(t.id, 'overdue')}
                      className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold transition">
                      Mark Overdue
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FollowUpManager;
