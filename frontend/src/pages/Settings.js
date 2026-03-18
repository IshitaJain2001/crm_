import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/authSlice";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import toast from "react-hot-toast";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Settings = () => {
    const token = useSelector((state) => state.auth.token);
    const user = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [displayName, setDisplayName] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [showUnregisterModal, setShowUnregisterModal] = useState(false);
    const [unregisterStep, setUnregisterStep] = useState("confirm"); // 'confirm' or 'otp'
    const [otp, setOtp] = useState("");
    const [verificationToken, setVerificationToken] = useState("");
    const [unregisterLoading, setUnregisterLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);

    useEffect(() => {
        fetchWorkspaceData();
    }, []);

    const fetchWorkspaceData = async () => {
        try {
            setLoading(true);
            const [companyRes, membersRes] = await Promise.all([
                axios.get(`${API_URL}/api/workspace/company`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${API_URL}/api/workspace/members`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            setCompany(companyRes.data.company);
            setMembers(membersRes.data.members);
            setDisplayName(companyRes.data.company.displayName);
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to load workspace");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCompany = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(
                `${API_URL}/api/workspace/company`,
                { displayName },
                { headers: { Authorization: `Bearer ${token}` } },
            );

            setCompany(response.data.company);
            setEditMode(false);
            toast.success("Workspace updated");
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to update");
        }
    };

    const handleRequestUnregister = async () => {
        try {
            setUnregisterLoading(true);
            const response = await axios.post(
                `${API_URL}/api/admin/company/unregister/request`,
                {},
                { headers: { Authorization: `Bearer ${token}` } },
            );

            setVerificationToken(response.data.verificationToken);
            setUnregisterStep("otp");
            toast.success("OTP sent to your email");
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to send OTP");
            setShowUnregisterModal(false);
            setUnregisterStep("confirm");
        } finally {
            setUnregisterLoading(false);
        }
    };

    const handleVerifyOtpAndUnregister = async () => {
        try {
            if (!otp || otp.length !== 6) {
                toast.error("Please enter a valid 6-digit OTP");
                return;
            }

            setUnregisterLoading(true);
            const response = await axios.post(
                `${API_URL}/api/admin/company/unregister/verify`,
                { otp },
                { headers: { Authorization: `Bearer ${token}` } },
            );

            toast.success(response.data.message);
            setShowUnregisterModal(false);
            setUnregisterStep("confirm");
            setOtp("");
            setVerificationToken("");

            // Log out user and redirect to login after 1.5 seconds
            setTimeout(() => {
                // Clear auth state from Redux (logout action already removes localStorage)
                dispatch(logout());

                // Redirect to login page
                navigate("/login", { replace: true });

                toast.success(
                    "You have been logged out. Company unregistration complete.",
                );
            }, 1500);
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to verify OTP");
        } finally {
            setUnregisterLoading(false);
        }
    };

    const closeUnregisterModal = () => {
        setShowUnregisterModal(false);
        setUnregisterStep("confirm");
        setOtp("");
        setVerificationToken("");
    };

    const handleExportData = async (format) => {
        try {
            setExportLoading(true);
            const endpoint = `/api/admin/company/export/${format}`;

            if (format === "json") {
                // Download JSON
                const response = await axios.get(`${API_URL}${endpoint}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const dataStr = JSON.stringify(response.data, null, 2);
                const dataBlob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `crm_export_${company.name}_${new Date()
                    .toISOString()
                    .split("T")[0]}.json`;
                link.click();
                URL.revokeObjectURL(url);
                toast.success("Data exported as JSON");
            } else if (format === "csv") {
                // Download CSV
                const response = await axios.get(`${API_URL}${endpoint}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: "blob",
                });

                const url = URL.createObjectURL(response.data);
                const link = document.createElement("a");
                link.href = url;
                link.download = `crm_export_${company.name}_${new Date()
                    .toISOString()
                    .split("T")[0]}.csv`;
                link.click();
                URL.revokeObjectURL(url);
                toast.success("Data exported as CSV");
            }
        } catch (error) {
            toast.error(error.response?.data?.error || `Failed to export ${format}`);
        } finally {
            setExportLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
                <Sidebar />
                <div className="absolute top-0 bottom-0 left-64 right-0 flex flex-col overflow-hidden transition-all duration-300">
                    <Header title="Settings & Workspace" />
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />
            <div className="absolute top-0 bottom-0 left-64 right-0 flex flex-col overflow-hidden transition-all duration-300">
                <Header title="Settings & Workspace" />
                <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
                    <div className="p-6 max-w-4xl mt-20">
                        {/* Workspace Info */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                    Workspace
                                </h2>
                                {!editMode && (
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>

                            {editMode ? (
                                <form onSubmit={handleUpdateCompany} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Display Name
                                        </label>
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                                        >
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditMode(false);
                                                setDisplayName(company.displayName);
                                            }}
                                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                                            Workspace Slug
                                        </p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {company?.name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                                            Display Name
                                        </p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {company?.displayName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                                            Plan
                                        </p>
                                        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 uppercase">
                                            {company?.plan}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                                            Max Users
                                        </p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Unlimited
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Team Members */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                                Team Members
                            </h2>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Email
                                            </th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Role
                                            </th>
                                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {members.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="4"
                                                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                                                >
                                                    No team members yet. Invite someone to get started!
                                                </td>
                                            </tr>
                                        ) : (
                                            members.map((member) => (
                                                <tr
                                                    key={member.id}
                                                    className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                >
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                        {member.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                        {member.email}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                            {member.role.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                member.active
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-gray-100 text-gray-800"
                                                            }`}
                                                        >
                                                            {member.active ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-4">
                                Total Members: {members.length} / Unlimited
                            </p>
                        </div>

                        {/* Export Data - Only for Super Admin */}
                        {user?.role === "superadmin" && (
                            <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 border-l-4 border-blue-500 rounded-lg p-6 mt-6 mb-6">
                                <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-400 mb-4">
                                    Export Company Data
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    Export all your company data before unregistering. Choose your
                                    preferred format:
                                </p>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-300 dark:border-blue-700">
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => handleExportData("csv")}
                                            disabled={exportLoading}
                                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                                        >
                                            {exportLoading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    Exporting...
                                                </>
                                            ) : (
                                                <>📥 Download as CSV</>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleExportData("json")}
                                            disabled={exportLoading}
                                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                                        >
                                            {exportLoading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    Exporting...
                                                </>
                                            ) : (
                                                <>💾 Download as JSON</>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                                        Includes: Employees, Contacts, Deals, Activities
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Danger Zone - Only for Super Admin */}
                        {user?.role === "superadmin" && (
                            <div className="bg-red-50 dark:bg-red-900 dark:bg-opacity-20 border-l-4 border-red-500 rounded-lg p-6 mt-6">
                                <h2 className="text-2xl font-bold text-red-800 dark:text-red-400 mb-4">
                                    Danger Zone
                                </h2>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-300 dark:border-red-700">
                                    <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
                                        Unregister Company
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                                        Once you unregister your company, this action cannot be
                                        undone. All company data, team members, settings, and your
                                        superadmin account will be permanently deleted. You will need
                                        to register as a new user. We'll send you an OTP to verify
                                        this critical action.
                                    </p>
                                    <button
                                        onClick={() => setShowUnregisterModal(true)}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                                    >
                                        Unregister Company
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Unregister Modal */}
            {showUnregisterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4">
                        {unregisterStep === "confirm" ? (
                            <div className="p-6">
                                <h3 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">
                                    Confirm Unregistration
                                </h3>
                                <div className="bg-red-50 dark:bg-red-900 dark:bg-opacity-30 border border-red-300 dark:border-red-700 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-red-900 dark:text-red-200">
                                        <strong>Warning:</strong> This action will permanently
                                        delete:
                                    </p>
                                    <ul className="text-sm text-red-900 dark:text-red-200 mt-2 ml-4 space-y-1">
                                        <li>• Your entire company workspace</li>
                                        <li>• All team members (employees)</li>
                                        <li>• All pending invitations</li>
                                        <li>• All data and records</li>
                                        <li>• All integrations and settings</li>
                                        <li>• Your superadmin user account</li>
                                    </ul>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 mb-6">
                                    An OTP will be sent to <strong>{user?.email}</strong> to
                                    verify this action.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={closeUnregisterModal}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleRequestUnregister}
                                        disabled={unregisterLoading}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {unregisterLoading ? "Sending OTP..." : "Continue"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6">
                                <h3 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">
                                    Verify with OTP
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    We've sent a 6-digit OTP to <strong>{user?.email}</strong>.
                                    Enter it below to confirm company unregistration.
                                </p>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        One-Time Password (OTP)
                                    </label>
                                    <input
                                        type="text"
                                        maxLength="6"
                                        value={otp}
                                        onChange={(e) =>
                                            setOtp(e.target.value.replace(/\D/g, ""))
                                        }
                                        placeholder="000000"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 dark:focus:border-red-400 text-center text-xl tracking-widest"
                                    />
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                        OTP will expire in 10 minutes
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setUnregisterStep("confirm");
                                            setOtp("");
                                        }}
                                        disabled={unregisterLoading}
                                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleVerifyOtpAndUnregister}
                                        disabled={
                                            unregisterLoading || otp.length !== 6
                                        }
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {unregisterLoading
                                            ? "Processing..."
                                            : "Confirm Unregistration"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
