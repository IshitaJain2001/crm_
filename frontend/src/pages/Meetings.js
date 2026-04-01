import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MeetingScheduler from '../components/MeetingScheduler';
import MeetingSchedulerWithTeam from '../components/MeetingSchedulerWithTeam';
import toast from 'react-hot-toast';
import { FiCalendar, FiX, FiCheck, FiUsers } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useLayout } from '../context/LayoutContext';
import { isCompanyLead } from '../utils/roles';
import { API_URL } from '../config/api';

const Meetings = () => {
  const token = useSelector(state => state.auth.token);
  const user = useSelector(state => state.auth.user);
  const { isDark } = useTheme();
  const { sidebarOpen } = useLayout();
  const [meetings, setMeetings] = useState([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showTeamScheduler, setShowTeamScheduler] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchMeetings = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/meetings?page=1&limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setMeetings(response.data.meetings || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meetings');
    }
  };

  useEffect(() => {
    if (token) {
      fetchMeetings();
    }
  }, [token]);

  const handleCancelMeeting = async (meetingId) => {
    if (!window.confirm('Are you sure you want to cancel this meeting?')) {
      return;
    }

    try {
      await axios.patch(
        `${API_URL}/api/meetings/${meetingId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Meeting cancelled');
      fetchMeetings();
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      toast.error('Failed to cancel meeting');
    }
  };

  const handleCompleteMeeting = async (meetingId) => {
    try {
      await axios.patch(
        `${API_URL}/api/meetings/${meetingId}/complete`,
        { notes: '' },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Meeting marked as completed');
      fetchMeetings();
    } catch (error) {
      console.error('Error completing meeting:', error);
      toast.error('Failed to complete meeting');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
      rescheduled: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getMeetingTypeIcon = (type) => {
    const icons = {
      video: '📹',
      phone: '📞',
      'in-person': '👥',
      virtual: '🌐'
    };
    return icons[type] || '📅';
  };

  const upcomingMeetings = meetings.filter(m => new Date(m.startTime) > new Date() && m.status === 'scheduled');
  const pastMeetings = meetings.filter(m => new Date(m.startTime) <= new Date() || m.status === 'completed');

  return (
    <div className={`h-screen w-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Sidebar />

      <div className={`absolute top-0 bottom-0 left-64 right-0 flex flex-col overflow-hidden transition-all duration-300`}>
        <Header title="Meetings" />

        <div className={`flex-1 overflow-auto ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
          <div className={`max-w-5xl mx-auto px-6 py-6 mt-16 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
            {/* Action Buttons */}
            <div className="mb-6 flex gap-3">
              <button
                onClick={() => setShowScheduler(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold text-sm transition"
              >
                <FiCalendar size={18} /> New Meeting
              </button>
              {isCompanyLead(user?.role) && (
                <button
                  onClick={() => setShowTeamScheduler(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-semibold text-sm transition"
                >
                  <FiUsers size={18} /> Team Meeting
                </button>
              )}
            </div>

            {/* Modals */}
            <MeetingScheduler
              isOpen={showScheduler}
              onClose={() => setShowScheduler(false)}
              onSuccess={() => fetchMeetings()}
            />

            <MeetingSchedulerWithTeam
              isOpen={showTeamScheduler}
              onClose={() => setShowTeamScheduler(false)}
              onSuccess={() => fetchMeetings()}
            />

            {/* Upcoming Meetings Section */}
            <div className="mb-8">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Upcoming Meetings</h3>
              
              {upcomingMeetings.length === 0 ? (
                <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg p-12 text-center`}>
                  <FiCalendar size={48} className={`mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No upcoming meetings</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingMeetings.map((meeting) => (
                    <div
                      key={meeting._id}
                      onClick={() => {
                        setSelectedMeeting(meeting);
                        setShowDetails(true);
                      }}
                      className={`${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} rounded-lg p-4 cursor-pointer transition border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{meeting.title}</h3>
                          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {getMeetingTypeIcon(meeting.meetingType)} {meeting.meetingType}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusColor(meeting.status)}`}>
                          {meeting.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          <strong>When:</strong> {new Date(meeting.startTime).toLocaleString()}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          <strong>Duration:</strong> {meeting.duration} minutes
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          <strong>Attendees:</strong> {meeting.attendees.length}
                        </p>
                      </div>

                      <div className={`flex gap-2 mt-4 pt-4 ${isDark ? 'border-gray-700' : 'border-gray-200'} border-t`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteMeeting(meeting._id);
                          }}
                          className="flex-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-semibold flex items-center justify-center gap-1"
                        >
                          <FiCheck size={16} /> Complete
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelMeeting(meeting._id);
                          }}
                          className="flex-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-semibold flex items-center justify-center gap-1"
                        >
                          <FiX size={16} /> Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Meetings Section */}
            <div className="mt-8 pt-8 border-t" style={{borderColor: isDark ? '#374151' : '#e5e7eb'}}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Past Meetings</h3>
              
              {pastMeetings.length === 0 ? (
                <p className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No past meetings</p>
              ) : (
                <div className="space-y-3">
                  {pastMeetings.map((meeting) => (
                    <div
                      key={meeting._id}
                      onClick={() => {
                        setSelectedMeeting(meeting);
                        setShowDetails(true);
                      }}
                      className={`${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} rounded-lg p-4 cursor-pointer transition border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{meeting.title}</h3>
                          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {new Date(meeting.startTime).toLocaleDateString()} at {new Date(meeting.startTime).toLocaleTimeString()}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusColor(meeting.status)}`}>
                          {meeting.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Meeting Details Modal */}
      {showDetails && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-2xl p-6`}>
            <div className="flex justify-between items-start mb-4">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedMeeting.title}</h2>
              <button onClick={() => setShowDetails(false)}>
                <FiX size={24} className={isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Start Time</p>
                <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {new Date(selectedMeeting.startTime).toLocaleString()}
                </p>
              </div>

              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>End Time</p>
                <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {new Date(selectedMeeting.endTime).toLocaleString()}
                </p>
              </div>

              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Type</p>
                <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {getMeetingTypeIcon(selectedMeeting.meetingType)} {selectedMeeting.meetingType}
                </p>
              </div>

              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Attendees ({selectedMeeting.attendees.length})</p>
                <div className="flex gap-2 flex-wrap mt-2">
                  {selectedMeeting.attendees.map((attendee) => (
                    <span key={attendee._id} className={`text-sm px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
                      {attendee.name || attendee.email}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t" style={{borderColor: isDark ? '#374151' : '#e5e7eb'}}>
              <button
                onClick={() => {
                  handleCompleteMeeting(selectedMeeting._id);
                  setShowDetails(false);
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition"
              >
                Mark Complete
              </button>
              <button
                onClick={() => {
                  handleCancelMeeting(selectedMeeting._id);
                  setShowDetails(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition"
              >
                Cancel Meeting
              </button>
              <button
                onClick={() => setShowDetails(false)}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meetings;
