import React from 'react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, match }) {
  if (!isOpen || !match) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80 animate-fadeIn">
      <div className="modal-box w-full max-w-md bg-[#23232a] rounded-2xl shadow-2xl p-8 animate-zoomIn">
        <h3 className="text-xl font-bold text-white mb-4">Delete Match</h3>
        <div className="mb-6">
          <p className="text-white mb-2">Are you sure you want to permanently delete this match?</p>
          <div className="bg-[#181A20] rounded-lg p-4 border border-gray-600">
            <div className="text-sm text-gray-300">
              <div><strong>Date:</strong> {match.match_date}</div>
              <div><strong>Winner:</strong> {match.winner}</div>
              <div><strong>Teams:</strong> {match.teams?.map(t => t.team).join(' vs ') || 'N/A'}</div>
            </div>
          </div>
          <p className="text-red-400 text-sm mt-3">
            ⚠️ This action cannot be undone. The match and all associated data will be permanently removed.
          </p>
        </div>
        <div className="flex justify-end gap-4">
          <button
            type="button"
            className="btn bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold"
            onClick={() => onConfirm(match.id)}
          >
            Delete Match
          </button>
          <button
            type="button"
            className="btn bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 