const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const Meeting = require("../models/Meeting");
const CalendarIntegration = require("../models/CalendarIntegration");
const User = require("../models/User");
const {
  getAuthorizationUrl,
  connectCalendar,
  getAvailableSlots,
  createMeetingEvent,
  updateMeetingEvent,
  deleteMeetingEvent,
  getCalendarEvents,
} = require("../services/googleCalendarService");
const { sendMeetingInviteEmail } = require("../services/emailService");

const router = express.Router();

// ============================================================
// Get Company Employees (for attendee selection)
// ============================================================
router.get("/employees", authMiddleware, async (req, res) => {
  try {
    console.log("Fetching employees for company:", req.user.company);

    const employees = await User.find(
      { company: req.user.company, active: true },
      "name email department role",
    ).sort({ name: 1 });

    console.log(`Found ${employees.length} employees`);

    res.json({
      employees: employees.map((emp) => ({
        id: emp._id,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        role: emp.role,
      })),
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get Employee Availability for Multiple Users
// ============================================================
router.post("/employees/availability", authMiddleware, async (req, res) => {
  try {
    const { employeeIds, startDate, endDate } = req.body;

    if (
      !employeeIds ||
      !Array.isArray(employeeIds) ||
      employeeIds.length === 0
    ) {
      return res.status(400).json({ error: "Employee IDs array is required" });
    }

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start and end dates are required" });
    }

    const availabilityData = {};

    for (const empId of employeeIds) {
      try {
        const slots = await getAvailableSlots(
          empId,
          new Date(startDate),
          new Date(endDate),
          60,
        );

        availabilityData[empId] = {
          totalSlots: slots.length,
          availableSlots: slots,
        };
      } catch (error) {
        availabilityData[empId] = {
          totalSlots: 0,
          error: "Could not fetch availability",
          availableSlots: [],
        };
      }
    }

    res.json(availabilityData);
  } catch (error) {
    console.error("Error fetching employee availability:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Find Common Available Time (Time Optimization)
// ============================================================
router.post("/common-available-slots", authMiddleware, async (req, res) => {
  try {
    const { employeeIds, startDate, endDate, duration = 60 } = req.body;

    if (
      !employeeIds ||
      !Array.isArray(employeeIds) ||
      employeeIds.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "At least one employee is required" });
    }

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start and end dates are required" });
    }

    // Get availability for all employees
    const allAvailability = {};

    for (const empId of employeeIds) {
      try {
        const slots = await getAvailableSlots(
          empId,
          new Date(startDate),
          new Date(endDate),
          duration,
        );
        allAvailability[empId] = slots.map((s) => ({
          start: new Date(s.start),
          end: new Date(s.end),
        }));
      } catch (error) {
        allAvailability[empId] = [];
      }
    }

    // Find common slots (where ALL employees are free)
    const commonSlots = findCommonSlots(allAvailability, employeeIds);

    res.json({
      commonSlots,
      totalCommonSlots: commonSlots.length,
      employeeCount: employeeIds.length,
    });
  } catch (error) {
    console.error("Error finding common slots:", error);
    res.status(500).json({ error: error.message });
  }
});

// Helper: Find slots common to all employees
const findCommonSlots = (availability, employeeIds) => {
  if (employeeIds.length === 0) return [];

  // Start with first employee's slots
  let commonSlots = availability[employeeIds[0]] || [];

  // Filter to only slots that exist for ALL employees
  for (let i = 1; i < employeeIds.length; i++) {
    const empSlots = availability[employeeIds[i]] || [];

    commonSlots = commonSlots.filter((slot) => {
      return empSlots.some(
        (empSlot) =>
          slot.start.getTime() === empSlot.start.getTime() &&
          slot.end.getTime() === empSlot.end.getTime(),
      );
    });
  }

  return commonSlots;
};

// ============================================================
// Get Google Calendar Auth URL
// ============================================================
router.get("/calendar/auth-url", authMiddleware, (req, res) => {
  try {
    const authUrl = getAuthorizationUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error("Error getting auth URL:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Connect Google Calendar
// ============================================================
router.post("/calendar/connect", authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Authorization code is required" });
    }

    const integration = await connectCalendar(
      req.user.id,
      req.user.company,
      code,
    );

    res.status(201).json({
      message: "Calendar connected successfully",
      integration: {
        id: integration._id,
        provider: integration.provider,
        calendarName: integration.calendarName,
        calendarEmail: integration.calendarEmail,
        status: integration.status,
      },
    });
  } catch (error) {
    console.error("Error connecting calendar:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get Calendar Integration Status
// ============================================================
router.get("/calendar/status", authMiddleware, async (req, res) => {
  try {
    const integration = await CalendarIntegration.findOne({
      user: req.user.id,
    });

    if (!integration) {
      return res.json({
        connected: false,
        message: "Calendar not connected",
      });
    }

    res.json({
      connected: integration.status === "connected",
      provider: integration.provider,
      calendarName: integration.calendarName,
      calendarEmail: integration.calendarEmail,
      timezone: integration.timezone,
      syncEnabled: integration.syncEnabled,
      status: integration.status,
    });
  } catch (error) {
    console.error("Error getting calendar status:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get Available Time Slots
// ============================================================
router.post("/available-slots", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, duration = 60 } = req.body;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start and end dates are required" });
    }

    const availableSlots = await getAvailableSlots(
      req.user.id,
      new Date(startDate),
      new Date(endDate),
      duration,
    );

    res.json({
      availableSlots,
      totalSlots: availableSlots.length,
    });
  } catch (error) {
    console.error("Error getting available slots:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Create Meeting
// ============================================================
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      startTime,
      endTime,
      attendees,
      location,
      meetingType,
      meetingLink,
      contact,
      deal,
      syncToCalendar = true,
    } = req.body;

    // Validate required fields
    if (!title || !startTime || !endTime) {
      return res
        .status(400)
        .json({ error: "Title, start time, and end time are required" });
    }

    if (!attendees || attendees.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one attendee is required" });
    }

    // Create meeting
    const meeting = new Meeting({
      organizer: req.user.id,
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      attendees,
      location,
      meetingType,
      meetingLink,
      company: req.user.company,
      contact,
      deal,
      duration: (new Date(endTime) - new Date(startTime)) / 60000,
    });

    // Sync to calendar if enabled
    if (syncToCalendar) {
      try {
        const calendarEvent = await createMeetingEvent(req.user.id, {
          title,
          description,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          attendees,
          location,
          meetingLink,
        });

        meeting.calendarEventId = calendarEvent.id;
        meeting.calendarProvider = "google";
        meeting.syncedToCalendar = true;
      } catch (error) {
        console.error("Warning: Failed to sync to calendar:", error);
        // Continue without calendar sync
      }
    }

    await meeting.save();

    // Send meeting invite emails
    for (const attendee of attendees) {
      try {
        await sendMeetingInviteEmail(attendee, meeting, req.user);
      } catch (emailError) {
        console.error("Warning: Failed to send invite email:", emailError);
      }
    }

    res.status(201).json({
      message: "Meeting scheduled successfully",
      meeting: {
        id: meeting._id,
        title: meeting.title,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        attendees: meeting.attendees,
        syncedToCalendar: meeting.syncedToCalendar,
      },
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get Meetings
// ============================================================
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, contact } = req.query;

    let query = { company: req.user.company };

    if (status) query.status = status;
    if (contact) query.contact = contact;

    const meetings = await Meeting.find(query)
      .populate("organizer", "name email")
      .populate("contact", "name email")
      .populate("deal", "name")
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Meeting.countDocuments(query);

    res.json({
      meetings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get Single Meeting
// ============================================================
router.get("/:meetingId", authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.meetingId)
      .populate("organizer", "name email")
      .populate("attendees.contactId", "name email")
      .populate("contact", "name email")
      .populate("deal", "name amount stage");

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    res.json(meeting);
  } catch (error) {
    console.error("Error fetching meeting:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Update Meeting
// ============================================================
router.put("/:meetingId", authMiddleware, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const {
      title,
      description,
      startTime,
      endTime,
      attendees,
      location,
      meetingLink,
      status,
      notes,
    } = req.body;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    if (meeting.organizer.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this meeting" });
    }

    // Update fields
    if (title) meeting.title = title;
    if (description) meeting.description = description;
    if (startTime) meeting.startTime = new Date(startTime);
    if (endTime) meeting.endTime = new Date(endTime);
    if (attendees) meeting.attendees = attendees;
    if (location) meeting.location = location;
    if (meetingLink) meeting.meetingLink = meetingLink;
    if (status) meeting.status = status;
    if (notes) meeting.notes = notes;

    // Update calendar if synced
    if (meeting.syncedToCalendar && meeting.calendarEventId) {
      try {
        await updateMeetingEvent(req.user.id, meeting.calendarEventId, {
          title: meeting.title,
          description: meeting.description,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          attendees: meeting.attendees,
        });
      } catch (error) {
        console.error("Warning: Failed to update calendar event:", error);
      }
    }

    await meeting.save();

    res.json({
      message: "Meeting updated successfully",
      meeting,
    });
  } catch (error) {
    console.error("Error updating meeting:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Cancel Meeting
// ============================================================
router.patch("/:meetingId/cancel", authMiddleware, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    if (meeting.organizer.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    meeting.status = "cancelled";

    // Delete from calendar if synced
    if (meeting.syncedToCalendar && meeting.calendarEventId) {
      try {
        await deleteMeetingEvent(req.user.id, meeting.calendarEventId);
      } catch (error) {
        console.error("Warning: Failed to delete calendar event:", error);
      }
    }

    await meeting.save();

    res.json({
      message: "Meeting cancelled successfully",
      meeting,
    });
  } catch (error) {
    console.error("Error cancelling meeting:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Get Calendar Events
// ============================================================
router.get("/calendar/events", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "Start and end dates are required" });
    }

    const events = await getCalendarEvents(
      req.user.id,
      new Date(startDate),
      new Date(endDate),
    );

    res.json({ events });
  } catch (error) {
    console.error("Error getting calendar events:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Mark Meeting as Completed
// ============================================================
router.patch("/:meetingId/complete", authMiddleware, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { notes, recordingUrl } = req.body;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    meeting.status = "completed";
    if (notes) meeting.notes = notes;
    if (recordingUrl) meeting.recordingUrl = recordingUrl;

    await meeting.save();

    res.json({
      message: "Meeting marked as completed",
      meeting,
    });
  } catch (error) {
    console.error("Error completing meeting:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
