import React from 'react';

export default function SearchBar({ searchTerm, setSearchTerm }) {
  return (
    <input
      type="text"
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
      placeholder="Search hero..."
      className="ml-4 px-3 py-1 rounded bg-[#181A20] text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
      style={{ minWidth: 160 }}
    />
  );
} 