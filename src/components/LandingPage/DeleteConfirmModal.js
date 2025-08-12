import React from 'react';

export default function DeleteConfirmModal({
  showDeleteConfirmModal,
  teamToDelete,
  isDeletingTeam,
  handleConfirmDelete,
  handleCancelDelete
}) {
  if (!showDeleteConfirmModal) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4"
      onClick={handleCancelDelete}
    >
      <div 
        className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-gray-600 shadow-2xl w-[95vw] max-w-md flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-500/5 opacity-50"></div>
        
        {/* Close Button */}
        <button 
          className="absolute top-6 right-6 text-gray-400 hover:text-white text-2xl font-bold transition-colors duration-200 z-50 cursor-pointer hover:scale-110 bg-gray-800/50 rounded-full w-8 h-8 flex items-center justify-center" 
          onClick={handleCancelDelete}
          type="button"
        >
          ✕
        </button>
        
        {/* Header Section */}
        <div className="relative z-10 text-center p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-xl">
            <span className="text-3xl">🗑️</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-red-400 to-red-400 bg-clip-text text-transparent">
            Delete Team
          </h2>
          <p className="text-gray-300 text-sm">
            Are you sure you want to delete <strong className="text-white">{teamToDelete?.name}</strong>?
          </p>
          <p className="text-red-400 text-sm mt-2">
            This action cannot be undone.
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="relative z-10 px-8 pb-8">
          <div className="flex space-x-4">
            <button
              onClick={handleCancelDelete}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
              disabled={isDeletingTeam}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isDeletingTeam}
            >
              {isDeletingTeam ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </div>
              ) : (
                'Delete Team'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 