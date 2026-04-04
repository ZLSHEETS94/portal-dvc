import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import MyGroupsPage from './pages/MyGroupsPage';
import GroupDetailsPage from './pages/GroupDetailsPage';
import PostDetailPage from './pages/PostDetailPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="/groups" element={
          <ProtectedRoute>
            <MyGroupsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/groups/:id" element={
          <ProtectedRoute>
            <GroupDetailsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        
        <Route path="/groups/:groupId/days/:dayId/posts/:postId" element={
          <ProtectedRoute>
            <PostDetailPage />
          </ProtectedRoute>
        } />
        
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}
