const express = require("express");
const Activity = require("../models/Activity");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");
const { sendTaskAssignedEmail } = require("../services/emailService");

const router = express.Router();

// Get all tasks - filter by assigned to current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority } = req.query;

    // Employees can only see tasks assigned to them
    let query = {
      type: "task",
      assignedTo: req.user.id,
    };

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Activity.find(query)
      .populate("contact")
      .populate("assignedTo", "name email")
      .populate("owner", "name email")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ dueDate: 1 });

    const total = await Activity.countDocuments(query);

    res.json({
      tasks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task - with permission checks
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { subject, description, contact, dueDate, priority, assignedTo } =
      req.body;

    // Validate required fields
    if (!subject) {
      return res.status(400).json({ error: "Task subject is required" });
    }

    // Check if user is allowed to assign tasks
    const currentUser = await User.findById(req.user.id);
    const isAdmin =
      currentUser.role === "superadmin" || currentUser.role === "admin";
    const isLeadRole = ["superadmin", "admin", "hr", "sales"].includes(
      currentUser.role,
    );

    // Only admin/superadmin/hr/sales can assign tasks to others
    if (assignedTo && assignedTo.toString() !== req.user.id) {
      if (!isLeadRole) {
        return res.status(403).json({
          error: "Only admins and team leads can assign tasks to other users",
        });
      }

      // Verify assignedTo user exists and is in same company
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        return res.status(404).json({ error: "Assigned user not found" });
      }

      if (assignedUser.company.toString() !== currentUser.company.toString()) {
        return res.status(403).json({
          error: "Cannot assign task to user from different company",
        });
      }
    }

    // If assignedTo is not provided, assign to self
    const taskAssignedTo = assignedTo || req.user.id;

    const task = new Activity({
      type: "task",
      subject,
      description,
      contact,
      dueDate,
      priority: priority || "medium",
      assignedTo: taskAssignedTo,
      owner: req.user.id,
      company: currentUser.company,
    });

    await task.save();
    await task.populate(["contact", "assignedTo"]);

    // Send assignment email if assigned to someone else
    if (taskAssignedTo.toString() !== req.user.id) {
      try {
        const assignedUser = await User.findById(taskAssignedTo);
        const createdByUser = await User.findById(req.user.id);
        if (assignedUser) {
          await sendTaskAssignedEmail(task, assignedUser, createdByUser);
        }
      } catch (emailError) {
        console.error("Task created but assignment email failed:", emailError);
      }
    }

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update task - with permission checks
router.put("/:taskId", authMiddleware, async (req, res) => {
  try {
    const { assignedTo, status, priority, subject, description, dueDate } =
      req.body;

    const task = await Activity.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check authorization: owner, assigned user, or admin
    const currentUser = await User.findById(req.user.id);
    const isOwner = task.owner.toString() === req.user.id;
    const isAssigned = task.assignedTo?.toString() === req.user.id;
    const isAdmin =
      currentUser.role === "superadmin" || currentUser.role === "admin";
    const isLeadRole = ["superadmin", "admin", "hr", "sales"].includes(
      currentUser.role,
    );

    if (!isOwner && !isAssigned && !isLeadRole) {
      return res.status(403).json({
        error:
          "Only task owner, assigned user, admin, or team lead can update task",
      });
    }

    // Only owner/admin/lead can reassign to someone else
    if (assignedTo && assignedTo.toString() !== task.assignedTo?.toString()) {
      if (!isOwner && !isLeadRole) {
        return res.status(403).json({
          error: "Only task owner, admin, or team lead can reassign tasks",
        });
      }

      // Verify new assigned user exists and is in same company
      const newAssignedUser = await User.findById(assignedTo);
      if (!newAssignedUser) {
        return res.status(404).json({ error: "Assigned user not found" });
      }

      if (
        newAssignedUser.company.toString() !== currentUser.company.toString()
      ) {
        return res.status(403).json({
          error: "Cannot assign task to user from different company",
        });
      }

      // Send reassignment notification
      try {
        const {
          createNotification,
        } = require("../services/notificationService");
        await createNotification({
          company: currentUser.company,
          userId: assignedTo,
          type: "task_assigned",
          title: `Task Reassigned: ${task.subject}`,
          message: `${currentUser.name} reassigned you "${task.subject}"`,
          resourceType: "task",
          resourceId: task._id,
          actorId: req.user.id,
          actorName: currentUser.name,
          actionUrl: `/tasks/${task._id}`,
        });
      } catch (notifError) {
        console.error("Notification creation failed:", notifError);
      }

      task.assignedTo = assignedTo;
    }

    // Update allowed fields
    if (subject) task.subject = subject;
    if (description) task.description = description;
    if (dueDate) task.dueDate = dueDate;
    if (priority) task.priority = priority;
    if (status) task.status = status;

    await task.save();
    await task.populate(["contact", "assignedTo"]);

    res.json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete task - only owner or admin can delete
router.delete("/:taskId", authMiddleware, async (req, res) => {
  try {
    const task = await Activity.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const currentUser = await User.findById(req.user.id);
    const isOwner = task.owner.toString() === req.user.id;
    const isAdmin =
      currentUser.role === "superadmin" || currentUser.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: "Only task owner or admin can delete tasks",
      });
    }

    await Activity.findByIdAndDelete(req.params.taskId);

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
