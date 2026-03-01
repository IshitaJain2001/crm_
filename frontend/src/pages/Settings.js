import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Settings = () => {
  const token = useSelector(state => state.auth.token);
  const [company, setCompany] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      const [companyRes, membersRes] = await Promise.all([
        axios.get(`${API_URL}/api/workspace/company`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/workspace/members`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setCompany(companyRes.data.company);
      setMembers(membersRes.data.members);
      setDisplayName(companyRes.data.company.displayName);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `${API_URL}/api/workspace/company`,
        { displayName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCompany(response.data.company);
      setEditMode(false);
      toast.success('Workspace updated');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update');
    }
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
        <Header title="Settings & Workspace" />

        <div className="p-6 max-w-4xl">
          {/* Workspace Info */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Workspace</h2>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Edit
                </button>
              )}
            </div>

            {editMode ? (
              <form onSubmit={handleUpdateCompany} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setDisplayName(company.displayName);
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-gray-600 text-sm">Workspace Slug</p>
                  <p className="text-lg font-semibold text-gray-900">{company?.name}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Display Name</p>
                  <p className="text-lg font-semibold text-gray-900">{company?.displayName}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Plan</p>
                  <p className="text-lg font-semibold text-blue-600 uppercase">{company?.plan}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Max Users</p>
                  <p className="text-lg font-semibold text-gray-900">{company?.maxUsers}</p>
                </div>
              </div>
            )}
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Team Members</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No team members yet. Invite someone to get started!
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{member.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{member.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {member.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            member.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {member.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-gray-600 text-sm mt-4">
              Total Members: {members.length} / {company?.maxUsers}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
