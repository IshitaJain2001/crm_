import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDeals, createDeal, deleteDeal } from '../store/dealsSlice';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CompanySelector from '../components/CompanySelector';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const Deals = () => {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const { deals, loading } = useSelector(state => state.deals);
  const token = useSelector(state => state.auth.token);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    dealName: '',
    company: '',
    amount: '',
    dealStage: 'initial_contact',
    expectedCloseDate: ''
  });

  useEffect(() => {
    dispatch(fetchDeals({ page: 1, limit: 20 }));
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.dealName || !formData.company || !formData.amount) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      await dispatch(createDeal({
        ...formData,
        amount: parseFloat(formData.amount)
      })).unwrap();
      toast.success('Deal created successfully');
      setFormData({ dealName: '', company: '', amount: '', dealStage: 'initial_contact', expectedCloseDate: '' });
      setShowForm(false);
    } catch (error) {
      toast.error('Failed to create deal');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      try {
        await dispatch(deleteDeal(id)).unwrap();
        toast.success('Deal deleted');
      } catch (error) {
        toast.error(error?.message || 'Failed to delete deal');
      }
    }
  };

  const getStageColor = (stage) => {
    const lightColors = {
      initial_contact: 'bg-blue-100 text-blue-800',
      proposal_sent: 'bg-yellow-100 text-yellow-800',
      negotiation: 'bg-purple-100 text-purple-800',
      review: 'bg-pink-100 text-pink-800',
      decision_makers_bought_in: 'bg-green-100 text-green-800'
    };
    const darkColors = {
      initial_contact: 'bg-blue-900 text-blue-300',
      proposal_sent: 'bg-yellow-900 text-yellow-300',
      negotiation: 'bg-purple-900 text-purple-300',
      review: 'bg-pink-900 text-pink-300',
      decision_makers_bought_in: 'bg-green-900 text-green-300'
    };
    const colorMap = isDark ? darkColors : lightColors;
    return colorMap[stage] || (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800');
  };

  return (
    <div className={`h-screen w-screen ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <Sidebar />
      
      <div className={`absolute top-0 bottom-0 left-64 right-0 flex flex-col overflow-hidden transition-all duration-300`}>
        <Header title="Sales Pipeline" />
        
        <div className={`flex-1 overflow-auto ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="p-6 mx-auto w-7/10 mt-16">
          <div className="flex justify-between items-center mb-6">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>Active Deals</h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <FiPlus />
              <span>New Deal</span>
            </button>
          </div>

          {showForm && (
            <div className={`rounded-lg shadow p-6 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Create Deal</h4>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <input
                   type="text"
                   name="dealName"
                   placeholder="Deal Name *"
                   value={formData.dealName}
                   onChange={handleChange}
                   className={`px-4 py-2 border rounded-lg focus:outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500'}`}
                 />
                 <CompanySelector
                   token={token}
                   selectedCompanyId={formData.company}
                   onChange={(id) => setFormData(prev => ({ ...prev, company: id }))}
                   label="Company *"
                 />
                 <input
                   type="number"
                   name="amount"
                   placeholder="Amount *"
                   value={formData.amount}
                   onChange={handleChange}
                   className={`px-4 py-2 border rounded-lg focus:outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500'}`}
                 />
                 <select
                   name="dealStage"
                   value={formData.dealStage}
                   onChange={handleChange}
                   className={`px-4 py-2 border rounded-lg focus:outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-400' : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'}`}
                 >
                   <option value="initial_contact">Initial Contact</option>
                   <option value="proposal_sent">Proposal Sent</option>
                   <option value="negotiation">Negotiation</option>
                   <option value="review">Review</option>
                   <option value="decision_makers_bought_in">Decision Makers Bought In</option>
                 </select>
                 <input
                   type="date"
                   name="expectedCloseDate"
                   value={formData.expectedCloseDate}
                   onChange={handleChange}
                   className={`px-4 py-2 border rounded-lg focus:outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500'}`}
                 />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                  >
                    Create Deal
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
            <div className={`rounded-lg shadow overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <table className="w-full">
                <thead className={`border-b ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Deal Name</th>
                    <th className={`px-6 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Amount</th>
                    <th className={`px-6 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Stage</th>
                    <th className={`px-6 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Close Date</th>
                    <th className={`px-6 py-3 text-left text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                   {deals.length === 0 ? (
                     <tr>
                       <td colSpan="5" className={`px-6 py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                         No deals yet. Create one to get started.
                       </td>
                     </tr>
                   ) : (
                     deals.map((deal) => (
                       <tr key={deal._id} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                         <td className={`px-6 py-4 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{deal.dealName}</td>
                         <td className={`px-6 py-4 text-sm font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                           ${deal.amount.toLocaleString()}
                         </td>
                         <td className="px-6 py-4 text-sm">
                           <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStageColor(deal.dealStage)}`}>
                             {deal.dealStage.replace(/_/g, ' ').toUpperCase()}
                           </span>
                         </td>
                         <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                           {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : '-'}
                         </td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          <button className={isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'}>
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDelete(deal._id)}
                            className={isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'}
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
    </div>
  );
};

export default Deals;
