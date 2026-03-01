import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchContacts, createContact, deleteContact } from '../store/contactsSlice';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Contacts = () => {
  const dispatch = useDispatch();
  const { contacts, loading } = useSelector(state => state.contacts);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: ''
  });

  useEffect(() => {
    dispatch(fetchContacts({ page: 1, limit: 20 }));
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      await dispatch(createContact(formData)).unwrap();
      toast.success('Contact created successfully');
      setFormData({ firstName: '', lastName: '', email: '', phone: '', jobTitle: '' });
      setShowForm(false);
    } catch (error) {
      toast.error('Failed to create contact');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await dispatch(deleteContact(id)).unwrap();
        toast.success('Contact deleted');
      } catch (error) {
        toast.error(error?.message || 'Failed to delete contact');
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <Header title="Contacts" />
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">All Contacts</h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <FiPlus />
              <span>Add Contact</span>
            </button>
          </div>

          {showForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h4 className="text-lg font-semibold mb-4">New Contact</h4>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name *"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name *"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  name="jobTitle"
                  placeholder="Job Title"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                  >
                    Save Contact
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Job Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No contacts yet. Create one to get started.
                      </td>
                    </tr>
                  ) : (
                    contacts.map((contact) => (
                      <tr key={contact._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {contact.firstName} {contact.lastName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{contact.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{contact.phone || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{contact.jobTitle || '-'}</td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDelete(contact._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contacts;
