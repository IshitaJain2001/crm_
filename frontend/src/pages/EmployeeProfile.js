import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'https://crm-1-5el5.onrender.com';

const EmployeeProfile = () => {
  const token = useSelector(state => state.auth.token);
  const user = useSelector(state => state.auth.user);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/employees/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(response.data);
    } catch (error) {
      console.error('Profile fetch error:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      superadmin: 'bg-red-100 text-red-800',
      admin: 'bg-orange-100 text-orange-800',
      hr: 'bg-purple-100 text-purple-800',
      sales: 'bg-blue-100 text-blue-800',
      employee: 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getDepartmentColor = (dept) => {
    const colors = {
      sales: 'bg-blue-50 border-blue-200',
      hr: 'bg-purple-50 border-purple-200',
      support: 'bg-green-50 border-green-200',
      marketing: 'bg-pink-50 border-pink-200',
      management: 'bg-orange-50 border-orange-200',
      tech: 'bg-indigo-50 border-indigo-200',
      other: 'bg-gray-50 border-gray-200'
    };
    return colors[dept] || 'bg-gray-50 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Header title="My Profile" />

        <div className="p-6 max-w-4xl mx-auto">
          {profileData && (
            <>
              {/* Profile Card */}
              <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{profileData.name}</h1>
                    <p className="text-gray-600 text-lg">{profileData.email}</p>
                  </div>
                  {profileData.avatar && (
                    <img 
                      src={profileData.avatar} 
                      alt={profileData.name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  )}
                </div>

                {/* Key Information */}
                <div className="grid grid-cols-2 gap-6 border-t pt-6">
                  <div className={`p-4 rounded-lg border-2 ${getDepartmentColor(profileData.department)}`}>
                    <p className="text-sm font-medium text-gray-600 mb-1">Department</p>
                    <p className="text-xl font-bold text-gray-900 capitalize">{profileData.department}</p>
                  </div>

                  <div className={`p-4 rounded-lg ${getRoleColor(profileData.role)}`}>
                    <p className="text-sm font-medium mb-1">Position</p>
                    <p className="text-xl font-bold capitalize">{profileData.role}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-50 border-2 border-blue-200">
                    <p className="text-sm font-medium text-gray-600 mb-1">Phone</p>
                    <p className="text-xl font-bold text-gray-900">{profileData.phone || 'Not provided'}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-green-50 border-2 border-green-200">
                    <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${profileData.active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      <p className="text-xl font-bold text-gray-900">{profileData.active ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Joined</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(profileData.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {profileData.lastLogin && (
                    <div>
                      <p className="text-sm text-gray-500">Last Login</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(profileData.lastLogin).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">About You</h2>
                <p className="text-gray-600">
                  You are a <strong>{profileData.role}</strong> in the <strong>{profileData.department}</strong> department.
                  {profileData.role !== 'superadmin' && (
                    <> Access is limited to personal data, tasks assigned to you, and team colleagues. </>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
