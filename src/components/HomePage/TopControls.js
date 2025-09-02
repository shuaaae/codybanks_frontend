import React from 'react';
import { FaChartBar, FaGamepad, FaTrophy } from 'react-icons/fa';

export default function TopControls({
  onExportClick,
  onHeroStatsClick,
  currentMode,
  onModeChange
}) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-2 w-full">
      {/* Left side - Buttons */}
      <div className="flex order-1 md:order-1">
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
      </div>

      {/* Center - Title */}
      <h1 className="text-2xl text-center font-bold text-blue-200 order-2 md:order-2">
        Cody Banks Draft and Statistics System
        <span className="block text-lg text-gray-300 mt-1">
          {currentMode === 'scrim' ? 'Scrim Mode' : 'Tournament Mode'}
        </span>
      </h1>

      {/* Right side - Mode Toggle */}
      <div className="flex items-center order-3 md:order-3">
        <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-600">
          <button
            className={`flex items-center px-4 py-2 rounded-md font-semibold transition-all duration-200 ${
              currentMode === 'scrim'
                ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
            onClick={() => onModeChange('scrim')}
          >
            <FaGamepad className="mr-2" />
            Scrim Mode
          </button>
          <button
            className={`flex items-center px-4 py-2 rounded-md font-semibold transition-all duration-200 ${
              currentMode === 'tournament'
                ? 'bg-yellow-600 text-white shadow-lg transform scale-105'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
            onClick={() => onModeChange('tournament')}
          >
            <FaTrophy className="mr-2" />
            Tournament Mode
          </button>
        </div>
      </div>
    </div>
  );
} 