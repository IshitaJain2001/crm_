import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Feedback = () => {
  const { isDark } = useTheme();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);

  const [tab, setTab] = useState("submit"); // 'submit' or 'history'
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]);
  const [stats, setStats] = useState(null);

  // Form states
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (tab === "history") {
      fetchFeedbackHistory();
    }
  }, [tab]);

  const fetchFeedbackHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/feedback/my-feedback`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFeedbackList(response.data.feedback);
      setStats(response.data.stats);
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to load feedback history"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();

    if (!rating || !subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    if (subject.length < 5) {
      toast.error("Subject must be at least 5 characters");
      return;
    }

    if (message.length < 10) {
      toast.error("Message must be at least 10 characters");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(
        `${API_URL}/api/feedback/submit`,
        {
          rating,
          category,
          subject,
          message,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Thank you for your feedback!");
      // Reset form
      setRating(5);
      setCategory("general");
      setSubject("");
      setMessage("");

      // Switch to history tab
      setTimeout(() => {
        setTab("history");
      }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const lightColors = {
      new: "bg-blue-100 text-blue-800",
      reviewed: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-purple-100 text-purple-800",
      resolved: "bg-green-100 text-green-800",
    };
    const darkColors = {
      new: "bg-blue-900 text-blue-300",
      reviewed: "bg-yellow-900 text-yellow-300",
      in_progress: "bg-purple-900 text-purple-300",
      resolved: "bg-green-900 text-green-300",
    };
    const colorMap = isDark ? darkColors : lightColors;
    return colorMap[status] || (isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800");
  };

  const getStatusLabel = (status) => {
    const labels = {
      new: "New",
      reviewed: "Reviewed",
      in_progress: "In Progress",
      resolved: "Resolved",
    };
    return labels[status] || status;
  };

  const getRatingColor = (rating) => {
    if (isDark) {
      if (rating === 5) return "text-green-400";
      if (rating === 4) return "text-blue-400";
      if (rating === 3) return "text-yellow-400";
      if (rating === 2) return "text-orange-400";
      return "text-red-400";
    } else {
      if (rating === 5) return "text-green-600";
      if (rating === 4) return "text-blue-600";
      if (rating === 3) return "text-yellow-600";
      if (rating === 2) return "text-orange-600";
      return "text-red-600";
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      feature_request: "Feature Request",
      bug_report: "Bug Report",
      performance: "Performance",
      ui_ux: "UI/UX",
      general: "General",
    };
    return labels[category] || category;
  };

  if (user?.role !== "superadmin") {
    return (
      <div className={`flex h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Access Denied
            </h2>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Only superadmins can access feedback
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <Header title="Feedback & Suggestions" />

        <div className={`p-6 max-w-4xl ${isDark ? 'bg-gray-900' : ''}`}>
          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setTab("submit")}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                tab === "submit"
                  ? "bg-blue-600 text-white"
                  : isDark ? "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              📝 Send Feedback
            </button>
            <button
              onClick={() => setTab("history")}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                tab === "history"
                  ? "bg-blue-600 text-white"
                  : isDark ? "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              📋 Feedback History
            </button>
          </div>

          {/* SUBMIT FEEDBACK TAB */}
          {tab === "submit" && (
            <div className={`rounded-lg shadow p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="mb-6">
                <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Share Your Feedback
                </h2>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Help us improve the CRM by sharing your thoughts, suggestions,
                  or reporting any issues you encounter.
                </p>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-6">
                {/* Rating */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    How would you rate your experience? ⭐
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRating(r)}
                        className={`w-12 h-12 rounded-lg font-bold text-lg transition-all ${
                          rating === r
                            ? "bg-blue-600 text-white scale-110"
                            : isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    1 = Poor, 5 = Excellent
                  </p>
                </div>

                {/* Category */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400 focus:ring-blue-900' : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-200'}`}
                  >
                    <option value="general">General Feedback</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="bug_report">Bug Report</option>
                    <option value="performance">Performance</option>
                    <option value="ui_ux">UI/UX Suggestion</option>
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief title of your feedback"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-900' : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-200'}`}
                  />
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Minimum 5 characters
                  </p>
                </div>

                {/* Message */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Your Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please describe your feedback in detail..."
                    rows="6"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-900' : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-200'}`}
                  />
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Minimum 10 characters (
                    {message.length}/10)
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  {submitting ? "Submitting..." : "Send Feedback"}
                </button>
              </form>

              {/* Info Box */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>💡 Tip:</strong> Your feedback helps us understand
                  what's working well and where we can improve. All feedback is
                  valuable and reviewed by our team.
                </p>
              </div>
            </div>
          )}

          {/* FEEDBACK HISTORY TAB */}
          {tab === "history" && (
            <div className="space-y-6">
              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="bg-white rounded-lg shadow p-4 text-center">
                    <div className="text-2xl font-bold text-gray-800">
                      {stats.total}
                    </div>
                    <p className="text-xs text-gray-600">Total Feedback</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.new}
                    </div>
                    <p className="text-xs text-gray-600">New</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {stats.reviewed}
                    </div>
                    <p className="text-xs text-gray-600">Reviewed</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.inProgress}
                    </div>
                    <p className="text-xs text-gray-600">In Progress</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.resolved}
                    </div>
                    <p className="text-xs text-gray-600">Resolved</p>
                  </div>
                </div>
              )}

              {/* Feedback List */}
              <div className="bg-white rounded-lg shadow">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                ) : feedbackList.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p className="text-lg font-semibold mb-2">
                      No feedback yet
                    </p>
                    <p className="text-sm">
                      Start sharing your feedback to help us improve!
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {feedbackList.map((fb) => (
                      <div key={fb._id} className="p-6 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-800 text-lg">
                              {fb.subject}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(fb.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(fb.status)}`}>
                            {getStatusLabel(fb.status)}
                          </span>
                        </div>

                        <div className="flex gap-4 mb-3 flex-wrap">
                          <div className="flex items-center gap-1">
                            <span className={`text-lg font-bold ${getRatingColor(fb.rating)}`}>
                              ★ {fb.rating}/5
                            </span>
                          </div>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {getCategoryLabel(fb.category)}
                          </span>
                        </div>

                        <p className="text-gray-700 text-sm">
                          {fb.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feedback;
