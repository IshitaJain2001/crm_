/** Roles that can register a workspace and invite/manage company-wide settings */
export const COMPANY_LEAD_ROLES = ["superadmin", "admin", "hr"];

export function isCompanyLead(role) {
  return COMPANY_LEAD_ROLES.includes(role);
}
