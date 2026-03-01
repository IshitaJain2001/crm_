const express = require('express');
const Company = require('../models/Company');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all companies
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    let query = { owner: req.user.id };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const companies = await Company.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

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
      .populate('contacts')
      .populate('owner', 'name email');

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (company.owner._id.toString() !== req.user.id) {
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
    const { name, website, industry, phone, email, companySize } = req.body;

    const company = new Company({
      name,
      website,
      industry,
      phone,
      email,
      companySize,
      owner: req.user.id
    });

    await company.save();
    await company.populate('owner');

    res.status(201).json({
      message: 'Company created successfully',
      company
    });
  } catch (error) {
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

    if (company.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
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
