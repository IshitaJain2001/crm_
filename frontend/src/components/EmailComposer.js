import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiSend, FiX, FiPlus } from 'react-icons/fi';

const API_URL = process.env.REACT_APP_API_URL || 'https://crm-1-5el5.onrender.com';

const EmailComposer = ({ isOpen, onClose, contactEmail, contactName, onSuccess }) => {
  const token = useSelector(state => state.auth.token);
  // eslint-disable-next-line no-unused-vars
  const user = null; // Future use for user context

  const [formData, setFormData] = useState({
    to: [],
    cc: [],
    bcc: [],
    subject: '',
    body: '',
    templateId: ''
  });

  const [templates, setTemplates] = useState([]);
  const [recipients, setRecipients] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/emails/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  // Load templates on mount
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      if (contactEmail) {
        setRecipients(contactEmail);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleAddRecipient = () => {
    if (recipients.trim()) {
      const emails = recipients.split(/[,;]/).map(e => e.trim()).filter(e => e);
      const newRecipients = emails.map(email => ({
        email,
        name: ''
      }));
      setFormData({
        ...formData,
        to: [...formData.to, ...newRecipients]
      });
      setRecipients('');
    }
  };

  const handleRemoveRecipient = (index) => {
    setFormData({
      ...formData,
      to: formData.to.filter((_, i) => i !== index)
    });
  };

  const handleTemplateSelect = (template) => {
    setFormData({
      ...formData,
      subject: template.subject,
      body: template.body,
      templateId: template._id
    });
  };

  const handleSendEmail = async () => {
    // Auto-add any remaining recipients in the input field
    let toRecipients = [...formData.to];
    if (recipients.trim()) {
      const emails = recipients.split(/[,;]/).map(e => e.trim()).filter(e => e);
      const newRecipients = emails.map(email => ({
        email,
        name: ''
      }));
      toRecipients = [...toRecipients, ...newRecipients];
    }

    // Validate
    if (toRecipients.length === 0) {
      toast.error('Add at least one recipient');
      return;
    }

    if (!formData.subject.trim()) {
      toast.error('Subject is required');
      return;
    }

    if (!formData.body.trim()) {
      toast.error('Email body is required');
      return;
    }

    setLoading(true);

    try {
      const emailPayload = {
        to: toRecipients.map(r => r.email),
        cc: formData.cc.map(r => r.email),
        bcc: formData.bcc.map(r => r.email),
        subject: formData.subject,
        body: formData.body,
        templateId: formData.templateId || undefined
      };

      console.log('Sending email with payload:', emailPayload);

      const response = await axios.post(
        `${API_URL}/api/emails/send`,
        emailPayload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Email sent successfully!');
      
      if (onSuccess) {
        onSuccess(response.data);
      }

      // Reset form
      setFormData({
        to: [],
        cc: [],
        bcc: [],
        subject: '',
        body: '',
        templateId: ''
      });
      onClose();

    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error.response?.data?.error || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Compose Email</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {/* Recipients */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Recipients
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="email"
                placeholder="Add email address..."
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddRecipient()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              />
              <button
                onClick={handleAddRecipient}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <FiPlus size={18} /> Add
              </button>
            </div>

            {/* Added Recipients */}
            {formData.to.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.to.map((recipient, index) => (
                  <div
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    {recipient.email}
                    <button
                      onClick={() => handleRemoveRecipient(index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              placeholder="Email subject..."
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            />
          </div>

          {/* Templates Selector */}
          {templates.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Or Use Template
              </label>
              <select
                onChange={(e) => {
                  const template = templates.find(t => t._id === e.target.value);
                  if (template) handleTemplateSelect(template);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="">Select a template...</option>
                {templates.map(template => (
                  <option key={template._id} value={template._id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Body */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Message
            </label>
            <textarea
              placeholder="Write your email message..."
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-64 font-mono text-sm bg-white text-gray-900"
            />
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Preview</h3>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-sm text-gray-600">
                  <strong>To:</strong> {formData.to.map(r => r.email).join(', ')}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Subject:</strong> {formData.subject}
                </p>
                <div className="mt-2 text-sm whitespace-pre-wrap bg-white p-2 rounded">
                  {formData.body}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            {showPreview ? 'Hide Preview' : 'Preview'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSendEmail}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <FiSend size={18} />
            {loading ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailComposer;
