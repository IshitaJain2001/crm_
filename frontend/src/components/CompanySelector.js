import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const CompanySelector = ({ token, selectedCompanyId, onChange, label = "Select Company" }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/companies`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 }
      });
      setCompanies(response.data.companies);
      setError(null);
    } catch (err) {
      setError("Failed to load companies");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter companies based on search
  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-2 text-sm">
          {error}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          placeholder="Search companies..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 mb-2"
        />

        {loading ? (
          <div className="text-gray-500 text-center py-4">Loading companies...</div>
        ) : filteredCompanies.length > 0 ? (
          <select
            value={selectedCompanyId}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="">-- Choose a Company --</option>
            {filteredCompanies.map((company) => (
              <option key={company._id} value={company._id}>
                {company.name}
                {company.industry && ` (${company.industry})`}
              </option>
            ))}
          </select>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded text-sm">
            {searchText ? "No companies found" : "No companies available"}
            <button
              onClick={fetchCompanies}
              className="ml-2 underline hover:no-underline font-semibold"
            >
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Show selected company ID (for debugging) */}
      {selectedCompanyId && (
        <p className="text-xs text-gray-500 mt-1">
          Selected ID: <span className="font-mono">{selectedCompanyId}</span>
        </p>
      )}
    </div>
  );
};

export default CompanySelector;
