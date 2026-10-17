// src/components/layout/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useSystemStore } from '../../store/useSystemStore';
import MaintenanceOverlay from '../common/MaintenanceOverlay';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, role } = useAuthStore();
  const isMaintenanceMode = useSystemStore((state) => state.isMaintenanceMode);

  // 1. Unauthenticated -> Redirect to Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Global Maintenance Mode Active -> Block standard users
  if (isMaintenanceMode && role !== 'admin') {
    return <MaintenanceOverlay />;
  }

  // 3. Unauthorized Role -> Redirect based on user privilege
  if (allowedRoles && !allowedRoles.includes(role)) {
    return role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />;
  }

  // Render nested child routes
  return <Outlet />;
};

export default ProtectedRoute;