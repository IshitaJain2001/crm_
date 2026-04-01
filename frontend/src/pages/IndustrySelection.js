import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const IndustrySelection = () => {
  const [industries, setIndustries] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const API_URL = 'https://crm-1-5el5.onrender.com';

  useEffect(() => {
    fetchIndustries();
  }, []);

  const fetchIndustries = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/industries`);
      setIndustries(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load industries');
      setLoading(false);
    }
  };

  const handleSelectIndustry = (industryId) => {
    setSelectedIndustry(industryId);
    // Pass industry to next step (company creation)
    localStorage.setItem('selectedIndustry', industryId);
    navigate('/register', { state: { industry: industryId } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Select Your Industry</h1>
          <p className="text-gray-600 text-lg">Choose your business type to customize your CRM experience</p>
        </div>

        {/* Industry Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {industries.map((industry) => (
            <div
              key={industry.id}
              onClick={() => handleSelectIndustry(industry.id)}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl border-2 border-transparent hover:border-blue-500 cursor-pointer transition transform hover:scale-105 p-8 text-center"
              style={{ borderColor: selectedIndustry === industry.id ? industry.color : 'transparent' }}
            >
              {/* Color Badge */}
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-3xl"
                style={{ backgroundColor: industry.color }}
              >
                {industry.name[0]}
              </div>

              {/* Name */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{industry.name}</h3>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4">{industry.description}</p>

              {/* Feature Count */}
              <div className="text-blue-500 font-semibold text-sm">
                {Object.values(industry.features).filter(f => f.enabled).length} Features
              </div>

              {/* Select Button */}
              <button
                className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition"
                onClick={() => handleSelectIndustry(industry.id)}
              >
                {selectedIndustry === industry.id ? '✓ Selected' : 'Select'}
              </button>
            </div>
          ))}
        </div>

        {/* Features Preview */}
        {selectedIndustry && (
          <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Features for {industries.find(i => i.id === selectedIndustry)?.name}
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {industries
                .find(i => i.id === selectedIndustry)
                ?.features &&
                Object.entries(
                  industries.find(i => i.id === selectedIndustry).features
                )
                  .filter(([_, feature]) => feature.enabled)
                  .map(([key, feature]) => (
                    <div key={key} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <span className="text-green-500 text-xl">✓</span>
                      <span className="text-gray-900 font-medium">{feature.label}</span>
                    </div>
                  ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-12">
          <button
            onClick={() => {
              if (selectedIndustry) {
                navigate('/register', { state: { industry: selectedIndustry } });
              } else {
                toast.error('Please select an industry first');
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition"
            disabled={!selectedIndustry}
          >
            Continue with {selectedIndustry ? industries.find(i => i.id === selectedIndustry)?.name : 'Selected Industry'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IndustrySelection;
