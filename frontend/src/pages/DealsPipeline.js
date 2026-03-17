import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { FiPlus, FiFilter, FiList, FiGrid, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';

const DealsPipeline = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = useSelector(state => state.auth.token);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban');
  const [draggedDeal, setDraggedDeal] = useState(null);
  const [showNewDealModal, setShowNewDealModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState('initial_contact');
  const [newDeal, setNewDeal] = useState({
    dealName: '',
    company: '',
    amount: '',
    dealStage: 'initial_contact',
    expectedCloseDate: ''
  });

  const stages = [
    { id: 'initial_contact', name: 'Initial Contact', color: 'bg-gray-600' },
    { id: 'qualification', name: 'Qualification', color: 'bg-blue-600' },
    { id: 'proposal', name: 'Proposal', color: 'bg-purple-600' },
    { id: 'negotiation', name: 'Negotiation', color: 'bg-yellow-600' },
    { id: 'decision', name: 'Decision', color: 'bg-green-600' }
  ];

  useEffect(() => {
    if (token) {
      fetchDeals();
    }
  }, [token]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/deals`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 }
      });
      setDeals(response.data.deals || []);
    } catch (error) {
      console.error('Error fetching deals:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeal = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/deals`, newDeal, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeals([...deals, response.data.deal]);
      setShowNewDealModal(false);
      setNewDeal({
        dealName: '',
        company: '',
        amount: '',
        dealStage: 'initial_contact',
        expectedCloseDate: ''
      });
      toast.success('Deal created successfully');
    } catch (error) {
      console.error('Error creating deal:', error);
      toast.error('Failed to create deal');
    }
  };

  const handleDragStart = (deal) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (stageId) => {
    if (!draggedDeal) return;

    try {
      const response = await axios.put(
        `${API_URL}/api/deals/${draggedDeal._id}`,
        { dealStage: stageId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDeals(deals.map(d => d._id === draggedDeal._id ? response.data.deal : d));
      toast.success('Deal moved successfully');
    } catch (error) {
      console.error('Error moving deal:', error);
      toast.error('Failed to move deal');
    }

    setDraggedDeal(null);
  };

  const getDealsByStage = (stageId) => deals.filter(d => d.dealStage === stageId);
  const getTotalRevenue = (stageId) =>
    getDealsByStage(stageId).reduce((sum, d) => sum + (d.amount || 0), 0);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-gray-900">
        <Sidebar />
        <div className={`absolute top-0 bottom-0 left-64 right-0 flex flex-col overflow-hidden transition-all duration-300`}>
          <Header title="Pipeline" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading pipeline...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gray-900">
      <Sidebar />
      <div className={`absolute top-0 bottom-0 left-64 right-0 flex flex-col overflow-hidden transition-all duration-300`}>
        <Header title="Pipeline" />
        <div className="flex-1 overflow-auto bg-gray-900">
          <div className="p-6 mx-auto w-7/10 mt-16">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">All Pipelines</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-gray-800 rounded-lg border border-gray-700">
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`px-3 py-2 ${
                      viewMode === 'kanban'
                        ? 'text-blue-400'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <FiGrid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 ${
                      viewMode === 'list'
                        ? 'text-blue-400'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <FiList className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={() => setShowNewDealModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  <FiPlus className="w-5 h-5" />
                  New Deal
                </button>
              </div>
            </div>

            {/* Kanban View */}
            {viewMode === 'kanban' && (
              <div className="flex gap-6 overflow-x-auto pb-4">
                {stages.map(stage => (
                  <div
                    key={stage.id}
                    className="flex-shrink-0 w-80"
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(stage.id)}
                  >
                    {/* Stage Header */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                          <h3 className="font-semibold text-white">{stage.name}</h3>
                          <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                            {getDealsByStage(stage.id).length}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm">
                        ${getTotalRevenue(stage.id).toLocaleString()}
                      </p>
                    </div>

                    {/* Cards */}
                    <div className="space-y-3">
                      {getDealsByStage(stage.id).map(deal => (
                        <DealCard
                          key={deal._id}
                          deal={deal}
                          onDragStart={() => handleDragStart(deal)}
                        />
                      ))}
                      {getDealsByStage(stage.id).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No deals
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-900 border-b border-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-gray-400 font-medium">Deal Name</th>
                      <th className="px-6 py-4 text-left text-gray-400 font-medium">Company</th>
                      <th className="px-6 py-4 text-left text-gray-400 font-medium">Amount</th>
                      <th className="px-6 py-4 text-left text-gray-400 font-medium">Stage</th>
                      <th className="px-6 py-4 text-left text-gray-400 font-medium">Close Date</th>
                      <th className="px-6 py-4 text-left text-gray-400 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map(deal => (
                      <tr
                        key={deal._id}
                        className="border-b border-gray-700 hover:bg-gray-700 transition"
                      >
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">{deal.dealName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-400">{deal.company?.name || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white font-semibold">
                            ${deal.amount?.toLocaleString() || 0}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded text-sm">
                            {stages.find(s => s.id === deal.dealStage)?.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-400">
                            {new Date(deal.expectedCloseDate).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              deal.dealStatus === 'won'
                                ? 'bg-green-500/20 text-green-400'
                                : deal.dealStatus === 'lost'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {deal.dealStatus?.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Deal Modal */}
      {showNewDealModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Deal</h2>
            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Deal Name
                </label>
                <input
                  type="text"
                  value={newDeal.dealName}
                  onChange={(e) => setNewDeal({ ...newDeal, dealName: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. Acme Corp - Enterprise Plan"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={newDeal.amount}
                  onChange={(e) => setNewDeal({ ...newDeal, amount: parseFloat(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expected Close Date
                </label>
                <input
                  type="date"
                  value={newDeal.expectedCloseDate}
                  onChange={(e) => setNewDeal({ ...newDeal, expectedCloseDate: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewDealModal(false)}
                  className="flex-1 px-4 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                >
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Deal Card Component
const DealCard = ({ deal, onDragStart }) => (
  <div
    draggable
    onDragStart={onDragStart}
    className="bg-gray-700 border border-gray-600 rounded-lg p-4 cursor-move hover:bg-gray-650 hover:border-gray-500 transition"
  >
    <h4 className="text-white font-semibold mb-2">{deal.dealName}</h4>
    <p className="text-gray-400 text-sm mb-3">{deal.company?.name || 'Unknown'}</p>
    <div className="flex items-center justify-between">
      <p className="text-white font-bold flex items-center gap-1">
        <FiDollarSign className="w-4 h-4" />
        {(deal.amount || 0).toLocaleString()}
      </p>
      <span
        className={`text-xs px-2 py-1 rounded ${
          deal.dealStatus === 'won'
            ? 'bg-green-500/20 text-green-400'
            : 'bg-blue-500/20 text-blue-400'
        }`}
      >
        {deal.dealStatus || 'open'}
      </span>
    </div>
  </div>
);

export default DealsPipeline;
