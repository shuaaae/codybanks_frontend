/**
 * PlayerService - Centralized service for handling player CRUD operations
 * Provides a clean interface for all player-related API calls and data management
 */

import { buildApiUrl } from '../config/api';

class PlayerService {
  constructor() {
    this.baseUrl = buildApiUrl('/players');
    this.activeTeamId = null;
  }

  /**
   * Set the active team ID for API calls
   */
  setActiveTeamId(teamId) {
    this.activeTeamId = teamId;
  }

  /**
   * Get headers for API requests
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.activeTeamId) {
      headers['X-Active-Team-ID'] = this.activeTeamId;
    }
    
    return headers;
  }

  /**
   * CREATE - Create a new player
   */
  async createPlayer(playerData) {
    try {
      if (!this.activeTeamId) {
        throw new Error('No active team selected');
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...playerData,
          team_id: this.activeTeamId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create player (${response.status})`);
      }

      const result = await response.json();
      
      // Ensure we have a player object with an ID
      const player = result.player || result;
      if (!player.id) {
        throw new Error('Player created but no ID returned from server');
      }
      
      return {
        success: true,
        player: player,
        message: result.message || 'Player created successfully'
      };
    } catch (error) {
      console.error('Error creating player:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create player'
      };
    }
  }

  /**
   * READ - Get all players for the active team
   */
  async getPlayers() {
    try {
      const response = await fetch(`${this.baseUrl}?team_id=${this.activeTeamId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch players (${response.status})`);
      }

      const players = await response.json();
      return {
        success: true,
        players: players,
        message: 'Players fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching players:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch players',
        players: []
      };
    }
  }

  /**
   * READ - Get a specific player by ID
   */
  async getPlayer(playerId) {
    try {
      const response = await fetch(`${this.baseUrl}/${playerId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch player (${response.status})`);
      }

      const player = await response.json();
      return {
        success: true,
        player: player,
        message: 'Player fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching player:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch player'
      };
    }
  }

  /**
   * UPDATE - Update an existing player
   */
  async updatePlayer(playerId, updateData) {
    try {
      const response = await fetch(`${this.baseUrl}/${playerId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update player (${response.status})`);
      }

      const result = await response.json();
      
      // Ensure we have a player object with an ID
      const player = result.player || result;
      if (!player.id) {
        throw new Error('Player updated but no ID returned from server');
      }
      
      return {
        success: true,
        player: player,
        message: result.message || 'Player updated successfully'
      };
    } catch (error) {
      console.error('Error updating player:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to update player'
      };
    }
  }

  /**
   * DELETE - Delete a player
   */
  async deletePlayer(playerId) {
    try {
      console.log(`Attempting to delete player with ID: ${playerId}`);
      console.log('Delete URL:', `${this.baseUrl}/${playerId}`);
      console.log('Headers:', this.getHeaders());
      
      const response = await fetch(`${this.baseUrl}/${playerId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      console.log('Delete response status:', response.status);
      console.log('Delete response headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete failed with error:', errorData);
        throw new Error(errorData.error || `Failed to delete player (${response.status})`);
      }

      const result = await response.json();
      console.log('Delete successful with result:', result);
      
      return {
        success: true,
        message: result.message || 'Player deleted successfully',
        deletedPlayer: result.deleted_player || result.player,
        playerId: result.deleted_player?.id || result.player?.id
      };
    } catch (error) {
      console.error('Error deleting player:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete player'
      };
    }
  }

  /**
   * Upload player photo
   */
  async uploadPhoto(playerName, playerRole, photoFile) {
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('playerName', playerName);
      formData.append('playerRole', playerRole);

      const response = await fetch(`${this.baseUrl}/photo-by-name`, {
        method: 'POST',
        headers: {
          'X-Active-Team-ID': this.activeTeamId || ''
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload photo (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      return {
        success: true,
        photo: result.photo,
        player: result.player,
        message: 'Photo uploaded successfully'
      };
    } catch (error) {
      console.error('Error uploading photo:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to upload photo'
      };
    }
  }

  /**
   * Validate player data before submission
   */
  validatePlayerData(playerData, isUpdate = false) {
    const errors = [];

    if (!isUpdate || playerData.name !== undefined) {
      if (!playerData.name || playerData.name.trim().length === 0) {
        errors.push('Player name is required');
      } else if (playerData.name.trim().length < 2) {
        errors.push('Player name must be at least 2 characters long');
      }
    }

    if (!isUpdate || playerData.role !== undefined) {
      if (!playerData.role || playerData.role.trim().length === 0) {
        errors.push('Player role is required');
      } else {
        const validRoles = ['exp', 'mid', 'jungler', 'gold', 'roam'];
        if (!validRoles.includes(playerData.role.toLowerCase())) {
          errors.push(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Normalize role values for consistency
   */
  normalizeRole(role) {
    if (!role) return role;
    
    const normalizedRole = role.toLowerCase().trim();
    
    const roleMap = {
      'exp': 'exp',
      'mid': 'mid',
      'jungler': 'jungler',
      'gold': 'gold',
      'roam': 'roam',
      
      
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
      
      'adc': 'gold',
      'marksman': 'gold',
      'gold_lane': 'gold',
      'goldlane': 'gold',
      'carry': 'gold',
      
      'support': 'roam',
      'roamer': 'roam',
      'roam_lane': 'roam',
      'roamlane': 'roam',
      
      
    };
    
    return roleMap[normalizedRole] || normalizedRole;
  }

  /**
   * Get user-friendly display names for roles
   */
  getRoleDisplayName(roleValue) {
    if (!roleValue) return 'No role assigned';
    
    const roleDisplayMap = {
      'exp': 'Exp Lane',
      'mid': 'Mid Lane',
      'jungler': 'Jungler',
      'gold': 'Gold Lane',
      'roam': 'Roam',
  
    };
    
    return roleDisplayMap[roleValue] || roleValue;
  }


}

// Create and export a singleton instance
const playerService = new PlayerService();
export default playerService;
