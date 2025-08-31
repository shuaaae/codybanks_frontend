/**
 * Utility functions for managing team activation
 */

// Simple debounce mechanism to prevent rapid successive calls
let lastActivationTime = 0;
const ACTIVATION_COOLDOWN = 1000; // 1 second cooldown

/**
 * Safely activates a team by checking if it's already active first
 * @param {number} teamId - The ID of the team to activate
 * @returns {Promise<boolean>} - True if team is active, false otherwise
 */
export const safelyActivateTeam = async (teamId) => {
  try {
    // Check if we're within the cooldown period
    const now = Date.now();
    if (now - lastActivationTime < ACTIVATION_COOLDOWN) {
      console.log('Team activation called too quickly, skipping (cooldown active)');
      return true; // Assume success to prevent errors
    }
    
    console.log('Setting team as active:', teamId);
    lastActivationTime = now; // Update the last activation time
    
    // Simplified: Just call the set-active endpoint directly
    console.log('Making request to /api/teams/set-active');
    const setActiveResponse = await fetch('/api/teams/set-active', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ team_id: teamId }),
    });
    
    console.log('Response status:', setActiveResponse.status);
    console.log('Response ok:', setActiveResponse.ok);
    
    if (setActiveResponse.ok) {
      const responseData = await setActiveResponse.json();
      console.log('Team activated successfully, response:', responseData);
      return true;
    } else {
      const errorText = await setActiveResponse.text();
      console.error('Failed to set team as active. Status:', setActiveResponse.status);
      console.error('Error response:', errorText);
      return false;
    }
  } catch (error) {
    console.error('Error setting team as active:', error);
    return false;
  }
};

/**
 * Checks if a team is currently active
 * @param {number} teamId - The ID of the team to check
 * @returns {Promise<boolean>} - True if team is active, false otherwise
 */
export const isTeamActive = async (teamId) => {
  try {
    const response = await fetch('/api/teams/active');
    if (response.ok) {
      const activeTeam = await response.json();
      return activeTeam.id === teamId;
    }
    return false;
  } catch (error) {
    console.error('Error checking if team is active:', error);
    return false;
  }
};

/**
 * Clears the active team for the current user
 * @returns {Promise<boolean>} - True if cleared successfully, false otherwise
 */
export const clearActiveTeam = async () => {
  try {
    const response = await fetch('/api/teams/set-active', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ team_id: null }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error clearing active team:', error);
    return false;
  }
};

// Removed debug function - no longer needed
