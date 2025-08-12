import React from 'react';
import { FaChartBar } from 'react-icons/fa';

export default function TopControls({ 
  onExportClick, 
  onHeroStatsClick 
}) {
  return (
    <div className="flex flex-row items-center mb-2">
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-3 rounded-lg shadow transition flex items-center mr-4"
        onClick={onExportClick}
      >
        Export Match
      </button>
      
      <button
        className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-3 rounded-lg shadow transition flex items-center mr-4"
        onClick={onHeroStatsClick}
      >
        <FaChartBar className="mr-2" />
        Hero Stats
      </button>
      
      <h1 className="text-2xl font-bold text-blue-200 ml-4">Cody Banks Draft and Statistics System</h1>
    </div>
  );
} 