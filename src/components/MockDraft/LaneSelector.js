import React, { useState, useEffect, useRef } from 'react';
import expIcon from '../../assets/exp.png';
import jungleIcon from '../../assets/jungle.png';
import midIcon from '../../assets/mid.png';
import goldIcon from '../../assets/gold.png';
import roamIcon from '../../assets/roam.png';
import fillIcon from '../../assets/fill.png';

// Global state to track which dropdown is open
let globalOpenDropdownId = null;

const LANE_ICONS = {
  exp: expIcon,
  jungler: jungleIcon,
  mid: midIcon,
  gold: goldIcon,
  roam: roamIcon
};

const LANE_LABELS = {
  exp: 'Exp Lane',
  jungler: 'Jungler',
  mid: 'Mid Lane',
  gold: 'Gold Lane',
  roam: 'Roam'
};

export default function LaneSelector({ 
  currentLane, 
  onLaneSelect, 
  onLaneSwap,
  availableLanes, 
  team, 
  slotIndex,
  size = 'w-12 h-12',
  takenLanes = [], // Array of lanes already taken by other players
  allTeamLanes = [], // Array of all current lane selections for the team
  teamLanes = {} // Object containing all team lane selections: {0: 'exp', 1: 'jungler', etc.}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dropdownRef = useRef(null);
  
  // Create a unique ID for this dropdown instance
  const dropdownId = `${team}-${slotIndex}`;
  


  const handleLaneClick = (lane) => {
    console.log('LaneSelector: Lane clicked:', { lane, team, slotIndex, onLaneSelect, availableLanes });
    if (onLaneSelect) {
      console.log('LaneSelector: Calling onLaneSelect with:', { team, slotIndex, lane });
      onLaneSelect(team, slotIndex, lane);
    } else {
      console.log('LaneSelector: onLaneSelect is undefined!');
    }
    setIsOpen(false);
    globalOpenDropdownId = null;
  };

  // Drag and drop handlers
  const handleDragStart = (e) => {
    if (!currentLane) {
      e.preventDefault();
      return; // Can't drag if no lane is assigned
    }
    
    console.log('Drag started for lane:', currentLane, 'at slot:', slotIndex, 'team:', team);
    
    e.dataTransfer.setData('text/plain', JSON.stringify({
      team,
      slotIndex,
      lane: currentLane
    }));
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    
    // Create a custom drag image
    const dragImage = e.target.cloneNode(true);
    dragImage.style.transform = 'rotate(5deg)';
    dragImage.style.opacity = '0.8';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.left = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 24, 24);
    
    // Clean up the drag image after a short delay
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
    console.log('Drag over lane at slot:', slotIndex, 'team:', team);
  };

  const handleDragLeave = (e) => {
    // Only set dragOver to false if we're actually leaving the element
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    console.log('Drop event triggered at slot:', slotIndex, 'team:', team);
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { team: sourceTeam, slotIndex: sourceSlotIndex } = dragData;
      
      console.log('Drop data:', dragData);
      
      // Only allow swapping within the same team
      if (sourceTeam === team && sourceSlotIndex !== slotIndex) {
        console.log(`LaneSelector: Dropping lane from slot ${sourceSlotIndex} to slot ${slotIndex} for ${team} team`);
        if (onLaneSwap) {
          onLaneSwap(team, sourceSlotIndex, slotIndex);
        } else {
          console.log('onLaneSwap function not provided');
        }
      } else {
        console.log('Invalid drop: different team or same slot');
      }
    } catch (error) {
      console.error('Error parsing drag data:', error);
    }
  };

  const toggleDropdown = (e) => {
    e?.stopPropagation();
    console.log('Toggle dropdown clicked, current isOpen:', isOpen);
    
    // If another dropdown is open, close it first
    if (globalOpenDropdownId && globalOpenDropdownId !== dropdownId) {
      // Trigger a custom event to close other dropdowns
      window.dispatchEvent(new CustomEvent('closeOtherDropdowns', { 
        detail: { exceptId: dropdownId } 
      }));
    }
    
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    if (newIsOpen) {
      globalOpenDropdownId = dropdownId;
    } else {
      globalOpenDropdownId = null;
    }
  };

  // Listen for events to close this dropdown when another one opens
  useEffect(() => {
    const handleCloseOtherDropdowns = (event) => {
      if (event.detail.exceptId !== dropdownId) {
        setIsOpen(false);
        if (globalOpenDropdownId === dropdownId) {
          globalOpenDropdownId = null;
        }
      }
    };

    window.addEventListener('closeOtherDropdowns', handleCloseOtherDropdowns);
    
    return () => {
      window.removeEventListener('closeOtherDropdowns', handleCloseOtherDropdowns);
    };
  }, [dropdownId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        if (globalOpenDropdownId === dropdownId) {
          globalOpenDropdownId = null;
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, dropdownId]);

  return (
    <>
      <div className="relative z-[9999] flex items-center gap-1" ref={dropdownRef}>
              {/* Lane icon or Fill icon - clickable and draggable */}
      {currentLane ? (
        <img
          src={LANE_ICONS[currentLane]}
          alt={`${currentLane} lane`}
          className={`${size} cursor-pointer hover:scale-110 transition-all duration-200 object-contain ${
            isDragging ? 'opacity-50 scale-95' : ''
          } ${
            dragOver ? 'ring-2 ring-blue-400 ring-opacity-75 scale-110' : ''
          }`}
          draggable={true}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onMouseDown={(e) => {
            e.stopPropagation();
            // Don't prevent default to allow drag to work
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            toggleDropdown(e);
          }}
          title={`Click to change lane or drag to swap with another lane (currently ${LANE_LABELS[currentLane]})`}
          style={{ pointerEvents: 'auto' }}
        />
      ) : (
        <img
          src={fillIcon}
          alt="Select lane"
          className={`${size} cursor-pointer hover:scale-110 transition-all duration-200 object-contain ${
            dragOver ? 'ring-2 ring-blue-400 ring-opacity-75 scale-110' : ''
          }`}
          draggable={false}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onMouseDown={(e) => {
            e.stopPropagation();
            // Don't prevent default to allow drag to work
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            toggleDropdown(e);
          }}
          title="Click to assign a lane or drop a lane here to swap"
          style={{ pointerEvents: 'auto' }}
        />
      )}
      </div>

      {/* Dropdown - positioned outside the button container */}
      {isOpen && (
        <>
          {/* Backdrop to prevent clicks behind */}
          <div 
            className="fixed inset-0 z-[9998] bg-transparent"
            onClick={() => setIsOpen(false)}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto' }}
          />
          <div 
            className="fixed z-[99999] bg-[#23232a] border border-gray-600 rounded-lg shadow-2xl p-2 min-w-[120px]"
            style={{ 
              left: (() => {
                const buttonRect = dropdownRef.current?.getBoundingClientRect();
                if (!buttonRect) return 0;
                
                const dropdownWidth = 120; // min-w-[120px]
                const margin = 8; // Smaller margin for container boundaries
                
                if (team === 'red') {
                  // For red team, position on the left side of the button
                  return buttonRect.left - dropdownWidth - margin;
                } else {
                  // For blue team, position on the right side of the button
                  return buttonRect.right + margin;
                }
              })(),
              top: (() => {
                const buttonRect = dropdownRef.current?.getBoundingClientRect();
                if (!buttonRect) return 0;
                
                const margin = 8;
                // Position below the button with small margin
                return buttonRect.bottom + margin;
              })(),
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Directional arrow indicator */}
            <div 
              className="absolute w-3 h-3 bg-[#23232a] transform rotate-45 z-[99999]"
              style={{
                top: -6,
                left: team === 'red' ? 'calc(100% - 18px)' : '18px',
                borderTop: '1px solid #4b5563',
                borderLeft: '1px solid #4b5563'
              }}
            />
          <div className="text-xs text-gray-400 mb-2 px-2">Select Lane:</div>
          {Object.entries(LANE_ICONS).map(([lane, icon]) => {
            // Check if this lane is already selected by anyone on the team
            let isLaneTaken = false;
            
            // Check takenLanes array
            if (takenLanes && takenLanes.includes(lane)) {
              isLaneTaken = true;
            }
            
            // Check allTeamLanes array
            if (allTeamLanes && allTeamLanes.includes(lane)) {
              isLaneTaken = true;
            }
            
            // Check teamLanes object (most reliable method)
            if (teamLanes) {
              Object.values(teamLanes).forEach(selectedLane => {
                if (selectedLane === lane) {
                  isLaneTaken = true;
                }
              });
            }
            
            // If lane is taken, don't show it at all
            if (isLaneTaken) {
              return null; // Completely hide this lane
            }
            
            return (
              <button
                key={lane}
                className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors text-white hover:bg-blue-900/30 cursor-pointer"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleLaneClick(lane);
                }}
                title={`Select ${LANE_LABELS[lane]}`}
              >
                <img
                  src={icon}
                  alt={`${lane} lane`}
                  className="w-6 h-6 object-contain"
                  draggable={false}
                />
                <span>{LANE_LABELS[lane]}</span>
              </button>
            );
          })}
          </div>
        </>
      )}
    </>
  );
}
