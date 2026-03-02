import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { FiBell, FiSearch, FiX } from "react-icons/fi";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Header = ({ title }) => {
  const token = useSelector((state) => state.auth.token);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

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
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
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
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Notifications
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {unreadCount} unread
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                {notifications.length > 0 ? (
                  <div className="overflow-y-auto flex-1">
                    {notifications.map((notif) => (
                      <div
                        key={notif._id}
                        className={`px-4 py-3 border-b border-gray-100 last:border-b-0 transition cursor-pointer hover:bg-gray-50 ${
                          !notif.read ? "bg-blue-50" : ""
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
                              <p className="font-medium text-gray-900 text-sm break-words">
                                {notif.title}
                              </p>
                              {!notif.read && (
                                <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5"></span>
                              )}
                            </div>
                            {notif.message && notif.message !== notif.title && (
                              <p className="text-xs text-gray-600 mt-1 break-words">
                                {notif.message}
                              </p>
                            )}
                            {notif.actorName && (
                              <p className="text-xs text-gray-500 mt-1">
                                by {notif.actorName}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
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
                            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    <p>No notifications yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      You're all caught up!
                    </p>
                  </div>
                )}

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200 text-center">
                    <a
                      href="/notifications"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
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
