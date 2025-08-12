import React from 'react';

// Lane options
const LANE_OPTIONS = [
  { key: 'exp', label: 'Exp Lane' },
  { key: 'jungler', label: 'Jungler' },
  { key: 'mid', label: 'Mid Lane' },
  { key: 'gold', label: 'Gold Lane' },
  { key: 'roam', label: 'Roam' },
];

export default function LaneSelectModal({ 
  open, 
  onClose, 
  onSelect, 
  availableLanes = LANE_OPTIONS, 
  currentPickSession 
}) {
  if (!open) return null;
  
  const showProgress = currentPickSession && currentPickSession.remainingPicks > 0;
  const teamColor = currentPickSession?.team === 'blue' ? 'blue' : 'red';
  const teamEmoji = currentPickSession?.team === 'blue' ? '🔵' : '🔴';
  
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const handleLaneClick = (laneKey) => {
    onSelect(laneKey);
  };

  const handleCancelClick = (e) => {
    e.stopPropagation();
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-80" onClick={handleModalClick}>
      <div className="modal-box w-full max-w-md bg-[#23232a] rounded-2xl shadow-2xl p-8" onClick={handleModalClick}>
        <h3 className="text-xl font-bold text-white mb-2">Select Lane</h3>
        
        {showProgress && (
          <div className="mb-4 p-3 bg-[#181A20] rounded-lg border border-gray-600">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white">
                {teamEmoji} {currentPickSession.team === 'blue' ? 'Blue' : 'Red'} Team - Phase {currentPickSession.pickNum}
              </span>
              <span className={`font-bold ${teamColor === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>
                {currentPickSession.remainingPicks} of {currentPickSession.maxPicks} picks remaining
              </span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-4">
          {availableLanes.map(lane => (
            <button
              key={lane.key}
              type="button"
              className="w-full px-4 py-2 rounded-lg border border-current text-white font-semibold bg-transparent hover:bg-blue-600 hover:text-white transition-colors duration-150"
              onClick={(e) => {
                e.stopPropagation();
                handleLaneClick(lane.key);
              }}
            >
              {lane.label}
            </button>
          ))}
        </div>
        <div className="flex justify-end mt-6">
          <button type="button" className="btn bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold" onClick={handleCancelClick}>Cancel</button>
        </div>
      </div>
    </div>
  );
} 