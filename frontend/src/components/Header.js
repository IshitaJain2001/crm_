import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { FiBell, FiSearch, FiX, FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";
import { useLayout } from "../context/LayoutContext";
import { API_URL } from "../config/api";

const Header = ({ title = "Dashboard" }) => {
  const token = useSelector((state) => state.auth.token);
  const { isDark, toggleTheme } = useTheme();
  const { sidebarOpen } = useLayout();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (token) {
      fetchNotifications();
      // Poll for new notifications every 10 seconds
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/notifications?limit=15`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.put(
        `${API_URL}/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchNotifications();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put(
        `${API_URL}/api/notifications/read/all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleDismiss = async (notificationId) => {
    try {
      await axios.put(
        `${API_URL}/api/notifications/${notificationId}/dismiss`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchNotifications();
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  const getNotificationColor = (color) => {
    const colors = {
      blue: "border-l-blue-500 bg-blue-50",
      green: "border-l-green-500 bg-green-50",
      yellow: "border-l-yellow-500 bg-yellow-50",
      red: "border-l-red-500 bg-red-50",
      purple: "border-l-purple-500 bg-purple-50",
    };
    return colors[color] || "border-l-blue-500 bg-blue-50";
  };

  return (
    <div className={`fixed top-0 left-0 right-0 shadow-sm border-b px-6 py-4 transition-all duration-300 z-30 ${
      sidebarOpen ? 'ml-64' : 'ml-20'
    } ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className={`pl-10 pr-4 py-2 border rounded-lg focus:outline-none ${
                isDark 
                  ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-gray-500' 
                  : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:border-gray-400'
              }`}
            />
            <FiSearch className={`absolute left-3 top-2.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition ${
              isDark 
                ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title={isDark ? "Light Mode" : "Dark Mode"}
          >
            {isDark ? <FiSun size={22} /> : <FiMoon size={22} />}
          </button>

           {/* Notification Bell */}
           <div className="relative">
             <button
               onClick={() => setShowNotifications(!showNotifications)}
               className={`relative p-2 rounded-lg transition ${
                 isDark 
                   ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                   : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
               }`}
               title="Notifications"
             >
              <FiBell size={22} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className={`absolute right-0 mt-2 w-96 rounded-lg shadow-xl z-50 max-h-96 flex flex-col ${
                isDark 
                  ? 'bg-gray-700 border border-gray-600' 
                  : 'bg-white border border-gray-200'
              }`}>
                {/* Header */}
                <div className={`p-4 border-b flex justify-between items-center ${
                  isDark ? 'border-gray-600' : 'border-gray-200'
                }`}>
                  <div>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Notifications
                    </h3>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {unreadCount} unread
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                {notifications.length > 0 ? (
                  <div className={`overflow-y-auto flex-1 scrollbar-thin ${
                    isDark 
                      ? 'scrollbar-thumb-gray-500 scrollbar-track-gray-700' 
                      : 'scrollbar-thumb-gray-300 scrollbar-track-gray-100'
                  }`}>
                    {notifications.map((notif) => (
                      <div
                        key={notif._id}
                        className={`px-4 py-3 border-b last:border-b-0 transition cursor-pointer ${
                          isDark 
                            ? `border-gray-600 hover:bg-gray-600 ${!notif.read ? "bg-gray-600" : ""}` 
                            : `border-gray-200 hover:bg-gray-50 ${!notif.read ? "bg-gray-100" : ""}`
                        }`}
                        onClick={() => {
                          if (!notif.read) {
                            handleMarkAsRead(notif._id);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                        {/* Icon */}
                        <span className="text-lg mt-1">{notif.icon}</span>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-medium text-sm break-words ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-1.5"></span>
                          )}
                        </div>
                        {notif.message && notif.message !== notif.title && (
                          <p className={`text-xs mt-1 break-words ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {notif.message}
                          </p>
                        )}
                        {notif.actorName && (
                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            by {notif.actorName}
                          </p>
                        )}
                        <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              {new Date(notif.createdAt).toLocaleDateString()}{" "}
                              {new Date(notif.createdAt).toLocaleTimeString()}
                            </p>
                          </div>

                          {/* Dismiss */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismiss(notif._id);
                            }}
                            className="text-gray-500 hover:text-gray-400 flex-shrink-0"
                          >
                            <FiX size={16} />
                          </button>
                          </div>
                          </div>
                          ))}
                          </div>
                          ) : (
                            <div className="p-8 text-center text-gray-400 text-sm">
                              <p>No notifications yet</p>
                              <p className="text-xs text-gray-500 mt-1">
                                You're all caught up!
                              </p>
                            </div>
                          )}

                           {/* Footer */}
                           {notifications.length > 0 && (
                             <div className="p-3 border-t border-gray-600 text-center">
                               <a
                                 href="/notifications"
                                 className="text-sm text-gray-300 hover:text-white font-medium"
                               >
                                 View all notifications
                               </a>
                             </div>
                           )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
