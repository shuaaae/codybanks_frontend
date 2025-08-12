import React from 'react';

export default function TeamPickerModal({
  showTeamPickerModal,
  setShowTeamPickerModal,
  loadingTeams,
  teams,
  activeTeam,
  handleSelectTeam,
  handleDeleteTeam,
  onAddNewTeam
}) {
  if (!showTeamPickerModal) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4"
      onClick={() => setShowTeamPickerModal(false)}
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
          onClick={() => setShowTeamPickerModal(false)}
          type="button"
        >
          ✕
        </button>
        
        {/* Header Section */}
        <div className="relative z-10 text-center p-6">
          <h2 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Select Your Team
          </h2>
          <p className="text-gray-300 text-sm">Choose an existing team or create a new one</p>
        </div>

        {/* Teams List */}
        <div className="relative z-10 flex-1 overflow-y-auto px-6">
          {loadingTeams ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <span className="text-white ml-3">Loading teams...</span>
            </div>
          ) : teams.length > 0 ? (
            <div className="space-y-3">
              {teams.map((team) => {
                const isActive = activeTeam && activeTeam.id === team.id;
                // Use created_at as fallback since last_used_at is not provided by API
                const lastUsed = team.last_used_at ? new Date(team.last_used_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : team.created_at ? new Date(team.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 'Never used';
                
                return (
                  <div 
                    key={team.id} 
                    className={`rounded-2xl p-4 border transition-all duration-200 hover:scale-105 ${
                      isActive 
                        ? 'bg-gradient-to-r from-green-600/20 to-green-500/20 border-green-400 shadow-lg shadow-green-500/20' 
                        : 'bg-gray-800/60 backdrop-blur-sm border-gray-600 hover:border-blue-400/50 hover:bg-gray-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {team.logo_path ? (
                          <img 
                            src={team.logo_path} 
                            alt={`${team.name} logo`} 
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-600"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 border-gray-600 ${team.logo_path ? 'hidden' : 'flex'}`}
                        >
                          {team.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-white font-semibold text-lg">{team.name}</h3>
                            {isActive && (
                              <span className="text-green-400 text-sm font-medium bg-green-500/20 px-2 py-1 rounded-full">🟢 Active</span>
                            )}
                          </div>
                          <p className="text-gray-300 text-sm">
                            {team.players_data?.length || 0} players • Last used {lastUsed}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSelectTeam(team.id)}
                          className={`px-6 py-2 rounded-xl font-semibold transition-all duration-200 hover:scale-105 ${
                            isActive 
                              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg' 
                              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg'
                          }`}
                        >
                          {isActive ? 'Continue' : 'Select'}
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team)}
                          className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all duration-200 hover:scale-105 shadow-lg"
                          title="Delete team"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-300 mb-4">No teams found. Please create a new one.</p>
              <button
                onClick={onAddNewTeam}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Create New Team
              </button>
            </div>
          )}
          
          {teams.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-600">
              <button
                onClick={onAddNewTeam}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-4 rounded-2xl font-semibold transition-all duration-200 hover:scale-[1.01] shadow-lg flex items-center justify-center gap-3"
              >
                <span className="text-xl">➕</span>
                Add New Team
              </button>
            </div>
          )}
        </div>

        {/* Bottom Spacing */}
        <div className="relative z-10 w-full p-6">
        </div>
      </div>
    </div>
  );
} 