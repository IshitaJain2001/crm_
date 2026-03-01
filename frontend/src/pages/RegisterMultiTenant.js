import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const RegisterMultiTenant = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Company & Password
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ============================================================
  // STEP 1: Send OTP
  // ============================================================
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!email) {
        toast.error('Please enter your email');
        return;
      }

      const response = await axios.post(`${API_URL}/api/auth/send-otp`, { email });

      setVerificationToken(response.data.verificationToken);
      setStep(2);
      toast.success('OTP sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // STEP 2: Verify OTP
  // ============================================================
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!otp || otp.length !== 6) {
        toast.error('Please enter a valid 6-digit OTP');
        return;
      }

      const response = await axios.post(`${API_URL}/api/auth/verify-otp`, {
        email,
        otp
      });

      setVerificationToken(response.data.verificationToken);
      setStep(3);
      toast.success('Email verified successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // STEP 3: Register Company & Create Super Admin
  // ============================================================
  const handleRegisterCompany = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!fullName || !companyName || !displayName || !password) {
        toast.error('Please fill in all fields');
        return;
      }

      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

      const response = await axios.post(`${API_URL}/api/auth/register-company`, {
        email,
        password,
        name: fullName,
        companyName,
        displayName,
        verificationToken
      });

      // Save token to localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('company', JSON.stringify(response.data.company));

      toast.success(response.data.message);
      
      // Force page reload to sync auth state
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        
        {/* STEP 1: Email & OTP */}
        {step === 1 && (
          <>
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Create Account</h1>
            <p className="text-center text-gray-600 mb-8">Step 1 of 3: Email Verification</p>

            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="your@email.com"
                  disabled={step > 1}
                />
              </div>

              <button
                type="submit"
                disabled={loading || step > 1}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          </>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 2 && (
          <>
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Verify Email</h1>
            <p className="text-center text-gray-600 mb-8">Step 2 of 3: Enter OTP sent to {email}</p>

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">6-Digit OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                  maxLength="6"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
                <p className="text-xs text-gray-500 mt-2">Check your email for the OTP (expires in 10 minutes)</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg transition"
              >
                Back
              </button>
            </form>
          </>
        )}

        {/* STEP 3: Company & Password */}
        {step === 3 && (
          <>
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Create Company</h1>
            <p className="text-center text-gray-600 mb-8">Step 3 of 3: Setup Your Workspace</p>

            <form onSubmit={handleRegisterCompany} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Slug</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="your-company"
                />
                <p className="text-xs text-gray-500 mt-1">Use lowercase and hyphens (e.g., ishita-crm)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Ishita's CRM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Creating Company...' : 'Create Company & Account'}
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg transition"
              >
                Back
              </button>
            </form>
          </>
        )}

        <p className="text-center text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-semibold">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterMultiTenant;
