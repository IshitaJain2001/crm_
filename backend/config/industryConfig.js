/**
 * Industry-Specific CRM Configuration
 * Defines features, field names, and workflows for each industry
 */

const industryConfigs = {
  edtech: {
    name: 'EdTech',
    description: 'Educational Technology & Online Learning',
    color: '#FF6B6B',
    features: {
      contacts: { enabled: true, label: 'Students & Contacts' },
      companies: { enabled: true, label: 'Institutions' },
      deals: { enabled: true, label: 'Enrollments' },
      activities: { enabled: true, label: 'Classes & Sessions' },
      tasks: { enabled: true, label: 'Assignments & Assessments' },
      emails: { enabled: true, label: 'Communications' },
      meetings: { enabled: true, label: 'Counseling Sessions' },
      forms: { enabled: true, label: 'Admission Forms' },
      chatbots: { enabled: true, label: 'Student Support Bot' },
      // EdTech specific
      attendance: { enabled: true, label: 'Attendance Tracking' },
      grades: { enabled: true, label: 'Grades & Performance' },
      fees: { enabled: true, label: 'Fee Management' },
      progress: { enabled: true, label: 'Progress Reports' },
      curriculum: { enabled: true, label: 'Curriculum Manager' },
      parents: { enabled: true, label: 'Parent Portal' }
    },
    fieldMappings: {
      contact: 'Student',
      company: 'Institution',
      deal: 'Enrollment',
      activity: 'Class Session',
      task: 'Assignment',
      email: 'Communication',
      meeting: 'Counseling Session'
    },
    defaultFields: {
      contacts: ['name', 'email', 'phone', 'studentId', 'enrollmentDate', 'program', 'parentName', 'parentEmail'],
      companies: ['name', 'institutionType', 'address', 'phone', 'website', 'numberOfStudents'],
      deals: ['studentName', 'program', 'enrollmentDate', 'fees', 'duration', 'status']
    },
    dashboardWidgets: ['enrollmentTrend', 'studentPerformance', 'feeCollection', 'attendanceRate', 'courseCompletion'],
    workflows: {
      admission: 'Inquiry → Demo → Enrollment → Payment → Active Student',
      support: 'Question → Answer → Resolved → Feedback'
    }
  },

  consulting: {
    name: 'Consulting Services',
    description: 'Management Consulting & Professional Services',
    color: '#4ECDC4',
    features: {
      contacts: { enabled: true, label: 'Clients & Team' },
      companies: { enabled: true, label: 'Client Companies' },
      deals: { enabled: true, label: 'Engagements' },
      activities: { enabled: true, label: 'Billable Hours' },
      tasks: { enabled: true, label: 'Deliverables' },
      emails: { enabled: true, label: 'Client Communication' },
      meetings: { enabled: true, label: 'Consultant Meetings' },
      forms: { enabled: true, label: 'Project Intake Forms' },
      chatbots: { enabled: true, label: 'Client Support Bot' },
      // Consulting specific
      projects: { enabled: true, label: 'Projects' },
      proposals: { enabled: true, label: 'Proposals & Quotes' },
      timesheet: { enabled: true, label: 'Timesheet Management' },
      invoices: { enabled: true, label: 'Invoices & Billing' },
      resources: { enabled: true, label: 'Resource Allocation' },
      expenses: { enabled: true, label: 'Expense Tracking' }
    },
    fieldMappings: {
      contact: 'Client/Consultant',
      company: 'Client Company',
      deal: 'Engagement',
      activity: 'Billable Hours',
      task: 'Deliverable',
      meeting: 'Project Meeting'
    },
    defaultFields: {
      contacts: ['name', 'email', 'phone', 'role', 'company', 'department'],
      companies: ['name', 'industry', 'address', 'phone', 'website', 'budget'],
      deals: ['clientName', 'projectName', 'scope', 'budget', 'startDate', 'endDate', 'status']
    },
    dashboardWidgets: ['projectPipeline', 'billableHours', 'utilization', 'revenueForecasted', 'resourceAvailability'],
    workflows: {
      engagement: 'Inquiry → Proposal → Contract → Project → Delivery → Invoice',
      resource: 'Bench → Assigned → Billable → Completed'
    }
  },

  realEstate: {
    name: 'Real Estate',
    description: 'Real Estate Sales & Property Management',
    color: '#A8E6CF',
    features: {
      contacts: { enabled: true, label: 'Buyers & Sellers' },
      companies: { enabled: true, label: 'Properties' },
      deals: { enabled: true, label: 'Transactions' },
      activities: { enabled: true, label: 'Showings' },
      tasks: { enabled: true, label: 'Follow-ups' },
      emails: { enabled: true, label: 'Client Communication' },
      meetings: { enabled: true, label: 'Property Viewings' },
      forms: { enabled: true, label: 'Lead Capture Forms' },
      chatbots: { enabled: true, label: 'Property Inquiry Bot' },
      // Real Estate specific
      properties: { enabled: true, label: 'Property Listings' },
      showings: { enabled: true, label: 'Showings & Viewings' },
      offers: { enabled: true, label: 'Offers & Negotiations' },
      inspections: { enabled: true, label: 'Inspections' },
      closings: { enabled: true, label: 'Closings' },
      commission: { enabled: true, label: 'Commission Tracking' }
    },
    fieldMappings: {
      contact: 'Buyer/Seller',
      company: 'Property',
      deal: 'Transaction',
      activity: 'Showing',
      task: 'Follow-up',
      meeting: 'Property Viewing'
    },
    defaultFields: {
      contacts: ['name', 'email', 'phone', 'type', 'budget', 'preferences', 'agent'],
      companies: ['address', 'price', 'beds', 'baths', 'sqft', 'yearBuilt', 'status', 'daysOnMarket'],
      deals: ['property', 'buyer', 'seller', 'offerPrice', 'listPrice', 'closingDate', 'status']
    },
    dashboardWidgets: ['activeListing', 'showingSchedule', 'offersOpen', 'daysOnMarket', 'closingPipeline'],
    workflows: {
      listing: 'New Listing → Showings → Offers → Negotiation → Inspection → Closing → Sold',
      buying: 'Inquiry → Showing → Offer → Acceptance → Inspection → Appraisal → Closing'
    }
  },

  insurance: {
    name: 'Insurance',
    description: 'Insurance Sales & Claims Management',
    color: '#FFD93D',
    features: {
      contacts: { enabled: true, label: 'Policyholders' },
      companies: { enabled: true, label: 'Insurance Companies' },
      deals: { enabled: true, label: 'Policies' },
      activities: { enabled: true, label: 'Claims' },
      tasks: { enabled: true, label: 'Renewals' },
      emails: { enabled: true, label: 'Policy Communication' },
      meetings: { enabled: true, label: 'Consultations' },
      forms: { enabled: true, label: 'Quote Request Forms' },
      chatbots: { enabled: true, label: 'Insurance Q&A Bot' },
      // Insurance specific
      policies: { enabled: true, label: 'Policy Management' },
      claims: { enabled: true, label: 'Claims Processing' },
      coverage: { enabled: true, label: 'Coverage Details' },
      premiums: { enabled: true, label: 'Premium Payments' },
      beneficiaries: { enabled: true, label: 'Beneficiaries' },
      commission: { enabled: true, label: 'Commission Tracking' }
    },
    fieldMappings: {
      contact: 'Policyholder',
      company: 'Insurance Company',
      deal: 'Policy',
      activity: 'Claim',
      task: 'Renewal',
      meeting: 'Consultation'
    },
    defaultFields: {
      contacts: ['name', 'email', 'phone', 'policyNumber', 'policyType', 'startDate', 'endDate'],
      companies: ['name', 'insuranceType', 'address', 'phone', 'website', 'agentName'],
      deals: ['policyNumber', 'type', 'coverage', 'premium', 'startDate', 'renewalDate', 'status']
    },
    dashboardWidgets: ['activePolices', 'renewalDue', 'claimsOpen', 'premiumDue', 'commissionEarned'],
    workflows: {
      sale: 'Lead → Inquiry → Quote → Policy Issued → Premium Payment → Active',
      claim: 'Claim Filed → Assessment → Approval → Payment → Closed',
      renewal: 'Policy Due → Reminder → Quote → Accepted → Renewed'
    }
  }
};

module.exports = industryConfigs;
