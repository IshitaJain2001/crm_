import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getAuthToken, parseAuthUser } from '../utils/authStorage';
import { isCompanyLead } from '../utils/roles';
import { API_URL } from '../config/api';
import { FaComments, FaPlus, FaEdit, FaTrash, FaCopy, FaEye, FaEyeSlash } from 'react-icons/fa';

const Chatbots = () => {
  const [chatbots, setChatbots] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [selectedChatbot, setSelectedChatbot] = useState(null);
  const [editingChatbot, setEditingChatbot] = useState(null);
  const [userRole, setUserRole] = useState('employee');
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [newFAQ, setNewFAQ] = useState({ question: '', answer: '' });
  const [chatbotFAQs, setChatbotFAQs] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    question: '',
    answer: '',
    welcomeMessage: 'Hello! How can I help you today?',
    initialPrompt: 'Please tell us what you need.',
    widget: {
      theme: 'light',
      position: 'bottom-right',
      headerText: 'Chat with us'
    }
  });

  const token = getAuthToken();

  useEffect(() => {
    const userInfo = parseAuthUser() || {};
    setUserRole(userInfo.role || 'employee');
    fetchChatbots();
  }, []);

  const fetchChatbots = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/chatbots`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatbots(response.data.chatbots);
    } catch (error) {
      toast.error('Failed to fetch chatbots');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async (chatbotId) => {
    try {
      const response = await axios.get(`${API_URL}/api/conversations/chatbot/${chatbotId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data.conversations);
      setShowConversations(true);
    } catch (error) {
      toast.error('Failed to fetch conversations');
      console.error(error);
    }
  };

  const handleCreateChatbot = async (e) => {
    e.preventDefault();
    try {
      if (!formData.name.trim()) {
        toast.error('Chatbot name is required');
        return;
      }

      // Create chatbot with Q&A
      const chatbotData = {
        name: formData.name,
        description: formData.description,
        welcomeMessage: formData.welcomeMessage,
        initialPrompt: formData.initialPrompt,
        widget: formData.widget
      };

      const response = await axios.post(`${API_URL}/api/chatbots`, chatbotData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Add Q&A if provided
      if (formData.question && formData.answer) {
        await axios.post(
          `${API_URL}/api/chatbots/${response.data.chatbot._id}/faq`,
          { question: formData.question, answer: formData.answer },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      toast.success('Chatbot created successfully');
      setChatbots([response.data.chatbot, ...chatbots]);
      setFormData({
        name: '',
        description: '',
        question: '',
        answer: '',
        welcomeMessage: 'Hello! How can I help you today?',
        initialPrompt: 'Please tell us what you need.',
        widget: {
          theme: 'light',
          position: 'bottom-right',
          headerText: 'Chat with us'
        }
      });
      setShowCreateModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create chatbot');
      console.error(error);
    }
  };

  const handleUpdateChatbot = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `${API_URL}/api/chatbots/${editingChatbot._id}`,
        {
          name: formData.name,
          description: formData.description,
          welcomeMessage: formData.welcomeMessage,
          initialPrompt: formData.initialPrompt,
          widget: formData.widget
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Chatbot updated successfully');
      setChatbots(chatbots.map(bot => bot._id === editingChatbot._id ? response.data.chatbot : bot));
      setEditingChatbot(null);
      setShowCreateModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update chatbot');
      console.error(error);
    }
  };

  const handleDeleteChatbot = async (botId) => {
    if (!window.confirm('Are you sure you want to delete this chatbot?')) return;

    try {
      await axios.delete(`${API_URL}/api/chatbots/${botId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Chatbot deleted');
      setChatbots(chatbots.filter(bot => bot._id !== botId));
    } catch (error) {
      toast.error('Failed to delete chatbot');
      console.error(error);
    }
  };

  const handleToggleStatus = async (botId, currentStatus) => {
    try {
      const response = await axios.patch(
        `${API_URL}/api/chatbots/${botId}/toggle-status`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success(`Chatbot ${response.data.chatbot.status}`);
      setChatbots(chatbots.map(bot => bot._id === botId ? response.data.chatbot : bot));
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const handleGetEmbedCode = async (botId) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/chatbots/${botId}/embed-code`,
        { domain: window.location.hostname },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Copy to clipboard
      await navigator.clipboard.writeText(response.data.embedCode);
      toast.success('Embed code copied to clipboard!');
    } catch (error) {
      toast.error('Failed to get embed code');
      console.error(error);
    }
  };

  const fetchChatbotFAQs = async (botId) => {
    try {
      const response = await axios.get(`${API_URL}/api/chatbots/${botId}/faq`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatbotFAQs(response.data.faqs || []);
    } catch (error) {
      toast.error('Failed to fetch FAQs');
      console.error(error);
    }
  };

  const handleAddFAQ = async (e) => {
    e.preventDefault();
    if (!newFAQ.question.trim() || !newFAQ.answer.trim()) {
      toast.error('Question and answer are required');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/chatbots/${selectedChatbot}/faq`,
        newFAQ,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('FAQ added successfully');
      setChatbotFAQs(response.data.faqs);
      setNewFAQ({ question: '', answer: '' });
    } catch (error) {
      toast.error('Failed to add FAQ');
      console.error(error);
    }
  };

  const handleDeleteFAQ = async (faqId) => {
    if (!window.confirm('Delete this Q&A?')) return;

    try {
      const response = await axios.delete(
        `${API_URL}/api/chatbots/${selectedChatbot}/faq/${faqId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('FAQ deleted');
      setChatbotFAQs(response.data.faqs);
    } catch (error) {
      toast.error('Failed to delete FAQ');
      console.error(error);
    }
  };

  const openEditModal = (chatbot) => {
    setEditingChatbot(chatbot);
    setFormData({
      name: chatbot.name,
      description: chatbot.description,
      welcomeMessage: chatbot.welcomeMessage,
      initialPrompt: chatbot.initialPrompt,
      widget: chatbot.widget
    });
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingChatbot(null);
    setFormData({
      name: '',
      description: '',
      welcomeMessage: 'Hello! How can I help you today?',
      initialPrompt: 'Please tell us what you need.',
      widget: {
        theme: 'light',
        position: 'bottom-right',
        headerText: 'Chat with us'
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // EMPLOYEE VIEW - Simple chat interface
  if (userRole === 'employee' || userRole === 'sales' || userRole === 'hr') {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-6">
              <FaComments size={32} className="text-blue-500" />
              Chat with Admin
            </h1>
            <p className="text-gray-600 mb-6">Ask your questions and get instant answers</p>

            {chatbots.length === 0 ? (
              <div className="text-center p-8 bg-blue-50 rounded-lg">
                <p className="text-gray-600">No support available yet. Admin will set up chatbot soon.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {chatbots.map(bot => (
                  <div key={bot._id} className="border rounded-lg p-6 hover:shadow-md transition">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{bot.name}</h3>
                    <p className="text-gray-600 mb-4">{bot.description}</p>
                    
                    {/* Questions from Admin */}
                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-semibold text-gray-700">Questions:</p>
                      {bot.faqs && bot.faqs.length > 0 ? (
                        <div className="space-y-2">
                          {bot.faqs.map((faq, idx) => (
                            <div key={idx} className="p-3 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition cursor-pointer">
                              <p className="font-medium text-gray-900">❓ {faq.question}</p>
                              <p className="text-sm text-gray-600 mt-1">✅ {faq.answer}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm italic">No questions added yet by admin</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleGetEmbedCode(bot._id)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                    >
                      Chat Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ADMIN/SUPERADMIN VIEW - Full chatbot management
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-2">
              <FaComments size={32} className="text-blue-500" />
              {isCompanyLead(userRole) ? 'Employee Support Chatbots' : 'Live Chatbots'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isCompanyLead(userRole)
                ? 'Create chatbots to help your employees with FAQs and support'
                : 'Create and manage chatbots for your website'}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingChatbot(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition"
          >
            <FaPlus size={20} />
            Create Chatbot
          </button>
        </div>

        {/* Chatbots Grid */}
        {chatbots.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <FaComments size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-4">No chatbots yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              Create Your First Chatbot
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {chatbots.map(bot => (
              <div key={bot._id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900">{bot.name}</h3>
                    {bot.description && (
                      <p className="text-gray-600 mt-1">{bot.description}</p>
                    )}
                    <div className="flex gap-3 mt-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        bot.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {bot.status === 'active' ? '🟢 Active' : '⚪ Inactive'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {bot.analytics?.totalConversations || 0} conversations
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleStatus(bot._id, bot.status)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                      title={bot.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      {bot.status === 'active' ? (
                        <FaEyeSlash size={20} className="text-gray-600" />
                      ) : (
                        <FaEye size={20} className="text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(bot)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                      title="Edit"
                    >
                      <FaEdit size={20} className="text-blue-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteChatbot(bot._id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                      title="Delete"
                    >
                      <FaTrash size={20} className="text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm text-gray-600">Theme</p>
                    <p className="font-semibold capitalize">{bot.widget?.theme || 'light'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Position</p>
                    <p className="font-semibold capitalize">{bot.widget?.position || 'bottom-right'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Auto-respond</p>
                    <p className="font-semibold">{bot.autoRespond ? '✅ Yes' : '❌ No'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Escalation</p>
                    <p className="font-semibold">{bot.escalationEnabled ? '✅ Yes' : '❌ No'}</p>
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => {
                      setSelectedChatbot(bot._id);
                      fetchConversations(bot._id);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition"
                  >
                    <FaComments size={16} />
                    View Conversations ({bot.analytics?.totalConversations || 0})
                  </button>
                  <button
                    onClick={() => handleGetEmbedCode(bot._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                  >
                    <FaCopy size={16} />
                    Copy Embed Code
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingChatbot ? 'Edit Chatbot' : 'Create New Chatbot'}
              </h2>

              <form onSubmit={editingChatbot ? handleUpdateChatbot : handleCreateChatbot} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chatbot Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Support Bot"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="What does this chatbot do?"
                    rows="3"
                  />
                </div>

                {/* Question */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., How do I reset my password?"
                  />
                </div>

                {/* Answer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Answer
                  </label>
                  <textarea
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Go to Settings > Change Password"
                    rows="2"
                  />
                </div>

                {/* Welcome Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Welcome Message
                  </label>
                  <input
                    type="text"
                    value={formData.welcomeMessage}
                    onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Message shown when chat opens"
                  />
                </div>

                {/* Initial Prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Prompt
                  </label>
                  <input
                    type="text"
                    value={formData.initialPrompt}
                    onChange={(e) => setFormData({ ...formData, initialPrompt: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="First question to ask visitor"
                  />
                </div>

                {/* Widget Settings */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Widget Appearance</h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Theme */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme
                      </label>
                      <select
                        value={formData.widget.theme}
                        onChange={(e) => setFormData({
                          ...formData,
                          widget: { ...formData.widget, theme: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </div>

                    {/* Position */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Position
                      </label>
                      <select
                        value={formData.widget.position}
                        onChange={(e) => setFormData({
                          ...formData,
                          widget: { ...formData.widget, position: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="top-left">Top Left</option>
                      </select>
                    </div>
                  </div>

                  {/* Header Text */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Widget Header Text
                    </label>
                    <input
                      type="text"
                      value={formData.widget.headerText}
                      onChange={(e) => setFormData({
                        ...formData,
                        widget: { ...formData.widget, headerText: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Chat with us"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 justify-end border-t pt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                  >
                    {editingChatbot ? 'Update Chatbot' : 'Create Chatbot'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Conversations Modal */}
      {showConversations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Conversations</h2>
                <button
                  onClick={() => setShowConversations(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {conversations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No conversations yet</p>
              ) : (
                <div className="space-y-4">
                  {conversations.map(conv => (
                    <div key={conv._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{conv.visitorName || 'Anonymous'}</p>
                          <p className="text-sm text-gray-600">{conv.visitorEmail || 'No email'}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {conv.messageCount} messages • Status: <span className={`font-medium ${
                              conv.status === 'active' ? 'text-blue-600' :
                              conv.status === 'closed' ? 'text-gray-600' :
                              'text-orange-600'
                            }`}>{conv.status}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {conv.satisfactionRating ? `⭐ ${conv.satisfactionRating}/5` : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {showFAQModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Manage Q&A</h2>
                <button
                  onClick={() => setShowFAQModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Add New FAQ Form */}
              <form onSubmit={handleAddFAQ} className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-3">Add New Question & Answer</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Question..."
                    value={newFAQ.question}
                    onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    placeholder="Answer..."
                    value={newFAQ.answer}
                    onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                  >
                    Add Q&A
                  </button>
                </div>
              </form>

              {/* List of FAQs */}
              <h3 className="font-semibold mb-3">Questions ({chatbotFAQs.length})</h3>
              {chatbotFAQs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No Q&A added yet</p>
              ) : (
                <div className="space-y-3">
                  {chatbotFAQs.map(faq => (
                    <div key={faq._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{faq.question}</h4>
                        <button
                          onClick={() => handleDeleteFAQ(faq._id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                      <p className="text-gray-600 text-sm">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbots;
