import React from 'react';

export default function HeroRoleTabs({ roleButtons, selectedType, setSelectedType }) {
  return (
    <>
      {roleButtons.map(type => (
        <button
          key={type}
          className={`px-4 py-1 text-sm font-semibold transition rounded ${selectedType === type ? 'text-blue-400 border-b-2 border-blue-400' : 'text-white hover:text-blue-400'}`}
          onClick={() => setSelectedType(type)}
        >
          {type}
        </button>
      ))}
    </>
  );
} 