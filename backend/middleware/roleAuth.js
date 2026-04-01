const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Role hierarchy
const ROLE_HIERARCHY = {
  superadmin: 5,
  admin: 4,
  hr: 3,
  sales: 2,
  employee: 1,
};

// Role-based permissions mapping
const PERMISSIONS = {
  superadmin: [
    "view_all_data",
    "manage_users",
    "manage_roles",
    "manage_system",
    "view_reports",
    "delete_any_data",
    "export_data",
  ],
  admin: [
    "view_all_data",
    "manage_team_users",
    "view_reports",
    "delete_team_data",
    "export_data",
  ],
  hr: [
    "view_employees",
    "manage_employees",
    "view_contacts",
    "manage_contacts",
  ],
  sales: [
    "view_contacts",
    "manage_own_contacts",
    "view_deals",
    "manage_own_deals",
    "view_activities",
    "manage_own_activities",
  ],
  employee: ["view_own_data", "manage_own_tasks", "view_assigned_contacts"],
};

// Verify authentication
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ NEW: Verify user still exists in database
    // This catches deleted users who still have valid tokens
    const userExists = await User.findById(decoded.id);
    if (!userExists) {
      console.warn(
        `❌ User ${decoded.id} (${decoded.email}) attempted access but account is deleted`,
      );
      return res.status(401).json({
        error:
          "Your account has been deleted. Please contact support or register again.",
        code: "ACCOUNT_DELETED",
      });
    }

    // ✅ NEW: Verify company still exists
    // This catches employees when their company is unregistered
    if (decoded.company) {
      const Company = require("../models/Company");
      const companyExists = await Company.findById(decoded.company);
      if (!companyExists) {
        console.warn(
          `❌ User ${decoded.id} attempted access but company ${decoded.company} is deleted`,
        );
        return res.status(401).json({
          error:
            "Your workspace has been deleted. Please create a new company or register again.",
          code: "COMPANY_DELETED",
        });
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    res.status(401).json({ error: "Invalid token" });
  }
};

// Require specific role
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required roles: ${roles.join(", ")}`,
      });
    }

    next();
  };
};

// Require permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userPermissions = PERMISSIONS[req.user.role] || [];

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        error: `Permission denied. Required permission: ${permission}`,
      });
    }

    next();
  };
};

// Admin only (Admin or Super Admin)
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!["admin", "superadmin"].includes(req.user.role)) {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};

// Super Admin only (legacy / strict)
const superAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role !== "superadmin") {
    return res.status(403).json({ error: "Super Admin access required" });
  }

  next();
};

/** Company registration owner + HR: can invite, manage site, settings (legacy superadmin included) */
const COMPANY_LEAD_ROLES = ["superadmin", "admin", "hr"];

const companyLeadOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (!COMPANY_LEAD_ROLES.includes(req.user.role)) {
    return res.status(403).json({
      error:
        "Access denied. Only company Admin or HR can perform this action.",
    });
  }
  next();
};

// Get user permissions
const getUserPermissions = (role) => {
  return PERMISSIONS[role] || [];
};

// Check if user has permission
const hasPermission = (userRole, permission) => {
  const userPermissions = PERMISSIONS[userRole] || [];
  return userPermissions.includes(permission);
};

// Check role hierarchy
const canManageUser = (managerRole, targetRole) => {
  return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole];
};

module.exports = {
  authMiddleware,
  requireRole,
  requirePermission,
  adminOnly,
  superAdminOnly,
  companyLeadOnly,
  COMPANY_LEAD_ROLES,
  getUserPermissions,
  hasPermission,
  canManageUser,
  ROLE_HIERARCHY,
  PERMISSIONS,
};
