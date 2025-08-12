import React from 'react';
import { FaSave } from 'react-icons/fa';

export default function NotesEditor({ 
  noteTitle, 
  setNoteTitle, 
  notes, 
  setNotes, 
  onSaveNote 
}) {
  return (
    <div className="flex flex-col flex-1">
      <div className="bg-[#23232a] rounded-xl shadow-lg p-4 border border-gray-700 h-full">
        <label className="text-gray-200 font-semibold mb-2 block">Notes Title</label>
        <input
          type="text"
          className="bg-[#1a1a1f] text-white rounded-lg px-3 py-2 w-full border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3"
          placeholder="Enter note title..."
          value={noteTitle}
          onChange={e => setNoteTitle(e.target.value)}
        />
        <label className="text-gray-200 font-semibold mb-2 block">Notes Content</label>
        <textarea
          className="bg-[#1a1a1f] text-white rounded-lg p-3 resize-none border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full mb-3"
          style={{ height: 300, minHeight: 300 }}
          placeholder="Enter your notes here..."
          value={notes || ""}
          onChange={e => setNotes(e.target.value)}
        />
        <button
          onClick={onSaveNote}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <FaSave className="w-4 h-4" />
          Save Note
        </button>
      </div>
    </div>
  );
} 