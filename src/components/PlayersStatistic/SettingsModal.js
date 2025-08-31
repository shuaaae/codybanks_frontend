import React, { useState, useEffect } from 'react';

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

  // Role options for the frontend display, mapping to consistent backend values
  const roleOptions = [
    { value: 'exp', label: 'Exp Lane' },
    { value: 'jungler', label: 'Jungler' },
    { value: 'mid', label: 'Mid Lane' },
    { value: 'gold', label: 'Gold Lane' },
    { value: 'roam', label: 'Roam' }
  ];

  // Normalize role values to ensure consistency
  const normalizeRole = (role) => {
    if (!role) return role;
    
    const normalizedRole = role.toLowerCase().trim();
    
    // Map various role formats to standard ones
    const roleMap = {
      // Standard roles
      'exp': 'exp',
      'mid': 'mid',
      'jungler': 'jungler',
      'gold': 'gold',
      'roam': 'roam',
      'sub': 'substitute',
      'substitute': 'substitute',
      
      // Common variations
      'explane': 'exp',
      'explaner': 'exp',
      'top': 'exp',
      'top_laner': 'exp',
      'toplaner': 'exp',
      
      'midlane': 'mid',
      'mid_laner': 'mid',
      'midlaner': 'mid',
      'middle': 'mid',
      
      'jungle': 'jungler',
      'jungler': 'jungler',
      
      'adc': 'gold',
      'marksman': 'gold',
      'gold_lane': 'gold',
      'goldlane': 'gold',
      'carry': 'gold',
      
      'support': 'roam',
      'roamer': 'roam',
      'roam_lane': 'roam',
      'roamlane': 'roam',
      
      'backup': 'substitute',
      'reserve': 'substitute',
      'sub': 'substitute'
    };
    
    return roleMap[normalizedRole] || normalizedRole;
  };

  // Get user-friendly display name for a role
  const getRoleDisplayName = (roleValue) => {
    if (!roleValue) return 'No role assigned';
    const roleOption = roleOptions.find(r => r.value === roleValue);
    return roleOption ? roleOption.label : roleValue;
  };

  useEffect(() => {
    if (teamPlayers && teamPlayers.players_data) {
      console.log('SettingsModal: Setting players from teamPlayers:', teamPlayers.players_data);
      setPlayers(teamPlayers.players_data);
      
      // Ensure all players have database records
      if (teamPlayers.id) {
        ensurePlayerRecords(teamPlayers.id);
      }
    }
  }, [teamPlayers]);

  // Function to ensure all players have database records
  const ensurePlayerRecords = async (teamId) => {
    try {
      console.log('Ensuring player records for team:', teamId);
      const response = await fetch(`/api/teams/${teamId}/ensure-players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Player records ensured successfully:', result);
        
        // Refresh the players data to get the updated records with IDs
        if (teamPlayers && teamPlayers.players_data) {
          // Fetch fresh team data to get the updated player records
          const teamResponse = await fetch(`/api/teams/${teamId}`);
          if (teamResponse.ok) {
            const updatedTeam = await teamResponse.json();
            console.log('Updated team data with player records:', updatedTeam);
            
            // Update the players state with the fresh data
            if (updatedTeam.players_data) {
              setPlayers(updatedTeam.players_data);
            }
          }
        }
      } else {
        console.error('Failed to ensure player records:', response.status);
      }
    } catch (error) {
      console.error('Error ensuring player records:', error);
    }
  };

  const handleEditPlayer = (player) => {
    setEditingPlayer({ ...player });
  };

  const handleSavePlayer = async () => {
    try {
      // Normalize the role to ensure consistency
      const normalizedPlayer = {
        ...editingPlayer,
        role: normalizeRole(editingPlayer.role)
      };
      
      console.log('Updating player with normalized data:', normalizedPlayer);
      
      const response = await fetch(`/api/players/${editingPlayer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(normalizedPlayer),
      });

            if (response.ok) {
        const updatedPlayer = await response.json();
        onPlayerUpdate(updatedPlayer);
        setEditingPlayer(null);
        onShowSuccess('Player updated successfully!');
        onClose(); // Close the SettingsModal after successful update
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to update player (${response.status})`;
        onShowSuccess(errorMessage);
      }
    } catch (error) {
      console.error('Error updating player:', error);
      onShowSuccess('Network error: ' + error.message);
    }
  };

    const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState(null);

  const handleDeletePlayer = async (player) => {
    console.log('Attempting to delete player:', player);
    
    // All players should have IDs now since we ensure them on load
    if (!player.id) {
      console.log('Player has no ID, this should not happen. Player data:', player);
      onShowSuccess('Error: Player data is incomplete. Please refresh and try again.');
      return;
    }
    
    console.log('Player has ID, using standard deletion');
    setPlayerToDelete({ type: 'with_id', playerId: player.id });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!playerToDelete) return;
    
    try {
      // All players should have IDs now
      if (playerToDelete.type !== 'with_id') {
        console.error('Unexpected player type:', playerToDelete.type);
        onShowSuccess('Error: Invalid player data. Please refresh and try again.');
        return;
      }
      
      console.log('Deleting player with ID:', playerToDelete.playerId);
      const response = await fetch(`/api/players/${playerToDelete.playerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onPlayerDelete(playerToDelete.playerId);
        onShowSuccess('Player deleted successfully!');
        onClose(); // Close the SettingsModal after successful deletion
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to delete player (${response.status})`;
        onShowSuccess(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      onShowSuccess('Network error: ' + error.message);
    } finally {
      setShowDeleteModal(false);
      setPlayerToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPlayerToDelete(null);
  };

  const handleCreatePlayer = async () => {
    if (!newPlayer.name || !newPlayer.role) {
      onShowSuccess('Please fill in all fields');
      return;
    }

    if (!teamPlayers?.id) {
      onShowSuccess('No active team found. Please select a team first.');
      return;
    }

    // Check if player already exists
    const existingPlayer = teamPlayers.players_data?.find(player => 
      player.name === newPlayer.name && player.team_id === parseInt(teamPlayers.id, 10)
    );

    if (existingPlayer) {
      onShowSuccess(`Player "${newPlayer.name}" already exists in this team!`);
      return;
    }

    // Normalize the role to ensure consistency
    const normalizedRole = normalizeRole(newPlayer.role);
    
    const playerData = {
      ...newPlayer,
      role: normalizedRole,
      team_id: parseInt(teamPlayers.id, 10)
    };
    
    console.log('Creating player with normalized data:', playerData);
    console.log('teamPlayers:', teamPlayers);

    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playerData),
      });

      if (response.ok) {
        const createdPlayer = await response.json();
        console.log('Player created successfully:', createdPlayer);
        
        // Call the parent's onPlayerCreate function
        onPlayerCreate(createdPlayer);
        
        // Reset form
        setNewPlayer({ name: '', role: '', team_id: null });
        
        // Show success message
        onShowSuccess('Player created successfully!');
        
        // Close the modal after successful creation
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend error response:', errorData);
        const errorMessage = errorData.error || errorData.message || `Failed to create player (${response.status})`;
        onShowSuccess(errorMessage);
      }
    } catch (error) {
      console.error('Error creating player:', error);
      onShowSuccess('Network error: ' + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90" style={{ pointerEvents: 'auto' }}>
      <div className="bg-[#23232a] rounded-2xl shadow-2xl p-8 min-w-[800px] max-w-[90vw] max-h-[90vh] overflow-y-auto z-[10000] border border-purple-500/30">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Player Management</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>



        {/* Players Management Content */}
        <div className="space-y-6">
            {/* Create New Player */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Add New Player</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Player Name"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                />
                <select
                  value={newPlayer.role}
                  onChange={(e) => setNewPlayer({ ...newPlayer, role: e.target.value })}
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-purple-500 focus:border-purple-500 focus:outline-none"
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
                className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Add Player
              </button>
            </div>

            {/* Players List */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Manage Players</h3>
              <div className="space-y-4">
                {players.map((player) => (
                  <div key={player.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                    {editingPlayer && editingPlayer.id === player.id ? (
                      // Edit Mode
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <input
                          type="text"
                          value={editingPlayer.name}
                          onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                          className="bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                        <select
                          value={editingPlayer.role}
                          onChange={(e) => setEditingPlayer({ ...editingPlayer, role: e.target.value })}
                          className="bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-purple-500 focus:outline-none"
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
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-semibold transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPlayer(null)}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm font-semibold transition-colors"
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
                              {getRoleDisplayName(player.role)}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditPlayer(player)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-semibold transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              console.log('Delete button clicked for player:', player);
                              console.log('Player has ID:', !!player.id);
                              console.log('Player data structure:', {
                                name: player.name,
                                role: player.role,
                                id: player.id,
                                team_id: player.team_id
                              });
                              handleDeletePlayer(player);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-semibold transition-colors"
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
        </div>

       {/* Delete Confirmation Modal */}
       {showDeleteModal && (
         <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black bg-opacity-90" style={{ pointerEvents: 'auto' }}>
           <div className="bg-[#23232a] rounded-2xl shadow-2xl p-8 min-w-[400px] max-w-[90vw] flex flex-col items-center z-[10002] border border-red-500/30">
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
                 className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg shadow-red-500/30"
               >
                 Delete Player
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default SettingsModal;
