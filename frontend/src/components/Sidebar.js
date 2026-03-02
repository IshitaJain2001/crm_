import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { FiHome, FiUsers, FiBriefcase, FiTrendingUp, FiActivity, FiCheckSquare, FiLogOut, FiSettings, FiUserCheck, FiFileText, FiMessageSquare, FiStar, FiBarChart2, FiMonitor } from 'react-icons/fi';

const Sidebar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector(state => state.auth.user);

  // Super Admin menu
  const superAdminMenuItems = [
    { path: '/', label: 'Dashboard', icon: FiHome },
    { path: '/contacts', label: 'Contacts', icon: FiUsers },
    { path: '/companies', label: 'Client Companies', icon: FiBriefcase },
    { path: '/deals', label: 'Sales Pipeline', icon: FiTrendingUp },
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
  const menuItems = user?.role === 'superadmin' ? superAdminMenuItems : employeeMenuItems;

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 min-h-screen text-white flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-blue-700">
        <h1 className="text-2xl font-bold">CRM</h1>
        <p className="text-blue-200 text-sm">Sales Platform</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    isActive(item.path)
                      ? 'bg-blue-500 text-white'
                      : 'text-blue-100 hover:bg-blue-700'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-blue-700 bg-blue-950">
        <div className="mb-4 pb-4 border-b border-blue-700">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="text-xs text-blue-200">{user?.email}</p>
        </div>
        <button
          onClick={() => dispatch(logout())}
          className="flex items-center space-x-2 w-full px-4 py-2 rounded-lg text-blue-100 hover:bg-red-600 transition"
        >
          <FiLogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
