import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import { FiCalendar, FiX, FiCheckCircle, FiSearch } from "react-icons/fi";
// eslint-disable-next-line no-unused-vars
import { FiPlus, FiAlertCircle } from "react-icons/fi";

const API_URL = process.env.REACT_APP_API_URL || "https://crm-1-5el5.onrender.com";

const MeetingSchedulerWithTeam = ({ isOpen, onClose, onSuccess }) => {
  const token = useSelector((state) => state.auth.token);
  // eslint-disable-next-line no-unused-vars
  const user = useSelector((state) => state.auth.user);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    attendeeIds: [],
    location: "",
    meetingType: "video",
    meetingLink: "",
    syncToCalendar: true,
  });

  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [commonSlots, setCommonSlots] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [employeeAvailability, setEmployeeAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [showCommonSlots, setShowCommonSlots] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState("all");

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, token]);

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await axios.get(`${API_URL}/api/meetings/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(response.data.employees || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to load employees");
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleEmployeeToggle = (empId) => {
    if (selectedEmployees.includes(empId)) {
      setSelectedEmployees(selectedEmployees.filter((id) => id !== empId));
    } else {
      setSelectedEmployees([...selectedEmployees, empId]);
    }
  };

  const handleFindCommonSlots = async () => {
    if (selectedEmployees.length === 0) {
      toast.error("Select at least one employee");
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      toast.error("Set start and end dates");
      return;
    }

    setLoading(true);

    try {
      // Get common slots
      const response = await axios.post(
        `${API_URL}/api/meetings/common-available-slots`,
        {
          employeeIds: selectedEmployees,
          startDate: new Date(formData.startTime),
          endDate: new Date(formData.endTime),
          duration: 60,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setCommonSlots(response.data.commonSlots || []);
      setShowCommonSlots(true);

      if (response.data.totalCommonSlots === 0) {
        toast.warning(
          `No common available slots found for ${selectedEmployees.length} employee(s)`,
        );
      } else {
        toast.success(`Found ${response.data.totalCommonSlots} common slots`);
      }
    } catch (error) {
      console.error("Error finding common slots:", error);
      toast.error("Failed to find available slots");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCommonSlot = (slot) => {
    setFormData({
      ...formData,
      startTime: new Date(slot.start).toISOString().slice(0, 16),
      endTime: new Date(slot.end).toISOString().slice(0, 16),
    });
    setShowCommonSlots(false);
  };

  const handleScheduleMeeting = async () => {
    // Validate
    if (!formData.title.trim()) {
      toast.error("Meeting title is required");
      return;
    }

    if (selectedEmployees.length === 0) {
      toast.error("Add at least one employee");
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      toast.error("Start and end times are required");
      return;
    }

    setLoading(true);

    try {
      // Map employee IDs to full attendee data
      const selectedEmps = employees.filter((e) =>
        selectedEmployees.includes(e.id),
      );
      const attendees = selectedEmps.map((emp) => ({
        email: emp.email,
        name: emp.name,
      }));

      const response = await axios.post(
        `${API_URL}/api/meetings`,
        {
          title: formData.title,
          description: formData.description,
          startTime: new Date(formData.startTime),
          endTime: new Date(formData.endTime),
          attendees,
          location: formData.location,
          meetingType: formData.meetingType,
          meetingLink: formData.meetingLink,
          syncToCalendar: formData.syncToCalendar,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success("Meeting scheduled successfully!");

      if (onSuccess) {
        onSuccess(response.data);
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        attendeeIds: [],
        location: "",
        meetingType: "video",
        meetingLink: "",
        syncToCalendar: true,
      });
      setSelectedEmployees([]);
      onClose();
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      toast.error(error.response?.data?.error || "Failed to schedule meeting");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const departments = ["all", ...new Set(employees.map((e) => e.department))];
  const filteredEmployees = employees.filter((emp) => {
    const matchesDept =
      departmentFilter === "all" || emp.department === departmentFilter;
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiCalendar size={28} /> Schedule Team Meeting
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Meeting Details */}
            <div className="lg:col-span-2 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  placeholder="Team Sync, Planning Session, etc."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Add meeting notes or agenda..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Meeting Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Meeting Type
                </label>
                <select
                  value={formData.meetingType}
                  onChange={(e) =>
                    setFormData({ ...formData, meetingType: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="video">Video Call</option>
                  <option value="phone">Phone Call</option>
                  <option value="in-person">In-Person</option>
                  <option value="virtual">Virtual</option>
                </select>
              </div>

              {/* Meeting Link */}
              {formData.meetingType !== "in-person" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://zoom.us/j/..."
                    value={formData.meetingLink}
                    onChange={(e) =>
                      setFormData({ ...formData, meetingLink: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Location */}
              {formData.meetingType === "in-person" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="Conference room, address, etc."
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Sync to Calendar */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="syncCalendar"
                  checked={formData.syncToCalendar}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      syncToCalendar: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="syncCalendar" className="text-sm text-gray-700">
                  Sync to Google Calendar
                </label>
              </div>
            </div>

            {/* Right: Employee Selection */}
            <div className="lg:col-span-1 border-l pl-6 space-y-4">
              {/* Selected Employees */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Selected ({selectedEmployees.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedEmployees.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">
                      No employees selected
                    </p>
                  ) : (
                    selectedEmployees.map((empId) => {
                      const emp = employees.find((e) => e.id === empId);
                      return (
                        <div
                          key={empId}
                          className="bg-blue-50 p-2 rounded border border-blue-200 flex justify-between items-start"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {emp?.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {emp?.department}
                            </p>
                          </div>
                          <button
                            onClick={() => handleEmployeeToggle(empId)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Time Optimization Button */}
              {selectedEmployees.length > 0 && (
                <button
                  onClick={handleFindCommonSlots}
                  disabled={loading || !formData.startTime || !formData.endTime}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold text-sm"
                >
                  Find Common Slots
                </button>
              )}

              {/* Common Slots Results */}
              {showCommonSlots && commonSlots.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm font-semibold text-green-900 mb-2">
                    Common Available Slots ({commonSlots.length})
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {commonSlots.slice(0, 5).map((slot, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectCommonSlot(slot)}
                        className="w-full text-left text-xs p-2 bg-white border border-green-200 rounded hover:bg-green-100 transition"
                      >
                        {new Date(slot.start).toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Employee List Section */}
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Add Team Members
            </h3>

            {/* Search & Filter */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <FiSearch
                  className="absolute left-3 top-3 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept === "all" ? "All Departments" : dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Employee List */}
            {loadingEmployees ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading employees...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-yellow-800 font-semibold">
                  No employees found in your workspace
                </p>
                <p className="text-sm text-yellow-600 mt-1">
                  Add team members from the Employees section
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {filteredEmployees.length === 0 ? (
                  <div className="col-span-2 text-center py-4 text-gray-500">
                    No employees match your search
                  </div>
                ) : (
                  filteredEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => handleEmployeeToggle(emp.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                        selectedEmployees.includes(emp.id)
                          ? "bg-blue-50 border-blue-500"
                          : "bg-white border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {emp.name}
                          </p>
                          <p className="text-xs text-gray-600">{emp.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {emp.department}
                          </p>
                        </div>
                        {selectedEmployees.includes(emp.id) && (
                          <FiCheckCircle className="text-blue-600" size={20} />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 sticky bottom-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleScheduleMeeting}
            disabled={loading || selectedEmployees.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <FiCalendar size={18} />
            {loading ? "Scheduling..." : "Schedule Meeting"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingSchedulerWithTeam;
