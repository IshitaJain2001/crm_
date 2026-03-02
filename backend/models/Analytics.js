const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      unique: true,
    },
    // Revenue Metrics
    totalRevenue: {
      type: Number,
      default: 0,
    },
    revenueThisMonth: {
      type: Number,
      default: 0,
    },
    revenueThisQuarter: {
      type: Number,
      default: 0,
    },
    revenueThisYear: {
      type: Number,
      default: 0,
    },
    revenueGrowth: {
      type: Number,
      default: 0, // percentage
    },

    // Deal Metrics
    totalDeals: {
      type: Number,
      default: 0,
    },
    openDeals: {
      type: Number,
      default: 0,
    },
    closedDeals: {
      type: Number,
      default: 0,
    },
    wonDeals: {
      type: Number,
      default: 0,
    },
    lostDeals: {
      type: Number,
      default: 0,
    },
    avgDealSize: {
      type: Number,
      default: 0,
    },
    dealClosureRate: {
      type: Number,
      default: 0, // percentage
    },
    avgSalesCycle: {
      type: Number,
      default: 0, // days
    },

    // Pipeline Metrics
    pipelineByStage: [
      {
        stage: String,
        count: Number,
        value: Number,
        percentage: Number,
      },
    ],

    // Contact Metrics
    totalContacts: {
      type: Number,
      default: 0,
    },
    activeContacts: {
      type: Number,
      default: 0,
    },
    contactConversionRate: {
      type: Number,
      default: 0, // percentage
    },
    contactsAddedThisMonth: {
      type: Number,
      default: 0,
    },

    // Company Metrics
    totalCompanies: {
      type: Number,
      default: 0,
    },
    activeCompanies: {
      type: Number,
      default: 0,
    },

    // Activity Metrics
    totalActivities: {
      type: Number,
      default: 0,
    },
    activitiesThisMonth: {
      type: Number,
      default: 0,
    },
    avgActivitiesPerDay: {
      type: Number,
      default: 0,
    },

    // Employee Metrics
    totalEmployees: {
      type: Number,
      default: 0,
    },
    activeEmployees: {
      type: Number,
      default: 0,
    },
    topPerformers: [
      {
        employeeId: mongoose.Schema.Types.ObjectId,
        name: String,
        dealsWon: Number,
        revenueGenerated: Number,
        rank: Number,
      },
    ],

    // Task Metrics
    totalTasks: {
      type: Number,
      default: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
    },
    overdueTasks: {
      type: Number,
      default: 0,
    },
    taskCompletionRate: {
      type: Number,
      default: 0, // percentage
    },

    // Trends
    revenueByMonth: [
      {
        month: String,
        revenue: Number,
      },
    ],
    dealsWonByMonth: [
      {
        month: String,
        count: Number,
        value: Number,
      },
    ],
    activityTrend: [
      {
        date: Date,
        count: Number,
      },
    ],

    // Last Updated
    lastUpdated: {
      type: Date,
      default: Date.now,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Analytics", analyticsSchema);
