import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';
import Login from './components/Login';
import Register from './components/Register';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import JobListPage from './pages/JobListPage';
import JobDetailPage from './pages/JobDetailPage';
import FreelancersPage from './pages/FreelancersPage';
import PostJobPage from './pages/PostJobPage';
import ClientJobsPage from './pages/ClientJobsPage';
import NotificationsPage from './pages/NotificationsPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';
import ReviewPage from './pages/ReviewPage';
import BadgeSystem from './components/BadgeSystem';
import { Badge } from './types';

function App() {
  const [badgeNotifications, setBadgeNotifications] = useState<Badge[]>([]);

  const handleBadgeEarned = (badge: Badge) => {
    setBadgeNotifications(prev => [...prev, badge]);
  };

  const removeBadgeNotification = (badgeToRemove: Badge) => {
    setBadgeNotifications(prev => prev.filter(badge => badge.id !== badgeToRemove.id));
  };

  useEffect(() => {
    const initializeApp = () => {
      const StorageService = require('./utils/storage').StorageService;
      StorageService.initializeData();
    };

    initializeApp();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/dashboard" element={
              <AuthGuard>
                <Layout><DashboardPage /></Layout>
              </AuthGuard>
            } />
            
            <Route path="/freelancer/dashboard" element={
              <AuthGuard requiredUserType="freelancer">
                <Layout><DashboardPage /></Layout>
              </AuthGuard>
            } />
            
            <Route path="/client/dashboard" element={
              <AuthGuard requiredUserType="client">
                <Layout><DashboardPage /></Layout>
              </AuthGuard>
            } />
            
            <Route path="/profile/:userId?" element={
              <AuthGuard>
                <Layout><ProfilePage /></Layout>
              </AuthGuard>
            } />
            
            <Route path="/freelancer/profile" element={
              <AuthGuard requiredUserType="freelancer">
                <Layout><ProfilePage /></Layout>
              </AuthGuard>
            } />
            
            <Route path="/jobs" element={
              <AuthGuard>
                <Layout><JobListPage /></Layout>
              </AuthGuard>
            } />
            
            <Route path="/jobs/:jobId" element={
              <AuthGuard>
                <Layout><JobDetailPage /></Layout>
              </AuthGuard>
            } />
            
            <Route path="/client/post-job" element={
              <AuthGuard requiredUserType="client">
                <Layout><PostJobPage /></Layout>
              </AuthGuard>
            } />
            
            <Route path="/client/jobs" element={
              <AuthGuard requiredUserType="client">
                <Layout><ClientJobsPage /></Layout>
              </AuthGuard>
            } />
            
            <Route path="/freelancers" element={
              <AuthGuard>
                <Layout><FreelancersPage /></Layout>
              </AuthGuard>
            } />
            
            <Route path="/messages" element={
              <AuthGuard>
                <Layout><MessagesPage /></Layout>
              </AuthGuard>
            } />
            
            <Route path="/reviews/:jobId" element={
              <AuthGuard>
                <Layout><ReviewPage /></Layout>
              </AuthGuard>
            } />
            
            <Route path="/notifications" element={
              <AuthGuard>
                <Layout><NotificationsPage /></Layout>
              </AuthGuard>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <BadgeSystem onBadgeEarned={handleBadgeEarned} />
          
          {badgeNotifications.map(badge => (
            <div key={badge.id} className="fixed top-20 right-4 z-50">
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm animate-slide-up">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="text-3xl">{badge.icon}</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Badge Earned!</h3>
                    <p className="text-gray-700 text-sm mt-1">{badge.name}</p>
                    <p className="text-gray-500 text-xs mt-1">{badge.description}</p>
                  </div>
                  <button
                    onClick={() => removeBadgeNotification(badge)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                    aria-label="Dismiss badge notification"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
