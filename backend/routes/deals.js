const express = require('express');
const Deal = require('../models/Deal');
const User = require('../models/User');
const Company = require('../models/Company');
const { authMiddleware } = require('../middleware/auth');
const { sendDealCreatedEmail } = require('../services/emailService');
const automationService = require('../services/automationService');

const router = express.Router();

// Get all deals
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, stage, company } = req.query;
    
    let query = { owner: req.user.id };

    if (status) query.dealStatus = status;
    if (stage) query.dealStage = stage;
    if (company) query.company = company;

    const deals = await Deal.find(query)
      .populate('company')
      .populate('contact')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ expectedCloseDate: -1 });

    const total = await Deal.countDocuments(query);

    res.json({
      deals,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single deal
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate('company')
      .populate('contact')
      .populate('owner', 'name email');

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    if (deal.owner._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(deal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create deal
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { dealName, company, amount, dealStage, expectedCloseDate } = req.body;

    // Validate required fields
    if (!dealName) {
      return res.status(400).json({ error: 'Deal name is required' });
    }

    if (!company) {
      return res.status(400).json({ error: 'Company is required' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid deal amount is required' });
    }

    if (!expectedCloseDate) {
      return res.status(400).json({ error: 'Expected close date is required' });
    }

    // Validate date format
    const closeDate = new Date(expectedCloseDate);
    if (isNaN(closeDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Check if company exists
    const companyExists = await Company.findById(company);
    if (!companyExists) {
      return res.status(400).json({ error: 'Company not found' });
    }

    const deal = new Deal({
      dealName: dealName.trim(),
      company,
      amount: parseFloat(amount),
      dealStage: dealStage || 'initial_contact',
      expectedCloseDate: closeDate,
      owner: req.user.id,
      dealStatus: 'open'
    });

    await deal.save();
    await deal.populate(['company', 'owner']);

    // Trigger automation
    try {
      automationService.onDealCreated(deal);
    } catch (automationError) {
      console.error('Automation error:', automationError);
    }

    // Send notification email
    try {
      const owner = await User.findById(req.user.id);
      await sendDealCreatedEmail(deal, owner, companyExists);
    } catch (emailError) {
      console.error('Deal created but notification email failed:', emailError);
    }

    res.status(201).json({
      message: 'Deal created successfully!',
      deal
    });
  } catch (error) {
    console.error('Deal creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update deal
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    let deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    if (deal.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const oldStage = deal.dealStage;

    deal = await Deal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate(['company', 'contact', 'owner']);

    // Trigger automation if stage changed
    if (req.body.dealStage && oldStage !== req.body.dealStage) {
      try {
        automationService.onDealStageChanged(deal, oldStage, req.body.dealStage);
      } catch (automationError) {
        console.error('Automation error:', automationError);
      }
    }

    res.json({
      message: 'Deal updated successfully',
      deal
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete deal
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    if (deal.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Deal.findByIdAndRemove(req.params.id);

    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
