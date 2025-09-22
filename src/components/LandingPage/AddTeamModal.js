import React, { useEffect, useState } from 'react';

export default function AddTeamModal({
  showAddTeamModal,
  setShowAddTeamModal,
  onClose,
  teamLogo,
  teamName,
  setTeamName,
  teamNameError,
  isValidatingName,
  players,
  laneRoles,
  defaultRoles,
  handleLogoChange,
  handlePlayerChange,
  handleTeamNameChange,
  handleRemovePlayer,
  handleConfirm,
  isCreatingTeam
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (showAddTeamModal) {
      setIsVisible(true);
      // Reset animation state and then start animation
      setIsAnimating(false);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before hiding
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [showAddTeamModal]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm p-4 transition-all duration-300 ${
        isAnimating ? 'bg-opacity-80' : 'bg-opacity-0'
      }`}
      onClick={() => !isCreatingTeam && onClose()}
    >
      <div 
        className={`relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-gray-600 shadow-2xl w-[95vw] max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300 transform ${
          isAnimating 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-50"></div>
        
        {/* Close Button */}
        <button 
          className={`absolute top-6 right-6 text-2xl font-bold transition-colors duration-200 z-50 rounded-full w-8 h-8 flex items-center justify-center ${
            isCreatingTeam 
              ? 'text-gray-600 cursor-not-allowed bg-gray-800/30' 
              : 'text-gray-400 hover:text-white cursor-pointer hover:scale-110 bg-gray-800/50'
          }`}
          onClick={() => !isCreatingTeam && onClose()}
          type="button"
          disabled={isCreatingTeam}
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
              <input id="team-logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} disabled={isCreatingTeam} />
            </div>
          </label>
        </div>
        
        {/* Team Name Input */}
        <div className="relative z-10 w-full flex justify-center mb-4 px-6">
          <div className="w-full max-w-md">
            <div className="relative">
              <input
                type="text"
                className={`w-full backdrop-blur-sm border rounded-2xl py-3 px-6 text-center font-semibold text-lg outline-none transition-all duration-200 ${
                  isCreatingTeam 
                    ? 'bg-gray-700/60 border-gray-500 text-gray-400 cursor-not-allowed' 
                    : teamNameError 
                      ? 'bg-gray-800/80 border-red-500 text-white focus:ring-2 focus:ring-red-400 focus:border-red-400'
                      : 'bg-gray-800/80 border-gray-600 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400'
                } placeholder-gray-400`}
                placeholder="Enter Team Name"
                value={teamName}
                onChange={handleTeamNameChange}
                disabled={isCreatingTeam}
              />
              {/* Validation indicator */}
              {isValidatingName && teamName.trim().length >= 2 && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent"></div>
                </div>
              )}
              {/* Success indicator */}
              {!isValidatingName && !teamNameError && teamName.trim().length >= 2 && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {teamNameError && (
              <div className="mt-2 text-center">
                <span className="text-red-400 text-sm font-medium flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {teamNameError}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Players Section */}
        <div className="relative z-10 w-full flex-1 overflow-y-auto px-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-white mb-1">Add Your Players</h3>
            <p className="text-gray-400 text-xs">Assign roles to each team member</p>
          </div>
          
          <div className="space-y-3 mb-4">
            {/* First 4 players in 2x2 grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {players.slice(0, 4).map((player, idx) => (
                <div key={idx} className="relative group">
                  <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-600 rounded-xl p-3 hover:border-blue-400/50 transition-all duration-200">
                    <input
                      type="text"
                      className={`w-full border rounded-lg py-2 px-3 text-center font-medium mb-2 outline-none transition-all duration-200 text-sm ${
                        isCreatingTeam 
                          ? 'bg-gray-600/60 border-gray-500 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-700/80 border-gray-500 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400'
                      } placeholder-gray-400`}
                      placeholder="Player Name"
                      value={player.name}
                      onChange={e => handlePlayerChange(idx, e.target.value)}
                      disabled={isCreatingTeam}
                    />
                    <div className={`w-full border rounded-lg py-2 px-3 text-center text-xs ${
                      isCreatingTeam 
                        ? 'bg-gray-600/60 border-gray-500 text-gray-400' 
                        : 'bg-gray-700/80 border-gray-500 text-gray-200'
                    }`}>
                      {laneRoles.find(lane => lane.key === player.role)?.label || 'Select Lane'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Last player centered */}
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <div className="relative group">
                  <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-600 rounded-xl p-3 hover:border-blue-400/50 transition-all duration-200">
                    <input
                      type="text"
                      className={`w-full border rounded-lg py-2 px-3 text-center font-medium mb-2 outline-none transition-all duration-200 text-sm ${
                        isCreatingTeam 
                          ? 'bg-gray-600/60 border-gray-500 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-700/80 border-gray-500 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400'
                      } placeholder-gray-400`}
                      placeholder="Player Name"
                      value={players[4]?.name || ''}
                      onChange={e => handlePlayerChange(4, e.target.value)}
                      disabled={isCreatingTeam}
                    />
                    <div className={`w-full border rounded-lg py-2 px-3 text-center text-xs ${
                      isCreatingTeam 
                        ? 'bg-gray-600/60 border-gray-500 text-gray-400' 
                        : 'bg-gray-700/80 border-gray-500 text-gray-200'
                    }`}>
                      {laneRoles.find(lane => lane.key === players[4]?.role)?.label || 'Select Lane'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
        
        {/* Confirm Button */}
        <div className="relative z-10 w-full p-6 border-t border-gray-700">
          <button
            className={`w-full font-bold text-lg py-3 px-6 rounded-2xl shadow-lg transition-all duration-200 transform ${
              isCreatingTeam || teamNameError || !teamName.trim() || !teamLogo
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:scale-105'
            } text-white`}
            onClick={handleConfirm}
            disabled={isCreatingTeam || teamNameError || !teamName.trim() || !teamLogo}
          >
            {isCreatingTeam ? (
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Creating Team...</span>
              </div>
            ) : (
              'Create Team'
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 