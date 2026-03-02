import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2, FiEye } from "react-icons/fi";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const WebsiteBuilder = ({ token }) => {
  const [website, setWebsite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState(null);
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  const [newSectionType, setNewSectionType] = useState("services");

  useEffect(() => {
    fetchWebsite();
  }, []);

  const fetchWebsite = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/website-builder/my-website`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWebsite(response.data);
    } catch (error) {
      toast.error("Failed to load website");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = async () => {
    if (!newSectionType) {
      toast.error("Select section type");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/website-builder/section`,
        {
          type: newSectionType,
          title: `New ${newSectionType} Section`,
          content: "Click to edit...",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWebsite(response.data.website);
      setNewSectionType("services");
      setShowNewSectionForm(false);
      toast.success("Section added!");
    } catch (error) {
      toast.error("Failed to add section");
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm("Delete this section?")) return;

    try {
      const response = await axios.delete(
        `${API_URL}/api/website-builder/section/${sectionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWebsite(response.data.website);
      toast.success("Section deleted!");
    } catch (error) {
      toast.error("Failed to delete section");
    }
  };

  const handleUpdateSection = async (sectionId, updates) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/website-builder/section/${sectionId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setWebsite(response.data.website);
      setEditingSection(null);
      toast.success("Section updated!");
    } catch (error) {
      toast.error("Failed to update section");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading website builder...</div>;
  }

  if (!website) {
    return <div className="text-center py-8 text-red-600">Website not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{website.title}</h2>
        <p className="text-gray-600 mb-4">{website.description}</p>

        <div className="flex gap-2">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
            <FiEye /> Preview
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition">
            Publish
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Sections</h3>
          <button
            onClick={() => setShowNewSectionForm(!showNewSectionForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <FiPlus /> Add Section
          </button>
        </div>

        {/* Add Section Form */}
        {showNewSectionForm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <select
                value={newSectionType}
                onChange={(e) => setNewSectionType(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="hero">Hero Section</option>
                <option value="services">Services</option>
                <option value="about">About</option>
                <option value="features">Features</option>
                <option value="contact">Contact</option>
                <option value="testimonials">Testimonials</option>
              </select>
              <button
                onClick={handleAddSection}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {/* Sections List */}
        {website.sections.length > 0 ? (
          website.sections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <div key={section.id} className="bg-white rounded-lg shadow overflow-hidden">
                {editingSection?.id === section.id ? (
                  // Edit Mode
                  <div className="p-6 space-y-4">
                    <h4 className="font-semibold text-gray-800">Edit {section.type}</h4>
                    
                    <input
                      type="text"
                      value={editingSection.title}
                      onChange={(e) =>
                        setEditingSection({ ...editingSection, title: e.target.value })
                      }
                      placeholder="Section Title"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />

                    <textarea
                      value={editingSection.content}
                      onChange={(e) =>
                        setEditingSection({ ...editingSection, content: e.target.value })
                      }
                      placeholder="Section Content"
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />

                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={editingSection.backgroundColor}
                        onChange={(e) =>
                          setEditingSection({
                            ...editingSection,
                            backgroundColor: e.target.value,
                          })
                        }
                        className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                        title="Background Color"
                      />
                      <input
                        type="color"
                        value={editingSection.textColor}
                        onChange={(e) =>
                          setEditingSection({
                            ...editingSection,
                            textColor: e.target.value,
                          })
                        }
                        className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                        title="Text Color"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleUpdateSection(section.id, {
                            title: editingSection.title,
                            content: editingSection.content,
                            backgroundColor: editingSection.backgroundColor,
                            textColor: editingSection.textColor,
                          })
                        }
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingSection(null)}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div
                    className="p-6"
                    style={{
                      backgroundColor: section.backgroundColor,
                      color: section.textColor,
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-semibold mb-2">{section.title}</h4>
                        <p className="text-sm opacity-75">{section.content}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingSection(section)}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSection(section.id)}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs opacity-50">
                      Type: <span className="font-mono">{section.type}</span>
                    </p>
                  </div>
                )}
              </div>
            ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No sections yet. Add one to get started!
          </div>
        )}
      </div>

      {/* Colors */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Website Colors</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600">Primary Color</label>
            <input
              type="color"
              value={website.colors.primary}
              className="w-full h-10 border border-gray-300 rounded cursor-pointer"
              title="Primary Color"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Secondary Color</label>
            <input
              type="color"
              value={website.colors.secondary}
              className="w-full h-10 border border-gray-300 rounded cursor-pointer"
              title="Secondary Color"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Accent Color</label>
            <input
              type="color"
              value={website.colors.accent}
              className="w-full h-10 border border-gray-300 rounded cursor-pointer"
              title="Accent Color"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteBuilder;
