import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserContext } from '../context/UserContext';

const STATUS_COLOR = {
  approved:         'bg-green-100 text-green-700',
  rejected:         'bg-red-100 text-red-700',
  pending_revision: 'bg-yellow-100 text-yellow-700',
};

const ScreeningReport = () => {
  const { currentUser } = useContext(UserContext);
  const [reviews, setReviews]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    axios.get('/api/reviews/all')
      .then(res => setReviews(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const downloadPDF = (review) => {
    // Log the download in the audit trail
    axios.post('/api/reviews/log-download', {
      userId: currentUser.id,
      videoId: review.video_id,
      babyName: review.baby_name,
    }).catch(() => {});

    const doc = new jsPDF();

    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('ddodle Baby Assessment Report', 14, 18);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 38);

    // Patient info
    autoTable(doc, {
      startY: 44,
      head: [['Field', 'Value']],
      body: [
        ['Baby Name',      review.baby_name],
        ['Date of Birth',  review.birth_date ? new Date(review.birth_date).toLocaleDateString() : '—'],
        ['Gender',         review.gender     || '—'],
        ['Risk Group',     review.risk_group || 'Standard'],
        ['Caregiver',      review.caregiver_name],
        ['Caregiver Email',review.caregiver_email],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    // Review details
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [['Review Field', 'Value']],
      body: [
        ['Video File',    review.file_name   || '—'],
        ['Review Status', review.review_status || '—'],
        ['Risk Flag',     review.risk_flag && review.risk_flag !== 'none' ? (review.risk_flag === 'high' ? '🔴 High Risk' : '🟡 Low Risk') : '🟢 None'],
        ['Quality Score', review.quality_score != null ? `${review.quality_score}/10` : '—'],
        ['Reviewed By',   review.reviewer_name],
        ['Reviewed At',   review.reviewed_at ? new Date(review.reviewed_at).toLocaleDateString() : '—'],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [79, 70, 229] },
    });

    // Reviewer notes
    const notesY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Reviewer Notes:', 14, notesY);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    const noteLines = doc.splitTextToSize(review.reviewer_notes || 'No notes provided.', 180);
    doc.text(noteLines, 14, notesY + 7);

    // Recommended next steps
    if (review.follow_up_recommendation) {
      const recY = notesY + 7 + noteLines.length * 5 + 8;
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Recommended Next Steps:', 14, recY);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      const recLines = doc.splitTextToSize(review.follow_up_recommendation, 180);
      doc.text(recLines, 14, recY + 7);
    }

    // Disclaimer
    const disclaimerY = doc.internal.pageSize.height - 20;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This report is for clinical use only. Not for distribution to third parties without consent.', 14, disclaimerY);

    doc.save(`ddodle-report-${review.baby_name}-${review.id}.pdf`);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Screening Reports</h1>
        <p className="text-gray-500 mt-1">View and download assessment reports for reviewed videos</p>
      </div>

      <div className="flex gap-6">
        {/* Review list */}
        <div className="flex-1 space-y-3">
          {reviews.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <span className="text-5xl block mb-4">📄</span>
              <p className="text-gray-500">No reviewed videos yet.</p>
            </div>
          ) : reviews.map(r => (
            <div key={r.id} onClick={() => setSelected(r)}
              className={`bg-white rounded-2xl border p-5 cursor-pointer hover:shadow-md transition ${
                selected?.id === r.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[r.review_status] || 'bg-gray-100 text-gray-600'}`}>
                  {r.review_status}
                </span>
                <span className="text-xs text-gray-400">
                  {r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString() : '—'}
                </span>
              </div>
              <h3 className="font-bold text-gray-900">👶 {r.baby_name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {r.file_name} · Reviewed by {r.reviewer_name}
              </p>
              {r.quality_score != null && (
                <p className="text-xs text-gray-400 mt-1">Quality: {r.quality_score}/10</p>
              )}
            </div>
          ))}
        </div>

        {/* Report detail */}
        {selected && (
          <div className="w-[420px] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
                <button onClick={() => downloadPDF(selected)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center space-x-1">
                  <span>⬇</span><span>Download PDF</span>
                </button>
              </div>
              <h2 className="font-bold text-gray-900 text-lg">👶 {selected.baby_name}</h2>
              <p className="text-sm text-gray-400 mt-1">{selected.file_name}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {selected.file_path && (
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-black">
                  <video
                    controls
                    className="w-full max-h-64"
                    src={selected.file_path}
                    onError={e => { e.target.parentElement.innerHTML = '<p class="text-center text-sm text-gray-400 py-6">Video file not found.</p>'; }}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Status',       value: selected.review_status },
                  { label: 'Quality',      value: selected.quality_score != null ? `${selected.quality_score}/10` : '—' },
                  { label: 'Reviewer',     value: selected.reviewer_name },
                  { label: 'Reviewed',     value: selected.reviewed_at ? new Date(selected.reviewed_at).toLocaleDateString() : '—' },
                  { label: 'Baby DOB',     value: selected.birth_date ? new Date(selected.birth_date).toLocaleDateString() : '—' },
                  { label: 'Risk Group',   value: selected.risk_group || 'Standard' },
                  { label: 'Caregiver',    value: selected.caregiver_name },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Reviewer Notes</p>
                <p className="text-sm text-gray-700 leading-relaxed">{selected.reviewer_notes || 'No notes provided.'}</p>
              </div>
              {selected.risk_flag && selected.risk_flag !== 'none' && (
                <div className={`rounded-xl p-4 border ${
                  selected.risk_flag === 'high' ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100'
                }`}>
                  <p className={`text-xs font-semibold mb-1 uppercase tracking-wide ${
                    selected.risk_flag === 'high' ? 'text-red-700' : 'text-yellow-700'
                  }`}>Risk Flag</p>
                  <p className="text-sm font-bold">
                    {selected.risk_flag === 'high' ? '🔴 High Risk' : '🟡 Low Risk'}
                  </p>
                </div>
              )}
              {selected.follow_up_recommendation && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <p className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">Recommended Next Steps</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selected.follow_up_recommendation}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScreeningReport;
