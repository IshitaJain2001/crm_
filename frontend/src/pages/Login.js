import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import axios from 'axios';
import { loginUser, setGoogleLogin } from '../store/authSlice';
import { FiMail, FiLock, FiLogIn, FiStar } from 'react-icons/fi';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { FcGoogle } from 'react-icons/fc';
import { API_URL } from '../config/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      // Use Redux loginUser action
      const result = await dispatch(loginUser({ email, password })).unwrap();
      
      // Also save company data
      sessionStorage.setItem('company', JSON.stringify(result.company));

      toast.success('Login successful!');
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (err) {
      const errorMsg = err || 'Login failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Send Google token to backend for verification
      const response = await axios.post(`${API_URL}/api/auth/google-login`, {
        idToken: await user.getIdToken(),
        email: user.email,
        displayName: user.displayName
      });

      // Save company data to sessionStorage
      sessionStorage.setItem('company', JSON.stringify(response.data.company));
      
      // Update Redux state using setGoogleLogin action
      dispatch(setGoogleLogin({
        token: response.data.token,
        user: response.data.user
      }));
      
      toast.success('Welcome back!');
      
      // Navigate to dashboard
      setTimeout(() => {
        navigate('/');
      }, 100);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Google sign-in failed';
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row lg:min-h-[600px]">
        
        {/* LEFT SIDE - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 relative overflow-hidden p-12 flex-col justify-between">
          {/* Animated background elements */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            {/* Icon */}
            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 hover:bg-white/30 transition duration-300">
              <FiStar size={48} className="text-white" />
            </div>
            
            {/* Main Heading */}
            <div className="mb-8">
              <h2 className="text-5xl font-bold text-white mb-2">Welcome Back!</h2>
              <p className="text-blue-100 text-lg font-medium">Sign in to your CRM account</p>
            </div>
            
            {/* Description */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8">
              <p className="text-white/90 text-sm leading-relaxed">
                Manage your contacts, deals, and customer relationships all in one powerful platform. Increase productivity through streamlined workflows and intelligent insights.
              </p>
            </div>
          </div>
          
          {/* Footer */}
          <div className="relative z-10">
            <p className="text-blue-100/70 text-xs font-medium">© 2024 CRM Platform. All rights reserved.</p>
          </div>
        </div>

        {/* RIGHT SIDE - Login Form */}
        <div className="w-full lg:w-1/2 bg-white lg:bg-gray-50 p-6 lg:p-10 flex flex-col justify-center overflow-y-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">CRM</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-900 font-bold">CRM</span>
              <span className="text-gray-500 text-xs">Platform</span>
            </div>
          </div>
          
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600 text-sm font-medium">Sign in to your account to continue</p>
          </div>
        
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2.5">Email Address</label>
              <div className="relative group">
                <FiMail className="absolute left-4 top-3.5 text-blue-500 group-focus-within:text-blue-600 transition" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-gray-900 placeholder-gray-500 hover:border-gray-400"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2.5">Password</label>
              <div className="relative group">
                <FiLock className="absolute left-4 top-3.5 text-blue-500 group-focus-within:text-blue-600 transition" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-gray-900 placeholder-gray-500 hover:border-gray-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm font-medium">{typeof error === 'string' ? error : 'Login failed'}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.01] flex items-center justify-center gap-2 duration-200 mt-6"
            >
              <FiLogIn size={20} />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Forgot Password Link */}
            <div className="text-center pt-2">
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition">
                Forgot your password?
              </Link>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white lg:bg-gray-50 text-gray-500 font-medium">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center gap-3 duration-200"
          >
            <FcGoogle size={22} />
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white lg:bg-gray-50 text-gray-500 font-medium">New here?</span>
            </div>
          </div>

          {/* Register Link */}
          <p className="text-center text-gray-600">
            <Link to="/get-started" className="text-blue-600 hover:text-blue-700 font-semibold transition duration-200">
              Create a new account
            </Link>
          </p>
          <p className="text-center text-xs text-gray-500 mt-3 max-w-sm mx-auto leading-relaxed">
            Team members without an invite should ask their Admin or HR for an invitation email — self-signup is only for company Admin or HR.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
