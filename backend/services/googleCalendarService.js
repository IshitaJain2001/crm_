const { google } = require('googleapis');
const CalendarIntegration = require('../models/CalendarIntegration');
const Meeting = require('../models/Meeting');

// Initialize Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

// ============================================================
// Get Authorization URL
// ============================================================
const getAuthorizationUrl = () => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  return url;
};

// ============================================================
// Exchange Auth Code for Tokens
// ============================================================
const exchangeCodeForTokens = async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw error;
  }
};

// ============================================================
// Connect Calendar
// ============================================================
const connectCalendar = async (userId, company, code) => {
  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Set credentials
    oauth2Client.setCredentials(tokens);

    // Get calendar info
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarInfo = await calendar.calendarList.list();
    
    const primaryCalendar = calendarInfo.data.items.find(cal => cal.primary);

    // Save integration
    const integration = new CalendarIntegration({
      user: userId,
      company,
      provider: 'google',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: new Date(tokens.expiry_date),
      calendarId: primaryCalendar.id,
      calendarName: primaryCalendar.summary,
      calendarEmail: primaryCalendar.description,
      timezone: primaryCalendar.timeZone,
      status: 'connected',
      permissions: ['read', 'write']
    });

    await integration.save();

    console.log(`✓ Calendar connected for user ${userId}`);

    return integration;

  } catch (error) {
    console.error('Error connecting calendar:', error);
    throw error;
  }
};

// ============================================================
// Get Available Time Slots
// ============================================================
const getAvailableSlots = async (userId, startDate, endDate, duration = 60) => {
  try {
    const integration = await CalendarIntegration.findOne({ user: userId });

    if (!integration || !integration.syncEnabled) {
      return [];
    }

    // Refresh token if needed
    if (integration.tokenExpiresAt < new Date()) {
      await refreshAccessToken(integration);
    }

    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get busy times
    const busyTimes = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        items: [{ id: integration.calendarId }]
      }
    });

    const busy = busyTimes.data.calendars[integration.calendarId].busy || [];

    // Generate available slots
    const availableSlots = generateAvailableSlots(
      startDate,
      endDate,
      busy,
      integration.workingHours,
      integration.bufferTime || 0,
      duration
    );

    return availableSlots;

  } catch (error) {
    console.error('Error getting available slots:', error);
    throw error;
  }
};

// ============================================================
// Helper: Generate Available Slots
// ============================================================
const generateAvailableSlots = (startDate, endDate, busyTimes, workingHours, bufferTime, duration) => {
  const slots = [];
  const current = new Date(startDate);
  const minSlotDuration = duration;

  while (current < endDate) {
    // Check if current time is within working hours
    const dayOfWeek = current.getDay();
    const hour = current.getHours();
    const minute = current.getMinutes();

    if (workingHours && !workingHours.daysOfWeek.includes(dayOfWeek)) {
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
      continue;
    }

    const slotStart = new Date(current);
    const slotEnd = new Date(slotStart.getTime() + minSlotDuration * 60000);

    // Check if slot overlaps with busy time
    let isAvailable = true;
    for (const busy of busyTimes) {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);

      if (
        (slotStart >= busyStart && slotStart < busyEnd) ||
        (slotEnd > busyStart && slotEnd <= busyEnd) ||
        (slotStart <= busyStart && slotEnd >= busyEnd)
      ) {
        isAvailable = false;
        break;
      }
    }

    if (isAvailable && slotEnd <= endDate) {
      slots.push({
        start: slotStart,
        end: slotEnd
      });
      current.setMinutes(current.getMinutes() + 30); // 30-min slots
    } else {
      current.setMinutes(current.getMinutes() + 30);
    }
  }

  return slots;
};

// ============================================================
// Create Meeting Event
// ============================================================
const createMeetingEvent = async (userId, meetingData) => {
  try {
    const integration = await CalendarIntegration.findOne({ user: userId });

    if (!integration) {
      throw new Error('Calendar not connected');
    }

    // Refresh token if needed
    if (integration.tokenExpiresAt < new Date()) {
      await refreshAccessToken(integration);
    }

    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Prepare event
    const event = {
      summary: meetingData.title,
      description: meetingData.description,
      start: {
        dateTime: meetingData.startTime.toISOString(),
        timeZone: integration.timezone
      },
      end: {
        dateTime: meetingData.endTime.toISOString(),
        timeZone: integration.timezone
      },
      attendees: meetingData.attendees.map(a => ({
        email: a.email,
        displayName: a.name
      })),
      conferenceData: meetingData.meetingLink ? {
        entryPoints: [
          {
            entryPointType: 'video',
            uri: meetingData.meetingLink
          }
        ]
      } : undefined,
      location: meetingData.location
    };

    // Create event
    const createdEvent = await calendar.events.insert({
      calendarId: integration.calendarId,
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all'
    });

    console.log(`✓ Calendar event created: ${createdEvent.data.id}`);

    return createdEvent.data;

  } catch (error) {
    console.error('Error creating meeting event:', error);
    throw error;
  }
};

// ============================================================
// Update Meeting Event
// ============================================================
const updateMeetingEvent = async (userId, eventId, meetingData) => {
  try {
    const integration = await CalendarIntegration.findOne({ user: userId });

    if (!integration) {
      throw new Error('Calendar not connected');
    }

    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: meetingData.title,
      description: meetingData.description,
      start: {
        dateTime: meetingData.startTime.toISOString(),
        timeZone: integration.timezone
      },
      end: {
        dateTime: meetingData.endTime.toISOString(),
        timeZone: integration.timezone
      },
      attendees: meetingData.attendees.map(a => ({
        email: a.email,
        displayName: a.name
      }))
    };

    const updatedEvent = await calendar.events.update({
      calendarId: integration.calendarId,
      eventId,
      requestBody: event,
      sendUpdates: 'all'
    });

    return updatedEvent.data;

  } catch (error) {
    console.error('Error updating meeting event:', error);
    throw error;
  }
};

// ============================================================
// Delete Meeting Event
// ============================================================
const deleteMeetingEvent = async (userId, eventId) => {
  try {
    const integration = await CalendarIntegration.findOne({ user: userId });

    if (!integration) {
      throw new Error('Calendar not connected');
    }

    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: integration.calendarId,
      eventId,
      sendUpdates: 'all'
    });

    console.log(`✓ Calendar event deleted: ${eventId}`);

  } catch (error) {
    console.error('Error deleting meeting event:', error);
    throw error;
  }
};

// ============================================================
// Refresh Access Token
// ============================================================
const refreshAccessToken = async (integration) => {
  try {
    oauth2Client.setCredentials({
      refresh_token: integration.refreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    // Update integration
    integration.accessToken = credentials.access_token;
    if (credentials.expiry_date) {
      integration.tokenExpiresAt = new Date(credentials.expiry_date);
    }
    if (credentials.refresh_token) {
      integration.refreshToken = credentials.refresh_token;
    }

    await integration.save();

    console.log(`✓ Access token refreshed for user ${integration.user}`);

  } catch (error) {
    console.error('Error refreshing access token:', error);
    integration.status = 'error';
    integration.errorMessage = error.message;
    await integration.save();
    throw error;
  }
};

// ============================================================
// Get Calendar Events
// ============================================================
const getCalendarEvents = async (userId, startDate, endDate) => {
  try {
    const integration = await CalendarIntegration.findOne({ user: userId });

    if (!integration) {
      return [];
    }

    if (integration.tokenExpiresAt < new Date()) {
      await refreshAccessToken(integration);
    }

    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const events = await calendar.events.list({
      calendarId: integration.calendarId,
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    return events.data.items || [];

  } catch (error) {
    console.error('Error getting calendar events:', error);
    return [];
  }
};

module.exports = {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  connectCalendar,
  getAvailableSlots,
  createMeetingEvent,
  updateMeetingEvent,
  deleteMeetingEvent,
  refreshAccessToken,
  getCalendarEvents
};
