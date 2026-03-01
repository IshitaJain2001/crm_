import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MeetingScheduler from '../components/MeetingScheduler';
import MeetingSchedulerWithTeam from '../components/MeetingSchedulerWithTeam';
import toast from 'react-hot-toast';
import { FiCalendar, FiX, FiCheck, FiUsers } from 'react-icons/fi';
// eslint-disable-next-line no-unused-vars
import { FiEdit2 } from 'react-icons/fi';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Meetings = () => {
  const token = useSelector(state => state.auth.token);
  const user = useSelector(state => state.auth.user);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <Header title="Meetings" />

        <div className="p-6">
          {/* Schedule Buttons */}
          <div className="mb-6 flex gap-4">
            <button
              onClick={() => setShowScheduler(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-semibold"
            >
              <FiCalendar size={20} /> Schedule Meeting
            </button>
            {user?.role === 'superadmin' && (
              <button
                onClick={() => setShowTeamScheduler(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-semibold"
              >
                <FiUsers size={20} /> Schedule Team Meeting
              </button>
            )}
          </div>

          {/* Meeting Scheduler Modals */}
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

          {/* Upcoming Meetings */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Meetings</h2>
            
            {upcomingMeetings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <FiCalendar size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No upcoming meetings</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {upcomingMeetings.map((meeting) => (
                  <div
                    key={meeting._id}
                    onClick={() => {
                      setSelectedMeeting(meeting);
                      setShowDetails(true);
                    }}
                    className="bg-white rounded-lg shadow p-4 hover:shadow-md cursor-pointer transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{meeting.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {getMeetingTypeIcon(meeting.meetingType)} {meeting.meetingType}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusColor(meeting.status)}`}>
                        {meeting.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-700">
                        <strong>When:</strong> {new Date(meeting.startTime).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Duration:</strong> {meeting.duration} minutes
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Attendees:</strong> {meeting.attendees.length}
                      </p>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t">
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

          {/* Past Meetings */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Past Meetings</h2>
            
            {pastMeetings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">No past meetings</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow divide-y">
                {pastMeetings.map((meeting) => (
                  <div
                    key={meeting._id}
                    onClick={() => {
                      setSelectedMeeting(meeting);
                      setShowDetails(true);
                    }}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
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

      {/* Meeting Details Modal */}
      {showDetails && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedMeeting.title}</h2>
              <button onClick={() => setShowDetails(false)}>
                <FiX size={24} className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Start Time</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(selectedMeeting.startTime).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">End Time</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(selectedMeeting.endTime).toLocaleString()}
                </p>
              </div>

              {selectedMeeting.description && (
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-900">{selectedMeeting.description}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Attendees</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedMeeting.attendees.map((attendee, index) => (
                    <div key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {attendee.email}
                    </div>
                  ))}
                </div>
              </div>

              {selectedMeeting.meetingLink && (
                <div>
                  <p className="text-sm text-gray-600">Meeting Link</p>
                  <a href={selectedMeeting.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {selectedMeeting.meetingLink}
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
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
