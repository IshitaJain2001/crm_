import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLayout } from '../context/LayoutContext';
import Sidebar from './Sidebar';
import Header from './Header';

const PageWrapper = ({ title, children }) => {
  const { isDark } = useTheme();
  const { sidebarOpen } = useLayout();

  return (
    <div className={`h-screen w-screen ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <Sidebar />
      {/* Main content with 80% width */}
      <div className={`absolute top-0 bottom-0 flex flex-col overflow-hidden transition-all duration-300 w-4/5 ${
        sidebarOpen ? 'left-64' : 'left-20'
      }`}>
        <Header title={title} />
        <div className={`flex-1 overflow-auto ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="p-6 mx-auto w-7/10 mt-16">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageWrapper;
