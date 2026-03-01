import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/Login';
import RegisterMultiTenant from './pages/RegisterMultiTenant';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Companies from './pages/Companies';
import Deals from './pages/Deals';
import Activities from './pages/Activities';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import Employees from './pages/Employees';
import JoinViaInvitation from './pages/JoinViaInvitation';
import EmployeeProfile from './pages/EmployeeProfile';
import Colleagues from './pages/Colleagues';
import EmailTracking from './pages/EmailTracking';
import Meetings from './pages/Meetings';

// Components
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

// Hooks
import { useAuthCheck } from './hooks/useAuthCheck';

function App() {
  // Check auth on mount and sync localStorage with Redux
  const { isAuthenticated, loading } = useAuthCheck();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <RegisterMultiTenant /> : <Navigate to="/" />} />
        <Route path="/join" element={!isAuthenticated ? <JoinViaInvitation /> : <Navigate to="/" />} />
        
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><EmployeeProfile /></PrivateRoute>} />
        <Route path="/colleagues" element={<PrivateRoute><Colleagues /></PrivateRoute>} />
        <Route path="/emails" element={<PrivateRoute><EmailTracking /></PrivateRoute>} />
        <Route path="/meetings" element={<PrivateRoute><Meetings /></PrivateRoute>} />
        <Route path="/contacts" element={<PrivateRoute><Contacts /></PrivateRoute>} />
        <Route path="/companies" element={<PrivateRoute><Companies /></PrivateRoute>} />
        <Route path="/deals" element={<PrivateRoute><Deals /></PrivateRoute>} />
        <Route path="/activities" element={<PrivateRoute><Activities /></PrivateRoute>} />
        <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
        <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="/employees" element={<AdminRoute><Employees /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
