const express = require('express');
const router = express.Router();
const IndustryService = require('../services/industryService');
const { authMiddleware } = require('../middleware/roleAuth');

/**
 * Get all available industries
 * GET /api/industries
 */
router.get('/', (req, res) => {
  try {
    const industries = IndustryService.getAllIndustries();
    res.json(industries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching industries', error: error.message });
  }
});

/**
 * Get configuration for specific industry
 * GET /api/industries/:industry
 */
router.get('/:industry', (req, res) => {
  try {
    const config = IndustryService.getConfig(req.params.industry);
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching industry config', error: error.message });
  }
});

/**
 * Get field mapping for an industry
 * GET /api/industries/:industry/field-mapping/:entityType
 */
router.get('/:industry/field-mapping/:entityType', (req, res) => {
  try {
    const mapping = IndustryService.getFieldMapping(req.params.industry, req.params.entityType);
    res.json({ entityType: req.params.entityType, label: mapping });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching field mapping', error: error.message });
  }
});

/**
 * Get enabled features for an industry
 * GET /api/industries/:industry/features
 */
router.get('/:industry/features', (req, res) => {
  try {
    const features = IndustryService.getEnabledFeatures(req.params.industry);
    res.json(features);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching features', error: error.message });
  }
});

/**
 * Get dashboard widgets for an industry
 * GET /api/industries/:industry/dashboard
 */
router.get('/:industry/dashboard', (req, res) => {
  try {
    const widgets = IndustryService.getDashboardWidgets(req.params.industry);
    res.json({ widgets });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard config', error: error.message });
  }
});

/**
 * Get workflows for an industry
 * GET /api/industries/:industry/workflows
 */
router.get('/:industry/workflows', (req, res) => {
  try {
    const workflows = IndustryService.getWorkflows(req.params.industry);
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workflows', error: error.message });
  }
});

module.exports = router;
