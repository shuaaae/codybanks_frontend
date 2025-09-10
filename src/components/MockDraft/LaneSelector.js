import React, { useState } from 'react';
import expIcon from '../../assets/exp.png';
import jungleIcon from '../../assets/jungle.png';
import midIcon from '../../assets/mid.png';
import goldIcon from '../../assets/gold.png';
import roamIcon from '../../assets/roam.png';
import fillIcon from '../../assets/fill.png';

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

// Define the fixed lane order for each slot
const FIXED_LANE_ORDER = ['exp', 'jungler', 'mid', 'gold', 'roam'];

export default function LaneSelector({ 
  currentLane, 
  onLaneSwap,
  team, 
  slotIndex,
  size = 'w-12 h-12'
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  // Use the current lane assignment for this slot
  const currentLaneForSlot = currentLane || FIXED_LANE_ORDER[slotIndex] || null;
  



  // Drag and drop handlers
  const handleDragStart = (e) => {
    if (!currentLaneForSlot) {
      e.preventDefault();
      return; // Can't drag if no lane is assigned
    }
    
    console.log('Drag started for lane:', currentLaneForSlot, 'at slot:', slotIndex, 'team:', team);
    
    e.dataTransfer.setData('text/plain', JSON.stringify({
      team,
      slotIndex,
      lane: currentLaneForSlot
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


  return (
    <div className="relative z-[9999] flex items-center gap-1">
      {/* Lane icon - draggable for swapping */}
      {currentLaneForSlot ? (
        <div
          className={`${size} cursor-move hover:scale-110 transition-all duration-200 ${
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
          title={`Drag to swap with another lane (${LANE_LABELS[currentLaneForSlot]})`}
          style={{ pointerEvents: 'auto' }}
        >
          <img
            src={LANE_ICONS[currentLaneForSlot]}
            alt={`${currentLaneForSlot} lane`}
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>
      ) : (
        <div
          className={`${size} object-contain opacity-50 ${
            dragOver ? 'ring-2 ring-blue-400 ring-opacity-75 scale-110' : ''
          }`}
          draggable={false}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          title="Drop a lane here to swap"
          style={{ pointerEvents: 'auto' }}
        >
          <img
            src={fillIcon}
            alt="No lane assigned"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}
