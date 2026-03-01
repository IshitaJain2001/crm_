import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const EmployeeRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Only allow employees (not superadmin or admin)
  if (user?.role === 'superadmin' || user?.role === 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

export default EmployeeRoute;
