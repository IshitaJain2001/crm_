import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useTheme } from '../context/ThemeContext';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import {
  FiTrendingUp, FiDollarSign, FiUsers, FiCheckCircle,
  FiCalendar, FiMail, FiActivity, FiArrowRight, FiTarget
} from 'react-icons/fi';

const Dashboard = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'https://crm-1-5el5.onrender.com';
  const token = useSelector(state => state.auth.token);
  const user = useSelector(state => state.auth.user);
  const { isDark } = useTheme();

  const [stats, setStats] = useState(null);
  const [deals, setDeals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [pipelineData, setPipelineData] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch deals
      const dealsRes = await axios.get(`${API_URL}/api/deals`, {
        headers,
        params: { limit: 100 }
      });

      // Fetch tasks
      const tasksRes = await axios.get(`${API_URL}/api/tasks`, {
        headers
      });

      // Fetch contacts
      const contactsRes = await axios.get(`${API_URL}/api/contacts`, {
        headers,
        params: { limit: 100 }
      });

      // Fetch activities
      const activitiesRes = await axios.get(`${API_URL}/api/activities`, {
        headers,
        params: { limit: 20 }
      });

      const dealsData = Array.isArray(dealsRes.data.deals) ? dealsRes.data.deals : [];
      const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : [];
      const contactsData = Array.isArray(contactsRes.data.contacts) ? contactsRes.data.contacts : [];
      const activitiesData = Array.isArray(activitiesRes.data) ? activitiesRes.data : [];

      setDeals(dealsData);
      setTasks(tasksData);
      setContacts(contactsData);
      setActivities(activitiesData);

      // Calculate stats
      const totalRevenue = dealsData.reduce((sum, deal) => sum + (deal.amount || 0), 0);
      const wonDeals = dealsData.filter(d => d.dealStatus === 'won').length;
      const openDeals = dealsData.filter(d => d.dealStatus === 'open').length;
      const newContacts = contactsData.filter(c => {
        const createdDate = new Date(c.createdAt);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return createdDate > thirtyDaysAgo;
      }).length;

      setStats({
        totalRevenue,
        wonDeals,
        openDeals,
        conversionRate: contactsData.length > 0 ? ((wonDeals / openDeals) * 100).toFixed(2) : 0,
        newContacts,
        totalContacts: contactsData.length,
        tasksToday: tasksData.filter(t => {
          const today = new Date().toDateString();
          return new Date(t.dueDate).toDateString() === today;
        }).length,
        completedTasks: tasksData.filter(t => t.status === 'completed').length
      });

      // Revenue trend data
      const last7Days = generateLast7Days();
      const revenueByDay = last7Days.map((date, idx) => {
        const dayRevenue = dealsData
          .filter(d => new Date(d.createdAt).toDateString() === new Date(date).toDateString())
          .reduce((sum, d) => sum + (d.amount || 0), 0);
        
        // If no real data, show mock data for demo
        return {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: dayRevenue || Math.floor(Math.random() * 50000) + 10000
        };
      });
      setRevenueData(revenueByDay);

      // Pipeline data
      const stages = ['initial_contact', 'qualification', 'proposal', 'negotiation', 'decision'];
      const mockCounts = [8, 5, 3, 2, 1]; // Mock data if empty
      const pipelineByStage = stages.map((stage, idx) => {
        const realCount = dealsData.filter(d => d.dealStage === stage).length;
        const realRevenue = dealsData
          .filter(d => d.dealStage === stage)
          .reduce((sum, d) => sum + (d.amount || 0), 0);
        
        return {
          name: formatStageName(stage),
          count: realCount || mockCounts[idx],
          revenue: realRevenue || (mockCounts[idx] * (Math.random() * 50000 + 10000))
        };
      });
      setPipelineData(pipelineByStage);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateLast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const formatStageName = (stage) => {
    return stage
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className={`h-screen w-screen ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <Sidebar />
        <div className={`absolute top-0 bottom-0 left-64 right-0 flex flex-col overflow-hidden transition-all duration-300`}>
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <Sidebar />
      <div className={`absolute top-0 bottom-0 left-64 right-0 flex flex-col overflow-hidden transition-all duration-300`}>
        <Header />
        <div className={`flex-1 overflow-auto ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="p-6 mx-auto w-7/10 mt-16">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KPICard
                icon={<FiDollarSign className="w-6 h-6" />}
                title="Total Revenue"
                value={`$${(stats?.totalRevenue || 0).toLocaleString()}`}
                subtext={`${stats?.openDeals || 0} open deals`}
                color="bg-blue-500"
                isDark={isDark}
              />
              <KPICard
                icon={<FiCheckCircle className="w-6 h-6" />}
                title="Won Deals"
                value={stats?.wonDeals || 0}
                subtext={`${stats?.conversionRate || 0}% conversion`}
                color="bg-green-500"
                isDark={isDark}
              />
              <KPICard
                icon={<FiUsers className="w-6 h-6" />}
                title="New Contacts"
                value={stats?.newContacts || 0}
                subtext={`${stats?.totalContacts || 0} total contacts`}
                color="bg-purple-500"
                isDark={isDark}
              />
              <KPICard
                icon={<FiTarget className="w-6 h-6" />}
                title="Tasks Due Today"
                value={stats?.tasksToday || 0}
                subtext={`${stats?.completedTasks || 0} completed`}
                color="bg-orange-500"
                isDark={isDark}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Revenue Trend */}
              <div className={`rounded-lg border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h2 className={`text-lg font-semibold mb-4 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <FiTrendingUp className="mr-2" />
                  Revenue Trend (Last 7 Days)
                </h2>
                {revenueData && revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                      <XAxis dataKey="date" stroke={isDark ? "#9CA3AF" : "#6b7280"} />
                      <YAxis stroke={isDark ? "#9CA3AF" : "#6b7280"} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1F2937' : '#ffffff',
                          border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                          borderRadius: '8px',
                          color: isDark ? '#fff' : '#111'
                        }}
                        formatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={`h-80 flex flex-col items-center justify-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div className="text-4xl mb-3">📊</div>
                    <p className={`font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No revenue data yet</p>
                    <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Create your first deal to see trends</p>
                    <a href="/pipeline" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                      Create a Deal →
                    </a>
                  </div>
                )}
              </div>

              {/* Deal Pipeline */}
              <div className={`rounded-lg border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Pipeline by Stage</h2>
                {pipelineData && pipelineData.length > 0 ? (
                   <ResponsiveContainer width="100%" height={300}>
                     <BarChart data={pipelineData}>
                       <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                       <XAxis dataKey="name" stroke={isDark ? "#9CA3AF" : "#6b7280"} />
                       <YAxis stroke={isDark ? "#9CA3AF" : "#6b7280"} />
                       <Tooltip
                         contentStyle={{
                           backgroundColor: isDark ? '#1F2937' : '#ffffff',
                           border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                           borderRadius: '8px',
                           color: isDark ? '#fff' : '#111'
                         }}
                         formatter={(value) => [value, 'Deals']}
                       />
                      <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={`h-80 flex flex-col items-center justify-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div className="text-4xl mb-3">🎯</div>
                    <p className={`font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No pipeline data yet</p>
                    <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Start building your sales pipeline</p>
                    <a href="/pipeline" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                      View Pipeline →
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Deals */}
              <div className={`lg:col-span-2 rounded-lg border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Deals</h2>
                <div className="space-y-3">
                  {deals.slice(0, 5).map((deal) => (
                    <DealItem key={deal._id} deal={deal} isDark={isDark} />
                  ))}
                  {deals.length === 0 && (
                    <p className="text-gray-400 text-center py-8">No deals yet</p>
                  )}
                </div>
              </div>

              {/* Activity Feed */}
              <div className={`rounded-lg border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Activity Feed</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activities.slice(0, 8).map((activity) => (
                    <ActivityItem key={activity._id} activity={activity} isDark={isDark} />
                  ))}
                  {activities.length === 0 && (
                    <p className="text-gray-400 text-center py-8">No activities</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tasks Section */}
            <div className={`rounded-lg border p-6 mt-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>My Tasks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tasks.slice(0, 6).map((task) => (
                  <TaskItem key={task._id} task={task} isDark={isDark} />
                ))}
                {tasks.length === 0 && (
                  <p className="text-gray-400 col-span-2 text-center py-8">No tasks</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// KPI Card Component
const KPICard = ({ icon, title, value, subtext, color, isDark }) => (
  <div className={`rounded-lg border p-6 hover:border-opacity-75 transition ${
    isDark 
      ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
      : 'bg-white border-gray-200 hover:border-gray-300'
  }`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
        <p className={`text-2xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{subtext}</p>
      </div>
      <div className={`${color} p-3 rounded-lg text-white`}>
        {icon}
      </div>
    </div>
  </div>
);

// Deal Item Component
const DealItem = ({ deal, isDark }) => (
  <div className={`flex items-center justify-between p-3 rounded-lg transition cursor-pointer ${
    isDark 
      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
  }`}>
    <div className="flex-1">
      <p className="font-medium">{deal.dealName}</p>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{deal.company?.name || 'Unknown Company'}</p>
    </div>
    <div className="text-right">
      <p className="font-semibold">${deal.amount?.toLocaleString() || 0}</p>
      <p className={`text-xs mt-1 ${
        deal.dealStatus === 'won' ? 'text-green-400' :
        deal.dealStatus === 'lost' ? 'text-red-400' :
        'text-blue-400'
      }`}>
        {deal.dealStatus?.toUpperCase()}
      </p>
    </div>
  </div>
);

// Activity Item Component
const ActivityItem = ({ activity, isDark }) => (
  <div className="flex items-start space-x-3 p-2">
    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        <span className="font-medium">{activity.type}</span>
        <span className={isDark ? 'text-gray-500' : 'text-gray-600'}> on {activity.relatedEntity}</span>
      </p>
      <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
        {new Date(activity.createdAt).toLocaleDateString()}
      </p>
    </div>
  </div>
);

// Task Item Component
const TaskItem = ({ task, isDark }) => (
  <div className={`p-3 rounded-lg border transition ${
    isDark 
      ? 'bg-gray-700 border-gray-600 hover:border-gray-500' 
      : 'bg-gray-100 border-gray-300 hover:border-gray-400'
  }`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.title}</p>
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </p>
      </div>
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        task.priority === 'high' ? 'bg-red-500/20 text-red-300' :
        task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
        'bg-green-500/20 text-green-300'
      }`}>
        {task.priority}
      </span>
    </div>
  </div>
);

export default Dashboard;
