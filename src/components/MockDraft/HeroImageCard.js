import React, { useState } from 'react';
import Spinner from './Spinner';

export default function HeroImageCard({ hero, pendingSlot, setPendingSlot, assignedSlots, setAssignedSlots }) {
  const [loaded, setLoaded] = useState(false);
  const isSelectable = !!pendingSlot;
  
  function handleClick() {
    if (isSelectable && pendingSlot) {
      // Assign this hero to the pending slot
      setAssignedSlots(prev => {
        const updated = { ...prev };
        const arr = [...updated[pendingSlot.type]];
        arr[pendingSlot.index] = hero;
        updated[pendingSlot.type] = arr;
        return updated;
      });
      setPendingSlot(null);
    }
  }
  
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex flex-col items-center w-full max-w-[5rem] focus:outline-none group ${isSelectable ? 'ring-2 ring-blue-400' : ''}`}
      tabIndex={0}
      disabled={!isSelectable}
      style={isSelectable ? { cursor: 'pointer' } : {}}
    >
      <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden relative transition-transform group-hover:scale-105 group-active:scale-95" style={{ border: 'none', outline: 'none', boxShadow: 'none' }}>
        {!loaded && <Spinner />}
        <img
          src={`/heroes/${hero.role?.trim().toLowerCase()}/${hero.image}`}
          alt={hero.name}
          className={`w-16 h-16 rounded-full object-cover absolute top-0 left-0 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          draggable={false}
        />
      </div>
      <span className="text-xs text-white mt-1 text-center truncate w-full">{hero.name}</span>
    </button>
  );
} 