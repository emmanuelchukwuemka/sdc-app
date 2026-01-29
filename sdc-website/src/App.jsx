import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Lazy load pages for better performance
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const RoleSelection = React.lazy(() => import('./pages/RoleSelection'));
const ForgetPassword = React.lazy(() => import('./pages/ForgetPassword'));
const PasswordResetConfirm = React.lazy(() => import('./pages/PasswordResetConfirm'));
const VerifyEmail = React.lazy(() => import('./pages/VerifyEmail'));

function App() {
  return (
    <Router>
      <React.Suspense fallback={<div className="loading-screen">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgetPassword />} />
          <Route path="/reset-password" element={<PasswordResetConfirm />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/role-selection" element={<RoleSelection />} />
          <Route path="/dashboard/*" element={<Dashboard />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </React.Suspense>
    </Router>
  );
}

export default App;
