const Deal = require("../models/Deal");
const Contact = require("../models/Contact");
const Company = require("../models/Company");
const Activity = require("../models/Activity");
const User = require("../models/User");
const Analytics = require("../models/Analytics");

// Calculate analytics for a company
const calculateAnalytics = async (companyId) => {
  try {
    console.log(`📊 Calculating analytics for company: ${companyId}`);

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const startOfQuarter = new Date(
      today.getFullYear(),
      Math.floor(today.getMonth() / 3) * 3,
      1
    );

    // ===== DEAL METRICS =====
    const allDeals = await Deal.find({ company: companyId });
    const dealsThisMonth = allDeals.filter(
      (d) => new Date(d.createdAt) >= startOfMonth
    );
    const dealsThisYear = allDeals.filter(
      (d) => new Date(d.createdAt) >= startOfYear
    );
    const dealsThisQuarter = allDeals.filter(
      (d) => new Date(d.createdAt) >= startOfQuarter
    );

    const wonDeals = allDeals.filter((d) => d.status === "won");
    const lostDeals = allDeals.filter((d) => d.status === "lost");
    const openDeals = allDeals.filter((d) => d.status === "open");
    const closedDeals = wonDeals.length + lostDeals.length;

    // Revenue calculations
    const totalRevenue = allDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
    const revenueThisMonth = dealsThisMonth.reduce(
      (sum, d) => sum + (d.amount || 0),
      0
    );
    const revenueThisQuarter = dealsThisQuarter.reduce(
      (sum, d) => sum + (d.amount || 0),
      0
    );
    const revenueThisYear = dealsThisYear.reduce(
      (sum, d) => sum + (d.amount || 0),
      0
    );

    // Previous month revenue for growth calculation
    const startOfPrevMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );
    const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    const prevMonthRevenue = allDeals
      .filter(
        (d) =>
          new Date(d.createdAt) >= startOfPrevMonth &&
          new Date(d.createdAt) <= endOfPrevMonth
      )
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    const revenueGrowth =
      prevMonthRevenue > 0
        ? ((revenueThisMonth - prevMonthRevenue) / prevMonthRevenue) * 100
        : 0;

    const avgDealSize = allDeals.length > 0 ? totalRevenue / allDeals.length : 0;
    const dealClosureRate =
      allDeals.length > 0 ? ((closedDeals / allDeals.length) * 100).toFixed(2) : 0;

    // Average sales cycle (days from creation to close)
    const closedDealsWithDates = allDeals.filter(
      (d) => d.status !== "open" && d.closedDate
    );
    const avgSalesCycle =
      closedDealsWithDates.length > 0
        ? (
            closedDealsWithDates.reduce(
              (sum, d) =>
                sum +
                (new Date(d.closedDate) - new Date(d.createdAt)) /
                  (1000 * 60 * 60 * 24),
              0
            ) / closedDealsWithDates.length
          ).toFixed(0)
        : 0;

    // Pipeline by stage
    const stageGroups = {};
    allDeals.forEach((d) => {
      if (!stageGroups[d.stage]) {
        stageGroups[d.stage] = { count: 0, value: 0 };
      }
      stageGroups[d.stage].count++;
      stageGroups[d.stage].value += d.amount || 0;
    });

    const pipelineByStage = Object.entries(stageGroups).map(
      ([stage, data]) => ({
        stage,
        count: data.count,
        value: data.value,
        percentage: allDeals.length > 0 ? ((data.count / allDeals.length) * 100).toFixed(1) : 0,
      })
    );

    // ===== CONTACT METRICS =====
    const allContacts = await Contact.find({ company: companyId });
    const contactsThisMonth = allContacts.filter(
      (c) => new Date(c.createdAt) >= startOfMonth
    );
    const activeContacts = allContacts.filter((c) => c.active !== false).length;
    const contactsWithDeals = allContacts.filter((c) => c.relatedDeals?.length > 0).length;
    const contactConversionRate =
      allContacts.length > 0
        ? ((contactsWithDeals / allContacts.length) * 100).toFixed(2)
        : 0;

    // ===== COMPANY METRICS =====
    const allCompanies = await Company.find();
    const activeCompanies = allCompanies.filter((c) => c.status !== "inactive").length;

    // ===== ACTIVITY METRICS =====
    const allActivities = await Activity.find({ company: companyId });
    const activitiesThisMonth = allActivities.filter(
      (a) => new Date(a.createdAt) >= startOfMonth
    );
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const avgActivitiesPerDay =
      activitiesThisMonth.length > 0
        ? (activitiesThisMonth.length / daysInMonth).toFixed(2)
        : 0;

    // ===== EMPLOYEE METRICS =====
    const allEmployees = await User.find({ company: companyId });
    const activeEmployees = allEmployees.filter((e) => e.active !== false).length;

    // Top performers
    const employeeStats = {};
    wonDeals.forEach((deal) => {
      if (deal.owner) {
        if (!employeeStats[deal.owner]) {
          employeeStats[deal.owner] = { dealsWon: 0, revenueGenerated: 0 };
        }
        employeeStats[deal.owner].dealsWon++;
        employeeStats[deal.owner].revenueGenerated += deal.amount || 0;
      }
    });

    const topPerformers = Object.entries(employeeStats)
      .map(([employeeId, stats]) => {
        const employee = allEmployees.find((e) => e._id.toString() === employeeId);
        return {
          employeeId,
          name: employee?.name || "Unknown",
          dealsWon: stats.dealsWon,
          revenueGenerated: stats.revenueGenerated,
        };
      })
      .sort((a, b) => b.revenueGenerated - a.revenueGenerated)
      .slice(0, 5)
      .map((p, idx) => ({ ...p, rank: idx + 1 }));

    // ===== TASK METRICS =====
    // Tasks not tracked separately - using 0 as placeholder
    const allTasks = [];
    const completedTasks = 0;
    const overdueTasks = 0;
    const taskCompletionRate = 0;

    // ===== TRENDS =====
    // Revenue by month (last 12 months)
    const revenueByMonth = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(
        today.getFullYear(),
        today.getMonth() - i,
        1
      );
      const monthEnd = new Date(
        today.getFullYear(),
        today.getMonth() - i + 1,
        0
      );
      const monthRevenue = allDeals
        .filter(
          (d) =>
            new Date(d.createdAt) >= monthStart &&
            new Date(d.createdAt) <= monthEnd
        )
        .reduce((sum, d) => sum + (d.amount || 0), 0);

      const monthName = monthStart.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      revenueByMonth.push({ month: monthName, revenue: monthRevenue });
    }

    // Deals won by month (last 12 months)
    const dealsWonByMonth = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(
        today.getFullYear(),
        today.getMonth() - i,
        1
      );
      const monthEnd = new Date(
        today.getFullYear(),
        today.getMonth() - i + 1,
        0
      );
      const monthWonDeals = wonDeals.filter(
        (d) =>
          new Date(d.closedDate) >= monthStart &&
          new Date(d.closedDate) <= monthEnd
      );
      const monthWonRevenue = monthWonDeals.reduce(
        (sum, d) => sum + (d.amount || 0),
        0
      );

      const monthName = monthStart.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      dealsWonByMonth.push({
        month: monthName,
        count: monthWonDeals.length,
        value: monthWonRevenue,
      });
    }

    // ===== SAVE ANALYTICS =====
    const analytics = await Analytics.findOneAndUpdate(
      { company: companyId },
      {
        company: companyId,
        totalRevenue,
        revenueThisMonth,
        revenueThisQuarter,
        revenueThisYear,
        revenueGrowth: revenueGrowth.toFixed(2),
        totalDeals: allDeals.length,
        openDeals: openDeals.length,
        closedDeals,
        wonDeals: wonDeals.length,
        lostDeals: lostDeals.length,
        avgDealSize: avgDealSize.toFixed(2),
        dealClosureRate,
        avgSalesCycle,
        pipelineByStage,
        totalContacts: allContacts.length,
        activeContacts,
        contactConversionRate,
        contactsAddedThisMonth: contactsThisMonth.length,
        totalCompanies: allCompanies.length,
        activeCompanies,
        totalActivities: allActivities.length,
        activitiesThisMonth: activitiesThisMonth.length,
        avgActivitiesPerDay,
        totalEmployees: allEmployees.length,
        activeEmployees,
        topPerformers,
        totalTasks: allTasks.length,
        completedTasks,
        overdueTasks,
        taskCompletionRate,
        revenueByMonth,
        dealsWonByMonth,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    console.log("✓ Analytics updated successfully");
    return analytics;
  } catch (error) {
    console.error("Error calculating analytics:", error.message);
    throw error;
  }
};

module.exports = {
  calculateAnalytics,
};
