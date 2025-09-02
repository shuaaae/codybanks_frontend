import React, { useState, useEffect } from 'react';
import playerService from '../../utils/playerService';

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  teamPlayers,
  onPlayerUpdate,
  onPlayerDelete,
  onPlayerCreate,
  onShowSuccess
}) => {
  const [players, setPlayers] = useState([]);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    role: '',
    team_id: null
  });

  const [validationErrors, setValidationErrors] = useState([]);

  // Role options for the frontend display, mapping to consistent backend values
  const roleOptions = [
    { value: 'exp', label: 'Exp Lane' },
    { value: 'jungler', label: 'Jungler' },
    { value: 'mid', label: 'Mid Lane' },
    { value: 'gold', label: 'Gold Lane' },
    { value: 'roam', label: 'Roam' }
  ];

  useEffect(() => {
    const playersData = teamPlayers?.players_data || teamPlayers?.players;
    if (playersData && Array.isArray(playersData)) {
      setPlayers(playersData);
      
      // Set the active team ID in the service
      if (teamPlayers.id) {
        playerService.setActiveTeamId(teamPlayers.id);
      }
    }
  }, [teamPlayers]);



  const handleEditPlayer = (player) => {
    setEditingPlayer({ ...player });
    setValidationErrors([]);
  };

  const handleSavePlayer = async () => {
    try {
      setIsUpdating(true);
      setValidationErrors([]);

      // Validate the editing player data
      const validation = playerService.validatePlayerData(editingPlayer, true);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }

      // Normalize the role to ensure consistency
      const normalizedPlayer = {
        ...editingPlayer,
        role: playerService.normalizeRole(editingPlayer.role)
      };
      
      const result = await playerService.updatePlayer(editingPlayer.id, normalizedPlayer);
      
      if (result.success) {
        onPlayerUpdate(result.player);
        setEditingPlayer(null);
        onShowSuccess(result.message);
        onClose(); // Close the SettingsModal after successful update
      } else {
        setValidationErrors([result.error]);
        onShowSuccess(result.message);
      }
    } catch (error) {
      setValidationErrors(['Network error: ' + error.message]);
    } finally {
      setIsUpdating(false);
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState(null);
  
  // Loading states for different operations
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePlayer = async (player) => {
    // Check if player has required data
    if (!player.name || !player.role) {
      onShowSuccess('Error: Player data is incomplete. Please refresh and try again.');
      return;
    }
    
    // If player has an ID, use standard deletion
    if (player.id) {
      setPlayerToDelete({ type: 'with_id', player: player });
      setShowDeleteModal(true);
    } else {
      // If no ID, this is a player that hasn't been saved to database yet
      setPlayerToDelete({ type: 'no_id', player: player });
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = async () => {
    if (!playerToDelete) return;
    
    try {
      setIsDeleting(true);
      
      if (playerToDelete.type === 'with_id') {
        // Standard deletion for players with database IDs
        const result = await playerService.deletePlayer(playerToDelete.player.id);

        if (result.success) {
          // Call the parent's delete handler first
          onPlayerDelete(playerToDelete.player.id);
          
          // Show success message (updated for hard deletion)
          onShowSuccess(result.message || 'Player permanently deleted successfully');
          
          // Close the modal after successful deletion
          onClose();
        } else {
          onShowSuccess('Error: ' + result.error);
          return; // Don't close modal on error
        }
      } else if (playerToDelete.type === 'no_id') {
        // Local deletion for players without database IDs
        onPlayerDelete(playerToDelete.player);
        onShowSuccess('Player removed successfully!');
        
        onClose(); // Close the SettingsModal after successful deletion
      } else {
        onShowSuccess('Error: Invalid player data. Please refresh and try again.');
      }
    } catch (error) {
      onShowSuccess('Network error: ' + error.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setPlayerToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPlayerToDelete(null);
  };

  const handleCreatePlayer = async () => {
    try {
      setIsCreating(true);
      setValidationErrors([]);

      if (!newPlayer.name || !newPlayer.role) {
        setValidationErrors(['Please fill in all fields']);
        return;
      }

      if (!teamPlayers?.id) {
        setValidationErrors(['No active team found. Please select a team first.']);
        return;
      }

      // Check if player already exists
      const playersData = teamPlayers?.players_data || teamPlayers?.players;
      const existingPlayer = playersData?.find(player => 
        player.name === newPlayer.name && player.team_id === parseInt(teamPlayers.id, 10)
      );

      if (existingPlayer) {
        setValidationErrors([`Player "${newPlayer.name}" already exists in this team!`]);
        return;
      }

      // Validate the new player data
      const validation = playerService.validatePlayerData(newPlayer, false);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }

      // Normalize the role to ensure consistency
      const normalizedRole = playerService.normalizeRole(newPlayer.role);
      
      const playerData = {
        ...newPlayer,
        role: normalizedRole,
        team_id: parseInt(teamPlayers.id, 10)
      };

      const result = await playerService.createPlayer(playerData);
      
      if (result.success) {
        // Call the parent's onPlayerCreate function
        onPlayerCreate(result.player);
        
        // Reset form
        setNewPlayer({ name: '', role: '', team_id: null });
        
        // Show success message
        onShowSuccess(result.message);
        
        // Close the modal after successful creation
        onClose();
      } else {
        setValidationErrors([result.error]);
        onShowSuccess(result.message);
      }
    } catch (error) {
      setValidationErrors(['Network error: ' + error.message]);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90" style={{ pointerEvents: 'auto' }}>
      <div className="bg-[#23232a] rounded-2xl shadow-2xl p-8 min-w-[800px] max-w-[90vw] max-h-[90vh] overflow-y-auto z-[10000] border border-purple-500/30">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Player Management</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Players Management Content */}
        <div className="space-y-6">
          {/* Create New Player */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Add New Player</h3>
            
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg">
                {validationErrors.map((error, index) => (
                  <div key={index} className="text-red-300 text-sm">
                    • {error}
                  </div>
                ))}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
                              <input
                  type="text"
                  placeholder="Player Name"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  disabled={isCreating || isUpdating || isDeleting}
                  className={`bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none ${
                    isCreating || isUpdating || isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                              <select
                  value={newPlayer.role}
                  onChange={(e) => setNewPlayer({ ...newPlayer, role: e.target.value })}
                  disabled={isCreating || isUpdating || isDeleting}
                  className={`bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none ${
                    isCreating || isUpdating || isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                <option value="">Select Role</option>
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCreatePlayer}
              disabled={isCreating}
              className={`mt-4 px-6 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                isCreating 
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Adding Player...</span>
                </>
              ) : (
                'Add Player'
              )}
            </button>
          </div>

          {/* Players List */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Manage Players</h3>
            <div className="space-y-4">
              {players.map((player) => (
                <div key={player.id || `${player.name}-${player.role}`} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                  {editingPlayer && (editingPlayer.id === player.id || (editingPlayer.name === player.name && editingPlayer.role === player.role)) ? (
                    // Edit Mode
                    <div className="flex-1 grid grid-cols-3 gap-4">
                                              <input
                          type="text"
                          value={editingPlayer.name}
                          onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                          disabled={isCreating || isUpdating || isDeleting}
                          className={`bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-purple-500 focus:outline-none ${
                            isCreating || isUpdating || isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        />
                                              <select
                          value={editingPlayer.role}
                          onChange={(e) => setEditingPlayer({ ...editingPlayer, role: e.target.value })}
                          disabled={isCreating || isUpdating || isDeleting}
                          className={`bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:outline-none ${
                            isCreating || isUpdating || isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                        {roleOptions.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSavePlayer}
                          disabled={isUpdating}
                          className={`px-3 py-2 rounded text-sm font-semibold transition-colors flex items-center justify-center space-x-2 ${
                            isUpdating 
                              ? 'bg-gray-500 cursor-not-allowed' 
                              : 'bg-green-600 hover:bg-green-700'
                          } text-white`}
                        >
                          {isUpdating ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                              <span>Saving...</span>
                            </>
                          ) : (
                            'Save'
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingPlayer(null);
                            setValidationErrors([]);
                          }}
                          disabled={isCreating || isUpdating || isDeleting}
                          className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${
                            isCreating || isUpdating || isDeleting 
                              ? 'bg-gray-500 cursor-not-allowed' 
                              : 'bg-gray-600 hover:bg-gray-700'
                          } text-white`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex-1">
                        <div className="text-white font-semibold">{player.name}</div>
                                                  <div className="text-gray-400 text-sm">
                            <span title={`Database value: ${player.role || 'null'}`}>
                              {playerService.getRoleDisplayName(player.role)}
                            </span>
                          </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditPlayer(player)}
                          disabled={isCreating || isUpdating || isDeleting}
                          className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${
                            isCreating || isUpdating || isDeleting 
                              ? 'bg-gray-500 cursor-not-allowed' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          } text-white`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePlayer(player)}
                          disabled={isCreating || isUpdating || isDeleting}
                          className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${
                            isCreating || isUpdating || isDeleting 
                              ? 'bg-gray-500 cursor-not-allowed' 
                              : 'bg-red-600 hover:bg-red-700'
                          } text-white`}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-[10010] flex items-center justify-center bg-black bg-opacity-90" style={{ pointerEvents: 'auto' }}>
            <div className="bg-[#23232a] rounded-2xl shadow-2xl p-8 min-w-[400px] max-w-[90vw] flex flex-col items-center z-[10011] border border-red-500/30">
              {/* Warning Icon */}
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-500/30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              {/* Warning Message */}
              <div className="text-white text-xl font-bold mb-4 text-center bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Confirm Deletion
              </div>

              <div className="text-white text-lg mb-8 text-center">
                Are you sure you want to delete this player? This action cannot be undone.
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                               <button
                 onClick={cancelDelete}
                 className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
               >
                 Cancel
               </button>
               <button
                 onClick={confirmDelete}
                 disabled={isDeleting}
                 className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2 ${
                   isDeleting 
                     ? 'bg-gray-500 cursor-not-allowed shadow-gray-500/30' 
                     : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                 } text-white`}
               >
                 {isDeleting ? (
                   <>
                     <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                     <span>Deleting...</span>
                   </>
                 ) : (
                   'Delete Player'
                 )}
               </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
