const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const Notification = require("../models/Notification");
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  dismissAllNotifications,
} = require("../services/notificationService");

const router = express.Router();

// ============================================================
// Get All Notifications
// ============================================================
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false, type } = req.query;

    const result = await getUserNotifications(req.user.id, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      unreadOnly: unreadOnly === "true",
      type: type || null,
    });

    res.json({
      notifications: result.notifications,
      unreadCount: result.unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get Unread Count
// ============================================================
router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      read: false,
      dismissed: false,
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Mark as Read
// ============================================================
router.put("/:notificationId/read", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await markAsRead(req.params.notificationId);

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Mark All as Read
// ============================================================
router.put("/read/all", authMiddleware, async (req, res) => {
  try {
    await markAllAsRead(req.user.id);

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Dismiss Notification
// ============================================================
router.put("/:notificationId/dismiss", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await dismissNotification(req.params.notificationId);

    res.json({ message: "Notification dismissed" });
  } catch (error) {
    console.error("Error dismissing notification:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Dismiss All Notifications
// ============================================================
router.put("/dismiss/all", authMiddleware, async (req, res) => {
  try {
    await dismissAllNotifications(req.user.id);

    res.json({ message: "All notifications dismissed" });
  } catch (error) {
    console.error("Error dismissing all notifications:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
