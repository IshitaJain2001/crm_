import React from 'react';
import { FiBell, FiSearch } from 'react-icons/fi';

const Header = ({ title }) => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
          </div>
          <button className="relative p-2 text-gray-600 hover:text-gray-900">
            <FiBell size={22} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
