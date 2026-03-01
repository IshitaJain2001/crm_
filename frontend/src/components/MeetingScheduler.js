import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiCalendar, FiX, FiPlus } from 'react-icons/fi';
// eslint-disable-next-line no-unused-vars
import { FiTrash2 } from 'react-icons/fi';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const MeetingScheduler = ({ isOpen, onClose, contactEmail, contactName, onSuccess }) => {
  const token = useSelector(state => state.auth.token);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    attendees: [],
    location: '',
    meetingType: 'video',
    meetingLink: '',
    syncToCalendar: true
  });

  const [attendeeInput, setAttendeeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [showSlots, setShowSlots] = useState(false);

  useEffect(() => {
    if (isOpen && contactEmail) {
      setFormData(prev => ({
        ...prev,
        attendees: [{ email: contactEmail, name: contactName }]
      }));
    }
  }, [isOpen, contactEmail, contactName]);

  const handleAddAttendee = () => {
    if (attendeeInput.trim()) {
      const emails = attendeeInput.split(/[,;]/).map(e => e.trim()).filter(e => e);
      const newAttendees = emails.map(email => ({
        email,
        name: ''
      }));
      setFormData({
        ...formData,
        attendees: [...formData.attendees, ...newAttendees]
      });
      setAttendeeInput('');
    }
  };

  const handleRemoveAttendee = (index) => {
    setFormData({
      ...formData,
      attendees: formData.attendees.filter((_, i) => i !== index)
    });
  };

  const handleGetAvailableSlots = async () => {
    if (!formData.startTime || !formData.endTime) {
      toast.error('Please set start and end date range');
      return;
    }

    setLoading(true);
    try {
      const startDate = new Date(formData.startTime);
      const endDate = new Date(formData.endTime);

      const response = await axios.post(
        `${API_URL}/api/meetings/available-slots`,
        {
          startDate,
          endDate,
          duration: 60
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setAvailableSlots(response.data.availableSlots || []);
      setShowSlots(true);
      toast.success(`Found ${response.data.totalSlots} available slots`);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Failed to fetch available slots');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = (slot) => {
    setFormData({
      ...formData,
      startTime: slot.start.toISOString().slice(0, 16),
      endTime: slot.end.toISOString().slice(0, 16)
    });
    setShowSlots(false);
  };

  const handleScheduleMeeting = async () => {
    // Validate
    if (!formData.title.trim()) {
      toast.error('Meeting title is required');
      return;
    }

    if (formData.attendees.length === 0) {
      toast.error('Add at least one attendee');
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      toast.error('Start and end times are required');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/meetings`,
        {
          title: formData.title,
          description: formData.description,
          startTime: new Date(formData.startTime),
          endTime: new Date(formData.endTime),
          attendees: formData.attendees,
          location: formData.location,
          meetingType: formData.meetingType,
          meetingLink: formData.meetingLink,
          syncToCalendar: formData.syncToCalendar
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Meeting scheduled successfully!');

      if (onSuccess) {
        onSuccess(response.data);
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        attendees: contactEmail ? [{ email: contactEmail, name: contactName }] : [],
        location: '',
        meetingType: 'video',
        meetingLink: '',
        syncToCalendar: true
      });
      onClose();

    } catch (error) {
      console.error('Error scheduling meeting:', error);
      toast.error(error.response?.data?.error || 'Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiCalendar size={28} /> Schedule Meeting
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Meeting Title *
            </label>
            <input
              type="text"
              placeholder="Team Sync, Sales Call, etc."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              placeholder="Add meeting notes or agenda..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
            />
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Attendees *
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="email"
                placeholder="Add attendee email..."
                value={attendeeInput}
                onChange={(e) => setAttendeeInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddAttendee()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAddAttendee}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <FiPlus size={18} /> Add
              </button>
            </div>

            {formData.attendees.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.attendees.map((attendee, index) => (
                  <div
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    {attendee.email}
                    <button
                      onClick={() => handleRemoveAttendee(index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Find Available Slots */}
          <button
            onClick={handleGetAvailableSlots}
            className="w-full px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 font-semibold"
          >
            Find Available Slots
          </button>

          {/* Available Slots */}
          {showSlots && availableSlots.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Available Slots</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {availableSlots.slice(0, 10).map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectSlot(slot)}
                    className="p-3 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition text-left"
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(slot.start).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(slot.end).toLocaleTimeString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Meeting Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Meeting Type
            </label>
            <select
              value={formData.meetingType}
              onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="video">Video Call</option>
              <option value="phone">Phone Call</option>
              <option value="in-person">In-Person</option>
              <option value="virtual">Virtual</option>
            </select>
          </div>

          {/* Location / Meeting Link */}
          {formData.meetingType === 'in-person' ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                placeholder="Conference room, address, etc."
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Meeting Link (Zoom, Google Meet, etc.)
              </label>
              <input
                type="url"
                placeholder="https://zoom.us/j/..."
                value={formData.meetingLink}
                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Sync to Calendar */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="syncCalendar"
              checked={formData.syncToCalendar}
              onChange={(e) => setFormData({ ...formData, syncToCalendar: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="syncCalendar" className="text-sm text-gray-700">
              Sync to Google Calendar
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleScheduleMeeting}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <FiCalendar size={18} />
            {loading ? 'Scheduling...' : 'Schedule Meeting'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingScheduler;
