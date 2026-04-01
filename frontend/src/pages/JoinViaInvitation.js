import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import axios from 'axios';
import toast from 'react-hot-toast';
import { setSessionAuth } from '../store/authSlice';
import { API_URL } from '../config/api';

// Google OAuth Button Component
const GoogleLoginButton = ({ onClick, loading }) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-blue-500 text-gray-700 font-semibold py-3 rounded-lg transition disabled:opacity-50"
    >
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <image href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%234285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/%3E%3Cpath fill='%2334A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/%3E%3Cpath fill='%23FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/%3E%3Cpath fill='%23EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/%3E%3C/svg%3E" width="24" height="24" />
      </svg>
      {loading ? 'Connecting...' : 'Sign in with Google'}
    </button>
  );
};

const JoinViaInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [invitationData, setInvitationData] = useState(null);
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided');
      setLoading(false);
      return;
    }
    fetchInvitationDetails();
  }, [token]);

  const fetchInvitationDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/oauth/invitation/${token}`);
      setInvitationData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setSigningIn(true);

      // Sign in with Google using Firebase
      const result = await signInWithPopup(auth, googleProvider);
      
      // Get user info from Firebase
      const googleUser = result.user;

      // Accept invitation with Google credentials
      const response = await axios.post(`${API_URL}/api/oauth/accept-invitation`, {
        invitationToken: token,
        googleEmail: googleUser.email,
        googleName: googleUser.displayName,
        googleId: googleUser.uid
      });

      dispatch(
        setSessionAuth({
          token: response.data.token,
          user: response.data.user,
          company: response.data.company,
        }),
      );

      toast.success(response.data.message);

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 400);
    } catch (error) {
      // Handle Firebase errors
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in was cancelled');
      } else if (error.code === 'auth/network-request-failed') {
        toast.error('Network error. Please check your connection');
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to join workspace. Please try again');
      }
      console.error('Error:', error);
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Invitation Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">You're Invited!</h1>
          <p className="text-gray-600">to join</p>
          <h2 className="text-2xl font-bold text-blue-600 mt-2">{invitationData?.company?.displayName}</h2>
        </div>

        {/* Invitation Details */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Your Email</p>
              <p className="font-semibold text-gray-900">{invitationData?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Your Role</p>
              <p className="font-semibold text-blue-600 uppercase">{invitationData?.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Invitation Expires</p>
              <p className="font-semibold text-gray-900">
                {new Date(invitationData?.expiresAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Google Sign-In Button */}
        <GoogleLoginButton onClick={handleGoogleSignIn} loading={signingIn} />

        <p className="text-center text-gray-600 text-sm mt-6">
          Sign in with the Google account associated with <strong>{invitationData?.email}</strong>
        </p>

        <p className="text-center text-gray-500 text-xs mt-6 border-t pt-4">
          Your profile has been created by the administrator. Just sign in to get started!
        </p>
      </div>
    </div>
  );
};

export default JoinViaInvitation;
