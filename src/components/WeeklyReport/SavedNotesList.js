import React from 'react';
import { FaTrash } from 'react-icons/fa';

export default function SavedNotesList({ 
  savedNotes, 
  sortOrder, 
  setSortOrder, 
  onDeleteNote, 
  onViewFullNote,
  formatDate,
  getSortedNotes 
}) {
  return (
    <div className="w-[900px] max-w-5xl mt-6">
      <div className="bg-[#23232a] rounded-xl shadow-lg p-6 border border-gray-700 max-h-72 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-gray-200 font-semibold text-lg">Saved Notes</h3>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Sort by:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-[#1a1a1f] text-white text-sm rounded px-3 py-1 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
        {savedNotes.length === 0 ? (
          <p className="text-gray-400 text-sm">No saved notes yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getSortedNotes().map((note) => (
              <div 
                key={note.id} 
                className="bg-[#1a1a1f] rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors cursor-pointer"
                onClick={() => onViewFullNote(note)}
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-white font-semibold text-sm truncate flex-1 mr-2">{note.title}</h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNote(note.id);
                    }}
                    className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                    title="Delete note"
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                </div>
                <div className="mt-2 text-center">
                  <span className="text-gray-400 text-xs">{formatDate(note.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 