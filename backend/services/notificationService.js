const Notification = require("../models/Notification");

// Notification type configurations
const notificationConfig = {
  contact_created: {
    icon: "👤",
    color: "blue",
    priority: "low",
  },
  contact_updated: {
    icon: "✏️",
    color: "blue",
    priority: "low",
  },
  company_created: {
    icon: "🏢",
    color: "blue",
    priority: "low",
  },
  company_updated: {
    icon: "✏️",
    color: "blue",
    priority: "low",
  },
  deal_created: {
    icon: "💼",
    color: "green",
    priority: "medium",
  },
  deal_updated: {
    icon: "✏️",
    color: "green",
    priority: "low",
  },
  deal_stage_changed: {
    icon: "📈",
    color: "green",
    priority: "medium",
  },
  task_created: {
    icon: "📝",
    color: "yellow",
    priority: "medium",
  },
  task_assigned: {
    icon: "📌",
    color: "yellow",
    priority: "high",
  },
  task_completed: {
    icon: "✅",
    color: "green",
    priority: "medium",
  },
  email_sent: {
    icon: "📧",
    color: "blue",
    priority: "low",
  },
  email_opened: {
    icon: "👁️",
    color: "blue",
    priority: "low",
  },
  email_clicked: {
    icon: "🔗",
    color: "blue",
    priority: "medium",
  },
  meeting_created: {
    icon: "📅",
    color: "purple",
    priority: "medium",
  },
  meeting_scheduled: {
    icon: "🗓️",
    color: "purple",
    priority: "high",
  },
  meeting_completed: {
    icon: "✅",
    color: "purple",
    priority: "low",
  },
  meeting_reminder: {
    icon: "🔔",
    color: "red",
    priority: "high",
  },
  form_submitted: {
    icon: "📋",
    color: "green",
    priority: "medium",
  },
  activity_logged: {
    icon: "📊",
    color: "blue",
    priority: "low",
  },
  user_mentioned: {
    icon: "@",
    color: "red",
    priority: "high",
  },
  item_assigned: {
    icon: "👤",
    color: "yellow",
    priority: "high",
  },
  comment_added: {
    icon: "💬",
    color: "blue",
    priority: "medium",
  },
  deadline_approaching: {
    icon: "⏰",
    color: "red",
    priority: "urgent",
  },
};

// Create notification
const createNotification = async ({
  company,
  userId,
  type,
  title,
  message,
  resourceType,
  resourceId,
  actorId,
  actorName,
  actorEmail,
  actionUrl,
  metadata,
}) => {
  try {
    const config = notificationConfig[type] || {
      icon: "📢",
      color: "blue",
      priority: "medium",
    };

    const notification = new Notification({
      company,
      userId,
      type,
      title,
      message: message || title,
      icon: config.icon,
      color: config.color,
      resourceType,
      resourceId,
      actorId,
      actorName,
      actorEmail,
      actionUrl,
      priority: config.priority,
      metadata,
    });

    await notification.save();
    console.log(`✓ Notification created: ${type} for user ${userId}`);
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error.message);
    // Don't throw - notifications shouldn't break main operations
    return null;
  }
};

// Create bulk notifications (for team assignments)
const createBulkNotifications = async (userIds, notificationData) => {
  try {
    const notifications = userIds.map((userId) => ({
      ...notificationData,
      userId,
    }));
    const result = await Notification.insertMany(notifications);
    console.log(`✓ ${result.length} notifications created`);
    return result;
  } catch (error) {
    console.error("Error creating bulk notifications:", error.message);
    return [];
  }
};

// Get unread notifications count
const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      userId,
      read: false,
      dismissed: false,
    });
    return count;
  } catch (error) {
    console.error("Error getting unread count:", error.message);
    return 0;
  }
};

// Get user notifications
const getUserNotifications = async (userId, options = {}) => {
  try {
    const {
      limit = 20,
      skip = 0,
      unreadOnly = false,
      type = null,
    } = options;

    let query = {
      userId,
      dismissed: false,
    };

    if (unreadOnly) {
      query.read = false;
    }

    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate("actorId", "name email")
      .populate("resourceId");

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      total,
      unreadCount: await getUnreadCount(userId),
    };
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
    return {
      notifications: [],
      total: 0,
      unreadCount: 0,
    };
  }
};

// Mark as read
const markAsRead = async (notificationId) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        read: true,
        readAt: new Date(),
      },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error("Error marking notification as read:", error.message);
    return null;
  }
};

// Mark all as read
const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      {
        userId,
        read: false,
        dismissed: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );
    console.log(`✓ Marked ${result.modifiedCount} notifications as read`);
    return result;
  } catch (error) {
    console.error("Error marking all as read:", error.message);
    return null;
  }
};

// Dismiss notification
const dismissNotification = async (notificationId) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        dismissed: true,
        dismissedAt: new Date(),
      },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error("Error dismissing notification:", error.message);
    return null;
  }
};

// Dismiss all notifications
const dismissAllNotifications = async (userId) => {
  try {
    const result = await Notification.updateMany(
      {
        userId,
        dismissed: false,
      },
      {
        dismissed: true,
        dismissedAt: new Date(),
      }
    );
    return result;
  } catch (error) {
    console.error("Error dismissing all notifications:", error.message);
    return null;
  }
};

// Delete old notifications (cleanup)
const cleanupOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      read: true,
      dismissed: true,
    });

    console.log(`✓ Deleted ${result.deletedCount} old notifications`);
    return result;
  } catch (error) {
    console.error("Error cleaning up notifications:", error.message);
    return null;
  }
};

module.exports = {
  createNotification,
  createBulkNotifications,
  getUnreadCount,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  dismissAllNotifications,
  cleanupOldNotifications,
  notificationConfig,
};
