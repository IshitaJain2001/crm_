import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";
import { useLayout } from "../context/LayoutContext";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiCopy,
  FiActivity,
} from "react-icons/fi";

const API_URL = process.env.REACT_APP_API_URL || "https://crm-1-5el5.onrender.com";

const Forms = () => {
  const { isDark } = useTheme();
  const { sidebarOpen } = useLayout();
  const token = useSelector((state) => state.auth.token);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [newFormTitle, setNewFormTitle] = useState("");

  useEffect(() => {
    if (token) {
      fetchForms();
    }
  }, [token]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/forms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForms(response.data.forms || []);
    } catch (error) {
      console.error("Error fetching forms:", error);
      toast.error("Failed to load forms");
    } finally {
      setLoading(false);
    }
  };

  const createForm = async () => {
    if (!newFormTitle.trim()) {
      toast.error("Form title is required");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/forms`,
        { title: newFormTitle, fields: [] },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setForms([response.data.form, ...forms]);
      setNewFormTitle("");
      setShowCreateForm(false);
      toast.success("Form created successfully");
    } catch (error) {
      console.error("Error creating form:", error);
      toast.error("Failed to create form");
    }
  };

  const deleteForm = async (formId) => {
    if (!window.confirm("Are you sure you want to delete this form?")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/forms/${formId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForms(forms.filter((f) => f._id !== formId));
      toast.success("Form deleted successfully");
    } catch (error) {
      console.error("Error deleting form:", error);
      toast.error("Failed to delete form");
    }
  };

  const copyEmbedCode = (formSlug) => {
    const embedCode = `<iframe src="${API_URL}/api/forms/public/form/${formSlug}" style="width: 100%; height: 600px; border: none; border-radius: 8px;"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    toast.success("Embed code copied to clipboard");
  };

  const getStatusBadge = (status) => {
    const lightColors = {
      draft: "bg-gray-100 text-gray-800",
      published: "bg-green-100 text-green-800",
      archived: "bg-red-100 text-red-800",
    };
    const darkColors = {
      draft: "bg-gray-700 text-gray-300",
      published: "bg-green-900 text-green-300",
      archived: "bg-red-900 text-red-300",
    };
    const colorMap = isDark ? darkColors : lightColors;
    return colorMap[status] || (isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800");
  };

  return (
    <div className={`h-screen w-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Sidebar />

      <div className={`absolute top-0 bottom-0 left-64 right-0 flex flex-col overflow-hidden transition-all duration-300`}>
        <Header title="Forms & Lead Capture" />

        <div className={`flex-1 overflow-auto ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
          <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
          {/* Create Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold"
            >
              <FiPlus size={20} /> Create New Form
            </button>
          </div>

          {/* Create Form Modal */}
           {showCreateForm && (
             <div className={`mb-6 rounded-lg shadow p-6 border-l-4 border-blue-600 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
               <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                 Create New Form
               </h3>
               <div className="space-y-4">
                 <input
                   type="text"
                   placeholder="Form title (e.g., Contact Us, Newsletter Signup)"
                   value={newFormTitle}
                   onChange={(e) => setNewFormTitle(e.target.value)}
                   onKeyPress={(e) => e.key === "Enter" && createForm()}
                   className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900'}`}
                   autoFocus
                 />
                <div className="flex gap-2">
                  <button
                    onClick={createForm}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Form
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewFormTitle("");
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Forms List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading forms...</p>
            </div>
          ) : forms.length === 0 ? (
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-12 text-center`}>
              <FiActivity size={48} className={`mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No forms yet</p>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Create your first form to start capturing leads
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {forms.map((form) => (
                <div
                  key={form._id}
                  className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow hover:shadow-md transition p-6`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {form.title}
                      </h3>
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {form.description}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusBadge(
                        form.status,
                      )}`}
                    >
                      {form.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <p>
                      <strong>Submissions:</strong> {form.submissionCount}
                    </p>
                    <p>
                      <strong>Views:</strong> {form.viewCount}
                    </p>
                    <p>
                      <strong>Slug:</strong>{" "}
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        {form.slug}
                      </code>
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      onClick={() => setSelectedForm(form)}
                      className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-semibold flex items-center justify-center gap-1"
                    >
                      <FiEdit2 size={16} /> Edit
                    </button>
                    <button
                      onClick={() => copyEmbedCode(form.slug)}
                      className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-semibold flex items-center justify-center gap-1"
                    >
                      <FiCopy size={16} /> Embed
                    </button>
                    <button
                      onClick={() => deleteForm(form._id)}
                      className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-semibold flex items-center justify-center gap-1"
                    >
                      <FiTrash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Editor Modal */}
      {selectedForm && (
        <FormEditor
          form={selectedForm}
          onClose={() => setSelectedForm(null)}
          onSave={(updatedForm) => {
            setForms(
              forms.map((f) => (f._id === updatedForm._id ? updatedForm : f)),
            );
            setSelectedForm(null);
          }}
          token={token}
        />
        )}
      </div>
    </div>
  );
};

// Form Editor Component
const FormEditor = ({ form, onClose, onSave, token }) => {
  const { isDark } = useTheme();
  const [title, setTitle] = useState(form.title);
  const [description, setDescription] = useState(form.description || "");
  const [fields, setFields] = useState(form.fields || []);
  const [successMessage, setSuccessMessage] = useState(
    form.successMessage || "",
  );
  const [status, setStatus] = useState(form.status);
  const [saving, setSaving] = useState(false);

  const addField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      name: `field_${fields.length + 1}`,
      label: "New Field",
      type: "text",
      required: false,
      order: fields.length,
    };
    setFields([...fields, newField]);
  };

  const updateField = (index, updates) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setFields(updatedFields);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const saveForm = async () => {
    try {
      setSaving(true);
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/forms/${
          form._id
        }`,
        {
          title,
          description,
          fields,
          successMessage,
          status,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success("Form updated successfully");
      onSave(response.data.form);
    } catch (error) {
      console.error("Error saving form:", error);
      toast.error("Failed to save form");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto`}>
         {/* Header */}
         <div className={`flex justify-between items-center p-6 border-b sticky top-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
           <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Edit Form</h2>
           <button
             onClick={onClose}
             className={isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}
           >
             ✕
           </button>
         </div>

         {/* Body */}
         <div className={`p-6 space-y-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Basic Information
            </h3>
            <input
              type="text"
              placeholder="Form title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900'}`}
            />
            <textarea
              placeholder="Form description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-20 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900'}`}
            />
            <input
              type="text"
              placeholder="Success message"
              value={successMessage}
              onChange={(e) => setSuccessMessage(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900'}`}
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            </div>

            {/* Fields */}
            <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Form Fields
              </h3>
              <button
                onClick={addField}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Add Field
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border border-gray-300 rounded-lg p-4 space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Field Label"
                      value={field.label}
                      onChange={(e) =>
                        updateField(index, { label: e.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <select
                      value={field.type}
                      onChange={(e) =>
                        updateField(index, { type: e.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="textarea">Textarea</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`required_${index}`}
                      checked={field.required || false}
                      onChange={(e) =>
                        updateField(index, { required: e.target.checked })
                      }
                    />
                    <label htmlFor={`required_${index}`} className="text-sm">
                      Required
                    </label>
                    <button
                      onClick={() => removeField(index)}
                      className="ml-auto text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
         <div className={`flex justify-end gap-3 p-6 border-t sticky bottom-0 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'}`}>
           <button
             onClick={onClose}
             className={`px-4 py-2 border rounded-lg ${isDark ? 'text-gray-300 border-gray-600 hover:bg-gray-600' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}
           >
             Cancel
           </button>
           <button
             onClick={saveForm}
             disabled={saving}
             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
           >
             {saving ? "Saving..." : "Save Changes"}
           </button>
         </div>
      </div>
    </div>
  );
};

export default Forms;
