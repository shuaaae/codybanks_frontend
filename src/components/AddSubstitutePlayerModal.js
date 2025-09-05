import React, { useState } from 'react';
import { buildApiUrl } from '../config/api';

const AddSubstitutePlayerModal = ({ 
  show, 
  onClose, 
  onAdd, 
  teamId, 
  existingPlayers = [],
  primaryPlayers = []
}) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    primary_player_id: '',
    substitute_order: 1,
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = ['exp', 'mid', 'jungler', 'gold', 'roam'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Player name is required';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    if (!formData.primary_player_id) {
      newErrors.primary_player_id = 'Primary player is required';
    }

    if (formData.substitute_order < 1) {
      newErrors.substitute_order = 'Substitute order must be at least 1';
    }

    // Check if name already exists for this role
    const existingPlayer = existingPlayers.find(p => 
      p.name.toLowerCase() === formData.name.toLowerCase() && 
      p.role === formData.role
    );
    
    if (existingPlayer) {
      newErrors.name = 'A player with this name and role already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(buildApiUrl('/players'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          team_id: teamId,
          is_substitute: true
        }),
      });

      if (response.ok) {
        const newPlayer = await response.json();
        onAdd(newPlayer);
        handleClose();
        resetForm();
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.message || 'Failed to add substitute player' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
      console.error('Error adding substitute player:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      primary_player_id: '',
      substitute_order: 1,
      notes: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getPrimaryPlayersForRole = (role) => {
    return primaryPlayers.filter(p => p.role === role && !p.is_substitute);
  };

  const getNextSubstituteOrder = (role) => {
    const existingSubs = existingPlayers.filter(p => 
      p.role === role && p.is_substitute
    );
    return existingSubs.length + 1;
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Add Substitute Player
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Player Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Player Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter player name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.role ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select role</option>
              {roles.map(role => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)} Lane
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="text-red-500 text-sm mt-1">{errors.role}</p>
            )}
          </div>

          {/* Primary Player */}
          {formData.role && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Player *
              </label>
              <select
                name="primary_player_id"
                value={formData.primary_player_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.primary_player_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select primary player</option>
                {getPrimaryPlayersForRole(formData.role).map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.role})
                  </option>
                ))}
              </select>
              {errors.primary_player_id && (
                <p className="text-red-500 text-sm mt-1">{errors.primary_player_id}</p>
              )}
            </div>
          )}

          {/* Substitute Order */}
          {formData.role && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Substitute Order
              </label>
              <input
                type="number"
                name="substitute_order"
                value={formData.substitute_order}
                onChange={handleInputChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.substitute_order ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={`Next available: ${getNextSubstituteOrder(formData.role)}`}
              />
              {errors.substitute_order && (
                <p className="text-red-500 text-sm mt-1">{errors.substitute_order}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Order when this substitute should be used (1st, 2nd, etc.)
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional information about this substitute player..."
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {errors.submit}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Substitute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubstitutePlayerModal;
