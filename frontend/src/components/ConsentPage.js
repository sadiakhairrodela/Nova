import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';

const ConsentPage = () => {
  const { currentUser } = useContext(UserContext);
  const [consent, setConsent] = useState(null);
  const [accessList, setAccessList] = useState([]);
  const [grantEmail, setGrantEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await axios.get(`/api/consent/${currentUser.id}`);
      setConsent(res.data.consent);
      setAccessList(res.data.accessList);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const giveConsent = async () => {
    await axios.post('/api/consent/give', { userId: currentUser.id });
    flash('✅ Consent recorded successfully.');
    load();
  };

  const withdrawConsent = async () => {
    if (!window.confirm('Withdraw consent? This may limit platform access.')) return;
    await axios.post('/api/consent/withdraw', { userId: currentUser.id });
    flash('Consent withdrawn.', 'warn');
    load();
  };

  const grantAccess = async () => {
    if (!grantEmail.trim()) return;
    try {
      const res = await axios.post('/api/consent/access/grant', {
        userId: currentUser.id, grantedToEmail: grantEmail
      });
      setGrantEmail('');
      flash(`✅ Access granted to ${res.data.grantedTo}`);
      load();
    } catch (e) { flash('❌ ' + (e.response?.data?.message || e.message), 'error'); }
  };

  const revokeAccess = async (revokeFromId, name) => {
    if (!window.confirm(`Revoke access for ${name}?`)) return;
    await axios.post('/api/consent/access/revoke', { userId: currentUser.id, revokeFromId });
    flash(`Access revoked for ${name}.`, 'warn');
    load();
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
    </div>
  );

  const hasConsent = consent?.consented === 1 || consent?.consented === true;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Consent &amp; Data Sharing</h1>
      <p className="text-gray-500 mb-8">Manage your data privacy settings and control who can access your information.</p>

      {msg.text && (
        <div className={`mb-6 p-4 rounded-xl text-sm border ${
          msg.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          msg.type === 'warn'  ? 'bg-orange-50 border-orange-200 text-orange-800' :
                                 'bg-green-50 border-green-200 text-green-800'}`}>
          {msg.text}
        </div>
      )}

      {/* Consent Status Card */}
      <div className={`rounded-2xl p-6 mb-6 border-2 ${hasConsent ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Privacy Consent</h2>
            <p className={`text-sm mt-1 font-medium ${hasConsent ? 'text-green-700' : 'text-orange-700'}`}>
              {hasConsent
                ? `✅ Consent given on ${new Date(consent.consented_at).toLocaleDateString()}`
                : '⚠️ Consent not yet provided'}
            </p>
          </div>
          {hasConsent
            ? <button onClick={withdrawConsent}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-200 transition">
                Withdraw Consent
              </button>
            : <button onClick={giveConsent}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">
                Give Consent
              </button>
          }
        </div>
      </div>

      {/* Privacy Policy */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-3">📄 Privacy Policy Summary</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          {[
            "Your baby's video data is stored securely and used only for developmental assessment purposes.",
            'Data is shared only with healthcare professionals you explicitly grant access to.',
            'You can withdraw consent or request data deletion at any time.',
            'All data transfers are encrypted and comply with healthcare data regulations.',
            "Your data will not be sold or shared with third parties without your explicit consent.",
          ].map((item, i) => (
            <li key={i} className="flex items-start space-x-2">
              <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Access Management */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-2">👥 Access Management</h3>
        <p className="text-sm text-gray-500 mb-4">Control which doctors or assessors can view your data.</p>
        <div className="flex space-x-3 mb-6">
          <input type="email" placeholder="Enter clinician's email address…"
            value={grantEmail} onChange={e => setGrantEmail(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && grantAccess()}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={grantAccess}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            Grant Access
          </button>
        </div>
        {accessList.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No one currently has access to your data.</p>
        ) : (
          <div className="space-y-2">
            {accessList.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{a.name}</p>
                  <p className="text-xs text-gray-500">{a.email} · {a.role}</p>
                </div>
                <button onClick={() => revokeAccess(a.granted_to_id, a.name)}
                  className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsentPage;
