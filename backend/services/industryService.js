/**
 * Industry Service - Provides industry-specific configurations
 */

const industryConfigs = require('../config/industryConfig');

class IndustryService {
  /**
   * Get configuration for a specific industry
   */
  static getConfig(industry = 'generic') {
    return industryConfigs[industry] || industryConfigs.generic;
  }

  /**
   * Get all available industries
   */
  static getAllIndustries() {
    return Object.keys(industryConfigs).map(key => ({
      id: key,
      ...industryConfigs[key]
    }));
  }

  /**
   * Get field mapping for an industry
   */
  static getFieldMapping(industry, entityType) {
    const config = this.getConfig(industry);
    return config.fieldMappings[entityType] || entityType;
  }

  /**
   * Get enabled features for an industry
   */
  static getEnabledFeatures(industry) {
    const config = this.getConfig(industry);
    return Object.entries(config.features)
      .filter(([_, feature]) => feature.enabled)
      .reduce((acc, [key, feature]) => {
        acc[key] = feature;
        return acc;
      }, {});
  }

  /**
   * Get dashboard widgets for an industry
   */
  static getDashboardWidgets(industry) {
    const config = this.getConfig(industry);
    return config.dashboardWidgets || [];
  }

  /**
   * Get workflow for an industry
   */
  static getWorkflows(industry) {
    const config = this.getConfig(industry);
    return config.workflows || {};
  }

  /**
   * Get default fields for an industry entity
   */
  static getDefaultFields(industry, entityType) {
    const config = this.getConfig(industry);
    return config.defaultFields[entityType] || [];
  }

  /**
   * Check if feature is enabled for industry
   */
  static isFeatureEnabled(industry, featureName) {
    const config = this.getConfig(industry);
    return config.features[featureName]?.enabled || false;
  }
}

module.exports = IndustryService;
