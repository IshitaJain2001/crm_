const Task = require('../models/Task');
const AutomationRule = require('../models/AutomationRule');
const AutomationLog = require('../models/AutomationLog');
const Contact = require('../models/Contact');
const Deal = require('../models/Deal');
const User = require('../models/User');

class AutomationService {
  
  /**
   * Execute automation rules when contact is created
   */
  async onContactCreated(contact) {
    try {
      const rules = await AutomationRule.find({
        workspaceId: contact.workspaceId,
        'trigger.type': 'contact_created',
        enabled: true
      });

      for (let rule of rules) {
        if (this.evaluateConditions(rule.trigger.conditions, contact)) {
          await this.executeAction(rule, contact, 'contact');
        }
      }
    } catch (error) {
      console.error('Error in onContactCreated:', error);
    }
  }

  /**
   * Execute automation rules when deal is created
   */
  async onDealCreated(deal) {
    try {
      const rules = await AutomationRule.find({
        workspaceId: deal.workspaceId,
        'trigger.type': 'deal_created',
        enabled: true
      });

      for (let rule of rules) {
        if (this.evaluateConditions(rule.trigger.conditions, deal)) {
          await this.executeAction(rule, deal, 'deal');
        }
      }
    } catch (error) {
      console.error('Error in onDealCreated:', error);
    }
  }

  /**
   * Execute automation rules when deal stage changes
   */
  async onDealStageChanged(deal, oldStage, newStage) {
    try {
      const rules = await AutomationRule.find({
        workspaceId: deal.workspaceId,
        'trigger.type': 'deal_stage_changed',
        enabled: true
      });

      for (let rule of rules) {
        // Check if any condition matches the new stage
        const conditions = rule.trigger.conditions || [];
        let conditionsMet = true;

        for (let condition of conditions) {
          if (condition.field === 'stage') {
            if (condition.operator === '==' && condition.value !== newStage) {
              conditionsMet = false;
              break;
            }
          } else if (!this.evaluateCondition(condition, deal)) {
            conditionsMet = false;
            break;
          }
        }

        if (conditionsMet) {
          await this.executeAction(rule, deal, 'deal');
        }
      }
    } catch (error) {
      console.error('Error in onDealStageChanged:', error);
    }
  }

  /**
   * Execute automation rules when company is created
   */
  async onCompanyCreated(company) {
    try {
      const rules = await AutomationRule.find({
        workspaceId: company.workspaceId,
        'trigger.type': 'company_created',
        enabled: true
      });

      for (let rule of rules) {
        if (this.evaluateConditions(rule.trigger.conditions, company)) {
          await this.executeAction(rule, company, 'company');
        }
      }
    } catch (error) {
      console.error('Error in onCompanyCreated:', error);
    }
  }

  /**
   * Execute the action for a rule
   */
  async executeAction(rule, triggerObject, objectType) {
    try {
      if (rule.action.type === 'create_task') {
        return await this.createTaskFromRule(rule, triggerObject, objectType);
      }
    } catch (error) {
      console.error('Error executing action:', error);
      
      // Log the error
      await AutomationLog.create({
        workspaceId: rule.workspaceId,
        automationRuleId: rule._id,
        triggerObject: { type: objectType, id: triggerObject._id },
        action: rule.action.type,
        result: 'failed',
        error: error.message,
        executedAt: new Date()
      });
    }
  }

  /**
   * Create task from automation rule
   */
  async createTaskFromRule(rule, triggerObject, objectType) {
    // Determine assignee
    let assigneeId = null;

    if (rule.action.assignTo === 'specific_user') {
      assigneeId = rule.action.specificUserId;
    } else if (rule.action.assignTo === 'contact_owner' && triggerObject.owner) {
      assigneeId = triggerObject.owner;
    } else if (rule.action.assignTo === 'deal_owner' && triggerObject.owner) {
      assigneeId = triggerObject.owner;
    } else if (rule.action.assignTo === 'manager') {
      // Find manager of the owner
      const owner = await User.findById(triggerObject.owner);
      assigneeId = owner?.manager;
    }

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + rule.action.dueDays);

    // Create task
    const task = await Task.create({
      workspaceId: rule.workspaceId,
      title: rule.action.taskTitle,
      description: rule.action.taskDescription,
      relatedTo: {
        type: objectType,
        id: triggerObject._id
      },
      assignedTo: assigneeId,
      dueDate,
      priority: rule.action.priority,
      createdBy: null,
      createdVia: 'automation',
      automationRuleId: rule._id
    });

    // Update automation rule execution count
    await AutomationRule.findByIdAndUpdate(
      rule._id,
      {
        executionCount: rule.executionCount + 1,
        lastExecuted: new Date()
      }
    );

    // Log successful execution
    await AutomationLog.create({
      workspaceId: rule.workspaceId,
      automationRuleId: rule._id,
      triggerObject: { type: objectType, id: triggerObject._id },
      action: rule.action.type,
      result: 'success',
      createdTask: task._id,
      executedAt: new Date()
    });

    return task;
  }

  /**
   * Evaluate all conditions
   */
  evaluateConditions(conditions, data) {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every(condition => 
      this.evaluateCondition(condition, data)
    );
  }

  /**
   * Evaluate single condition
   */
  evaluateCondition(condition, data) {
    const value = this.getNestedValue(data, condition.field);

    switch (condition.operator) {
      case '==':
        return value == condition.value;
      case '!=':
        return value != condition.value;
      case '>':
        return value > condition.value;
      case '<':
        return value < condition.value;
      case '>=':
        return value >= condition.value;
      case '<=':
        return value <= condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'not_contains':
        return !String(value).includes(String(condition.value));
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'not_in':
        return !Array.isArray(condition.value) || !condition.value.includes(value);
      default:
        return false;
    }
  }

  /**
   * Get nested object value (e.g., 'contact.email')
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, prop) => 
      current?.[prop], obj
    );
  }
}

module.exports = new AutomationService();
