const express = require('express');
const Deal = require('../models/Deal');
const Contact = require('../models/Contact');
const Activity = require('../models/Activity');
const Company = require('../models/Company');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get dashboard stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const thisMonth = new Date();
    thisMonth.setDate(1);

    // Total contacts
    const totalContacts = await Contact.countDocuments({ owner: userId });

    // Total companies
    const totalCompanies = await Company.countDocuments({ owner: userId });

    // Open deals
    const openDeals = await Deal.find({ 
      owner: userId, 
      dealStatus: 'open' 
    });

    const totalDealsAmount = openDeals.reduce((sum, deal) => sum + deal.amount, 0);

    // Deals won this month
    const dealsWonThisMonth = await Deal.countDocuments({
      owner: userId,
      dealStatus: 'won',
      actualCloseDate: { $gte: thisMonth }
    });

    // Recent activities
    const recentActivities = await Activity.countDocuments({
      owner: userId,
      activityDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalContacts,
      totalCompanies,
      openDeals: openDeals.length,
      totalDealsAmount,
      dealsWonThisMonth,
      recentActivities
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pipeline overview
router.get('/pipeline', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const pipeline = await Deal.aggregate([
      { $match: { owner: userId, dealStatus: 'open' } },
      {
        $group: {
          _id: '$dealStage',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ pipeline });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get activity summary
router.get('/activity-summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const summary = await Activity.aggregate([
      { $match: { owner: userId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
