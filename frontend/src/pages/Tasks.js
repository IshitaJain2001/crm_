import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiCheckCircle,
  FiEdit2,
  FiTrash2,
  FiX,
  FiClock,
} from "react-icons/fi";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Tasks = () => {
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    dueDate: "",
    priority: "medium",
    assignedTo: "",
  });

  useEffect(() => {
    if (token) {
      fetchTasks();
      fetchTeamMembers();
    }
  }, [token]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/tasks?page=1&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/meetings/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeamMembers(response.data.employees || []);
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const handleCreateTask = async () => {
    if (!formData.subject.trim()) {
      toast.error("Task subject is required");
      return;
    }

    try {
      const payload = {
        subject: formData.subject,
        description: formData.description,
        dueDate: formData.dueDate,
        priority: formData.priority,
      };

      // Only add assignedTo if it's specified and user can assign
      if (
        formData.assignedTo &&
        ["superadmin", "admin", "hr", "sales"].includes(user?.role)
      ) {
        payload.assignedTo = formData.assignedTo;
      }

      const response = await axios.post(`${API_URL}/api/tasks`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Task created successfully");
      setFormData({
        subject: "",
        description: "",
        dueDate: "",
        priority: "medium",
        assignedTo: "",
      });
      setShowCreateModal(false);
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error(error.response?.data?.error || "Failed to create task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Task deleted");
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await axios.put(
        `${API_URL}/api/tasks/${taskId}`,
        { status: "completed" },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Task marked as completed");
      fetchTasks();
    } catch (error) {
      console.error("Error completing task:", error);
      toast.error("Failed to complete task");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      on_hold: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "text-green-600",
      medium: "text-yellow-600",
      high: "text-orange-600",
      urgent: "text-red-600",
    };
    return colors[priority] || "text-gray-600";
  };

  const canAssignTasks = ["superadmin", "admin", "hr", "sales"].includes(
    user?.role,
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <Header title="Tasks" />

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">My Tasks</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-semibold"
            >
              <FiPlus size={20} />
              Create Task
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FiCheckCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">No tasks yet</p>
              <p className="text-sm text-gray-400">
                Create your first task to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className={`bg-white rounded-lg shadow p-4 hover:shadow-md transition ${
                    task.status === "completed" ? "opacity-75" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleCompleteTask(task._id)}
                          className={`mt-1 ${
                            task.status === "completed"
                              ? "text-green-600"
                              : "text-gray-400 hover:text-green-600"
                          }`}
                        >
                          <FiCheckCircle size={20} />
                        </button>

                        <div className="flex-1">
                          <h3
                            className={`font-semibold text-gray-900 ${
                              task.status === "completed"
                                ? "line-through text-gray-500"
                                : ""
                            }`}
                          >
                            {task.subject}
                          </h3>

                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {task.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                                task.status || "pending",
                              )}`}
                            >
                              {(task.status || "pending").replace("_", " ")}
                            </span>

                            <span
                              className={`text-xs font-semibold ${getPriorityColor(
                                task.priority,
                              )}`}
                            >
                              {task.priority.toUpperCase()}
                            </span>

                            {task.dueDate && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <FiClock size={14} />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            )}

                            {task.assignedTo && (
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">
                                  Assigned to:
                                </span>{" "}
                                {task.assignedTo.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete task"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Create Task</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Task Subject *
                </label>
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Add details about this task..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {canAssignTasks && teamMembers.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Assign To (Optional)
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedTo: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Assign to Self --</option>
                    {teamMembers
                      .filter((member) => member.id !== user?.id) // Filter out current user
                      .map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.email})
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select a team member to assign this task
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
