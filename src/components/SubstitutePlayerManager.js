import React, { useState, useEffect } from 'react';

const SubstitutePlayerManager = ({ 
  teamId, 
  onPlayerAssignmentChange,
  existingAssignments = [],
  matchId = null 
}) => {
  const [players, setPlayers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = ['exp', 'mid', 'jungler', 'gold', 'roam'];

  useEffect(() => {
    if (teamId) {
      loadTeamPlayers();
    }
  }, [teamId]);

  useEffect(() => {
    if (existingAssignments.length > 0) {
      setAssignments(existingAssignments);
    }
  }, [existingAssignments]);

  const loadTeamPlayers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/players`);
      if (response.ok) {
        const playersData = await response.json();
        setPlayers(playersData);
      }
    } catch (error) {
      setError('Failed to load team players');
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlayersForRole = (role) => {
    return players.filter(player => player.role === role);
  };

  const getPrimaryPlayer = (role) => {
    return players.find(player => player.role === role && !player.is_substitute);
  };

  const getSubstitutes = (role) => {
    return players.filter(player => player.role === role && player.is_substitute);
  };

  const handleAssignmentChange = (role, playerId, isStartingLineup = true, substituteOrder = null) => {
    const newAssignments = [...assignments];
    
    // Remove existing assignment for this role
    const existingIndex = newAssignments.findIndex(a => a.role === role);
    if (existingIndex !== -1) {
      newAssignments.splice(existingIndex, 1);
    }

    // Add new assignment
    if (playerId) {
      newAssignments.push({
        player_id: playerId,
        role: role,
        is_starting_lineup: isStartingLineup,
        substitute_order: substituteOrder
      });
    }

    setAssignments(newAssignments);
    
    if (onPlayerAssignmentChange) {
      onPlayerAssignmentChange(newAssignments);
    }
  };

  const getAssignmentForRole = (role) => {
    return assignments.find(a => a.role === role);
  };

  const isPlayerAssigned = (playerId) => {
    return assignments.some(a => a.player_id === playerId);
  };

  const canAssignPlayer = (playerId, role) => {
    const assignment = getAssignmentForRole(role);
    if (!assignment) return true;
    
    // If this role already has a starting player, only allow substitutes
    if (assignment.is_starting_lineup) {
      return false; // Can't have multiple starting players for same role
    }
    
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading players...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Match Player Assignments
      </h3>
      
      {roles.map(role => {
        const primaryPlayer = getPrimaryPlayer(role);
        const substitutes = getSubstitutes(role);
        const assignment = getAssignmentForRole(role);
        const assignedPlayer = assignment ? players.find(p => p.id === assignment.player_id) : null;

        return (
          <div key={role} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-medium text-gray-700 capitalize">
                {role} Lane
              </h4>
              <span className="text-sm text-gray-500">
                {assignment ? `${assignedPlayer?.name} (${assignment.is_starting_lineup ? 'Starting' : 'Substitute'})` : 'Not assigned'}
              </span>
            </div>

            {/* Primary Player Selection */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Starting Player
              </label>
              <select
                value={assignment?.is_starting_lineup ? assignment.player_id : ''}
                onChange={(e) => handleAssignmentChange(role, e.target.value, true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select starting player</option>
                {primaryPlayer && (
                  <option value={primaryPlayer.id}>
                    {primaryPlayer.name} (Primary)
                  </option>
                )}
                {substitutes.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} (Substitute)
                  </option>
                ))}
              </select>
            </div>

            {/* Substitute Selection (if needed) */}
            {substitutes.length > 0 && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Substitute
                </label>
                <div className="space-y-2">
                  {substitutes.map((sub, index) => {
                    const isAssigned = isPlayerAssigned(sub.id);
                    const canAssign = canAssignPlayer(sub.id, role);
                    
                    return (
                      <div key={sub.id} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`sub_${sub.id}`}
                          checked={isAssigned && assignment?.player_id === sub.id}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleAssignmentChange(role, sub.id, false, index + 1);
                            } else {
                              handleAssignmentChange(role, '', true);
                            }
                          }}
                          disabled={!canAssign}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label 
                          htmlFor={`sub_${sub.id}`}
                          className={`text-sm ${canAssign ? 'text-gray-700' : 'text-gray-400'}`}
                        >
                          {sub.name} (Substitute {index + 1})
                          {sub.notes && <span className="text-gray-500 ml-2">- {sub.notes}</span>}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Assignment Notes */}
            {assignment && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={assignment.notes || ''}
                  onChange={(e) => {
                    const updatedAssignments = assignments.map(a => 
                      a.role === role ? { ...a, notes: e.target.value } : a
                    );
                    setAssignments(updatedAssignments);
                    if (onPlayerAssignmentChange) {
                      onPlayerAssignmentChange(updatedAssignments);
                    }
                  }}
                  placeholder="Add notes about this player's assignment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-medium text-gray-700 mb-2">Assignment Summary</h4>
        <div className="space-y-1 text-sm text-gray-600">
          {roles.map(role => {
            const assignment = getAssignmentForRole(role);
            const player = assignment ? players.find(p => p.id === assignment.player_id) : null;
            
            return (
              <div key={role} className="flex justify-between">
                <span className="capitalize">{role}:</span>
                <span>
                  {player ? (
                    <span className={assignment.is_starting_lineup ? 'text-green-600 font-medium' : 'text-blue-600'}>
                      {player.name} ({assignment.is_starting_lineup ? 'Starting' : 'Substitute'})
                    </span>
                  ) : (
                    <span className="text-red-500">Not assigned</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span>Total Players:</span>
            <span className="font-medium">{assignments.length}/5</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Starting Lineup:</span>
            <span className="font-medium">
              {assignments.filter(a => a.is_starting_lineup).length}/5
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubstitutePlayerManager;
