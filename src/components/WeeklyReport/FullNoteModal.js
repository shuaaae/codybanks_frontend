import React from 'react';

export default function FullNoteModal({ isOpen, onClose, note }) {
  if (!isOpen || !note) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 rounded-xl shadow-2xl p-0 w-full max-w-2xl mx-4 border border-gray-700 max-h-[90vh] flex flex-col animate-slideIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 rounded-t-xl flex justify-between items-center border-b border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Full Note</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-gray-900 rounded-b-xl flex-1 overflow-hidden flex flex-col">
          <div className="mb-4 flex-shrink-0">
            <h3 className="text-lg font-semibold text-white mb-2 break-words">{note.title}</h3>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 flex-1 overflow-y-auto overflow-x-hidden">
            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {note.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 