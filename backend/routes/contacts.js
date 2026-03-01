const express = require('express');
const Contact = require('../models/Contact');
const User = require('../models/User');
const { authMiddleware, requirePermission } = require('../middleware/roleAuth');
const { sendContactCreatedEmail } = require('../services/emailService');

const router = express.Router();

// Get all contacts for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, company } = req.query;
    
    let query = { owner: req.user.id };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (company) {
      query.company = company;
    }

    const contacts = await Contact.find(query)
      .populate('company')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Contact.countDocuments(query);

    res.json({
      contacts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single contact
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('company')
      .populate('owner', 'name email');

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (contact.owner._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create contact
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, company, jobTitle, lifecycle } = req.body;

    const contact = new Contact({
      firstName,
      lastName,
      email,
      phone,
      company,
      jobTitle,
      lifecycle: lifecycle || 'subscriber',
      owner: req.user.id
    });

    await contact.save();
    await contact.populate(['company', 'owner']);

    // Send notification email
    try {
      const owner = await User.findById(req.user.id);
      await sendContactCreatedEmail(contact, owner);
    } catch (emailError) {
      console.error('Contact created but notification email failed:', emailError);
    }

    res.status(201).json({
      message: 'Contact created successfully. Notification email sent!',
      contact
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update contact
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    let contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (contact.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    contact = await Contact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate(['company', 'owner']);

    res.json({
      message: 'Contact updated successfully',
      contact
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete contact
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (contact.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Contact.findByIdAndRemove(req.params.id);

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
