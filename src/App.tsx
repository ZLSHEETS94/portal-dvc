import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import MyGroupsPage from './pages/MyGroupsPage';
import GroupDetailsPage from './pages/GroupDetailsPage';
import PostDetailPage from './pages/PostDetailPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/groups" element={<MyGroupsPage />} />
        <Route path="/groups/:id" element={<GroupDetailsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/groups/:groupId/days/:dayId/posts/:postId" element={<PostDetailPage />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}
