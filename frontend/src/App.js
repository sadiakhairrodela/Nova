import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserContext } from './context/UserContext';
import Login            from './components/Login';
import Header           from './components/Header';
import VideoUploader    from './components/VideoUploader';
import AdminDashboard   from './components/AdminDashboard';
import BabyProfiles     from './components/BabyProfiles';
import CommunityPage    from './components/CommunityPage';
import ConsentPage      from './components/ConsentPage';
import ExpertAdvicePage from './components/ExpertAdvicePage';
import NotificationCenter from './components/NotificationCenter';
import VideoTimeline    from './components/VideoTimeline';
import ScreeningReport  from './components/ScreeningReport';
import FollowUpManager  from './components/FollowUpManager';
import AuditLog         from './components/AuditLog';
import DataRetention    from './components/DataRetention';
import Chatbot          from './components/Chatbot';
import './index.css';

function App() {
  const { currentUser, loading } = useContext(UserContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-700">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-blue-200 mx-auto"></div>
            <p className="mt-6 text-white font-semibold text-lg">Loading ddodle...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  const isAdmin     = currentUser.role === 'admin';
  const isCaregiver = currentUser.role === 'caregiver';

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header currentUser={currentUser} />
        <main>
          <Routes>
            {/* Home — role-based dashboard */}
            <Route path="/"
              element={isCaregiver ? <VideoUploader /> : <AdminDashboard />} />

            {/* Caregiver pages */}
            <Route path="/babies"        element={isCaregiver ? <BabyProfiles /> : <Navigate to="/" replace />} />
            <Route path="/timeline"      element={<VideoTimeline />} />
            <Route path="/community"     element={<CommunityPage />} />
            <Route path="/consent"       element={<ConsentPage />} />
            <Route path="/advice"        element={<ExpertAdvicePage />} />
            <Route path="/notifications" element={<NotificationCenter />} />
            <Route path="/privacy"       element={<DataRetention />} />

            {/* Admin-only pages */}
            <Route path="/reports"
              element={isAdmin ? <ScreeningReport /> : <Navigate to="/" replace />} />
            <Route path="/followup"
              element={isAdmin ? <FollowUpManager /> : <Navigate to="/" replace />} />
            <Route path="/audit"
              element={isAdmin ? <AuditLog /> : <Navigate to="/" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* AI chatbot — visible to caregivers */}
        {isCaregiver && <Chatbot />}
      </div>
    </Router>
  );
}

export default App;

