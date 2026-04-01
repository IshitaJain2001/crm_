import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useTheme } from '../context/ThemeContext';
import { useLayout } from '../context/LayoutContext';
import { FiPlus, FiTrash2, FiEdit2, FiMail, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { API_URL } from '../config/api';

const Employees = () => {
  const { isDark } = useTheme();
  const { sidebarOpen } = useLayout();
  const token = useSelector(state => state.auth.token);
  const [employees, setEmployees] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [tab, setTab] = useState('active'); // 'active', 'inactive', 'pending'

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: 'other',
    role: 'employee'
  });

  useEffect(() => {
    fetchEmployees();
  }, [tab]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      if (tab === 'pending') {
        const response = await axios.get(`${API_URL}/api/employees/invitations/pending`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPendingInvitations(response.data.invitations);
      } else {
        const response = await axios.get(
          `${API_URL}/api/employees?status=${tab === 'active' ? 'active' : 'inactive'}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEmployees(response.data.employees);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.email) {
      toast.error('First name and email are required');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/employees/invite`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Invitation sent to ${formData.email}`);
      setFormData({ firstName: '', lastName: '', email: '', department: 'other', role: 'employee' });
      setShowInviteForm(false);
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send invitation');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this employee?')) return;

    try {
      await axios.patch(
        `${API_URL}/api/employees/${id}/deactivate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Employee deactivated');
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to deactivate');
    }
  };

  const handleActivate = async (id) => {
    try {
      await axios.patch(
        `${API_URL}/api/employees/${id}/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Employee activated');
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to activate');
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this employee?')) return;

    try {
      await axios.delete(
        `${API_URL}/api/employees/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Employee removed');
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove');
    }
  };

  const handleResendInvitation = async (id) => {
    try {
      await axios.post(
        `${API_URL}/api/employees/invitations/${id}/resend`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Invitation resent');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to resend');
    }
  };

  const handleRevokeInvitation = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this invitation?')) return;

    try {
      await axios.delete(
        `${API_URL}/api/employees/invitations/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Invitation revoked');
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to revoke');
    }
  };

  return (
    <div className={`h-screen w-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Sidebar />
      <div className={`absolute top-0 bottom-0 left-64 right-0 flex flex-col overflow-hidden transition-all duration-300`}>
        <Header title="My Employees" />

        <div className={`flex-1 overflow-auto ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
          <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
          {/* Tabs */}
          <div className={`flex gap-4 mb-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setTab('active')}
              className={`px-4 py-2 font-semibold ${tab === 'active' ? 'border-b-2 border-blue-600 text-blue-600' : isDark ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Active Employees
            </button>
            <button
              onClick={() => setTab('inactive')}
              className={`px-4 py-2 font-semibold ${tab === 'inactive' ? 'border-b-2 border-blue-600 text-blue-600' : isDark ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Inactive
            </button>
            <button
              onClick={() => setTab('pending')}
              className={`px-4 py-2 font-semibold ${tab === 'pending' ? 'border-b-2 border-blue-600 text-blue-600' : isDark ? 'text-gray-400' : 'text-gray-600'}`}
            >
              Pending Invitations
            </button>
          </div>

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {tab === 'active' && 'Active Employees'}
              {tab === 'inactive' && 'Inactive Employees'}
              {tab === 'pending' && 'Pending Invitations'}
            </h3>
            {tab !== 'pending' && (
              <button
                onClick={() => setShowInviteForm(!showInviteForm)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                <FiPlus />
                <span>Invite Employee</span>
              </button>
            )}
          </div>

          {/* Invite Form */}
          {showInviteForm && (
            <div className={`rounded-lg shadow p-6 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : ''}`}>Invite Employee</h4>
              <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                   type="text"
                   placeholder="First Name *"
                   value={formData.firstName}
                   onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                   className={`px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900'}`}
                 />
                 <input
                   type="text"
                   placeholder="Last Name"
                   value={formData.lastName}
                   onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                   className={`px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900'}`}
                 />
                 <input
                   type="email"
                   placeholder="Email *"
                   value={formData.email}
                   onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                   className={`px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900'}`}
                 />
                 <select
                   value={formData.department}
                   onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                   className={`px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                 >
                   <option value="other">Select Department</option>
                   <option value="sales">Sales</option>
                   <option value="hr">HR</option>
                   <option value="support">Support</option>
                   <option value="marketing">Marketing</option>
                   <option value="management">Management</option>
                   <option value="tech">Tech</option>
                 </select>
                 <select
                   value={formData.role}
                   onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                   className={`px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                 >
                  <option value="employee">Employee</option>
                  <option value="sales">Sales</option>
                  <option value="hr">HR</option>
                  <option value="admin">Admin</option>
                </select>

                <div className="flex gap-2 md:col-span-2">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  >
                    Send Invitation
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : (
            <div className={`rounded-lg shadow overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <table className="w-full">
                <thead className={`border-b ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Name</th>
                    <th className={`px-6 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</th>
                    {tab !== 'pending' && (
                      <>
                        <th className={`px-6 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Role</th>
                        <th className={`px-6 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Department</th>
                        <th className={`px-6 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                      </>
                    )}
                    {tab === 'pending' && (
                      <>
                        <th className={`px-6 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Role</th>
                        <th className={`px-6 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Invited On</th>
                        <th className={`px-6 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Expires</th>
                      </>
                    )}
                    <th className={`px-6 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                   {tab === 'pending' ? (
                     pendingInvitations.length === 0 ? (
                       <tr>
                         <td colSpan="6" className={`px-6 py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                           No pending invitations
                         </td>
                       </tr>
                     ) : (
                       pendingInvitations.map((inv) => (
                         <tr key={inv._id} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                           <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{inv.email}</td>
                           <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{inv.email}</td>
                           <td className="px-6 py-4 text-sm">
                             <span className={`px-2 py-1 rounded text-xs font-semibold ${isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                               {inv.role.toUpperCase()}
                             </span>
                           </td>
                           <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                             {new Date(inv.createdAt).toLocaleDateString()}
                           </td>
                           <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                             {new Date(inv.expiresAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm space-x-2">
                            <button
                              onClick={() => handleResendInvitation(inv._id)}
                              className="text-green-600 hover:text-green-900"
                              title="Resend invitation"
                            >
                              <FiRefreshCw size={18} />
                            </button>
                            <button
                              onClick={() => handleRevokeInvitation(inv._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Revoke invitation"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    employees.length === 0 ? (
                      <tr>
                        <td colSpan="6" className={`px-6 py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          No employees yet. Invite someone to get started!
                        </td>
                      </tr>
                    ) : (
                      employees.map((emp) => (
                        <tr key={emp._id} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                          <td className={`px-6 py-4 text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{emp.name}</td>
                          <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{emp.email}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                              {emp.role.toUpperCase()}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-sm capitalize ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{emp.department}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              emp.active
                                ? (isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800')
                                : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800')
                            }`}>
                              {emp.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm space-x-2">
                            {emp.active ? (
                              <button
                                onClick={() => handleDeactivate(emp._id)}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Deactivate"
                              >
                                <FiEdit2 size={18} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivate(emp._id)}
                                className="text-green-600 hover:text-green-900"
                                title="Activate"
                              >
                                <FiRefreshCw size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => handleRemove(emp._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Remove"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Employees;
