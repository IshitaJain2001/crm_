import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { FiPlus, FiCheckCircle } from 'react-icons/fi';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <Header title="Tasks" />
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">My Tasks</h3>
            <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
              <FiPlus />
              <span>Create Task</span>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-center py-8">Tasks module coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
