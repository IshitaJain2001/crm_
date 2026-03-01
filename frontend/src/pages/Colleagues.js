import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Colleagues = () => {
  const token = useSelector(state => state.auth.token);
  const [colleagues, setColleagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState('all');

  useEffect(() => {
    fetchColleagues();
  }, []);

  const fetchColleagues = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/workspace/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setColleagues(response.data.members || []);
    } catch (error) {
      toast.error('Failed to load colleagues');
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
      sales: 'bg-blue-50 border-l-4 border-blue-500',
      hr: 'bg-purple-50 border-l-4 border-purple-500',
      support: 'bg-green-50 border-l-4 border-green-500',
      marketing: 'bg-pink-50 border-l-4 border-pink-500',
      management: 'bg-orange-50 border-l-4 border-orange-500',
      tech: 'bg-indigo-50 border-l-4 border-indigo-500',
      other: 'bg-gray-50 border-l-4 border-gray-500'
    };
    return colors[dept] || 'bg-gray-50 border-l-4 border-gray-500';
  };

  const filteredColleagues = filterDept === 'all' 
    ? colleagues 
    : colleagues.filter(c => c.department === filterDept);

  const departments = ['all', ...new Set(colleagues.map(c => c.department))];

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
        <Header title="My Colleagues" />

        <div className="p-6">
          {/* Filter */}
          <div className="mb-6">
            <div className="flex gap-2 flex-wrap">
              {departments.map(dept => (
                <button
                  key={dept}
                  onClick={() => setFilterDept(dept)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    filterDept === dept
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500'
                  }`}
                >
                  {dept === 'all' ? 'All' : dept.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="text-gray-600 text-sm mt-3">
              Showing {filteredColleagues.length} of {colleagues.length} colleagues
            </p>
          </div>

          {/* Colleagues Grid */}
          {filteredColleagues.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">No colleagues in this department</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredColleagues.map(colleague => (
                <div key={colleague.id} className={`rounded-lg shadow p-6 ${getDepartmentColor(colleague.department)}`}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{colleague.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(colleague.role)}`}>
                      {colleague.role.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>Email:</strong> {colleague.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Department:</strong> <span className="capitalize">{colleague.department}</span>
                    </p>
                    {colleague.phone && (
                      <p className="text-sm text-gray-600">
                        <strong>Phone:</strong> {colleague.phone}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-300">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      colleague.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {colleague.active ? '● Active' : '● Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Colleagues;
