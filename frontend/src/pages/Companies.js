import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCompanies, createCompany, deleteCompany } from '../store/companiesSlice';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Companies = () => {
  const dispatch = useDispatch();
  const { companies, loading } = useSelector(state => state.companies);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    industry: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    dispatch(fetchCompanies({ page: 1, limit: 20 }));
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Company name is required');
      return;
    }

    try {
      await dispatch(createCompany(formData)).unwrap();
      toast.success('Company created successfully');
      setFormData({ name: '', website: '', industry: '', phone: '', email: '' });
      setShowForm(false);
    } catch (error) {
      toast.error('Failed to create company');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        await dispatch(deleteCompany(id)).unwrap();
        toast.success('Company deleted');
      } catch (error) {
        toast.error(error?.message || 'Failed to delete company');
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <Header title="Client Companies" />
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">All Client Companies</h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <FiPlus />
              <span>Add Client Company</span>
            </button>
          </div>

          {showForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h4 className="text-lg font-semibold mb-4">Add New Client Company</h4>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Company Name *"
                  value={formData.name}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  name="website"
                  placeholder="Website"
                  value={formData.website}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  name="industry"
                  placeholder="Industry"
                  value={formData.industry}
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
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                  >
                    Save Company
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
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Company Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Website</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Industry</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No client companies yet. Add one to get started.
                      </td>
                    </tr>
                  ) : (
                    companies.map((company) => (
                      <tr key={company._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{company.name}</td>
                        <td className="px-6 py-4 text-sm text-blue-600">
                          {company.website ? (
                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {company.website}
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{company.industry || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{company.phone || '-'}</td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDelete(company._id)}
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

export default Companies;
