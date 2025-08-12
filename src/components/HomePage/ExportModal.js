import React, { useState } from 'react';
import { FaBolt, FaTimes, FaPlay } from 'react-icons/fa';
import DraftBoard from '../MockDraft/DraftBoard';

// Lane options
const LANE_OPTIONS = [
  { key: 'exp', label: 'Exp Lane' },
  { key: 'jungler', label: 'Jungler' },
  { key: 'mid', label: 'Mid Lane' },
  { key: 'gold', label: 'Gold Lane' },
  { key: 'roam', label: 'Roam' },
];

// Lane to hero type mapping for picks
const LANE_TYPE_MAP = {
  exp: 'Fighter',
  jungler: 'Assassin',
  mid: 'Mage',
  gold: 'Marksman',
  roam: 'Support', // or 'Tank' if you want both, but for now Support
};

export default function ExportModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onReset,
  banning,
  picks,
  turtleTakenBlue,
  setTurtleTakenBlue,
  turtleTakenRed,
  setTurtleTakenRed,
  lordTakenBlue,
  setLordTakenBlue,
  lordTakenRed,
  setLordTakenRed,
  notes,
  setNotes,
  playstyle,
  setPlaystyle,
  matchDate,
  setMatchDate,
  winner,
  setWinner,
  blueTeam,
  setBlueTeam,
  redTeam,
  setRedTeam,
  onBanClick,
  onPickClick,
  setBanning,
  setPicks,
  heroList = []
}) {
  const [showDraft, setShowDraft] = useState(false);

  // Mock Draft state for the draft interface
  const [currentStep, setCurrentStep] = useState(0);
  const [draftSteps, setDraftSteps] = useState([]);
  const [draftFinished, setDraftFinished] = useState(false);
  const [draftBans, setDraftBans] = useState({ blue: [], red: [] });
  const [draftPicks, setDraftPicks] = useState({ blue: [], red: [] });
  const [heroLoading, setHeroLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDraftSlot, setSelectedDraftSlot] = useState(null); // { type: 'ban'|'pick', team: 'blue'|'red', index: number }
  const [draftSlotSearch, setDraftSlotSearch] = useState(''); // For draft slot editing modal

  if (!isOpen) return null;

  const handleBackgroundClick = (e) => {
    // Only close if clicking directly on the background overlay
    // Don't close if clicking on modal content or inner modals
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle comprehensive draft for both teams
  const handleComprehensiveDraft = () => {
    // Initialize complete draft steps with proper MOBA draft order
    // Draft phase order: blue-red-blue-red-blue-red (ban), blue-red-blue-red-blue-red (pick), blue-red-blue-red (ban), blue-red-blue-red (pick)
    const completeDraftSteps = [
      // Ban Phase 1 (6 bans: blue-red-blue-red-blue-red)
      { type: 'ban', team: 'blue', step: 0, phase: 1 },
      { type: 'ban', team: 'red', step: 1, phase: 1 },
      { type: 'ban', team: 'blue', step: 2, phase: 1 },
      { type: 'ban', team: 'red', step: 3, phase: 1 },
      { type: 'ban', team: 'blue', step: 4, phase: 1 },
      { type: 'ban', team: 'red', step: 5, phase: 1 },
      
      // Pick Phase 1 (6 picks: blue-red-red-blue-blue-red)
      { type: 'pick', team: 'blue', lane: 'exp', label: 'Exp Lane', role: 'Fighter', step: 6, phase: 1 },
      { type: 'pick', team: 'red', lane: 'exp', label: 'Exp Lane', role: 'Fighter', step: 7, phase: 1 },
      { type: 'pick', team: 'red', lane: 'jungler', label: 'Jungler', role: 'Assassin', step: 8, phase: 1 },
      { type: 'pick', team: 'blue', lane: 'jungler', label: 'Jungler', role: 'Assassin', step: 9, phase: 1 },
      { type: 'pick', team: 'blue', lane: 'mid', label: 'Mid Lane', role: 'Mage', step: 10, phase: 1 },
      { type: 'pick', team: 'red', lane: 'mid', label: 'Mid Lane', role: 'Mage', step: 11, phase: 1 },
      
      // Ban Phase 2 (4 bans: red-blue-red-blue)
      { type: 'ban', team: 'red', step: 12, phase: 2 },
      { type: 'ban', team: 'blue', step: 13, phase: 2 },
      { type: 'ban', team: 'red', step: 14, phase: 2 },
      { type: 'ban', team: 'blue', step: 15, phase: 2 },
      
      // Pick Phase 2 (4 picks: red-blue-blue-red)
      { type: 'pick', team: 'red', lane: 'gold', label: 'Gold Lane', role: 'Marksman', step: 16, phase: 2 },
      { type: 'pick', team: 'blue', lane: 'gold', label: 'Gold Lane', role: 'Marksman', step: 17, phase: 2 },
      { type: 'pick', team: 'blue', lane: 'roam', label: 'Roam', role: 'Support', step: 18, phase: 2 },
      { type: 'pick', team: 'red', lane: 'roam', label: 'Roam', role: 'Support', step: 19, phase: 2 }
    ];
    
    setDraftSteps(completeDraftSteps);
    setCurrentStep(0);
    setDraftFinished(false);
    setDraftPicks({ blue: [], red: [] });
    setDraftBans({ blue: [], red: [] });
    setShowDraft(true);
  };

  // Handle hero selection in draft
  const handleHeroSelect = (hero) => {
    if (currentStep >= draftSteps.length) return;

    const currentDraftStep = draftSteps[currentStep];
    
    if (currentDraftStep.type === 'ban') {
      // Handle ban selection - find the next available slot (not skipped)
      setDraftBans(prev => {
        const currentTeamBans = prev[currentDraftStep.team] || [];
        // Find the next available slot index
        let nextSlotIndex = 0;
        while (nextSlotIndex < currentTeamBans.length && currentTeamBans[nextSlotIndex] !== null) {
          nextSlotIndex++;
        }
        
        // Create a new array with the hero placed in the next available slot
        const newBans = [...currentTeamBans];
        newBans[nextSlotIndex] = hero;
        
        return {
          ...prev,
          [currentDraftStep.team]: newBans
        };
      });
    } else if (currentDraftStep.type === 'pick') {
      // Handle pick selection - store the complete hero object directly (like bans)
      // Add lane information to the hero object
      const heroWithLane = {
        ...hero,
        lane: currentDraftStep.lane
      };

      setDraftPicks(prev => ({
        ...prev,
        [currentDraftStep.team]: [...prev[currentDraftStep.team], heroWithLane]
      }));
    }

    // Move to next step
    if (currentStep < draftSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Draft is complete
      setDraftFinished(true);
    }
  };

  // Handle skip ban function
  const handleSkipBan = () => {
    if (currentStep >= draftSteps.length) return;
    const currentDraftStep = draftSteps[currentStep];
    if (!currentDraftStep || currentDraftStep.type !== 'ban') return;
    
    // Add a null entry to mark this slot as skipped
    setDraftBans(prev => {
      const currentTeamBans = prev[currentDraftStep.team] || [];
      // Find the next available slot index
      let nextSlotIndex = 0;
      while (nextSlotIndex < currentTeamBans.length && currentTeamBans[nextSlotIndex] !== null) {
        nextSlotIndex++;
      }
      
      // Create a new array with null placed in the next available slot to mark it as skipped
      const newBans = [...currentTeamBans];
      newBans[nextSlotIndex] = null;
      
      return {
        ...prev,
        [currentDraftStep.team]: newBans
      };
    });
    
    // Just advance to the next step, don't assign a hero
    if (currentStep < draftSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setDraftFinished(true);
    }
  };

  // Handle draft completion
  const handleDraftComplete = () => {
    // Update the banning state - extract hero names from hero objects
    // Distribute bans: 3 in phase 1, 2 in phase 2 for each team
    const blueBans = draftBans.blue.map(hero => hero.name);
    const redBans = draftBans.red.map(hero => hero.name);
    
    setBanning({
      blue1: blueBans.slice(0, 3), // First 3 bans for phase 1
      blue2: blueBans.slice(3, 5), // Last 2 bans for phase 2
      red1: redBans.slice(0, 3),   // First 3 bans for phase 1
      red2: redBans.slice(3, 5)    // Last 2 bans for phase 2
    });

    // Update the picks state - extract hero names and lane info from hero objects
    const bluePicks = draftPicks.blue.map(hero => ({
      hero: hero.name,
      lane: hero.lane,
      role: hero.role
    }));
    const redPicks = draftPicks.red.map(hero => ({
      hero: hero.name,
      lane: hero.lane,
      role: hero.role
    }));

    setPicks({
      blue: {
        1: bluePicks.slice(0, 3), // First 3 picks for phase 1
        2: bluePicks.slice(3, 5)  // Last 2 picks for phase 2
      },
      red: {
        1: redPicks.slice(0, 3), // First 3 picks for phase 1
        2: redPicks.slice(3, 5)  // Last 2 picks for phase 2
      }
    });

    setShowDraft(false);
  };

  // Check if current slot is active
  const isActiveSlot = (slotType, slotTeam, slotIndex) => {
    if (currentStep >= draftSteps.length || draftFinished) return false;
    
    const currentDraftStep = draftSteps[currentStep];
    if (currentDraftStep.type !== slotType || currentDraftStep.team !== slotTeam) return false;
    
    // For ban slots, we need to determine which slot index this step corresponds to
    if (slotType === 'ban') {
      // Count how many non-null bans this team has made so far (excluding skipped slots)
      const teamBansSoFar = (draftBans[currentDraftStep.team] || []).filter(ban => ban !== null).length;
      
      // Find the next available slot index (where we would place the next ban)
      const currentTeamBans = draftBans[currentDraftStep.team] || [];
      let nextAvailableSlot = 0;
      while (nextAvailableSlot < currentTeamBans.length && currentTeamBans[nextAvailableSlot] !== null) {
        nextAvailableSlot++;
      }
      
      return slotIndex === nextAvailableSlot;
    }
    
    // For pick slots, use the lane order
    if (slotType === 'pick') {
      const laneOrder = ['exp', 'jungler', 'mid', 'gold', 'roam'];
      const currentLane = currentDraftStep.lane;
      const laneIndex = laneOrder.indexOf(currentLane);
      return slotIndex === laneIndex;
    }
    
    return false;
  };

  // Handle double-click to remove hero from slot
  const handleHeroRemove = (slotType, slotTeam, slotIndex) => {
    if (slotType === 'ban') {
      setDraftBans(prev => ({
        ...prev,
        [slotTeam]: prev[slotTeam].filter((_, index) => index !== slotIndex)
      }));
    } else if (slotType === 'pick') {
      setDraftPicks(prev => ({
        ...prev,
        [slotTeam]: prev[slotTeam].filter((_, index) => index !== slotIndex)
      }));
    }
  };

  // Handle clicking on draft slots for editing
  const handleDraftSlotClick = (slotType, slotTeam, slotIndex) => {
    setSelectedDraftSlot({ type: slotType, team: slotTeam, index: slotIndex });
  };

  // Handle hero selection for draft slot editing
  const handleDraftSlotEdit = (hero) => {
    if (!selectedDraftSlot) return;
    
    const { type, team, index } = selectedDraftSlot;
    
    if (type === 'ban') {
      setDraftBans(prev => {
        const currentTeamBans = prev[team] || [];
        const newBans = [...currentTeamBans];
        newBans[index] = hero;
        return { ...prev, [team]: newBans };
      });
    } else if (type === 'pick') {
      setDraftPicks(prev => {
        const currentTeamPicks = prev[team] || [];
        const newPicks = [...currentTeamPicks];
        newPicks[index] = hero;
        return { ...prev, [team]: newPicks };
      });
    }
    
    setSelectedDraftSlot(null);
  };

  // Get all banned and picked heroes for filtering
  const getAllBannedAndPickedHeroes = () => {
    const bannedHeroes = [];
    const pickedHeroes = [];
    
    // Get all banned heroes
    Object.values(draftBans).forEach(teamBans => {
      if (teamBans) {
        teamBans.forEach(hero => {
          if (hero && hero.name) {
            bannedHeroes.push(hero.name);
          }
        });
      }
    });
    
    // Get all picked heroes
    Object.values(draftPicks).forEach(teamPicks => {
      if (teamPicks) {
        teamPicks.forEach(hero => {
          if (hero && hero.name) {
            pickedHeroes.push(hero.name);
          }
        });
      }
    });
    
    return [...bannedHeroes, ...pickedHeroes];
  };

  return (
    <>
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black bg-opacity-70 animate-fadeIn">
        <div 
          style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', background: 'rgba(30, 41, 59, 0.85)', zIndex: 1000 }} 
          onClick={handleBackgroundClick} 
        />
        <div className="modal-box w-full max-w-[110rem] rounded-2xl shadow-2xl p-8 px-20" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1001, borderRadius: 24, background: '#101014', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
          {/* Focus trap to prevent date input from being auto-focused */}
          <button
            type="button"
            tabIndex={0}
            style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
            aria-hidden="true"
            id="modal-focus-trap"
          />
          <h2 className="text-2xl font-bold text-white mb-6">Data Draft Input</h2>
          
          {/* Comprehensive Draft Button */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white text-lg font-bold">Complete Draft</h3>
                <p className="text-blue-100 text-sm">Handle all bans and picks for both teams in one session</p>
                <p className="text-blue-200 text-xs mt-1">
                  Draft Order: Ban Phase 1 (6 bans) → Pick Phase 1 (6 picks) → Ban Phase 2 (4 bans) → Pick Phase 2 (4 picks)
                </p>
              </div>
              <button
                type="button"
                onClick={handleComprehensiveDraft}
                className="flex items-center gap-3 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
              >
                <FaPlay className="w-5 h-5" />
                Enter Complete Draft
              </button>
            </div>
          </div>

          <form className="space-y-6">
            <div className="grid grid-cols-7 gap-6 items-center text-white text-sm font-semibold mb-2">
              <label className="col-span-1">Date</label>
              <label className="col-span-1">Results</label>
              <label className="col-span-1">Team</label>
              <label className="col-span-1">Banning phase 1</label>
              <label className="col-span-1">Pick</label>
              <label className="col-span-1">Banning phase 2</label>
              <label className="col-span-1">Pick</label>
            </div>
            {/* Row 1: Blue Team */}
            <div className="grid grid-cols-7 gap-6 items-center mb-2">
              {/* Date Picker */}
              <div className="relative flex items-center bg-[#181A20] rounded px-2 py-1">
                <input
                  type="date"
                  className="bg-transparent text-white rounded w-full focus:outline-none pr-8"
                  id="match-date-input"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 focus:outline-none"
                  tabIndex={-1}
                  aria-label="Pick date"
                  onClick={() => document.getElementById('match-date-input').showPicker && document.getElementById('match-date-input').showPicker()}
                >
                  {/* SVG calendar icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 7.5h16.5M4.5 21h15a.75.75 0 00.75-.75V6.75A2.25 2.25 0 0018 4.5H6A2.25 2.25 0 003.75 6.75v13.5c0 .414.336.75.75.75z" />
                  </svg>
                </button>
              </div>
              {/* Winner Field */}
              <input 
                type="text" 
                placeholder="Winner" 
                className="bg-[#181A20] text-white rounded px-2 py-1 w-full focus:outline-none" 
                id="winner-input"
                value={winner}
                onChange={(e) => setWinner(e.target.value)}
              />
              {/* Blue Team */}
              <div className="flex items-center bg-[#181A20] rounded px-2 py-1">
                <span className="mr-2 text-blue-400 text-lg">🔵</span>
                <input 
                  type="text" 
                  placeholder="Blue Team" 
                  className="bg-transparent text-white rounded focus:outline-none w-full" 
                  id="blue-team-input"
                  value={blueTeam}
                  onChange={(e) => setBlueTeam(e.target.value)}
                />
              </div>
              {/* Banning Phase 1 */}
              <button
                type="button"
                className="w-full px-4 py-2 rounded-lg border border-current text-white font-semibold bg-transparent hover:bg-white/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => onBanClick('blue1')}
              >
                {banning.blue1.length === 0 ? 'Choose a hero to ban' : banning.blue1.join(', ')}
              </button>
              {/* Pick 1 */}
              <button
                type="button"
                className="w-full px-4 py-2 rounded-lg border border-current text-white font-semibold bg-transparent hover:bg-white/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => onPickClick('blue', 1)}
              >
                {Array.isArray(picks.blue[1]) && picks.blue[1].length > 0
                  ? picks.blue[1].filter(p => p && p.lane && p.hero).map(p => p.hero).join(', ')
                  : 'Choose a hero to pick'}
              </button>
              {/* Banning Phase 2 */}
              <button
                type="button"
                className="w-full px-4 py-2 rounded-lg border border-current text-white font-semibold bg-transparent hover:bg-white/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => onBanClick('blue2')}
              >
                {banning.blue2.length === 0 ? 'Choose a hero to ban' : banning.blue2.join(', ')}
              </button>
              {/* Pick 2 */}
              <button
                type="button"
                className="w-full px-4 py-2 rounded-lg border border-current text-white font-semibold bg-transparent hover:bg-white/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => onPickClick('blue', 2)}
              >
                {Array.isArray(picks.blue[2]) && picks.blue[2].length > 0
                  ? picks.blue[2].filter(p => p && p.lane && p.hero).map(p => p.hero).join(', ')
                  : 'Choose a hero to pick'}
              </button>
            </div>
            {/* Row 2: Red Team */}
            <div className="grid grid-cols-7 gap-6 items-center mb-2">
              {/* Empty cell for alignment */}
              <div></div>
              {/* Empty cell for alignment */}
              <div></div>
              {/* Red Team */}
              <div className="flex items-center bg-[#181A20] rounded px-2 py-1">
                <span className="mr-2 text-red-400 text-lg">🔴</span>
                <input 
                  type="text" 
                  placeholder="Red Team" 
                  className="bg-transparent text-white rounded focus:outline-none w-full" 
                  id="red-team-input"
                  value={redTeam}
                  onChange={(e) => setRedTeam(e.target.value)}
                />
              </div>
              {/* Banning Phase 1 */}
              <button
                type="button"
                className="w-full px-4 py-2 rounded-lg border border-current text-white font-semibold bg-transparent hover:bg-white/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => onBanClick('red1')}
              >
                {banning.red1.length === 0 ? 'Choose a hero to ban' : banning.red1.join(', ')}
              </button>
              {/* Pick 1 */}
              <button
                type="button"
                className="w-full px-4 py-2 rounded-lg border border-current text-white font-semibold bg-transparent hover:bg-white/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => onPickClick('red', 1)}
              >
                {Array.isArray(picks.red[1]) && picks.red[1].length > 0
                  ? picks.red[1].filter(p => p && p.lane && p.hero).map(p => p.hero).join(', ')
                  : 'Choose a hero to pick'}
              </button>
              {/* Banning Phase 2 */}
              <button
                type="button"
                className="w-full px-4 py-2 rounded-lg border border-current text-white font-semibold bg-transparent hover:bg-white/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => onBanClick('red2')}
              >
                {banning.red2.length === 0 ? 'Choose a hero to ban' : banning.red2.join(', ')}
              </button>
              {/* Pick 2 */}
              <button
                type="button"
                className="w-full px-4 py-2 rounded-lg border border-current text-white font-semibold bg-transparent hover:bg-white/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => onPickClick('red', 2)}
              >
                {Array.isArray(picks.red[2]) && picks.red[2].length > 0
                  ? picks.red[2].filter(p => p && p.lane && p.hero).map(p => p.hero).join(', ')
                  : 'Choose a hero to pick'}
              </button>
            </div>
            {/* Additional Fields */}
            <div className="grid grid-cols-2 gap-6">
              {/* Turtle Taken */}
              <div className="space-y-2">
                <label className="text-white text-sm font-semibold">Turtle Taken</label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">🔵</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={turtleTakenBlue}
                      onChange={(e) => setTurtleTakenBlue(e.target.value)}
                      className="w-16 px-2 py-1 bg-[#181A20] text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">🔴</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={turtleTakenRed}
                      onChange={(e) => setTurtleTakenRed(e.target.value)}
                      className="w-16 px-2 py-1 bg-[#181A20] text-white rounded focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  </div>
                </div>
              </div>
              {/* Lord Taken */}
              <div className="space-y-2">
                <label className="text-white text-sm font-semibold">Lord Taken</label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">🔵</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={lordTakenBlue}
                      onChange={(e) => setLordTakenBlue(e.target.value)}
                      className="w-16 px-2 py-1 bg-[#181A20] text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">🔴</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={lordTakenRed}
                      onChange={(e) => setLordTakenRed(e.target.value)}
                      className="w-16 px-2 py-1 bg-[#181A20] text-white rounded focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Notes and Playstyle */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-white text-sm font-semibold">Notes</label>
                <textarea
                  placeholder="Enter match notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#181A20] text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-white text-sm font-semibold">Playstyle</label>
                <textarea
                  placeholder="Enter playstyle notes..."
                  value={playstyle}
                  onChange={(e) => setPlaystyle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#181A20] text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  rows={3}
                />
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={onReset}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Export Match
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Mock Draft Modal */}
      {showDraft && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-90">
          <div className="w-full h-full flex items-center justify-center">
            <div className="relative w-full h-full flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center p-6 bg-[#23232a] border-b border-gray-700">
                <div>
                  <h3 className="text-white text-2xl font-bold">Complete Draft</h3>
                  <p className="text-gray-400 text-sm">
                    Draft all bans and picks for both teams
                  </p>
                </div>
                <div className="flex gap-3">
                  {/* Skip Ban Button - only show during banning phase */}
                  {!draftFinished && draftSteps[currentStep]?.type === 'ban' && (
                    <button
                      onClick={handleSkipBan}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Skip Ban
                    </button>
                  )}
                  <button
                    onClick={handleDraftComplete}
                    disabled={!draftFinished}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
                  >
                    Complete Draft
                  </button>
                  <button 
                    onClick={() => setShowDraft(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <FaTimes className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              {/* Mock Draft Board */}
              <div className="flex-1 overflow-hidden">
                <DraftBoard
                  currentStep={currentStep}
                  draftSteps={draftSteps}
                  draftFinished={draftFinished}
                  bans={draftBans}
                  picks={draftPicks}
                  heroList={heroList}
                  heroLoading={heroLoading}
                  selectedType={selectedType}
                  setSelectedType={setSelectedType}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  handleHeroSelect={handleHeroSelect}
                  isActiveSlot={isActiveSlot}
                  handleHeroRemove={handleHeroRemove}
                  handleDraftSlotClick={handleDraftSlotClick}
                  handleDraftSlotEdit={handleDraftSlotEdit}
                  isCompleteDraft={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Picker Modal for Draft Slot Editing */}
      {selectedDraftSlot && (
        <div className="fixed inset-0 z-[10003] flex items-center justify-center bg-black bg-opacity-80">
          <div className="modal-box w-full max-w-4xl bg-[#23232a] rounded-2xl shadow-2xl p-8">
            <h3 className="text-xl font-bold text-white mb-4">
              Select Hero for {selectedDraftSlot.team === 'blue' ? 'Blue' : 'Red'} Team {selectedDraftSlot.type === 'ban' ? 'Ban' : 'Pick'} (Slot {selectedDraftSlot.index + 1})
            </h3>
            
            {/* Search Bar */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Search Hero</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search heroes..."
                  value={draftSlotSearch}
                  onChange={(e) => setDraftSlotSearch(e.target.value)}
                  className="w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {/* Filtered Hero Grid */}
            <div className="grid grid-cols-8 gap-2 mb-6 max-h-[60vh] overflow-y-auto">
              {heroList
                .filter(hero => {
                  // Filter by search term
                  if (draftSlotSearch && !hero.name.toLowerCase().includes(draftSlotSearch.toLowerCase())) {
                    return false;
                  }
                  
                  // Filter out already banned/picked heroes
                  const bannedAndPickedHeroes = getAllBannedAndPickedHeroes();
                  if (bannedAndPickedHeroes.includes(hero.name)) {
                    return false;
                  }
                  
                  return true;
                })
                .map(hero => (
                  <button
                    key={hero.name}
                    type="button"
                    className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-transparent hover:border-blue-400 hover:bg-blue-900/20 text-white transition-all"
                    onClick={() => handleDraftSlotEdit(hero)}
                  >
                    <div className="w-16 h-16 rounded-full shadow-lg overflow-hidden flex items-center justify-center mb-2 bg-gradient-to-b from-blue-900 to-blue-700">
                      <img
                        src={`/public/heroes/${hero.role?.trim().toLowerCase()}/${hero.image}`}
                        alt={hero.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <span className="text-sm font-semibold text-center w-20 truncate">
                      {hero.name}
                    </span>
                  </button>
                ))}
            </div>
            
            <div className="flex justify-end gap-4">
              <button
                type="button"
                className="btn bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold"
                onClick={() => {
                  setSelectedDraftSlot(null);
                  setDraftSlotSearch('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 