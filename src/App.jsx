import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import CheckInPage from './pages/CheckInPage';
import RegistrationPage from './pages/RegistrationPage';
import AdminDashboard from './pages/AdminDashboard';
import VisitorLogsPage from './pages/VisitorLogsPage';
import UserManagementPage from './pages/UserManagementPage';
import AdminUserManagementPage from './pages/AdminUserManagementPage';

function ProtectedRoute({ children, requiredRole = null }) {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-neu-blue mx-auto mb-4"></div>
          <p className="text-dark-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/check-in" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, loading, userRole, userData } = useAuth();

  // Check if student user needs to complete registration
  const needsRegistration = user && userRole === 'student' && userData && (!userData.college || !userData.userType);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-neu-blue mx-auto mb-4"></div>
          <p className="text-dark-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          user ? (
            needsRegistration ? (
              <Navigate to="/register" replace />
            ) : userRole === 'admin' || userRole === 'super' ? (
              <Navigate to="/admin-dashboard" replace />
            ) : (
              <Navigate to="/check-in" replace />
            )
          ) : (
            <LoginPage />
          )
        } 
      />
      <Route
        path="/check-in"
        element={
          <ProtectedRoute>
            <CheckInPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/register"
        element={
          <ProtectedRoute>
            <RegistrationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/visitor-logs"
        element={
          <ProtectedRoute requiredRole="admin">
            <VisitorLogsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user-management"
        element={
          <ProtectedRoute requiredRole="super">
            <UserManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-user-management"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminUserManagementPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
