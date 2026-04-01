import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Toaster } from "react-hot-toast";

// Store
import { logout } from "./store/authSlice";

// Pages
import Login from "./pages/Login";
import RegisterMultiTenant from "./pages/RegisterMultiTenant";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import Companies from "./pages/Companies";
import Deals from "./pages/Deals";
import DealsPipeline from "./pages/DealsPipeline";
import Activities from "./pages/Activities";
import Tasks from "./pages/Tasks";
import Settings from "./pages/Settings";
import Employees from "./pages/Employees";
import JoinViaInvitation from "./pages/JoinViaInvitation";
import EmployeeProfile from "./pages/EmployeeProfile";
import Colleagues from "./pages/Colleagues";
import EmailTracking from "./pages/EmailTracking";
import Meetings from "./pages/Meetings";
import Forms from "./pages/Forms";
import SimpleChat from "./pages/SimpleChat";
import Feedback from "./pages/Feedback";
import Analytics from "./pages/Analytics";
import WebsiteBuilder from "./pages/WebsiteBuilder";
import IndustrySelection from "./pages/IndustrySelection";

// Components
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";

// Utils
import { setupAxiosInterceptors } from "./utils/axiosInterceptor";
import { checkAuth } from "./store/authSlice";
import { API_URL } from "./config/api";

function App() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  // Setup axios interceptors for global auth error handling
  useEffect(() => {
    setupAxiosInterceptors();
  }, []);

  // Restore session from sessionStorage (or migrate legacy localStorage on first load)
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // Validate token periodically (every 30 seconds) to detect immediate deletion
  useEffect(() => {
    if (!token) return;

    const validateToken = async () => {
      try {
        // Make a lightweight validation request
        const response = await fetch(
          `${API_URL}/api/auth/validate`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!response.ok) {
          const data = await response.json();
          if (
            data.code === "ACCOUNT_DELETED" ||
            data.code === "COMPANY_DELETED"
          ) {
            console.warn("User/company was deleted - logging out");
            dispatch(logout());
            window.location.href = "/login";
          }
        }
      } catch (error) {
        // Network error - don't logout, just log
        console.error("Token validation error:", error);
      }
    };

    // Validate immediately on token change
    validateToken();

    // Then set up periodic validation
    const interval = setInterval(validateToken, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [token, dispatch]);

  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const loading = useSelector((state) => state.auth.loading);

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
    <Router future={{ v7_relativeSplatPath: true }}>
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/" />}
        />
        <Route
          path="/get-started"
          element={
            !isAuthenticated ? (
              <IndustrySelection />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/register"
          element={
            !isAuthenticated ? <RegisterMultiTenant /> : <Navigate to="/" />
          }
        />
        <Route
          path="/dashboard"
          element={<Navigate to="/" replace />}
        />
        <Route
          path="/forgot-password"
          element={
            !isAuthenticated ? <ForgotPassword /> : <Navigate to="/" />
          }
        />
        <Route
          path="/reset-password"
          element={
            !isAuthenticated ? <ResetPassword /> : <Navigate to="/" />
          }
        />
        <Route
          path="/join"
          element={
            !isAuthenticated ? <JoinViaInvitation /> : <Navigate to="/" />
          }
        />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <EmployeeProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="/colleagues"
          element={
            <PrivateRoute>
              <Colleagues />
            </PrivateRoute>
          }
        />
        <Route
          path="/emails"
          element={
            <PrivateRoute>
              <EmailTracking />
            </PrivateRoute>
          }
        />
        <Route
          path="/meetings"
          element={
            <PrivateRoute>
              <Meetings />
            </PrivateRoute>
          }
        />
        <Route
          path="/forms"
          element={
            <PrivateRoute>
              <Forms />
            </PrivateRoute>
          }
        />
        <Route
          path="/chatbots"
          element={
            <PrivateRoute>
              <SimpleChat />
            </PrivateRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <PrivateRoute>
              <Contacts />
            </PrivateRoute>
          }
        />
        <Route
          path="/companies"
          element={
            <PrivateRoute>
              <Companies />
            </PrivateRoute>
          }
        />
        <Route
          path="/deals"
          element={
            <PrivateRoute>
              <Deals />
            </PrivateRoute>
          }
        />
        <Route
          path="/pipeline"
          element={
            <PrivateRoute>
              <DealsPipeline />
            </PrivateRoute>
          }
        />
        <Route
          path="/activities"
          element={
            <PrivateRoute>
              <Activities />
            </PrivateRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <PrivateRoute>
              <Tasks />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <AdminRoute>
              <Settings />
            </AdminRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <AdminRoute>
              <Employees />
            </AdminRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <AdminRoute>
              <Feedback />
            </AdminRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <AdminRoute>
              <Analytics />
            </AdminRoute>
          }
        />
        <Route
          path="/website-builder"
          element={
            <AdminRoute>
              <WebsiteBuilder />
            </AdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
