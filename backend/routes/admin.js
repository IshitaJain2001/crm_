const express = require("express");
const User = require("../models/User");
const Company = require("../models/Company");
const Invitation = require("../models/Invitation");
const Contact = require("../models/Contact");
const Deal = require("../models/Deal");
const Activity = require("../models/Activity");
const {
  authMiddleware,
  companyLeadOnly,
  adminOnly,
    canManageUser,
    PERMISSIONS,
} = require("../middleware/roleAuth");
const { sendWelcomeEmail } = require("../services/emailService");
const { sendOTPEmail, verifyOTP } = require("../services/otpService");

const router = express.Router();

// Get all users (Admin+ only)
router.get("/users", authMiddleware, adminOnly, async (req, res) => {
    try {
        const { page = 1, limit = 20, role, active = true } = req.query;

        const query = active !== "false" ? { active: true } : {};
        if (role) query.role = role;

        const users = await User.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select("-password")
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        res.json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new user (Admin+ only)
router.post("/users", authMiddleware, adminOnly, async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;

        // Validate role
        const validRoles = ["admin", "hr", "sales", "employee"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                error: `Invalid role. Allowed: ${validRoles.join(", ")}`,
            });
        }

        // Super Admin can create any role, Admin can only create lower roles
        if (req.user.role === "admin" && !canManageUser("admin", role)) {
            return res.status(403).json({
                error: `You can only create ${PERMISSIONS.admin.join(", ")} users`,
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Create user
        const user = new User({
            name,
            email,
            password,
            role,
            department: department || "other",
            createdBy: req.user.id,
        });

        await user.save();

        // Send welcome email
        try {
            await sendWelcomeEmail(user);
        } catch (emailError) {
            console.error("Welcome email failed:", emailError);
        }

        res.status(201).json({
            message: `User created successfully with role: ${role}`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdBy: user.createdBy,
            },
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update user role (Super Admin+ only)
router.patch(
    "/users/:id/role",
    authMiddleware,
    companyLeadOnly,
    async (req, res) => {
        try {
            const { role } = req.body;
            const validRoles = ["admin", "hr", "sales", "employee"];

            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    error: `Invalid role. Allowed: ${validRoles.join(", ")}`,
                });
            }

            if (req.params.id === req.user.id) {
                return res.status(403).json({
                    error:
                        "You cannot change your own role. Ask another company admin if needed.",
                    code: "SELF_ROLE_CHANGE_DENIED",
                });
            }

            // Verify user exists and is in same company
            const targetUser = await User.findById(req.params.id);
            if (!targetUser) {
                return res.status(404).json({ error: "User not found" });
            }

            if (targetUser.company.toString() !== req.user.company.toString()) {
                return res.status(403).json({
                    error: "Cannot change role for user from different company",
                });
            }

            const user = await User.findByIdAndUpdate(
                req.params.id,
                { role },
                { new: true },
            ).select("-password");

            res.json({
                message: `User role updated to ${role}`,
                user,
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
);

// Update user (Admin+ can update, but not their own role/createdBy)
router.put("/users/:id", authMiddleware, adminOnly, async (req, res) => {
    try {
        const { name, email, department, active } = req.body;
        const userId = req.params.id;

        // Cannot update own role
        if (req.body.role && userId === req.user.id) {
            return res.status(403).json({
                error: "Cannot change your own role",
            });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (department) updateData.department = department;
        if (active !== undefined) updateData.active = active;

        const user = await User.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true,
        }).select("-password");

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            message: "User updated successfully",
            user,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Deactivate user (Admin+ only)
router.patch(
    "/users/:id/deactivate",
    authMiddleware,
    adminOnly,
    async (req, res) => {
        try {
            const userId = req.params.id;

            // Cannot deactivate yourself
            if (userId === req.user.id) {
                return res.status(403).json({
                    error: "Cannot deactivate yourself",
                });
            }

            const user = await User.findByIdAndUpdate(
                userId,
                { active: false },
                { new: true },
            ).select("-password");

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            res.json({
                message: "User deactivated successfully",
                user,
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
);

// Get user roles and permissions
router.get("/roles", authMiddleware, (req, res) => {
    res.json({
        roles: Object.keys(PERMISSIONS),
        permissions: PERMISSIONS,
        currentUserRole: req.user.role,
        currentUserPermissions: PERMISSIONS[req.user.role] || [],
    });
});

// Delete user (Super Admin only)
router.delete(
    "/users/:id",
    authMiddleware,
    companyLeadOnly,
    async (req, res) => {
        try {
            const userId = req.params.id;

            if (userId === req.user.id) {
                return res.status(403).json({
                    error: "Cannot delete yourself",
                });
            }

            const targetUser = await User.findById(userId);
            if (!targetUser) {
                return res.status(404).json({ error: "User not found" });
            }
            if (targetUser.company.toString() !== req.user.company.toString()) {
                return res.status(403).json({
                    error: "Cannot delete users outside your company",
                });
            }

            await User.findByIdAndRemove(userId);

            res.json({ message: "User deleted successfully" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
);

// COMPANY UNREGISTRATION ENDPOINTS

// Step 1: Request company unregistration - sends OTP to superadmin email
router.post(
    "/company/unregister/request",
    authMiddleware,
    companyLeadOnly,
    async (req, res) => {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            // Check if user is a superadmin of a company
            const company = await Company.findOne({ superAdmin: userId });
            if (!company) {
                return res.status(404).json({
                    error:
                        "No company found under your admin. Company may have already been unregistered.",
                });
            }

            // Send OTP to superadmin's email
            const result = await sendOTPEmail(user.email);

            res.json({
                message: "OTP sent to your registered email for company unregistration",
                verificationToken: result.verificationToken,
                email: user.email,
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
);

// Step 2: Verify OTP and unregister company
router.post(
    "/company/unregister/verify",
    authMiddleware,
    companyLeadOnly,
    async (req, res) => {
        try {
            const { otp } = req.body;
            const userId = req.user.id;

            if (!otp) {
                return res.status(400).json({ error: "OTP is required" });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            // Verify OTP
            const verification = await verifyOTP(user.email, otp);
            if (!verification.success) {
                return res
                    .status(400)
                    .json({ error: verification.message || "Invalid OTP" });
            }

            // Find and delete the company
            const company = await Company.findOne({ superAdmin: userId });
            if (!company) {
                return res
                    .status(404)
                    .json({ error: "No company found under your admin" });
            }

            const companyName = company.name;

            console.log(
                `\n🗑️  UNREGISTERING COMPANY: ${companyName} (${company._id})`,
            );

            // Delete all company data
            // 1. Delete all company members/employees
            console.log("Deleting all company employees...");
            const deletedUsers = await User.deleteMany({
                company: company._id,
                _id: { $ne: userId },
            });
            console.log(`✓ Deleted ${deletedUsers.deletedCount} employees`);

            // 2. Invalidate all pending invitations for this company
            console.log("Invalidating all company invitations...");
            const invalidatedInvitations = await Invitation.updateMany(
                { company: company._id, status: "pending" },
                { status: "expired", expiredAt: new Date() },
            );
            console.log(
                `✓ Invalidated ${invalidatedInvitations.modifiedCount} invitations`,
            );

            // 3. Delete the company
            console.log("Deleting company record...");
            await Company.findByIdAndRemove(company._id);
            console.log(`✓ Company deleted`);

            console.log("Deleting company owner account...");
            await User.findByIdAndRemove(userId);
            console.log(`✓ Owner account deleted`);

            console.log(`✓✓✓ COMPANY UNREGISTRATION COMPLETE ✓✓✓\n`);

            res.json({
                message: `Company "${companyName}" has been successfully unregistered and deleted. All employees have been removed. All invitations have been invalidated. Your account has also been deleted.`,
                deletedCompany: {
                    id: company._id,
                    name: company.name,
                },
                summary: {
                    employeesDeleted: deletedUsers.deletedCount,
                    invitationsInvalidated: invalidatedInvitations.modifiedCount,
                },
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
);

// EXPORT DATA ENDPOINTS

// Export company data as JSON
router.get(
    "/company/export/json",
    authMiddleware,
    companyLeadOnly,
    async (req, res) => {
        try {
            const company = await Company.findOne({ superAdmin: req.user.id });
            if (!company) {
                return res
                    .status(404)
                    .json({ error: "No company found under your admin" });
            }

            // Fetch all company data
            const [employees, contacts, deals, activities] = await Promise.all(
              [
                User.find({ company: company._id }).select("-password"),
                Contact.find({ company: company._id }),
                Deal.find({ company: company._id }),
                Activity.find({ company: company._id }),
              ],
            );

            const exportData = {
                company: {
                    id: company._id,
                    name: company.name,
                    displayName: company.displayName,
                    exportedAt: new Date(),
                },
                summary: {
                  totalEmployees: employees.length,
                  totalContacts: contacts.length,
                  totalDeals: deals.length,
                  totalActivities: activities.length,
                },
                data: {
                  employees,
                  contacts,
                  deals,
                  activities,
                },
            };

            res.json(exportData);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
);

// Export company data as CSV
router.get(
    "/company/export/csv",
    authMiddleware,
    companyLeadOnly,
    async (req, res) => {
        try {
            const company = await Company.findOne({ superAdmin: req.user.id });
            if (!company) {
                return res
                    .status(404)
                    .json({ error: "No company found under your admin" });
            }

            // Fetch all company data
            const [employees, contacts, deals, activities] = await Promise.all(
              [
                User.find({ company: company._id }).select("-password"),
                Contact.find({ company: company._id }),
                Deal.find({ company: company._id }),
                Activity.find({ company: company._id }),
              ],
            );

            // Helper function to convert array of objects to CSV
            const convertToCSV = (data, headers) => {
                if (!data || data.length === 0) return "";

                const csvHeaders = headers.join(",");
                const csvRows = data
                    .map((row) =>
                        headers
                            .map((header) => {
                                const value = row[header];
                                // Escape quotes and wrap in quotes if contains comma
                                if (value === undefined || value === null) return "";
                                const stringValue = String(value);
                                if (stringValue.includes(",") || stringValue.includes('"')) {
                                    return `"${stringValue.replace(/"/g, '""')}"`;
                                }
                                return stringValue;
                            })
                            .join(","),
                    )
                    .join("\n");

                return `${csvHeaders}\n${csvRows}`;
            };

            // Build CSV content
            let csvContent = `CRM Data Export - ${company.name}\n`;
            csvContent += `Exported: ${new Date().toISOString()}\n\n`;

            // Employees
            if (employees.length > 0) {
              csvContent += "=== EMPLOYEES ===\n";
              const empHeaders = ["name", "email", "role", "department", "active"];
              csvContent +=
                convertToCSV(
                  employees.map((e) => ({
                    name: e.name,
                    email: e.email,
                    role: e.role,
                    department: e.department,
                    active: e.active,
                  })),
                  empHeaders,
                ) + "\n\n";
            }

            // Contacts
            if (contacts.length > 0) {
              csvContent += "=== CONTACTS ===\n";
              const contactHeaders = [
                "firstName",
                "lastName",
                "email",
                "phone",
                "jobTitle",
                "company",
              ];
              csvContent +=
                convertToCSV(
                  contacts.map((c) => ({
                    firstName: c.firstName,
                    lastName: c.lastName,
                    email: c.email,
                    phone: c.phone,
                    jobTitle: c.jobTitle,
                    company: c.company,
                  })),
                  contactHeaders,
                ) + "\n\n";
            }

            // Deals
            if (deals.length > 0) {
              csvContent += "=== DEALS ===\n";
              const dealHeaders = [
                "dealName",
                "amount",
                "stage",
                "expectedCloseDate",
                "status",
              ];
              csvContent +=
                convertToCSV(
                  deals.map((d) => ({
                    dealName: d.dealName,
                    amount: d.amount,
                    stage: d.stage,
                    expectedCloseDate: d.expectedCloseDate,
                    status: d.status,
                  })),
                  dealHeaders,
                ) + "\n\n";
            }

            // Activities
            if (activities.length > 0) {
              csvContent += "=== ACTIVITIES ===\n";
              const activityHeaders = [
                "activityType",
                "description",
                "relatedTo",
                "date",
              ];
              csvContent +=
                convertToCSV(
                  activities.map((a) => ({
                    activityType: a.activityType,
                    description: a.description,
                    relatedTo: a.relatedTo,
                    date: a.date,
                  })),
                  activityHeaders,
                ) + "\n\n";
            }

            // Set response headers
            res.setHeader("Content-Type", "text/csv");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="crm_export_${company.name}_${new Date().toISOString().split("T")[0]}.csv"`,
            );
            res.send(csvContent);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
);

module.exports = router;
