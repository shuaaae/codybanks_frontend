import React from 'react';
import LaneSelector from './LaneSelector';



export default function DraftSlots({ 
  type, 
  team, 
  heroes = [], 
  size = 'w-12 h-12', 
  isActiveSlot, 
  handleHeroRemove, 
  handleDraftSlotClick, 
  handleDraftSlotEdit, 
  isCompleteDraft = false,
  customLaneAssignments,
  onLaneSwap,
  heroList = []
}) {
  // Use custom lane assignments if available, otherwise fall back to fixed lane order
  const laneOrder = customLaneAssignments?.[team] || ['exp', 'jungler', 'mid', 'gold', 'roam'];
  
  // For red team ban slots, we need to reverse the order to fill from right to left
  const getSlotValue = (index) => {
    if (type === 'ban' && team === 'red') {
      // For red team bans, reverse the index to fill from right to left
      const reversedIndex = 4 - index; // 4, 3, 2, 1, 0
      return heroes[reversedIndex];
    }
    return heroes[index];
  };

  // turn slot value into a hero object (or null)
  const toHero = (slotVal) => {
    if (!slotVal) return null;
    // If it's already an object with hero properties, return it
    if (typeof slotVal === 'object' && slotVal.name) return slotVal;
    // If it's a string, find the hero object from the heroList
    if (typeof slotVal === 'string') {
      const heroFromList = heroList.find(hero => hero.name === slotVal);
      if (heroFromList) {
        return heroFromList;
      }
      // Fallback: return a simple object with the name
      return { name: slotVal, image: '', role: '' };
    }
    return slotVal;
  };
  
  const isSlotActive = (index) => {
    if (type === 'ban' && team === 'red') {
      // For red team bans, reverse the index for active slot check
      const reversedIndex = 4 - index;
      return isActiveSlot(type, team, reversedIndex);
    }
    return isActiveSlot(type, team, index);
  };
  
  const isSlotSkipped = (index) => getSlotValue(index) === null;
  const isSlotEmpty = (index) => getSlotValue(index) == null;
  
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => {
        const hero = toHero(getSlotValue(i));
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
            style={{ pointerEvents: 'auto', cursor: isCompleteDraft && hero ? 'pointer' : 'default' }}
          >
            {/* Lane icon for Red Team picks - show first, always visible for pick slots */}
            {type === 'pick' && team === 'red' && (
              <LaneSelector
                currentLane={currentLane}
                onLaneSwap={onLaneSwap}
                team={team}
                slotIndex={i}
                size="w-12 h-12"
              />
            )}
            
            {/* Hero icon */}
            <div
              className={`relative ${size} rounded-full bg-white/90 flex items-center justify-center overflow-hidden ${outline} ${isCompleteDraft ? 'hover:scale-105 transition-transform duration-200 cursor-pointer group' : ''}`}
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
                    src={`${process.env.REACT_APP_API_URL || 'https://api.coachdatastatistics.site'}/api/hero-image/${hero.role?.trim().toLowerCase()}/${encodeURIComponent(hero.image)}`}
                    alt={hero.name}
                    className="w-full h-full object-cover rounded-full transition-opacity duration-200"
                    draggable={false}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    loading="eager"
                    decoding="sync"
                    onLoad={(e) => {
                      e.target.style.opacity = '1';
                    }}
                    onError={(e) => {
                      console.log(`Failed to load image for ${hero.name}:`, e.target.src);
                      e.target.style.display = 'none';
                    }}
                    style={{ opacity: '0' }}
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
            {type === 'pick' && team === 'blue' && (
              <LaneSelector
                currentLane={currentLane}
                onLaneSwap={onLaneSwap}
                team={team}
                slotIndex={i}
                size="w-12 h-12"
              />
            )}
          </div>
        );
      })}
    </>
  );
} 