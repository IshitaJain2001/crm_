import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import { FaPlus, FaTrash } from 'react-icons/fa';

const SimpleChat = () => {
  const { isDark } = useTheme();
  const [userRole, setUserRole] = useState('employee');
  const [chatbot, setChatbot] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const API_URL = 'https://crm-1-5el5.onrender.com';
  const token = localStorage.getItem('token');

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(userInfo.role || 'employee');
    initializeChatbot();
  }, []);

  const initializeChatbot = async () => {
    try {
      // Check if chatbot exists
      const response = await axios.get(`${API_URL}/api/chatbots`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.chatbots.length > 0) {
        const existingChatbot = response.data.chatbots[0];
        setChatbot(existingChatbot);
        setFaqs(existingChatbot.faqs || []);
      } else {
        // Create default chatbot
        const newBot = await axios.post(
          `${API_URL}/api/chatbots`,
          {
            name: 'Employee Support',
            description: 'Q&A for employees',
            welcomeMessage: 'Hello! Ask your questions.',
            initialPrompt: 'What do you want to know?',
            widget: { theme: 'light', position: 'bottom-right', headerText: 'Chat' }
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setChatbot(newBot.data.chatbot);
        setFaqs([]);
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleAddFAQ = async (e) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      toast.error('Question and answer required');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/chatbots/${chatbot._id}/faq`,
        { question, answer },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFaqs(response.data.faqs);
      setQuestion('');
      setAnswer('');
      toast.success('Q&A added');
    } catch (error) {
      toast.error('Failed to add Q&A');
    }
  };

  const handleDeleteFAQ = async (faqId) => {
    if (!window.confirm('Delete?')) return;

    try {
      const response = await axios.delete(
        `${API_URL}/api/chatbots/${chatbot._id}/faq/${faqId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFaqs(response.data.faqs);
      toast.success('Deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return <div className={`flex items-center justify-center h-screen ${isDark ? 'bg-gray-900' : ''}`}><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
  }

  // ADMIN VIEW
  if (userRole === 'superadmin' || userRole === 'admin') {
    return (
      <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Employee Support</h1>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Manage questions and answers for your team</p>
          </div>

          {/* Add Q&A Section */}
          <div className={`rounded-2xl shadow-lg p-8 mb-8 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-blue-100'}`}>
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                 <FaPlus className="text-white" size={20} />
               </div>
               <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Add New Question</h2>
             </div>
             
             <form onSubmit={handleAddFAQ} className="space-y-5">
               <div>
                 <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Question</label>
                 <input
                   type="text"
                   value={question}
                   onChange={(e) => setQuestion(e.target.value)}
                   placeholder="e.g., How to reset my password?"
                   className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200 bg-gray-50 text-gray-900'}`}
                 />
               </div>
               <div>
                 <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Answer</label>
                 <textarea
                   value={answer}
                   onChange={(e) => setAnswer(e.target.value)}
                   placeholder="e.g., Go to Settings > Change Password > Enter new password"
                   rows="4"
                   className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-200 bg-gray-50 text-gray-900'}`}
                 />
               </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-xl font-semibold transition shadow-md hover:shadow-lg"
              >
                Add Question & Answer
              </button>
            </form>
          </div>

          {/* Q&A List */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">All Q&As ({faqs.length})</h2>
            </div>

            {faqs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center border border-gray-100">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-gray-500 text-lg">No questions added yet</p>
                <p className="text-gray-400 text-sm mt-1">Add your first question above</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {faqs.map((faq, idx) => (
                  <div
                    key={faq._id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-gray-100 p-6 transition transform hover:scale-[1.02]"
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-lg mb-2">❓ {faq.question}</p>
                        <p className="text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">
                          ✅ {faq.answer}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteFAQ(faq._id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                        title="Delete"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // EMPLOYEE VIEW
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Ask & Answer</h1>
          <p className="text-gray-600 text-lg">Find answers to common questions</p>
        </div>

        {faqs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-blue-100">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500 text-xl font-medium">No questions available yet</p>
            <p className="text-gray-400 mt-2">Check back soon for answers to common questions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={faq._id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 overflow-hidden cursor-pointer transition transform hover:scale-[1.01]"
                onClick={() => setExpandedFAQ(expandedFAQ === faq._id ? null : faq._id)}
              >
                <div className="p-6">
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        <span>❓</span>
                        {faq.question}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {expandedFAQ === faq._id ? 'Click to collapse' : 'Click to expand'}
                      </p>
                    </div>
                    <div className="text-blue-500 text-xl transition transform" style={{transform: expandedFAQ === faq._id ? 'rotate(180deg)' : 'rotate(0deg)'}}>
                      ▼
                    </div>
                  </div>

                  {expandedFAQ === faq._id && (
                    <div className="mt-4 ml-14 pt-4 border-t border-gray-200">
                      <p className="text-gray-700 leading-relaxed flex gap-3">
                        <span className="text-green-500 text-xl flex-shrink-0">✅</span>
                        <span>{faq.answer}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {faqs.length > 0 && (
          <div className="mt-10 text-center">
            <p className="text-gray-500 text-sm">
              Total questions available: <span className="font-bold text-gray-900">{faqs.length}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleChat;
