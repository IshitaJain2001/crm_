import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { useTheme } from '../context/ThemeContext';
import { useLayout } from '../context/LayoutContext';
import { FiHome, FiUsers, FiBriefcase, FiTrendingUp, FiActivity, FiCheckSquare, FiLogOut, FiSettings, FiUserCheck, FiFileText, FiMessageSquare, FiStar, FiBarChart2, FiMonitor, FiMenu, FiX } from 'react-icons/fi';
import { isCompanyLead } from '../utils/roles';

const Sidebar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector(state => state.auth.user);
  const { isDark } = useTheme();
  const { sidebarOpen, setSidebarOpen } = useLayout();

  // Super Admin menu
  const superAdminMenuItems = [
    { path: '/', label: 'Dashboard', icon: FiHome },
    { path: '/contacts', label: 'Contacts', icon: FiUsers },
    { path: '/companies', label: 'Client Companies', icon: FiBriefcase },
    { path: '/pipeline', label: 'Pipeline', icon: FiTrendingUp },
    { path: '/deals', label: 'Deals', icon: FiBriefcase },
    { path: '/activities', label: 'Activities', icon: FiActivity },
    { path: '/tasks', label: 'Tasks', icon: FiCheckSquare },
    { path: '/emails', label: 'Email Tracking', icon: FiActivity },
    { path: '/meetings', label: 'Meetings', icon: FiCheckSquare },
    { path: '/forms', label: 'Forms & Leads', icon: FiFileText },
    { path: '/chatbots', label: 'Live Chatbots', icon: FiMessageSquare },
    { path: '/employees', label: 'My Employees', icon: FiUserCheck },
    { path: '/analytics', label: 'Analytics', icon: FiBarChart2 },
    { path: '/website-builder', label: 'Website Builder', icon: FiMonitor },
    { path: '/feedback', label: 'Feedback', icon: FiStar },
    { path: '/settings', label: 'Settings', icon: FiSettings }
  ];

  // Employee menu (limited access)
  const employeeMenuItems = [
    { path: '/', label: 'Dashboard', icon: FiHome },
    { path: '/profile', label: 'My Profile', icon: FiUsers },
    { path: '/colleagues', label: 'My Colleagues', icon: FiUserCheck },
    { path: '/tasks', label: 'My Tasks', icon: FiCheckSquare },
    { path: '/chatbots', label: 'Chat with Admin', icon: FiMessageSquare }
  ];

  // Build menu based on role
  const menuItems = isCompanyLead(user?.role) ? superAdminMenuItems : employeeMenuItems;

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Sidebar */}
      <div className={`sidebar border-r h-screen flex flex-col shadow-lg transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-20'
      } fixed left-0 top-0 z-40 overflow-hidden ${
        isDark 
          ? 'bg-gray-800 border-gray-700 text-white' 
          : 'bg-white border-gray-200 text-gray-900'
      }`}>
        {/* Header - Fixed */}
        <div className={`p-4 flex items-center justify-between flex-shrink-0 ${
          isDark ? 'border-b border-gray-700' : 'border-b border-gray-200'
        }`}>
          {sidebarOpen && (
            <>
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>CRM</h1>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sales Platform</p>
              </div>
            </>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1 rounded-lg transition ${
              isDark 
                ? 'hover:bg-gray-700 text-gray-300' 
                : 'hover:bg-gray-200 text-gray-700'
            }`}
          >
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                     to={item.path}
                     title={!sidebarOpen ? item.label : ''}
                     className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition ${
                       isActive(item.path)
                         ? 'bg-blue-600 text-white'
                         : isDark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100'
                     }`}
                   >
                     <Icon size={20} className="flex-shrink-0" />
                     {sidebarOpen && <span className="text-sm">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info - Fixed */}
        <div className={`p-3 border-t flex-shrink-0 ${
          isDark 
            ? 'border-gray-700 bg-gray-900' 
            : 'border-gray-300 bg-gray-100'
        }`}>
          {sidebarOpen && (
            <div className={`mb-3 pb-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
              <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
              <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{user?.email}</p>
            </div>
          )}
          <button
            onClick={() => dispatch(logout())}
            title={!sidebarOpen ? 'Logout' : ''}
            className={`flex items-center space-x-2 w-full px-3 py-2 rounded-lg hover:bg-red-600 transition text-sm ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            <FiLogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Mobile overlay when sidebar open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
