import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';

const RISK_GROUPS = ['standard', 'low', 'moderate', 'high'];
const GENDERS     = ['', 'male', 'female', 'other'];

const emptyForm = { name: '', birthDate: '', gender: '', riskGroup: 'standard', notes: '' };

export default function BabyProfiles() {
  const { currentUser } = useContext(UserContext);
  const [babies,   setBabies]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBaby,  setEditBaby]  = useState(null); // null = create mode
  const [form,      setForm]      = useState(emptyForm);
  const [error,     setError]     = useState('');
  const [saving,    setSaving]    = useState(false);
  const [deleteId,  setDeleteId]  = useState(null);

  useEffect(() => { fetchBabies(); }, []);

  const fetchBabies = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/videos/babies/${currentUser.id}`);
      setBabies(res.data);
    } catch (e) {
      setError('Could not load babies: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditBaby(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (baby) => {
    setEditBaby(baby);
    setForm({
      name:      baby.name,
      birthDate: baby.birth_date ? baby.birth_date.slice(0, 10) : '',
      gender:    baby.gender || '',
      riskGroup: baby.risk_group || 'standard',
      notes:     baby.notes || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.birthDate) {
      setError('Name and birth date are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editBaby) {
        const res = await axios.put(`/api/videos/babies/${editBaby.id}`, {
          userId:    currentUser.id,
          name:      form.name.trim(),
          birthDate: form.birthDate,
          gender:    form.gender,
          riskGroup: form.riskGroup,
          notes:     form.notes,
        });
        setBabies(prev => prev.map(b => b.id === editBaby.id ? res.data : b));
      } else {
        const res = await axios.post('/api/videos/babies', {
          userId:    currentUser.id,
          name:      form.name.trim(),
          birthDate: form.birthDate,
          gender:    form.gender,
          riskGroup: form.riskGroup,
          notes:     form.notes,
        });
        setBabies(prev => [res.data, ...prev]);
      }
      setShowModal(false);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (babyId) => {
    try {
      await axios.delete(`/api/videos/babies/${babyId}`, {
        data: { userId: currentUser.id },
      });
      setBabies(prev => prev.filter(b => b.id !== babyId));
      setDeleteId(null);
    } catch (e) {
      alert(e.response?.data?.error || 'Could not delete baby profile.');
    }
  };

  const ageLabel = (birthDate) => {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const now   = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months < 24) return `${months} month${months !== 1 ? 's' : ''}`;
    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? 's' : ''}`;
  };

  const riskBadge = (rg) => {
    const map = {
      high:     'bg-red-100 text-red-700',
      moderate: 'bg-orange-100 text-orange-700',
      low:      'bg-yellow-100 text-yellow-700',
      standard: 'bg-green-100 text-green-700',
    };
    return map[rg] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Baby Profiles</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all babies under your account</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl shadow text-sm transition"
        >
          + Add Baby
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16 text-gray-400">Loading profiles…</div>
      )}

      {/* Empty state */}
      {!loading && babies.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-4xl mb-3">👶</p>
          <p className="text-gray-500 font-medium">No baby profiles yet.</p>
          <p className="text-sm text-gray-400 mt-1">Click <strong>+ Add Baby</strong> to create your first profile.</p>
        </div>
      )}

      {/* Baby cards */}
      {!loading && babies.length > 0 && (
        <div className="space-y-4">
          {babies.map(baby => (
            <div key={baby.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                    {baby.gender === 'female' ? '👧' : baby.gender === 'male' ? '👦' : '👶'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{baby.name}</p>
                    <p className="text-sm text-gray-500">
                      {baby.birth_date ? new Date(baby.birth_date).toLocaleDateString() : '—'}
                      {baby.birth_date && <span className="ml-2 text-gray-400">· {ageLabel(baby.birth_date)} old</span>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(baby)}
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >Edit</button>
                  <button
                    onClick={() => setDeleteId(baby.id)}
                    className="text-sm text-red-500 hover:underline font-medium"
                  >Delete</button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${riskBadge(baby.risk_group)}`}>
                  {baby.risk_group ? baby.risk_group.charAt(0).toUpperCase() + baby.risk_group.slice(1) : 'Standard'} Risk
                </span>
                {baby.gender && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700 capitalize">
                    {baby.gender}
                  </span>
                )}
              </div>

              {baby.notes && (
                <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed">
                  {baby.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editBaby ? `Edit — ${editBaby.name}` : 'Add New Baby'}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Baby's Name *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="e.g. Sophia"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              {/* Birth date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date *</label>
                <input
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={form.birthDate}
                  onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))}
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                >
                  {GENDERS.map(g => (
                    <option key={g} value={g}>{g ? g.charAt(0).toUpperCase() + g.slice(1) : 'Prefer not to say'}</option>
                  ))}
                </select>
              </div>

              {/* Risk Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Group</label>
                <select
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={form.riskGroup}
                  onChange={e => setForm(f => ({ ...f, riskGroup: e.target.value }))}
                >
                  {RISK_GROUPS.map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  placeholder="Any relevant health notes, conditions, etc."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
              >Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
              >
                {saving ? 'Saving…' : editBaby ? 'Save Changes' : 'Add Baby'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <p className="text-3xl mb-2">🗑️</p>
            <p className="font-bold text-gray-800 text-lg mb-1">Delete Baby Profile?</p>
            <p className="text-sm text-gray-500 mb-5">
              This cannot be undone. Babies with submitted videos cannot be deleted.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
              >Cancel</button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition"
              >Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
