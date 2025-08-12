import React from 'react';

export default function AddTeamModal({
  showAddTeamModal,
  setShowAddTeamModal,
  teamLogo,
  teamName,
  setTeamName,
  players,
  laneRoles,
  defaultRoles,
  handleLogoChange,
  handlePlayerChange,
  handleAddPlayer,
  handleRoleChange,
  handleRemovePlayer,
  handleConfirm
}) {
  if (!showAddTeamModal) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4"
      onClick={() => setShowAddTeamModal(false)}
    >
      <div 
        className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-gray-600 shadow-2xl w-[95vw] max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-50"></div>
        
        {/* Close Button */}
        <button 
          className="absolute top-6 right-6 text-gray-400 hover:text-white text-2xl font-bold transition-colors duration-200 z-50 cursor-pointer hover:scale-110 bg-gray-800/50 rounded-full w-8 h-8 flex items-center justify-center" 
          onClick={() => setShowAddTeamModal(false)}
          type="button"
        >
          ✕
        </button>
        
        {/* Header Section */}
        <div className="relative z-10 text-center p-6">
          <h2 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Create Your Team
          </h2>
          <p className="text-gray-300 text-sm">Build your esports squad and dominate the competition</p>
        </div>
        
        {/* Logo Upload Section */}
        <div className="relative z-10 mb-4 flex flex-col items-center">
          <label htmlFor="team-logo-upload" className="cursor-pointer group">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border-2 border-gray-600 relative overflow-hidden shadow-xl group-hover:border-blue-400 transition-all duration-300 group-hover:scale-105">
              {teamLogo ? (
                <img src={teamLogo} alt="Team Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-blue-400 text-4xl font-bold mb-1">+</span>
                  <span className="text-gray-400 text-xs">Upload Logo</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              <input id="team-logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>
          </label>
        </div>
        
        {/* Team Name Input */}
        <div className="relative z-10 w-full flex justify-center mb-4 px-6">
                      <input
              type="text"
              className="w-full max-w-md bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-2xl py-3 px-6 text-white text-center font-semibold text-lg outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400 transition-all duration-200"
              placeholder="Enter Team Name"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
            />
        </div>
        
        {/* Players Section */}
        <div className="relative z-10 w-full flex-1 overflow-y-auto px-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-white mb-1">Add Your Players</h3>
            <p className="text-gray-400 text-xs">Assign roles to each team member</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {players.map((player, idx) => (
              <div key={idx} className="relative group">
                <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-600 rounded-xl p-3 hover:border-blue-400/50 transition-all duration-200">
                  <input
                    type="text"
                    className="w-full bg-gray-700/80 border border-gray-500 rounded-lg py-2 px-3 text-white text-center font-medium mb-2 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400 transition-all duration-200 text-sm"
                    placeholder="Player Name"
                    value={player.name}
                    onChange={e => handlePlayerChange(idx, e.target.value)}
                  />
                  <select
                    className="w-full bg-gray-700/80 border border-gray-500 rounded-lg py-2 px-3 text-gray-200 text-center text-xs outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
                    value={player.role}
                    onChange={e => handleRoleChange(idx, e.target.value)}
                  >
                    <option value="">Select Lane</option>
                    {laneRoles.map(lane => (
                      <option key={lane.key} value={lane.key}>{lane.label}</option>
                    ))}
                  </select>
                  
                  {idx >= defaultRoles.length && (
                    <button
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 hover:scale-110"
                      onClick={() => handleRemovePlayer(idx)}
                      title="Remove player"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Add More Player Button */}
          <div className="mb-4">
            <button
              className="w-full bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 border border-gray-500 rounded-xl py-3 px-4 text-white font-semibold text-sm flex items-center justify-center transition-all duration-200 hover:scale-105"
              onClick={handleAddPlayer}
            >
              <span className="mr-2">Add More Player</span>
              <span className="text-blue-400 text-lg font-bold">+</span>
            </button>
          </div>
        </div>
        
        {/* Confirm Button */}
        <div className="relative z-10 w-full p-6 border-t border-gray-700">
          <button
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-lg py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 transform"
            onClick={handleConfirm}
          >
            Create Team
          </button>
        </div>
      </div>
    </div>
  );
} 