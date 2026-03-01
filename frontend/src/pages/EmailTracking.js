import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import EmailComposer from '../components/EmailComposer';
import toast from 'react-hot-toast';
import { FiMail, FiBarChart2, FiEye, FiMousePointer } from 'react-icons/fi';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const EmailTracking = () => {
  const token = useSelector(state => state.auth.token);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [page, setPage] = useState(1);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/emails/history?page=1&limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setEmails(response.data.emails || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast.error('Failed to load email history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchEmails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchAnalytics = async (emailId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/emails/${emailId}/analytics`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setAnalytics(response.data);
      setSelectedEmail(emailId);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load email analytics');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      sent: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      bounced: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <Header title="Email Tracking" />

        <div className="p-6">
          {/* Send Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowComposer(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold"
            >
              <FiMail size={20} /> Compose Email
            </button>
          </div>

          {/* Email Composer Modal */}
          <EmailComposer
            isOpen={showComposer}
            onClose={() => setShowComposer(false)}
            onSuccess={() => {
              fetchEmails();
            }}
          />

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Email List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-bold text-gray-800">Email History</h2>
                </div>

                {loading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                ) : emails.length === 0 ? (
                  <div className="p-12 text-center">
                    <FiMail size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No emails sent yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {emails.map((email) => (
                      <div
                        key={email._id}
                        onClick={() => fetchAnalytics(email._id)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                          selectedEmail === email._id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{email.subject}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              To: {email.to.map(t => t.email).join(', ')}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusBadge(email.status)}`}>
                                {email.status.toUpperCase()}
                              </span>
                              {email.opens.count > 0 && (
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">
                                  <FiEye className="inline mr-1" size={12} />
                                  {email.opens.count} opens
                                </span>
                              )}
                              {email.clicks.count > 0 && (
                                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 font-semibold">
                                  <FiMousePointer className="inline mr-1" size={12} />
                                  {email.clicks.count} clicks
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {new Date(email.sentAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Analytics Panel */}
            {analytics && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FiBarChart2 size={24} /> Analytics
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  
                  {/* Subject */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Subject</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{analytics.subject}</p>
                  </div>

                  {/* Recipients */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Recipients</p>
                    <p className="text-sm text-gray-700 mt-1">{analytics.to.length} recipient(s)</p>
                  </div>

                  {/* Engagement Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FiEye className="text-blue-600" size={20} />
                        <div>
                          <p className="text-xs text-gray-600">Opens</p>
                          <p className="text-2xl font-bold text-blue-600">{analytics.opens.count}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Open Rate: {analytics.engagement.openRate}
                      </p>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FiMousePointer className="text-purple-600" size={20} />
                        <div>
                          <p className="text-xs text-gray-600">Clicks</p>
                          <p className="text-2xl font-bold text-purple-600">{analytics.clicks.count}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Click Rate: {analytics.engagement.clickRate}
                      </p>
                    </div>
                  </div>

                  {/* Top Links */}
                  {analytics.clicks.topLinks && analytics.clicks.topLinks.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Top Clicked Links</p>
                      <div className="space-y-2">
                        {analytics.clicks.topLinks.map((link, index) => (
                          <div key={index} className="text-xs">
                            <p className="text-gray-700 truncate">{link.link}</p>
                            <p className="text-gray-500">{link.clicks} clicks</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sent At */}
                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-500">Sent on</p>
                    <p className="text-sm text-gray-700 mt-1">
                      {new Date(analytics.sentAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTracking;
