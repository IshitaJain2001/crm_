import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL } from "../config/api";

const EmailRecommendation = ({ contactId, token }) => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState(null);
  const [timing, setTiming] = useState(null);
  const [activeTab, setActiveTab] = useState("templates");

  useEffect(() => {
    fetchRecommendations();
  }, [contactId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);

      // Fetch both templates and timing
      const [templatesRes, timingRes] = await Promise.all([
        axios.get(
          `${API_URL}/api/email-recommendations/templates/recommend/${contactId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          `${API_URL}/api/email-recommendations/timing/${contactId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);

      setTemplates(templatesRes.data);
      setTiming(timingRes.data);
    } catch (error) {
      toast.error("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">📧 Email Assistant</h3>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === "templates"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          📝 Email Templates
        </button>
        <button
          onClick={() => setActiveTab("timing")}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === "timing"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          ⏰ Follow-up Timing
        </button>
      </div>

      {/* Email Templates Tab */}
      {activeTab === "templates" && templates && (
        <div className="space-y-4">
          {/* Recommendation Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              💡 Recommended Category: <span className="text-blue-700">{templates.recommendedCategory.replace(/_/g, " ").toUpperCase()}</span>
            </p>
            <p className="text-sm text-blue-800">{templates.insight}</p>
            <p className="text-xs text-blue-600 mt-2">
              Current Deal Stage: <span className="font-semibold">{templates.dealStage}</span>
            </p>
          </div>

          {/* Templates */}
          {templates.templates.length > 0 ? (
            templates.templates.map((template, idx) => (
              <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">#{idx + 1} {template.name}</p>
                    <p className="text-xs text-gray-500">
                      {template.category.replace(/_/g, " ").toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      {template.successRate}% Success
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded mb-3 max-h-32 overflow-y-auto">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Subject:</p>
                  <p className="text-sm text-gray-800 mb-3">{template.subject}</p>
                  <p className="text-xs font-semibold text-gray-700 mb-1">Preview:</p>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {template.body.substring(0, 150)}...
                  </p>
                </div>

                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold transition">
                  Use This Template
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No templates available</p>
          )}
        </div>
      )}

      {/* Follow-up Timing Tab */}
      {activeTab === "timing" && timing && (
        <div className="space-y-4">
          {/* Main Timing Card */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-2">Recommended Follow-up Time</p>
            <p className="text-3xl font-bold text-green-600 mb-2">
              {timing.optimalDay} at {timing.optimalTime}
            </p>
            <p className="text-lg text-gray-700 font-semibold">
              📅 {new Date(timing.followUpDate).toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              ⏳ {timing.daysFromNow} day{timing.daysFromNow !== 1 ? "s" : ""} from now
            </p>
          </div>

          {/* Reasoning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="font-semibold text-gray-800 mb-2">📌 Why This Time?</p>
            <p className="text-sm text-gray-700">{timing.reasoning}</p>
          </div>

          {/* Engagement Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Email Open Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {timing.contactEngagement.emailOpenRate}
              </p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Last Contact</p>
              <p className="text-sm font-semibold text-gray-800">
                {timing.contactEngagement.daysSinceLastContact} days ago
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ({timing.contactEngagement.lastActivity.replace(/_/g, " ")})
              </p>
            </div>
          </div>

          {/* Urgency Level */}
          <div className={`border rounded-lg p-4 ${
            timing.contactEngagement.recommendedUrgency.includes("High")
              ? "bg-red-50 border-red-200"
              : "bg-blue-50 border-blue-200"
          }`}>
            <p className="font-semibold text-gray-800 mb-1">🚨 Urgency Level</p>
            <p className={`text-sm font-bold ${
              timing.contactEngagement.recommendedUrgency.includes("High")
                ? "text-red-600"
                : "text-blue-600"
            }`}>
              {timing.contactEngagement.recommendedUrgency}
            </p>
          </div>

          {/* Schedule Button */}
          <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition">
            ✅ Schedule Follow-up
          </button>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={fetchRecommendations}
        disabled={loading}
        className="w-full mt-4 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 py-2 rounded text-sm font-semibold transition"
      >
        🔄 Refresh Recommendations
      </button>
    </div>
  );
};

export default EmailRecommendation;
