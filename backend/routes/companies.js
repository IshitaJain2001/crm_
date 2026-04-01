const express = require('express');
const Company = require('../models/Company');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all companies
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    // Get companies where user is superAdmin or member
    let query = {
      $or: [
        { superAdmin: req.user.id },
        { members: req.user.id }
      ]
    };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const companies = await Company.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .populate('superAdmin', 'name email');

    const total = await Company.countDocuments(query);

    res.json({
      companies,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single company
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('superAdmin', 'name email')
      .populate('members', 'name email');

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Check if user is superAdmin or member
    const isSuperAdmin = company.superAdmin._id.toString() === req.user.id;
    const isMember = company.members.some(m => m._id.toString() === req.user.id);

    if (!isSuperAdmin && !isMember) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create company
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, website, industry, description } = req.body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Company name is required' });
    }

    // Check if company name already exists
    const existingCompany = await Company.findOne({ 
      name: { $regex: `^${name}$`, $options: 'i' } 
    });
    
    if (existingCompany) {
      return res.status(400).json({ error: 'Company name already exists' });
    }

    const company = new Company({
      name: name.trim(),
      website: website || '',
      industry: industry || 'generic',
      description: description || '',
      superAdmin: req.user.id,
      members: [req.user.id]
    });

    await company.save();
    await company.populate(['superAdmin', 'members']);

    res.status(201).json({
      message: 'Company created successfully',
      company
    });
  } catch (error) {
    console.error('Company creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update company
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    let company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (company.superAdmin.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the company owner can update the company' });
    }

    company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner');

    res.json({
      message: 'Company updated successfully',
      company
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete company
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (company.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Company.findByIdAndRemove(req.params.id);

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
