import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);

  // Not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Not super admin
  if (user?.role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Only Super Admin can access this page.</p>
          <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Super admin - allow access
  return children;
};

export default AdminRoute;
