import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiCheckCircle,
  FiEdit2,
  FiTrash2,
  FiX,
  FiClock,
} from "react-icons/fi";

const API_URL = process.env.REACT_APP_API_URL || "https://crm-1-5el5.onrender.com";

const Tasks = () => {
  const { isDark } = useTheme();
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
    const lightColors = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      on_hold: "bg-gray-100 text-gray-800",
    };
    const darkColors = {
      pending: "bg-yellow-900 text-yellow-300",
      in_progress: "bg-blue-900 text-blue-300",
      completed: "bg-green-900 text-green-300",
      on_hold: "bg-gray-700 text-gray-300",
    };
    const colorMap = isDark ? darkColors : lightColors;
    return colorMap[status] || (isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800");
  };

  const getPriorityColor = (priority) => {
    const lightColors = {
      low: "text-green-600",
      medium: "text-yellow-600",
      high: "text-orange-600",
      urgent: "text-red-600",
    };
    const darkColors = {
      low: "text-green-400",
      medium: "text-yellow-400",
      high: "text-orange-400",
      urgent: "text-red-400",
    };
    const colorMap = isDark ? darkColors : lightColors;
    return colorMap[priority] || (isDark ? "text-gray-400" : "text-gray-600");
  };

  const canAssignTasks = ["superadmin", "admin", "hr", "sales"].includes(
    user?.role,
  );

  return (
    <div className={`h-screen w-screen ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <Sidebar />

      <div className={`absolute top-0 bottom-0 left-64 right-0 flex flex-col overflow-hidden transition-all duration-300`}>
        <Header title="Tasks" />

        <div className={`flex-1 overflow-auto ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="p-6 mx-auto w-7/10 mt-16">
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>My Tasks</h3>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-semibold"
              >
                <FiPlus size={20} />
                Create Task
              </button>
            </div>

            {loading ? (
              <div className={`rounded-lg shadow p-12 text-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className={`rounded-lg shadow p-12 text-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <FiCheckCircle size={48} className={`mx-auto mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <p className={`mb-2 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>No tasks yet</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
                  Create your first task to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className={`rounded-lg shadow p-4 hover:shadow-md transition ${
                      isDark ? 'bg-gray-800' : 'bg-white'
                    } ${task.status === "completed" ? "opacity-75" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleCompleteTask(task._id)}
                            className={`mt-1 ${
                              task.status === "completed"
                                ? isDark ? "text-green-400" : "text-green-600"
                                : isDark ? "text-gray-500 hover:text-green-400" : "text-gray-400 hover:text-green-600"
                            }`}
                          >
                            <FiCheckCircle size={20} />
                          </button>

                          <div className="flex-1">
                            <h3
                              className={`font-semibold ${
                                task.status === "completed"
                                  ? isDark ? "line-through text-gray-500" : "line-through text-gray-500"
                                  : isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {task.subject}
                            </h3>

                            {task.description && (
                              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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
                                <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  <FiClock size={14} />
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </div>
                              )}

                              {task.assignedTo && (
                                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  <span className="font-medium">Assigned to:</span>{" "}
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
                          className={`p-2 rounded-lg transition ${isDark ? 'text-red-400 hover:bg-red-900' : 'text-red-600 hover:bg-red-50'}`}
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
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl w-full max-w-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex justify-between items-center p-6 border-b ${isDark ? 'border-gray-700' : ''}`}>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Create Task</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Task Subject *
                </label>
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  placeholder="Add details about this task..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
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
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Assign To (Optional)
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedTo: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                  >
                    <option value="">-- Assign to Self --</option>
                    {teamMembers
                      .filter((member) => member.id !== user?.id)
                      .map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.email})
                        </option>
                      ))}
                  </select>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Select a team member to assign this task
                  </p>
                </div>
              )}
            </div>

            <div className={`flex justify-end gap-3 p-6 border-t ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'}`}>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`px-4 py-2 rounded-lg ${isDark ? 'text-gray-300 border border-gray-600 hover:bg-gray-700' : 'text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
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
