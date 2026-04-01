import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";
import { useLayout } from "../context/LayoutContext";
import toast from "react-hot-toast";
import { API_URL } from "../config/api";

const Analytics = () => {
  const { isDark } = useTheme();
  const { sidebarOpen } = useLayout();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/analytics/company`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(response.data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const response = await axios.post(
        `${API_URL}/api/analytics/refresh`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalytics(response.data.analytics);
      toast.success("Analytics refreshed!");
    } catch (error) {
      toast.error("Failed to refresh analytics");
    } finally {
      setRefreshing(false);
    }
  };

  if (!analytics || loading) {
    return (
      <div className={`h-screen w-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <Sidebar />
        <div className={`absolute top-0 bottom-0 left-64 right-0 flex flex-col overflow-hidden transition-all duration-300`}>
          <Header title="Company Analytics Dashboard" />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className={`h-screen w-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Sidebar />

      <div className={`absolute top-0 bottom-0 left-64 right-0 flex flex-col overflow-hidden transition-all duration-300`}>
        <Header title="Company Analytics Dashboard" />

        <div className={`flex-1 overflow-auto ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
          <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
          {/* Refresh Button */}
          <div className="mb-6 flex justify-between items-center">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Analytics Overview</h2>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              {refreshing ? "Refreshing..." : "🔄 Refresh Data"}
            </button>
          </div>

          {/* KPI Cards */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
             {/* Revenue */}
             <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
               <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Revenue</p>
               <p className={`text-3xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                 ${(analytics.totalRevenue / 1000).toFixed(1)}K
               </p>
               <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                 This Month: ${(analytics.revenueThisMonth / 1000).toFixed(1)}K
               </p>
               <p className={`text-sm font-semibold mt-2 ${analytics.revenueGrowth >= 0 ? (isDark ? "text-green-400" : "text-green-600") : (isDark ? "text-red-400" : "text-red-600")}`}>
                 {analytics.revenueGrowth >= 0 ? "↑" : "↓"} {Math.abs(analytics.revenueGrowth).toFixed(1)}% vs last month
               </p>
             </div>

            {/* Deals */}
            <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Sales Pipeline</p>
              <p className="text-3xl font-bold text-green-600">${(analytics.openDeals || 0)}</p>
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {analytics.totalDeals} total | {analytics.wonDeals} won
              </p>
              <p className="text-sm font-semibold mt-2 text-yellow-600">
                {analytics.dealClosureRate}% closure rate
              </p>
            </div>

            {/* Contacts */}
            <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Contacts</p>
              <p className="text-3xl font-bold text-purple-600">{analytics.totalContacts}</p>
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {analytics.activeContacts} active
              </p>
              <p className="text-sm font-semibold mt-2 text-purple-600">
                {analytics.contactConversionRate}% conversion rate
              </p>
            </div>

            {/* Team */}
            <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Team Activity</p>
              <p className="text-3xl font-bold text-orange-600">{analytics.totalActivities}</p>
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {analytics.activitiesThisMonth} this month
              </p>
              <p className="text-sm font-semibold mt-2 text-orange-600">
                {analytics.avgActivitiesPerDay} per day
              </p>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Trend */}
            <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Revenue Trend (12 Months)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${(value / 1000).toFixed(1)}K`} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pipeline Distribution */}
            <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Pipeline by Stage</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.pipelineByStage}
                    dataKey="value"
                    nameKey="stage"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${(value / 1000).toFixed(1)}K`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Deals Won by Month */}
            <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Deals Won (12 Months)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.dealsWonByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="#10b981" name="Deals Count" />
                  <Bar yAxisId="right" dataKey="value" fill="#3b82f6" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Performers */}
            <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Top Performers</h3>
              <div className="space-y-4">
                {analytics.topPerformers && analytics.topPerformers.length > 0 ? (
                  analytics.topPerformers.map((performer) => (
                    <div key={performer.employeeId} className={`flex justify-between items-center pb-3 border-b ${isDark ? 'border-gray-700' : ''}`}>
                      <div>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>#{performer.rank} {performer.name}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{performer.dealsWon} deals won</p>
                      </div>
                      <p className="text-lg font-bold text-green-600">
                        ${(performer.revenueGenerated / 1000).toFixed(1)}K
                      </p>
                    </div>
                  ))
                ) : (
                  <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No deals data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Deal Stats */}
            <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Deal Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total Deals:</span>
                  <span className="font-semibold">{analytics.totalDeals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Won:</span>
                  <span className="font-semibold text-green-600">{analytics.wonDeals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lost:</span>
                  <span className="font-semibold text-red-600">{analytics.lostDeals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Deal Size:</span>
                  <span className="font-semibold">${(analytics.avgDealSize / 1000).toFixed(1)}K</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Sales Cycle:</span>
                  <span className="font-semibold">{analytics.avgSalesCycle} days</span>
                </div>
              </div>
            </div>

            {/* Task Stats */}
            <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Task Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total Tasks:</span>
                  <span className="font-semibold">{analytics.totalTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Completed:</span>
                  <span className="font-semibold text-green-600">{analytics.completedTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Overdue:</span>
                  <span className="font-semibold text-red-600">{analytics.overdueTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Completion Rate:</span>
                  <span className="font-semibold">{analytics.taskCompletionRate}%</span>
                </div>
              </div>
            </div>

            {/* Contact Stats */}
            <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Contact Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total Contacts:</span>
                  <span className="font-semibold">{analytics.totalContacts}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Active:</span>
                  <span className="font-semibold">{analytics.activeContacts}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Added This Month:</span>
                  <span className="font-semibold">{analytics.contactsAddedThisMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Conversion:</span>
                  <span className="font-semibold">{analytics.contactConversionRate}%</span>
                </div>
              </div>
            </div>

            {/* Team Stats */}
            <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Team Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total Employees:</span>
                  <span className="font-semibold">{analytics.totalEmployees}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Active:</span>
                  <span className="font-semibold">{analytics.activeEmployees}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total Activities:</span>
                  <span className="font-semibold">{analytics.totalActivities}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>This Month:</span>
                  <span className="font-semibold">{analytics.activitiesThisMonth}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className={`mt-8 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Last updated: {new Date(analytics.lastUpdated).toLocaleString()}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
