const EmailTemplate = require("../models/EmailTemplate");
const Contact = require("../models/Contact");
const Deal = require("../models/Deal");
const Activity = require("../models/Activity");

// Get email template recommendations for a contact
const getEmailTemplateRecommendation = async (contactId, companyId) => {
  try {
    console.log(`📧 Getting email recommendations for contact: ${contactId}`);

    const contact = await Contact.findById(contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    // Get contact's deals
    const deals = await Deal.find({
      company: companyId,
      $or: [
        { initialContact: contactId },
        { relatedContact: contactId },
      ],
    }).sort({ createdAt: -1 });

    // Determine current deal stage
    let dealStage = "qualification";
    if (deals.length > 0) {
      const latestDeal = deals[0];
      dealStage = latestDeal.stage || "qualification";
    }

    // Get communication history
    const activities = await Activity.find({
      company: companyId,
      relatedTo: contactId,
    }).sort({ createdAt: -1 });

    // Determine recommendation category based on interaction history
    let recommendedCategory = getRecommendedCategory(
      activities,
      dealStage,
      deals
    );

    // Get templates matching the recommendation
    const templates = await EmailTemplate.find({
      $or: [{ company: companyId }, { company: { $exists: false } }],
      category: recommendedCategory,
      $or: [
        { dealStage: "all" },
        { dealStage: dealStage },
      ],
    }).sort({ successRate: -1, timesUsed: -1 });

    // Get top 3 templates
    const topTemplates = templates.slice(0, 3);

    return {
      recommendedCategory,
      dealStage,
      templates: topTemplates.map((t) => ({
        id: t._id,
        name: t.name,
        subject: t.subject,
        body: t.body,
        category: t.category,
        successRate: t.successRate,
        description: `Success rate: ${t.successRate}%`,
      })),
      insight: getInsight(activities, dealStage, contact),
    };
  } catch (error) {
    console.error("Error getting email recommendations:", error.message);
    throw error;
  }
};

// Determine recommended email category
const getRecommendedCategory = (activities, dealStage, deals) => {
  if (activities.length === 0) {
    return "initial_contact";
  }

  const lastActivity = activities[0];
  const daysSinceLastContact = Math.floor(
    (new Date() - new Date(lastActivity.createdAt)) / (1000 * 60 * 60 * 24)
  );

  // Check last activity type
  const lastActivityType = lastActivity.activityType;

  if (lastActivityType === "email_sent") {
    if (daysSinceLastContact > 7) {
      return "follow_up";
    }
  }

  if (lastActivityType === "email_opened" || lastActivityType === "email_clicked") {
    return "follow_up";
  }

  if (lastActivityType === "call") {
    return "follow_up";
  }

  if (lastActivityType === "meeting") {
    return "proposal";
  }

  if (daysSinceLastContact > 30) {
    return "re_engagement";
  }

  if (daysSinceLastContact > 60) {
    return "win_back";
  }

  // Based on deal stage
  switch (dealStage) {
    case "proposal":
      return "proposal";
    case "negotiation":
      return "negotiation";
    case "decision":
      return "closing";
    default:
      return "follow_up";
  }
};

// Get insight/context message
const getInsight = (activities, dealStage, contact) => {
  if (activities.length === 0) {
    return "First time contacting this prospect - use introduction template";
  }

  const lastActivity = activities[0];
  const daysSinceLastContact = Math.floor(
    (new Date() - new Date(lastActivity.createdAt)) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastContact > 30) {
    return `Last contact was ${daysSinceLastContact} days ago - use re-engagement template`;
  }

  if (lastActivity.activityType === "meeting") {
    return "Follow up after meeting - send proposal or next steps";
  }

  if (lastActivity.activityType === "email_sent") {
    return `${daysSinceLastContact} days since email sent - gentle follow-up recommended`;
  }

  return `Continue with ${dealStage} stage - use relevant template`;
};

// Get optimal follow-up timing
const getFollowUpTiming = async (contactId, companyId) => {
  try {
    console.log(`⏰ Calculating follow-up timing for contact: ${contactId}`);

    const contact = await Contact.findById(contactId);
    if (!contact) {
      throw new Error("Contact not found");
    }

    // Get all activities for this contact
    const activities = await Activity.find({
      company: companyId,
      relatedTo: contactId,
    }).sort({ createdAt: -1 });

    if (activities.length === 0) {
      return getDefaultTiming("initial_contact");
    }

    // Analyze email open times
    const emailOpenTimes = [];
    activities.forEach((activity) => {
      if (activity.activityType === "email_opened") {
        const hour = new Date(activity.createdAt).getHours();
        emailOpenTimes.push(hour);
      }
    });

    // Calculate average open time
    const bestTimeToSend = calculateBestTime(emailOpenTimes);

    // Get last activity
    const lastActivity = activities[0];
    const daysSinceLastContact = Math.floor(
      (new Date() - new Date(lastActivity.createdAt)) / (1000 * 60 * 60 * 24)
    );

    // Determine follow-up day
    let followUpDaysFromNow = getFollowUpDays(
      lastActivity.activityType,
      daysSinceLastContact
    );

    // Create follow-up date
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + followUpDaysFromNow);
    followUpDate.setHours(bestTimeToSend, 0, 0, 0);

    // Check for weekend and move to Monday if needed
    const day = followUpDate.getDay();
    if (day === 0) followUpDate.setDate(followUpDate.getDate() + 1); // Sunday -> Monday
    if (day === 6) followUpDate.setDate(followUpDate.getDate() + 2); // Saturday -> Monday

    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayName = daysOfWeek[followUpDate.getDay()];

    // Get email open rate for this contact
    const emailsSent = activities.filter(
      (a) => a.activityType === "email_sent"
    ).length;
    const emailsOpened = activities.filter(
      (a) => a.activityType === "email_opened"
    ).length;
    const openRate =
      emailsSent > 0
        ? ((emailsOpened / emailsSent) * 100).toFixed(0)
        : "No data";

    return {
      optimalDay: dayName,
      optimalTime: `${bestTimeToSend}:00 (${getTimeLabel(bestTimeToSend)})`,
      followUpDate: followUpDate.toISOString(),
      daysFromNow: followUpDaysFromNow,
      reasoning: getTimingReasoning(
        lastActivity.activityType,
        daysSinceLastContact,
        bestTimeToSend
      ),
      contactEngagement: {
        emailOpenRate: `${openRate}%`,
        lastActivity: lastActivity.activityType,
        daysSinceLastContact,
        recommendedUrgency:
          daysSinceLastContact > 14 ? "High - Follow up soon!" : "Medium",
      },
    };
  } catch (error) {
    console.error("Error calculating follow-up timing:", error.message);
    throw error;
  }
};

// Calculate best time to send email based on open history
const calculateBestTime = (emailOpenTimes) => {
  if (emailOpenTimes.length === 0) {
    // Default: 9 AM
    return 9;
  }

  // Find most common hour
  const hourCounts = {};
  emailOpenTimes.forEach((hour) => {
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  let bestHour = 9;
  let maxCount = 0;
  Object.entries(hourCounts).forEach(([hour, count]) => {
    if (count > maxCount) {
      maxCount = count;
      bestHour = parseInt(hour);
    }
  });

  return bestHour;
};

// Determine follow-up days based on last activity
const getFollowUpDays = (lastActivityType, daysSinceLastContact) => {
  // If last activity was > 14 days ago, follow up ASAP (next day)
  if (daysSinceLastContact > 14) {
    return 1;
  }

  switch (lastActivityType) {
    case "email_sent":
      return 3; // 3 days after email
    case "email_opened":
      return 2; // 2 days after they open email
    case "call":
      return 1; // Next day after call
    case "meeting":
      return 2; // 2 days after meeting
    case "email_clicked":
      return 1; // Next day after click
    default:
      return 3;
  }
};

// Get time label
const getTimeLabel = (hour) => {
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return "12:00 PM";
  return `${hour - 12}:00 PM`;
};

// Get timing reasoning
const getTimingReasoning = (lastActivityType, daysSinceLastContact, bestHour) => {
  let reason = "";

  if (daysSinceLastContact > 14) {
    reason = `${daysSinceLastContact} days have passed - send follow-up immediately. `;
  }

  switch (lastActivityType) {
    case "email_sent":
      reason += "Usually responds in 3 days after receiving email.";
      break;
    case "email_opened":
      reason += "They opened your email - follow up within 2 days while interest is fresh.";
      break;
    case "call":
      reason += "Follow up on phone call within 1-2 days to maintain momentum.";
      break;
    case "meeting":
      reason += "Send proposal or recap email 1-2 days after meeting while it's fresh.";
      break;
    default:
      reason += "Standard follow-up timing.";
  }

  reason += ` Best time: ${getTimeLabel(bestHour)} (based on their email opening history).`;

  return reason;
};

// Get default timing
const getDefaultTiming = (category) => {
  return {
    optimalDay: "Monday",
    optimalTime: "9:00 AM",
    followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    daysFromNow: 2,
    reasoning: "First contact - recommended timing: Monday morning",
    contactEngagement: {
      emailOpenRate: "No data",
      lastActivity: "None",
      daysSinceLastContact: "N/A",
      recommendedUrgency: "Normal",
    },
  };
};

module.exports = {
  getEmailTemplateRecommendation,
  getFollowUpTiming,
};
