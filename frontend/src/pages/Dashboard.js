import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = useSelector(state => state.auth.token);
  const user = useSelector(state => state.auth.user);
  const [stats, setStats] = useState(null);
  const [pipeline, setPipeline] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'employee') {
      fetchEmployeeDashboard();
    } else {
      fetchDashboardData();
    }
  }, [user?.role]);

  const fetchEmployeeDashboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const tasks = response.data.tasks || [];
      const completed = tasks.filter(t => t.status === 'completed').length;
      const pending = tasks.filter(t => t.status === 'pending').length;
      const overdue = tasks.filter(t => t.status === 'pending' && new Date(t.dueDate) < new Date()).length;
      
      setMyTasks(tasks);
      setStats({
        total: tasks.length,
        completed,
        pending,
        overdue
      });
    } catch (error) {
      console.error('Error fetching employee dashboard:', error?.message || error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [statsRes, pipelineRes] = await Promise.all([
        axios.get(`${API_URL}/api/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/dashboard/pipeline`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data);
      setPipeline(pipelineRes.data.pipeline || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error?.message || error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <Header title={user?.role === 'employee' ? 'My Dashboard' : 'Dashboard'} />
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : (
            <>
              {user?.role === 'employee' ? (
                // Employee Dashboard
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-gray-500 text-sm font-semibold mb-2">Total Tasks</div>
                      <div className="text-3xl font-bold text-gray-800">{stats?.total || 0}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-gray-500 text-sm font-semibold mb-2">Completed</div>
                      <div className="text-3xl font-bold text-green-600">{stats?.completed || 0}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-gray-500 text-sm font-semibold mb-2">Pending</div>
                      <div className="text-3xl font-bold text-yellow-600">{stats?.pending || 0}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-gray-500 text-sm font-semibold mb-2">Overdue</div>
                      <div className="text-3xl font-bold text-red-600">{stats?.overdue || 0}</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">Your Progress</h3>
                      <span className="text-2xl font-bold text-blue-600">
                        {stats?.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                        style={{ width: `${stats?.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Recent Tasks */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Tasks</h3>
                    {myTasks.length === 0 ? (
                      <p className="text-gray-500">No tasks assigned to you yet</p>
                    ) : (
                      <div className="space-y-3">
                        {myTasks.slice(0, 5).map(task => (
                          <div key={task._id} className="flex justify-between items-start border-b pb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800">{task.subject}</h4>
                              <p className="text-sm text-gray-600">{task.description}</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                              task.status === 'completed' ? 'bg-green-100 text-green-800' :
                              task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.status.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // Admin/Superadmin Dashboard
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-gray-500 text-sm font-semibold mb-2">Total Contacts</div>
                      <div className="text-3xl font-bold text-gray-800">{stats?.totalContacts || 0}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-gray-500 text-sm font-semibold mb-2">Total Companies</div>
                      <div className="text-3xl font-bold text-gray-800">{stats?.totalCompanies || 0}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-gray-500 text-sm font-semibold mb-2">Open Deals</div>
                      <div className="text-3xl font-bold text-blue-600">{stats?.openDeals || 0}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="text-gray-500 text-sm font-semibold mb-2">Pipeline Value</div>
                      <div className="text-3xl font-bold text-green-600">${(stats?.totalDealsAmount || 0).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Pipeline by Stage</h3>
                      {pipeline.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={pipeline}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="_id" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="totalAmount" fill="#3b82f6" name="Amount ($)" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-gray-500">No deals data available</p>
                      )}
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Deals Won This Month</span>
                          <span className="text-2xl font-bold text-green-600">{stats?.dealsWonThisMonth || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Recent Activities (7d)</span>
                          <span className="text-2xl font-bold text-blue-600">{stats?.recentActivities || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
