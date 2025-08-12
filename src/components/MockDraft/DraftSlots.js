import React from 'react';
import expIcon from '../../assets/exp.png';
import jungleIcon from '../../assets/jungle.png';
import midIcon from '../../assets/mid.png';
import goldIcon from '../../assets/gold.png';
import roamIcon from '../../assets/roam.png';

// Lane icons mapping
const getLaneIcon = (lane) => {
  const laneLower = lane?.toLowerCase();
  switch (laneLower) {
    case 'exp':
      return expIcon;
    case 'jungler':
      return jungleIcon;
    case 'mid':
      return midIcon;
    case 'gold':
      return goldIcon;
    case 'roam':
      return roamIcon;
    default:
      return null;
  }
};

export default function DraftSlots({ type, team, heroes = [], size = 'w-12 h-12', isActiveSlot, handleHeroRemove, handleDraftSlotClick, handleDraftSlotEdit, isCompleteDraft = false }) {
  // Define lane order for pick slots
  const laneOrder = ['exp', 'jungler', 'mid', 'gold', 'roam'];
  
  // For red team ban slots, we need to reverse the order to fill from right to left
  const getHeroForSlot = (index) => {
    if (type === 'ban' && team === 'red') {
      // For red team bans, reverse the index to fill from right to left
      const reversedIndex = 4 - index; // 4, 3, 2, 1, 0
      return heroes[reversedIndex];
    }
    return heroes[index];
  };
  
  const isSlotActive = (index) => {
    if (type === 'ban' && team === 'red') {
      // For red team bans, reverse the index for active slot check
      const reversedIndex = 4 - index;
      return isActiveSlot(type, team, reversedIndex);
    }
    return isActiveSlot(type, team, index);
  };
  
  const isSlotSkipped = (index) => {
    const hero = getHeroForSlot(index);
    return hero === null;
  };
  
  const isSlotEmpty = (index) => {
    const hero = getHeroForSlot(index);
    return hero === null || hero === undefined;
  };
  
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => {
        const hero = getHeroForSlot(i);
        const isActive = isSlotActive(i);
        const currentLane = laneOrder[i]; // Get lane for this slot position
        
        let outline = '';
        if (isActive && type === 'ban') outline = 'ring-4 ring-red-500';
        else if (isActive && type === 'pick' && team === 'blue') outline = 'ring-4 ring-blue-500';
        else if (isActive) outline = 'ring-4 ring-yellow-400';
        
        return (
          <div
            key={i}
            className={`m-1 flex items-center gap-1 ${type === 'pick' ? 'flex-row' : ''}`}
            style={{ pointerEvents: isCompleteDraft && hero ? 'auto' : 'none', cursor: isCompleteDraft && hero ? 'pointer' : 'default' }}
          >
            {/* Lane icon for Red Team picks - show first, always visible for pick slots */}
            {type === 'pick' && team === 'red' && getLaneIcon(currentLane) && (
              <div
                className="flex items-center justify-center"
                style={{ pointerEvents: 'none', cursor: 'default' }}
              >
                <img
                  src={getLaneIcon(currentLane)}
                  alt={`${currentLane} lane`}
                  className="w-12 h-12 object-contain"
                  draggable={false}
                />
              </div>
            )}
            
            {/* Hero icon */}
            <div
              className={`relative ${size} rounded-full bg-white/90 flex items-center justify-center overflow-hidden ${outline} ${isCompleteDraft ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''}`}
              onClick={isCompleteDraft ? () => {
                if (handleDraftSlotClick) {
                  if (type === 'ban' && team === 'red') {
                    // For red team bans, use the reversed index
                    const reversedIndex = 4 - i;
                    handleDraftSlotClick(type, team, reversedIndex);
                  } else {
                    handleDraftSlotClick(type, team, i);
                  }
                }
              } : undefined}
              title={isCompleteDraft ? 'Click to edit hero' : ''}
            >
              {hero ? (
                <>
                  <img
                    src={`/public/heroes/${hero.role?.trim().toLowerCase()}/${hero.image}`}
                    alt={hero.name}
                    className="w-full h-full object-cover rounded-full"
                    draggable={false}
                  />
                  {/* X icon overlay for banned hero */}
                  {type === 'ban' && (
                    <span
                      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                      style={{
                        fontSize: 26,
                        color: 'rgba(220, 38, 38, 0.85)',
                        fontWeight: 'bold',
                        textShadow: '0 2px 8px #000',
                      }}
                    >
                      &#10006;
                    </span>
                  )}
                </>
              ) : isSlotEmpty(i) ? (
                // Show empty slot indicator
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-2xl" style={{ color: type === 'ban' ? '#ef4444' : '#3b82f6' }}>
                  {type === 'ban' ? '🚫' : '?'}
                </span>
              ) : (
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none select-none text-2xl" style={{ color: type === 'ban' ? '#ef4444' : '#3b82f6' }}>
                  {type === 'ban' ? '🚫' : '?'}
                </span>
              )}
            </div>
            
            {/* Lane icon for Blue Team picks - show after hero, always visible for pick slots */}
            {type === 'pick' && team === 'blue' && getLaneIcon(currentLane) && (
              <div
                className="flex items-center justify-center"
                style={{ pointerEvents: 'none', cursor: 'default' }}
              >
                <img
                  src={getLaneIcon(currentLane)}
                  alt={`${currentLane} lane`}
                  className="w-12 h-12 object-contain"
                  draggable={false}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
} 