import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlay } from 'react-icons/fa';
import DraftBoard from '../MockDraft/DraftBoard';

// Import role icons
import expIcon from '../../assets/exp.png';
import midIcon from '../../assets/mid.png';
import junglerIcon from '../../assets/jungle.png';
import goldIcon from '../../assets/gold.png';
import roamIcon from '../../assets/roam.png';
import defaultPlayer from '../../assets/default.png';

// Role icon mapping
const ROLE_ICONS = {
  exp: expIcon,
  mid: midIcon,
  jungler: junglerIcon,
  gold: goldIcon,
  roam: roamIcon
};

// Role label mapping
const ROLE_LABELS = {
  exp: 'Exp Lane',
  mid: 'Mid Lane',
  jungler: 'Jungler',
  gold: 'Gold Lane',
  roam: 'Roam'
};

// Helper functions
const getRoleIcon = (role) => {
  const normalizedRole = role?.toLowerCase()?.trim();
  return ROLE_ICONS[normalizedRole] || midIcon; // Default to mid icon
};

const getRoleLabel = (role) => {
  const normalizedRole = role?.toLowerCase()?.trim();
  return ROLE_LABELS[normalizedRole] || 'Mid Lane'; // Default to mid lane
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
  heroList = [],
  isEditing = false,
  currentTeamName = '',
  matchMode = 'scrim'
}) {
  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [showDraft, setShowDraft] = useState(false);

  // Mock Draft state for the draft interface
  const [currentStep, setCurrentStep] = useState(0);
  const [draftSteps, setDraftSteps] = useState([]);
  const [draftFinished, setDraftFinished] = useState(false);
  const [draftBans, setDraftBans] = useState({ blue: [], red: [] });
  const [draftPicks, setDraftPicks] = useState({ blue: [], red: [] });
  const [heroLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDraftSlot, setSelectedDraftSlot] = useState(null); // { type: 'ban'|'pick', team: 'blue'|'red', index: number }
  const [draftSlotSearch, setDraftSlotSearch] = useState(''); // For draft slot editing modal

  // Add lane assignment state
  const [laneAssignments, setLaneAssignments] = useState({
    blue: [null, null, null, null, null], // [exp, jungler, mid, gold, roam]
    red: [null, null, null, null, null]
  });

  // Add custom lane assignments state for draft analysis
  const [customLaneAssignments, setCustomLaneAssignments] = useState({
    blue: [null, null, null, null, null], // [exp, jungler, mid, gold, roam]
    red: [null, null, null, null, null]
  });

  // Keep customLaneAssignments in sync with laneAssignments
  useEffect(() => {
    setCustomLaneAssignments(laneAssignments);
  }, [laneAssignments]);

  // Add state for lane assignment alert modal
  const [showLaneAlert, setShowLaneAlert] = useState(false);

  // Add state for player selection modal when multiple players exist for same role
  const [showPlayerSelection, setShowPlayerSelection] = useState(false);
  const [pendingLaneAssignment, setPendingLaneAssignment] = useState(null); // { team, slotIndex, lane }
  const [pendingHeroSelection, setPendingHeroSelection] = useState(null); // { hero, lane, team }
  const [availablePlayers, setAvailablePlayers] = useState([]); // Players available for the selected lane
  const [playerAssignments, setPlayerAssignments] = useState({
    blue: [null, null, null, null, null], // [exp_player, jungler_player, mid_player, gold_player, roam_player]
    red: [null, null, null, null, null]
  });

  // Get current team name for case-sensitive validation (if not provided as prop)
  const latestTeam = JSON.parse(localStorage.getItem('latestTeam') || '{}');
  const actualCurrentTeamName = currentTeamName || latestTeam.teamName || latestTeam.name || '';

  // Check if export should be disabled based on validation rules
  const isExportDisabled = () => {
    if (!actualCurrentTeamName) return false; // If no team name, allow export
    
    // Check if either team name matches the current team name (case-sensitive)
    const blueTeamMatches = blueTeam && blueTeam === actualCurrentTeamName;
    const redTeamMatches = redTeam && redTeam === actualCurrentTeamName;
    
    // Check if results field is valid (must be either team name or opponent name)
    const resultsValid = winner && (
      winner === actualCurrentTeamName || // Your team won
      winner === blueTeam || // Blue team won (if different from your team)
      winner === redTeam    // Red team won (if different from your team)
    );
    
    // Check if turtle and lord taken have values
    const objectivesValid = turtleTakenBlue !== '' && turtleTakenRed !== '' && 
                           lordTakenBlue !== '' && lordTakenRed !== '';
    
    // Check if complete draft is finished (all picks completed)
    const isDraftComplete = () => {
      // Check blue team picks
      const bluePicks1 = picks.blue[1] || [];
      const bluePicks2 = picks.blue[2] || [];
      const bluePicksComplete = bluePicks1.length >= 3 && bluePicks2.length >= 2;
      
      // Check red team picks
      const redPicks1 = picks.red[1] || [];
      const redPicks2 = picks.red[2] || [];
      const redPicksComplete = redPicks1.length >= 3 && redPicks2.length >= 2;
      
      return bluePicksComplete && redPicksComplete;
    };
    
    // Export is disabled if:
    // 1. Neither team matches the current team name, OR
    // 2. Results field is not valid, OR
    // 3. Turtle/Lord taken fields are empty, OR
    // 4. Complete draft is not finished
    return (!blueTeamMatches && !redTeamMatches) || 
           !resultsValid || 
           !objectivesValid || 
           !isDraftComplete();
  };



  // Auto-populate team names and player assignments when modal opens
  useEffect(() => {
          if (isOpen) {
        const latestTeam = JSON.parse(localStorage.getItem('latestTeam'));
        
        // Set default date to today if no date is set
        if (!matchDate) {
          setMatchDate(getTodayDate());
        }
        
        // Always keep team fields empty by default
      if (!blueTeam) {
        setBlueTeam('');
      }
      if (!redTeam) {
        setRedTeam('');
      }
      
      // Only reconstruct player assignments if editing
      if (isEditing && picks) {
        const reconstructedAssignments = {
          blue: [null, null, null, null, null],
          red: [null, null, null, null, null]
        };
        
        // Reconstruct from blue team picks
        if (picks.blue) {
          [1, 2].forEach(phase => {
            if (picks.blue[phase] && Array.isArray(picks.blue[phase])) {
              picks.blue[phase].forEach(pick => {
                if (pick && pick.lane && pick.player) {
                  const laneIndex = ['exp', 'jungler', 'mid', 'gold', 'roam'].indexOf(pick.lane);
                  if (laneIndex !== -1) {
                    reconstructedAssignments.blue[laneIndex] = pick.player;
                  }
                }
              });
            }
          });
        }
        
        // Reconstruct from red team picks
        if (picks.red) {
          [1, 2].forEach(phase => {
            if (picks.red[phase] && Array.isArray(picks.red[phase])) {
              picks.red[phase].forEach(pick => {
                if (pick && pick.lane && pick.player) {
                  const laneIndex = ['exp', 'jungler', 'mid', 'gold', 'roam'].indexOf(pick.lane);
                  if (laneIndex !== -1) {
                    reconstructedAssignments.red[laneIndex] = pick.player;
                  }
                }
              });
            }
          });
        }
        
        console.log('Reconstructed player assignments from existing picks:', reconstructedAssignments);
        setPlayerAssignments(reconstructedAssignments);
      }
      
      console.log(`Team fields initialized: Blue='${blueTeam}', Red='${redTeam}'`);
    }
  }, [isOpen, redTeam, blueTeam, isEditing, picks]);

  // Safety checks effect - runs when modal opens and when critical state changes
  useEffect(() => {
    if (isOpen) {
      // Run safety checks when modal opens
      handleSafetyChecks();
      
      // Log current state for debugging
      logDraftState();
    }
  }, [isOpen, draftBans, draftPicks, laneAssignments, playerAssignments]);



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
    // Initialize complete draft steps with flexible lane assignments
    // Draft phase order: blue-red-blue-red-blue-red (ban), blue-red-blue-red-blue-red (pick), blue-red-blue-red (ban), blue-red-blue-red (pick)
    const completeDraftSteps = [
      // Ban Phase 1 (6 bans: blue-red-blue-red-blue-red)
      { type: 'ban', team: 'blue', step: 0, phase: 1 },
      { type: 'ban', team: 'red', step: 1, phase: 1 },
      { type: 'ban', team: 'blue', step: 2, phase: 1 },
      { type: 'ban', team: 'red', step: 3, phase: 1 },
      { type: 'ban', team: 'blue', step: 4, phase: 1 },
      { type: 'ban', team: 'red', step: 5, phase: 1 },
      
      // Pick Phase 1 (6 picks: blue-red-red-blue-blue-red) - lanes will be determined by user assignments
      { type: 'pick', team: 'blue', step: 6, phase: 1, slotIndex: 0 },
      { type: 'pick', team: 'red', step: 7, phase: 1, slotIndex: 0 },
      { type: 'pick', team: 'red', step: 8, phase: 1, slotIndex: 1 },
      { type: 'pick', team: 'blue', step: 9, phase: 1, slotIndex: 1 },
      { type: 'pick', team: 'blue', step: 10, phase: 1, slotIndex: 2 },
      { type: 'pick', team: 'red', step: 11, phase: 1, slotIndex: 2 },
      
      // Ban Phase 2 (4 bans: red-blue-red-blue)
      { type: 'ban', team: 'red', step: 12, phase: 2 },
      { type: 'ban', team: 'blue', step: 13, phase: 2 },
      { type: 'ban', team: 'red', step: 14, phase: 2 },
      { type: 'ban', team: 'blue', step: 15, phase: 2 },
      
      // Pick Phase 2 (4 picks: red-blue-blue-red) - lanes will be determined by user assignments
      { type: 'pick', team: 'red', step: 16, phase: 2, slotIndex: 3 },
      { type: 'pick', team: 'blue', step: 17, phase: 2, slotIndex: 3 },
      { type: 'pick', team: 'blue', step: 18, phase: 2, slotIndex: 4 },
      { type: 'pick', team: 'red', step: 19, phase: 2, slotIndex: 4 }
    ];
    
    setDraftSteps(completeDraftSteps);
    setCurrentStep(0);
    setDraftFinished(false);
    
    // Initialize lane assignments - don't reset if editing
    if (!isEditing) {
      const initialLaneAssignments = {
        blue: [null, null, null, null, null], // Start with no lanes assigned
        red: [null, null, null, null, null]
      };
      setLaneAssignments(initialLaneAssignments);
      
      // CRITICAL: Reset player assignments to ensure clean state for new matches
      const initialPlayerAssignments = {
        blue: [null, null, null, null, null], // [exp_player, jungler_player, mid_player, gold_player, roam_player]
        red: [null, null, null, null, null]
      };
      setPlayerAssignments(initialPlayerAssignments);
    }
    // Load existing data if available (for both editing and new matches with existing data)
    const hasExistingData = (banning.blue1 && banning.blue1.length > 0) || 
                           (banning.blue2 && banning.blue2.length > 0) ||
                           (banning.red1 && banning.red1.length > 0) ||
                           (banning.red2 && banning.red2.length > 0) ||
                           (picks.blue && picks.blue[1] && picks.blue[1].length > 0) ||
                           (picks.blue && picks.blue[2] && picks.blue[2].length > 0) ||
                           (picks.red && picks.red[1] && picks.red[1].length > 0) ||
                           (picks.red && picks.red[2] && picks.red[2].length > 0);
    
    if (hasExistingData) {
        // Populate bans from existing data
        const existingBans = {
          blue: [
            ...(banning.blue1 || []),
            ...(banning.blue2 || [])
          ],
          red: [
            ...(banning.red1 || []),
            ...(banning.red2 || [])
          ]
        };
        
        // Populate picks from existing data
        const existingPicks = {
          blue: [
            ...(picks.blue?.[1] || []),
            ...(picks.blue?.[2] || [])
          ],
          red: [
            ...(picks.red?.[1] || []),
            ...(picks.red?.[2] || [])
          ]
        };
      

      
      // Convert hero names to hero objects for the draft
      const populateBans = (teamBans) => {
        return teamBans.map(heroName => {
          const hero = heroList.find(h => h.name === heroName);
          return hero || { name: heroName, role: 'Unknown' };
        });
      };
      
             const populatePicks = (teamPicks) => {
         if (!Array.isArray(teamPicks)) {
           return [];
         }
         return teamPicks.map((pick, index) => {
           const heroName = typeof pick === 'string' ? pick : pick.hero;
           const hero = heroList.find(h => h.name === heroName);
           
           // Determine lane based on pick phase and index
           let lane = pick.lane;
           if (!lane) {
             // If no lane info, determine based on pick phase and position
             if (index < 3) {
               // Phase 1 picks: exp, jungler, mid
               const phase1Lanes = ['exp', 'jungler', 'mid'];
               lane = phase1Lanes[index] || 'unknown';
             } else {
               // Phase 2 picks: gold, roam
               const phase2Lanes = ['gold', 'roam'];
               lane = phase2Lanes[index - 3] || 'unknown';
             }
           }
           
           return {
             ...hero,
             lane: lane
           };
         });
       };
      
      const populatedBans = {
        blue: populateBans(existingBans.blue),
        red: populateBans(existingBans.red)
      };
      
      const populatedPicks = {
        blue: populatePicks(existingPicks.blue),
        red: populatePicks(existingPicks.red)
      };
      

      
      setDraftBans(populatedBans);
      setDraftPicks(populatedPicks);
      

      
      // CRITICAL: Populate both lane and player assignments together to ensure consistency
      const populateAllAssignments = () => {
        const blueLanes = [null, null, null, null, null];
        const redLanes = [null, null, null, null, null];
        const bluePlayers = [null, null, null, null, null];
        const redPlayers = [null, null, null, null, null];
        
        // Extract lanes and players from populated picks (which are now flat arrays)
        if (populatedPicks.blue) {
          populatedPicks.blue.forEach((heroPick, pickIndex) => {
            if (heroPick && heroPick.lane && pickIndex < 5) {
              blueLanes[pickIndex] = heroPick.lane;
            }
            if (heroPick && heroPick.player && pickIndex < 5) {
              bluePlayers[pickIndex] = heroPick.player;
            }
          });
        }
        
        if (populatedPicks.red) {
          populatedPicks.red.forEach((heroPick, pickIndex) => {
            if (heroPick && heroPick.lane && pickIndex < 5) {
              redLanes[pickIndex] = heroPick.lane;
            }
            if (heroPick && heroPick.player && pickIndex < 5) {
              redPlayers[pickIndex] = heroPick.player;
            }
          });
        }
        
        // Set both states together to ensure consistency
        setLaneAssignments({
          blue: blueLanes,
          red: redLanes
        });
        
        setPlayerAssignments({
          blue: bluePlayers,
          red: redPlayers
        });
      };
      
      populateAllAssignments();
      

      
      // Mark draft as finished since we have existing data
      setDraftFinished(true);
      // Set current step to the end since draft is complete
      setCurrentStep(completeDraftSteps.length - 1);
    } else {
      // For new matches, start with empty draft
      setDraftPicks({ blue: [], red: [] });
      setDraftBans({ blue: [], red: [] });
    }
     
     // Ensure the main form state is synchronized with draft state
     setTimeout(() => {
       // Force a re-sync of the main form state with draft data
       if (isEditing) {
         // For editing, ensure the form reflects the draft data
         const updatedBanning = {
           blue1: draftBans.blue.slice(0, 3).filter(hero => hero && hero.name).map(hero => hero.name),
           blue2: draftBans.blue.slice(3, 5).filter(hero => hero && hero.name).map(hero => hero.name),
           red1: draftBans.red.slice(0, 3).filter(hero => hero && hero.name).map(hero => hero.name),
           red2: draftBans.red.slice(3, 5).filter(hero => hero && hero.name).map(hero => hero.name),
         };
         
         const updatedPicks = {
           blue: {
             1: draftPicks.blue.slice(0, 3).filter(hero => hero && hero.name).map((hero, index) => ({
               hero: hero.name,
               lane: laneAssignments.blue[index] || hero.lane || null,
               role: hero.role
             })),
             2: draftPicks.blue.slice(3, 5).filter(hero => hero && hero.name).map((hero, index) => ({
               hero: hero.name,
               lane: laneAssignments.blue[index + 3] || hero.lane || null,
               role: hero.role
             }))
           },
           red: {
             1: draftPicks.red.slice(0, 3).filter(hero => hero && hero.name).map((hero, index) => ({
               hero: hero.name,
               lane: laneAssignments.red[index] || hero.lane || null,
               role: hero.role
             })),
             2: draftPicks.red.slice(3, 5).filter(hero => hero && hero.name).map((hero, index) => ({
               hero: hero.name,
               lane: laneAssignments.red[index + 3] || hero.lane || null,
               role: hero.role
             }))
           }
         };
         
         setBanning(updatedBanning);
         setPicks(updatedPicks);
         console.log('Synchronized form state with draft data for editing:', { updatedBanning, updatedPicks });
       }
     }, 200);
    
    setShowDraft(true);
  };

  // Handle hero selection in draft
  const handleHeroSelect = (hero) => {
     // Prevent hero selection if draft is finished or step is invalid
     if (draftFinished || currentStep >= draftSteps.length) return;

    const currentDraftStep = draftSteps[currentStep];
    
    if (currentDraftStep.type === 'ban') {
      // Handle ban selection - place hero in the correct slot for this step
      const team = currentDraftStep.team;
      const phase = currentDraftStep.phase;
      
      // Calculate which slot this step should use
      let slotIndex;
      if (phase === 1) {
        // Phase 1: steps 0, 2, 4 for blue; steps 1, 3, 5 for red
        if (team === 'blue') {
          slotIndex = Math.floor(currentStep / 2); // 0, 1, 2
        } else {
          slotIndex = Math.floor((currentStep - 1) / 2); // 0, 1, 2
        }
      } else {
        // Phase 2: steps 12, 14 for red; steps 13, 15 for blue
        if (team === 'blue') {
          slotIndex = 3 + Math.floor((currentStep - 13) / 2); // 3, 4
        } else {
          slotIndex = 3 + Math.floor((currentStep - 12) / 2); // 3, 4
        }
      }
      
      setDraftBans(prev => {
        const currentTeamBans = [...(prev[team] || [])];
        
        // Ensure the array has enough slots
        while (currentTeamBans.length <= slotIndex) {
          currentTeamBans.push(null);
        }
        
        // Place the hero in the specific slot for this step
        currentTeamBans[slotIndex] = hero;
        
        console.log(`Placed ban for ${team} team at slot ${slotIndex}, step ${currentStep}, phase ${phase}`);
        
        return {
          ...prev,
          [team]: currentTeamBans
        };
      });
    } else if (currentDraftStep.type === 'pick') {
      // Handle pick selection - store the complete hero object directly (like bans)
      // Use the slotIndex from the draft step to determine which slot this pick goes into
      const slotIndex = currentDraftStep.slotIndex;
      
      // Use the custom lane assignment for this slot if available
      const actualLane = laneAssignments[currentDraftStep.team][slotIndex];
      
      if (!actualLane) {
         // If no lane is assigned yet, show a modal and don't proceed
         setShowLaneAlert(true);
        return;
      }
      
      // Check if there are multiple players for this lane and show player selection modal
      const latestTeam = JSON.parse(localStorage.getItem('latestTeam'));
      const activeTeamName = latestTeam?.teamName;
      
      console.log(`Checking players for ${actualLane} lane. Latest team:`, latestTeam);
      console.log(`Active team name: ${activeTeamName}, Current team: ${currentDraftStep.team}, Blue team: ${blueTeam}, Red team: ${redTeam}`);
      
      // Get players array - moved outside if block to fix scope issue
      const players = latestTeam?.players_data || latestTeam?.players || [];
      
      // Only check for players if this is the active team
      if (activeTeamName && (
        (currentDraftStep.team === 'blue' && blueTeam === activeTeamName) || 
        (currentDraftStep.team === 'red' && redTeam === activeTeamName)
      )) {
        console.log(`Found ${players.length} players for active team:`, players);
        
        // Find players with this role - use flexible matching
        const playersForRole = players.filter(p => {
          if (!p.role) return false;
          
          const playerRole = p.role.toLowerCase();
          const targetRole = actualLane.toLowerCase();
          
          // Check if player has the target role with flexible matching
          const hasTargetRole = playerRole === targetRole || 
                 playerRole.includes(targetRole) ||
                 (targetRole === 'exp' && (playerRole.includes('explane') || playerRole.includes('top'))) ||
                 (targetRole === 'mid' && (playerRole.includes('midlane') || playerRole.includes('mid'))) ||
                 (targetRole === 'jungler' && (playerRole.includes('jungle') || playerRole.includes('jungler'))) ||
                 (targetRole === 'gold' && (playerRole.includes('marksman') || playerRole.includes('gold') || playerRole.includes('adc'))) ||
                 (targetRole === 'roam' && (playerRole.includes('support') || playerRole.includes('roam')));
          
          console.log(`Checking player ${p.name} (${playerRole}) for role ${targetRole}: ${hasTargetRole}`);
          
          return hasTargetRole;
        });
        
        if (playersForRole.length > 1) {
          console.log(`Found ${playersForRole.length} players for role ${actualLane}:`, playersForRole);
          
          // IMPROVED: Ask for player assignment when hero is picked (not during lane assignment)
          // This is more intuitive - user picks hero, then decides who plays it
          setAvailablePlayers(playersForRole);
          setPendingHeroSelection({ hero, lane: actualLane, team: currentDraftStep.team });
          setShowPlayerSelection(true);
          return; // Don't proceed until player is selected
        } else if (playersForRole.length === 1) {
          console.log(`Found single player for role ${actualLane}:`, playersForRole[0]);
          // Single player - auto-assign
          const assignedPlayer = playersForRole[0];
          
          const heroWithLane = {
            ...hero,
            lane: actualLane,
            player: assignedPlayer
          };
          
          console.log(`Hero pick: ${hero.name} for ${actualLane} lane, auto-assigned player:`, assignedPlayer);

          setDraftPicks(prev => ({
            ...prev,
            [currentDraftStep.team]: [...prev[currentDraftStep.team], heroWithLane]
          }));
          
          // Update player assignments
          setPlayerAssignments(prev => {
            const laneIndex = ['exp', 'jungler', 'mid', 'gold', 'roam'].indexOf(actualLane);
            if (laneIndex !== -1) {
              const updated = { ...prev };
              updated[currentDraftStep.team][laneIndex] = assignedPlayer;
              return updated;
            }
            return prev;
          });
        } else {
          console.log(`No players found for role ${actualLane}. Available players:`, players);
          // No players for this role - show error
          alert(`No players found for ${actualLane} role. Please check your team configuration.`);
          return;
        }
      } else {
        console.log(`This is opponent team (${currentDraftStep.team}), no player selection needed`);
        // This is the opponent team - just assign the hero without player selection
        const heroWithLane = {
          ...hero,
          lane: actualLane,
          player: null
        };
        
        console.log(`Hero pick: ${hero.name} for ${actualLane} lane (opponent team - no player selection needed)`);

        setDraftPicks(prev => ({
          ...prev,
          [currentDraftStep.team]: [...prev[currentDraftStep.team], heroWithLane]
        }));
      }
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
    
    // Calculate which ban slot this step corresponds to
    const team = currentDraftStep.team;
    const phase = currentDraftStep.phase;
    
    // Determine the slot index based on the current step and phase
    let slotIndex;
    if (phase === 1) {
      // Phase 1: steps 0, 2, 4 for blue; steps 1, 3, 5 for red
      if (team === 'blue') {
        slotIndex = Math.floor(currentStep / 2); // 0, 1, 2
      } else {
        slotIndex = Math.floor((currentStep - 1) / 2); // 0, 1, 2
      }
    } else {
      // Phase 2: steps 12, 14 for red; steps 13, 15 for blue
      if (team === 'blue') {
        slotIndex = 3 + Math.floor((currentStep - 13) / 2); // 3, 4
      } else {
        slotIndex = 3 + Math.floor((currentStep - 12) / 2); // 3, 4
      }
    }
    
    // Mark this specific slot as skipped
    setDraftBans(prev => {
      const currentTeamBans = [...(prev[team] || [])];
      
      // Ensure the array has enough slots
      while (currentTeamBans.length <= slotIndex) {
        currentTeamBans.push(null);
      }
      
      // Mark the specific slot as skipped
      currentTeamBans[slotIndex] = null;
      
      console.log(`Skipped ban for ${team} team at slot ${slotIndex}, step ${currentStep}, phase ${phase}`);
      
      return {
         ...prev,
         [team]: currentTeamBans
       };
     });
     
     // Advance to the next step
     if (currentStep < draftSteps.length - 1) {
       setCurrentStep(prev => prev + 1);
     } else {
       setDraftFinished(true);
     }
   };

    // Handle draft completion
  const handleDraftComplete = () => {
    console.log('Draft completion - Current draft data:', { draftBans, draftPicks, laneAssignments });
    
    // Update the banning state - extract hero names from hero objects
    // Distribute bans: 3 in phase 1, 2 in phase 2 for each team
    const blueBans = draftBans.blue.filter(hero => hero && hero.name).map(hero => hero.name);
    const redBans = draftBans.red.filter(hero => hero && hero.name).map(hero => hero.name);
    
    console.log('Processed bans:', { blueBans, redBans });
    
    const newBanning = {
      blue1: blueBans.slice(0, 3), // First 3 bans for phase 1
      blue2: blueBans.slice(3, 5), // Last 2 bans for phase 2
      red1: redBans.slice(0, 3),   // First 3 bans for phase 1
      red2: redBans.slice(3, 5)    // Last 2 bans for phase 2
    };

         // Update the picks state - merge hero picks with lane assignments and player data
         // CRITICAL FIX: Use the laneAssignments state for dragged lane assignments
         const bluePicks = draftPicks.blue.filter(hero => hero && hero.name).map((hero, index) => {
           const pick = {
             hero: hero.name,
             lane: laneAssignments.blue[index] || hero.lane || null, // Use dragged lane assignment first
             role: hero.role,
             player: hero.player // Use the player that was stored when the hero was picked
           };
           console.log(`Blue pick ${index} (lane: ${pick.lane}, player: ${hero.player?.name || 'none'}):`, pick);
           return pick;
         });
         
         // CRITICAL: Update playerAssignments based on actual picks to ensure consistency
         const updatedPlayerAssignments = { ...playerAssignments };
         bluePicks.forEach(pick => {
           if (pick.lane && pick.player) {
             const laneIndex = ['exp', 'jungler', 'mid', 'gold', 'roam'].indexOf(pick.lane);
             if (laneIndex !== -1) {
               updatedPlayerAssignments.blue[laneIndex] = pick.player;
               console.log(`Updated playerAssignments for ${pick.lane} lane:`, pick.player.name);
             }
           }
         });
         
         const redPicks = draftPicks.red.filter(hero => hero && hero.name).map((hero, index) => {
           const pick = {
             hero: hero.name,
             lane: laneAssignments.red[index] || hero.lane || null, // Use dragged lane assignment first
             role: hero.role,
             player: hero.player || { name: `Opponent_${laneAssignments.red[index] || hero.lane || 'unknown'}`, role: laneAssignments.red[index] || hero.lane || 'unknown' } // Add placeholder for opponent team
           };
           console.log(`Red pick ${index} (lane: ${pick.lane}, player: ${pick.player.name}):`, pick);
           return pick;
         });

    console.log('Processed picks with lanes:', { bluePicks, redPicks });
    console.log('Final playerAssignments state:', { 
      blue: playerAssignments.blue, 
      red: playerAssignments.red 
    });
    console.log('Final laneAssignments state:', { 
      blue: laneAssignments.blue, 
      red: laneAssignments.red 
    });
    console.log('Raw draftPicks state:', draftPicks);

    const newPicks = {
      blue: {
        1: bluePicks.slice(0, 3), // First 3 picks for phase 1
        2: bluePicks.slice(3, 5)  // Last 2 picks for phase 2
       },
      red: {
        1: redPicks.slice(0, 3), // First 3 picks for phase 1
        2: redPicks.slice(3, 5)  // Last 2 picks for phase 2
       }
    };
    
     // Use functional state updates to ensure data consistency
     setBanning(prevBanning => {
       const updatedBanning = {
         ...prevBanning,
         ...newBanning
       };
       console.log('Updated banning state:', updatedBanning);
       return updatedBanning;
     });

     setPicks(prevPicks => {
       const updatedPicks = {
         ...prevPicks,
         ...newPicks
       };
       console.log('Updated picks state:', updatedPicks);
       return updatedPicks;
     });
     
     // CRITICAL: Update playerAssignments state to match actual picks
     setPlayerAssignments(updatedPlayerAssignments);
     console.log('Updated playerAssignments state to match actual picks:', updatedPlayerAssignments);

     // CRITICAL: Save lane assignments to customLaneAssignments for draft analysis
     setCustomLaneAssignments(laneAssignments);
     console.log('Saved lane assignments to customLaneAssignments:', laneAssignments);

     // Force a re-render to ensure state is updated before closing modal
     setTimeout(() => {
    setShowDraft(false);
     }, 100);
  };

  // Handle confirm with draft sync for editing
  const handleConfirmWithSync = () => {
    // Use current form state instead of draft state for editing
    // This ensures we always have the data even if user didn't click "Edit Draft"
    const finalBanning = {
      blue1: banning.blue1 || [],
      blue2: banning.blue2 || [],
      red1:  banning.red1  || [],
      red2:  banning.red2  || [],
    };

    // Merge player assignments with picks data to ensure specific players are included
    const mergePlayerAssignments = (teamPicks, teamName) => {
      const merged = { ...teamPicks };
      
      console.log(`Merging player assignments for ${teamName} team:`, {
        teamPicks,
        playerAssignments: playerAssignments[teamName]
      });
      
      // For each phase (1 and 2)
      [1, 2].forEach(phase => {
        if (merged[phase] && Array.isArray(merged[phase])) {
          merged[phase] = merged[phase].map(pick => {
            if (pick && pick.lane) {
              if (teamName === 'blue') {
                // For your team (blue), prioritize the player data already stored in the pick
                if (pick.player && (pick.player.name || (typeof pick.player === 'string' && pick.player))) {
                  // Pick already has player data - use it (this is the correct approach)
                  console.log(`Pick already has player data:`, pick.player);
                  return pick;
                }
                
                // Only fall back to playerAssignments if the pick doesn't have player data
                const laneIndex = ['exp', 'jungler', 'mid', 'gold', 'roam'].indexOf(pick.lane);
                console.log(`Processing ${teamName} pick for ${pick.lane} lane (index: ${laneIndex}):`, {
                  pick,
                  assignedPlayer: playerAssignments[teamName]?.[laneIndex]
                });
                
                if (laneIndex !== -1 && playerAssignments[teamName] && playerAssignments[teamName][laneIndex]) {
                  const result = {
                    ...pick,
                    player: playerAssignments[teamName][laneIndex]
                  };
                  console.log(`Updated pick with player assignment from state:`, result);
                  return result;
                } else {
                  console.warn(`No player assigned to ${pick.lane} lane for ${teamName} team`);
                }
              } else {
                // For opponent team (red), add placeholder player data
                if (!pick.player) {
                  return {
                    ...pick,
                    player: { name: `Opponent_${pick.lane}`, role: pick.lane }
                  };
                }
              }
            }
            return pick;
          });
        }
      });
      
      console.log(`Final merged picks for ${teamName} team:`, merged);
      return merged;
    };

    const finalPicks = {
      blue: mergePlayerAssignments(picks.blue || { 1: [], 2: [] }, 'blue'),
      red: mergePlayerAssignments(picks.red || { 1: [], 2: [] }, 'red'),
    };
    
    // Final safety check: ensure all picks have player data
    ['blue', 'red'].forEach(team => {
      [1, 2].forEach(phase => {
        if (finalPicks[team] && finalPicks[team][phase]) {
          finalPicks[team][phase] = finalPicks[team][phase].map(pick => {
            if (pick && !pick.player) {
              // Add placeholder player data for any missing assignments
              return {
                ...pick,
                player: { name: `Opponent_${pick.lane || 'unknown'}`, role: pick.lane || 'unknown' }
              };
            }
            return pick;
          });
        }
      });
    });

         console.log('Final data being sent to parent:', { 
       banning: finalBanning, 
       picks: finalPicks,
       playerAssignments: playerAssignments 
     });
     
     // Debug: Check if all picks have player data
     console.log('Validating picks data structure:');
     ['blue', 'red'].forEach(team => {
       [1, 2].forEach(phase => {
         if (finalPicks[team] && finalPicks[team][phase]) {
           finalPicks[team][phase].forEach((pick, index) => {
             console.log(`${team} team phase ${phase} pick ${index + 1}:`, {
               hero: pick.hero,
               lane: pick.lane,
               player: pick.player,
               hasPlayer: !!pick.player
             });
           });
         }
       });
     });

    // Validate data integrity before sending
    const validationErrors = validateDraftData(finalBanning, finalPicks);
    if (validationErrors.length > 0) {
      console.error('Draft data validation failed:', validationErrors);
      // Show detailed error message
      const errorMessage = validationErrors.join('\n');
      alert(`Match export failed:\n\n${errorMessage}\n\nPlease fix these issues and try again.`);
      return;
    }

    // Debug: Log the final data being sent
    console.log('ExportModal - Final data being sent to parent:', {
      banning: finalBanning,
      picks: finalPicks,
      isEditing
    });
    
    // Call parent with computed payload (do NOT rely on setState finishing)
    onConfirm({ banning: finalBanning, picks: finalPicks });
  };

  // Check if current slot is active
  const isActiveSlot = (slotType, slotTeam, slotIndex) => {
     // If draft is finished, no slots should be active
     if (draftFinished) return false;
     
     // If we've reached the end of draft steps, no slots should be active
     if (currentStep >= draftSteps.length) return false;
    
    const currentDraftStep = draftSteps[currentStep];
    if (currentDraftStep.type !== slotType || currentDraftStep.team !== slotTeam) return false;
    
    // For ban slots, we need to determine which slot index this step corresponds to
    if (slotType === 'ban') {
      const team = currentDraftStep.team;
      const phase = currentDraftStep.phase;
      
      // Calculate which slot this step should activate
      let expectedSlotIndex;
      if (phase === 1) {
        // Phase 1: steps 0, 2, 4 for blue; steps 1, 3, 5 for red
        if (team === 'blue') {
          expectedSlotIndex = Math.floor(currentStep / 2); // 0, 1, 2
        } else {
          expectedSlotIndex = Math.floor((currentStep - 1) / 2); // 0, 1, 2
        }
      } else {
        // Phase 2: steps 12, 14 for red; steps 13, 15 for blue
        if (team === 'blue') {
          expectedSlotIndex = 3 + Math.floor((currentStep - 13) / 2); // 3, 4
        } else {
          expectedSlotIndex = 3 + Math.floor((currentStep - 12) / 2); // 3, 4
        }
      }
      
      // Only activate the slot that corresponds to the current step
      return slotIndex === expectedSlotIndex;
    }
    
    // For pick slots, use the slotIndex from the draft step
    if (slotType === 'pick') {
      const currentDraftStep = draftSteps[currentStep];
      return currentDraftStep.slotIndex === slotIndex;
    }
    
    return false;
  };

  // IMPROVED: Handle double-click to remove hero from slot - preserves slot structure
  const handleHeroRemove = (slotType, slotTeam, slotIndex) => {
    if (slotType === 'ban') {
      // For bans, just clear the hero but keep the slot
      setDraftBans(prev => {
        const currentTeamBans = prev[slotTeam] || [];
        const newBans = [...currentTeamBans];
        newBans[slotIndex] = null; // Clear the hero but keep the slot
        return { ...prev, [slotTeam]: newBans };
      });
    } else if (slotType === 'pick') {
      // For picks, clear the hero but preserve lane and player assignments
      setDraftPicks(prev => {
        const currentTeamPicks = prev[slotTeam] || [];
        const existingPick = currentTeamPicks[slotIndex];
        
        if (existingPick) {
          // Preserve lane and player, only clear the hero
          const clearedPick = {
            ...existingPick,
            hero: null,
            name: null
          };
          
          console.log(`Cleared hero from pick at index ${slotIndex} for ${slotTeam} team:`, {
            oldPick: existingPick,
            clearedPick: clearedPick,
            preservedLane: clearedPick.lane,
            preservedPlayer: clearedPick.player
          });
          
          const newPicks = [...currentTeamPicks];
          newPicks[slotIndex] = clearedPick;
          return { ...prev, [slotTeam]: newPicks };
        }
        
        return prev;
      });
    }
    
    console.log(`Hero removed from ${slotType} slot ${slotIndex} on ${slotTeam} team`);
  };

  // Safe function to clear all heroes from a team while preserving structure
  const handleTeamClear = (team) => {
    // Clear all bans for the team
    setDraftBans(prev => ({
      ...prev,
      [team]: prev[team].map(() => null) // Clear heroes but keep slots
    }));
    
    // Clear all picks for the team but preserve lanes and players
    setDraftPicks(prev => ({
      ...prev,
      [team]: prev[team].map(pick => {
        if (pick) {
          return {
            ...pick,
            hero: null,
            name: null
          };
        }
        return null;
      })
    }));
    
    console.log(`Cleared all heroes from ${team} team while preserving structure`);
  };

  // Safe function to swap heroes between slots while preserving all other data
  const handleHeroSwap = (slotType, slotTeam, slotIndex1, slotIndex2) => {
    if (slotType === 'ban') {
      // Swap bans
      setDraftBans(prev => {
        const currentTeamBans = prev[slotTeam] || [];
        const newBans = [...currentTeamBans];
        const temp = newBans[slotIndex1];
        newBans[slotIndex1] = newBans[slotIndex2];
        newBans[slotIndex2] = temp;
        return { ...prev, [slotTeam]: newBans };
      });
    } else if (slotType === 'pick') {
      // Swap picks while preserving lanes and players
      setDraftPicks(prev => {
        const currentTeamPicks = prev[slotTeam] || [];
        const newPicks = [...currentTeamPicks];
        const temp = newPicks[slotIndex1];
        newPicks[slotIndex1] = newPicks[slotIndex2];
        newPicks[slotIndex2] = temp;
        return { ...prev, [slotTeam]: newPicks };
      });
    }
    
    console.log(`Swapped heroes between ${slotType} slots ${slotIndex1} and ${slotIndex2} on ${slotTeam} team`);
  };

  // Validation function to ensure draft structure integrity
  const validateDraftStructure = () => {
    const errors = [];
    
    // Validate bans structure
    Object.entries(draftBans).forEach(([team, bans]) => {
      if (!Array.isArray(bans)) {
        errors.push(`${team} team bans is not an array`);
      } else {
        bans.forEach((ban, index) => {
          if (ban && typeof ban !== 'object' && typeof ban !== 'string') {
            errors.push(`${team} team ban at index ${index} has invalid format`);
          }
        });
      }
    });
    
    // Validate picks structure
    Object.entries(draftPicks).forEach(([team, picks]) => {
      if (!Array.isArray(picks)) {
        errors.push(`${team} team picks is not an array`);
      } else {
        picks.forEach((pick, index) => {
          if (pick && typeof pick !== 'object') {
            errors.push(`${team} team pick at index ${index} is not an object`);
          } else if (pick && !pick.hasOwnProperty('hero') && !pick.hasOwnProperty('name')) {
            errors.push(`${team} team pick at index ${index} is missing hero/name property`);
          }
        });
      }
    });
    
    if (errors.length > 0) {
      console.error('Draft structure validation errors:', errors);
      return false;
    }
    
    console.log('Draft structure validation passed');
    return true;
  };

  // Safe function to restore a hero to a slot with validation
  const handleHeroRestore = (slotType, slotTeam, slotIndex, hero) => {
    if (!hero) {
      console.warn('Cannot restore null hero to slot');
      return false;
    }
    
    if (slotType === 'ban') {
      setDraftBans(prev => {
        const currentTeamBans = prev[slotTeam] || [];
        const newBans = [...currentTeamBans];
        newBans[slotIndex] = hero;
        return { ...prev, [slotTeam]: newBans };
      });
    } else if (slotType === 'pick') {
      setDraftPicks(prev => {
        const currentTeamPicks = prev[slotTeam] || [];
        const existingPick = currentTeamPicks[slotIndex];
        
        if (existingPick) {
          // Restore hero while preserving existing lane and player
          const restoredPick = {
            ...existingPick,
            hero: hero.name || hero,
            name: hero.name || hero
          };
          
          console.log(`Restored hero to pick at index ${slotIndex} for ${slotTeam} team:`, {
            restoredPick: restoredPick,
            preservedLane: restoredPick.lane,
            preservedPlayer: restoredPick.player
          });
          
          const newPicks = [...currentTeamPicks];
          newPicks[slotIndex] = restoredPick;
          return { ...prev, [slotTeam]: newPicks };
        } else {
          // Create new pick if none exists
          const newPick = {
            hero: hero.name || hero,
            name: hero.name || hero,
            lane: null,
            player: null
          };
          
          const newPicks = [...currentTeamPicks];
          newPicks[slotIndex] = newPick;
          return { ...prev, [slotTeam]: newPicks };
        }
      });
    }
    
    console.log(`Hero restored to ${slotType} slot ${slotIndex} on ${slotTeam} team`);
    return true;
  };

  // Safe function to duplicate a hero pick to another slot
  const handleHeroDuplicate = (slotType, slotTeam, sourceIndex, targetIndex) => {
    if (slotType === 'ban') {
      setDraftBans(prev => {
        const currentTeamBans = prev[slotTeam] || [];
        const sourceBan = currentTeamBans[sourceIndex];
        
        if (sourceBan) {
          const newBans = [...currentTeamBans];
          newBans[targetIndex] = sourceBan;
          return { ...prev, [slotTeam]: newBans };
        }
        
        return prev;
      });
    } else if (slotType === 'pick') {
      setDraftPicks(prev => {
        const currentTeamPicks = prev[slotTeam] || [];
        const sourcePick = currentTeamPicks[sourceIndex];
        
        if (sourcePick) {
          // Duplicate the pick with all its data (lane, player, etc.)
          const duplicatedPick = { ...sourcePick };
          
          console.log(`Duplicated pick from index ${sourceIndex} to ${targetIndex} for ${slotTeam} team:`, {
            sourcePick: sourcePick,
            duplicatedPick: duplicatedPick
          });
          
          const newPicks = [...currentTeamPicks];
          newPicks[targetIndex] = duplicatedPick;
          return { ...prev, [slotTeam]: newPicks };
        }
        
        return prev;
      });
    }
    
    console.log(`Hero duplicated from ${slotType} slot ${sourceIndex} to ${targetIndex} on ${slotTeam} team`);
  };

  // Comprehensive error recovery function to fix data structure issues
  const handleDataRecovery = () => {
    console.log('Starting data recovery process...');
    
    let recoveryActions = [];
    
    // Fix bans structure
    setDraftBans(prev => {
      const fixedBans = {};
      Object.entries(prev).forEach(([team, bans]) => {
        if (!Array.isArray(bans)) {
          fixedBans[team] = [];
          recoveryActions.push(`Fixed ${team} team bans: converted to array`);
        } else {
          fixedBans[team] = bans.map(ban => {
            if (ban && typeof ban !== 'object' && typeof ban !== 'string') {
              recoveryActions.push(`Fixed ${team} team ban: converted invalid format to null`);
              return null;
            }
            return ban;
          });
        }
      });
      return fixedBans;
    });
    
    // Fix picks structure
    setDraftPicks(prev => {
      const fixedPicks = {};
      Object.entries(prev).forEach(([team, picks]) => {
        if (!Array.isArray(picks)) {
          fixedPicks[team] = [];
          recoveryActions.push(`Fixed ${team} team picks: converted to array`);
        } else {
          fixedPicks[team] = picks.map(pick => {
            if (pick && typeof pick !== 'object') {
              recoveryActions.push(`Fixed ${team} team pick: converted invalid format to null`);
              return null;
            } else if (pick && !pick.hasOwnProperty('hero') && !pick.hasOwnProperty('name')) {
              // Add missing properties
              const fixedPick = {
                ...pick,
                hero: pick.hero || null,
                name: pick.name || null
              };
              recoveryActions.push(`Fixed ${team} team pick: added missing hero/name properties`);
              return fixedPick;
            }
            return pick;
          });
        }
      });
      return fixedPicks;
    });
    
    // Validate the recovered structure
    const isValid = validateDraftStructure();
    
    if (recoveryActions.length > 0) {
      console.log('Data recovery completed. Actions taken:', recoveryActions);
      if (isValid) {
        console.log('✅ Data structure is now valid');
      } else {
        console.warn('⚠️ Data structure still has issues after recovery');
      }
    } else {
      console.log('No data recovery actions needed');
    }
    
    return { success: isValid, actions: recoveryActions };
  };

  // Safe export function with comprehensive validation and recovery
  const handleSafeExport = () => {
    console.log('Starting safe export process...');
    
    // First, validate the current structure
    const isValid = validateDraftStructure();
    
    if (!isValid) {
      console.warn('Data structure validation failed. Attempting recovery...');
      const recovery = handleDataRecovery();
      
      if (!recovery.success) {
        console.error('❌ Data recovery failed. Cannot export safely.');
        alert('Data structure is corrupted and cannot be recovered. Please reset the draft.');
        return false;
      }
      
      console.log('✅ Data recovery successful. Proceeding with export...');
    }
    
    // Prepare the export data with safety checks
    const exportData = {
      bans: draftBans,
      picks: draftPicks,
      teamNames: {
        blue: blueTeam,
        red: redTeam
      },
      playerAssignments: playerAssignments,
      laneAssignments: laneAssignments,
      metadata: {
        exportTime: new Date().toISOString(),
        validationStatus: 'validated',
        dataIntegrity: 'verified'
      }
    };
    
    console.log('Export data prepared:', exportData);
    
    // Call the parent's onConfirm with the validated data
    if (onConfirm) {
      onConfirm(exportData);
      return true;
    }
    
    return false;
  };

  // Safe reset function that preserves team structure
  const handleSafeReset = () => {
    console.log('Starting safe reset process...');
    
    // Reset draft state while preserving team structure
    setDraftBans({ blue: [], red: [] });
    setDraftPicks({ blue: [], red: [] });
    setCurrentStep(0);
    setDraftFinished(false);
    
    // Reset lane and player assignments
    setLaneAssignments({
      blue: [null, null, null, null, null],
      red: [null, null, null, null, null]
    });
    
    setPlayerAssignments({
      blue: [null, null, null, null, null],
      red: [null, null, null, null, null]
    });
    
    // Reset modal states
    setShowPlayerSelection(false);
    setPendingLaneAssignment(null);
    setPendingHeroSelection(null);
    setAvailablePlayers([]);
    setSelectedDraftSlot(null);
    setDraftSlotSearch('');
    
    // Keep team names
    console.log('Draft reset completed. Team names preserved:', { blueTeam, redTeam });
  };

  // Comprehensive logging function for debugging
  const logDraftState = () => {
    console.group('📊 Current Draft State');
    console.log('Team Names:', { blueTeam, redTeam });
    console.log('Current Step:', currentStep);
    console.log('Draft Finished:', draftFinished);
    
    console.group('🚫 Bans');
    Object.entries(draftBans).forEach(([team, bans]) => {
      console.log(`${team} team:`, bans);
    });
    console.groupEnd();
    
    console.group('✅ Picks');
    Object.entries(draftPicks).forEach(([team, picks]) => {
      console.log(`${team} team:`, picks);
    });
    console.groupEnd();
    
    console.group('🛣️ Lane Assignments');
    Object.entries(laneAssignments).forEach(([team, lanes]) => {
      console.log(`${team} team:`, lanes);
    });
    console.groupEnd();
    
    console.group('👥 Player Assignments');
    Object.entries(playerAssignments).forEach(([team, players]) => {
      console.log(`${team} team:`, players);
    });
    console.groupEnd();
    
    console.group('🔧 Modal States');
    console.log('Player Selection Modal:', showPlayerSelection);
    console.log('Pending Lane Assignment:', pendingLaneAssignment);
    console.log('Pending Hero Selection:', pendingHeroSelection);
    console.log('Available Players:', availablePlayers);
    console.log('Selected Draft Slot:', selectedDraftSlot);
    console.groupEnd();
    
    console.groupEnd();
  };

  // Safety function to prevent data corruption and handle edge cases
  const handleSafetyChecks = () => {
    console.log('Running safety checks...');
    
    let issues = [];
    
    // Check for null/undefined values that could cause issues
    if (!draftBans || typeof draftBans !== 'object') {
      issues.push('Draft bans is null/undefined or not an object');
      setDraftBans({ blue: [], red: [] });
    }
    
    if (!draftPicks || typeof draftPicks !== 'object') {
      issues.push('Draft picks is null/undefined or not an object');
      setDraftPicks({ blue: [], red: [] });
    }
    
    if (!laneAssignments || typeof laneAssignments !== 'object') {
      issues.push('Lane assignments is null/undefined or not an object');
      setLaneAssignments({
        blue: [null, null, null, null, null],
        red: [null, null, null, null, null]
      });
    }
    
    if (!playerAssignments || typeof playerAssignments !== 'object') {
      issues.push('Player assignments is null/undefined or not an object');
      setPlayerAssignments({
        blue: [null, null, null, null, null],
        red: [null, null, null, null, null]
      });
    }
    
    // Check for invalid step values
    if (typeof currentStep !== 'number' || currentStep < 0) {
      issues.push('Current step is invalid');
      setCurrentStep(0);
    }
    
    // Check for invalid draft finished state
    if (typeof draftFinished !== 'boolean') {
      issues.push('Draft finished state is invalid');
      setDraftFinished(false);
    }
    
    if (issues.length > 0) {
      console.warn('Safety check issues found and fixed:', issues);
      return false;
    }
    
    console.log('✅ All safety checks passed');
    return true;
  };

  // Handle clicking on draft slots for editing
  const handleDraftSlotClick = (slotType, slotTeam, slotIndex) => {
    setSelectedDraftSlot({ type: slotType, team: slotTeam, index: slotIndex });
  };

  // IMPROVED: Handle hero selection for draft slot editing - preserves existing data
  const handleDraftSlotEdit = (hero) => {
    if (!selectedDraftSlot) return;
    
    const { type, team, index } = selectedDraftSlot;
    
    // Safety check: ensure the slot exists and is valid
    if (index < 0 || index > 9) { // Assuming max 10 slots per team
      console.error(`Invalid slot index: ${index}`);
      setSelectedDraftSlot(null);
      return;
    }
    
    if (type === 'ban') {
      // For bans, simply replace the hero
      setDraftBans(prev => {
        const currentTeamBans = prev[team] || [];
        
        // Ensure the array has enough slots
        const newBans = [...currentTeamBans];
        while (newBans.length <= index) {
          newBans.push(null);
        }
        
        newBans[index] = hero.name || hero; // Store hero name for backend compatibility
        return { ...prev, [team]: newBans };
      });
    } else if (type === 'pick') {
      // For picks, we need to handle the complex structure with lanes and players
      setDraftPicks(prev => {
        const currentTeamPicks = prev[team] || [];
        
        // Ensure the array has enough slots
        const newPicks = [...currentTeamPicks];
        while (newPicks.length <= index) {
          newPicks.push(null);
        }
        
        // Find the existing pick at this index
        const existingPick = newPicks[index];
        
        if (existingPick) {
          // Check if we need to handle player assignment for the new hero
          const lane = existingPick.lane;
          const existingPlayer = existingPick.player;
          
          if (lane && existingPlayer) {
            // Lane and player are already assigned - just update the hero
            const updatedPick = {
              ...existingPick,
              hero: hero.name || hero, // Store hero name for backend compatibility
              name: hero.name || hero // Ensure backward compatibility
            };
            
            console.log(`Editing pick at index ${index} for ${team} team:`, {
              oldPick: existingPick,
              newPick: updatedPick,
              preservedLane: updatedPick.lane,
              preservedPlayer: updatedPick.player
            });
            
            newPicks[index] = updatedPick;
            
            // Force immediate update by creating a new object reference
            const updatedState = { ...prev, [team]: newPicks };
            console.log(`Updated draft picks state:`, updatedState);
            return updatedState;
          } else if (lane && !existingPlayer) {
            // Lane is assigned but no player - need to check for multiple players
            const latestTeam = JSON.parse(localStorage.getItem('latestTeam'));
            const activeTeamName = latestTeam?.teamName;
            
            // Only check for players if this is the active team
            if (activeTeamName && (
              (team === 'blue' && blueTeam === activeTeamName) || 
              (team === 'red' && redTeam === activeTeamName)
            )) {
              const players = latestTeam?.players_data || latestTeam?.players || [];
              
              // Find players with this role
              const playersForRole = players.filter(p => {
                if (!p.role) return false;
                const playerRole = p.role.toLowerCase();
                const targetRole = lane.toLowerCase();
                
                return playerRole === targetRole || 
                       playerRole.includes(targetRole) ||
                       (targetRole === 'exp' && playerRole.includes('explane')) ||
                       (targetRole === 'mid' && playerRole.includes('midlane')) ||
                       (targetRole === 'jungler' && playerRole.includes('jungle')) ||
                       (targetRole === 'gold' && (playerRole.includes('marksman') || playerRole.includes('gold'))) ||
                       (targetRole === 'roam' && playerRole.includes('support'));
              });
              
              if (playersForRole.length > 1) {
                // Multiple players - ask user to choose
                setAvailablePlayers(playersForRole);
                setPendingHeroSelection({ hero, lane, team, isEditing: true, editIndex: index });
                setShowPlayerSelection(true);
                
                // Don't update picks yet - wait for player selection
                return prev;
              } else if (playersForRole.length === 1) {
                // Single player - auto-assign
                const assignedPlayer = playersForRole[0];
                const updatedPick = {
                  ...existingPick,
                  hero: hero.name || hero, // Store hero name for backend compatibility
                  name: hero.name || hero,
                  player: assignedPlayer
                };
                
                console.log(`Auto-assigned player ${assignedPlayer.name} to edited hero ${hero.name}`);
                
                newPicks[index] = updatedPick;
                // Force immediate update by creating a new object reference
                const updatedState = { ...prev, [team]: newPicks };
                console.log(`Auto-assigned player and updated draft picks state:`, updatedState);
                return updatedState;
              }
            }
            
            // Fallback - just update the hero without player
            const updatedPick = {
              ...existingPick,
              hero: hero.name || hero, // Store hero name for backend compatibility
              name: hero.name || hero
            };
            
            newPicks[index] = updatedPick;
            // Force immediate update by creating a new object reference
            const updatedState = { ...prev, [team]: newPicks };
            console.log(`Fallback update - updated draft picks state:`, updatedState);
            return updatedState;
          } else {
            // No lane assigned - just update the hero
            const updatedPick = {
              ...existingPick,
              hero: hero.name || hero, // Store hero name for backend compatibility
              name: hero.name || hero
            };
            
            newPicks[index] = updatedPick;
            // Force immediate update by creating a new object reference
            const updatedState = { ...prev, [team]: newPicks };
            console.log(`Fallback update - updated draft picks state:`, updatedState);
            return updatedState;
          }
        } else {
          // If no existing pick, create a new one
          console.log(`Creating new pick at index ${index} for ${team} team`);
          newPicks[index] = {
            hero: hero.name || hero, // Store hero name for backend compatibility
            name: hero.name || hero,
            lane: null, // Will need lane assignment
            player: null // Will need player assignment
          };
          return { ...prev, [team]: newPicks };
        }
      });
    }
    
    // Immediately close the hero picker modal
    setSelectedDraftSlot(null);
    setDraftSlotSearch('');
    console.log(`Hero edit completed for ${type} slot ${index} on ${team} team`);
  };

  // IMPROVED: Lane assignment handler - only assigns lanes, no player selection
  const handleLaneAssignment = (team, slotIndex, lane) => {
    // Simply assign the lane without asking for player selection
    // Player assignment will happen when a hero is picked (if multiple players exist)
    setLaneAssignments(prev => ({
      ...prev,
      [team]: prev[team].map((currentLane, idx) => 
        idx === slotIndex ? lane : currentLane
      )
    }));
    
    console.log(`Assigned ${lane} lane to slot ${slotIndex} for ${team} team`);
    
    // Note: Player assignment will be handled during hero selection
    // This ensures that the player is directly tied to the specific hero they'll play
  };

  // NEW: Handle lane swapping between slots via drag and drop
  const handleLaneSwap = (team, sourceSlotIndex, targetSlotIndex) => {
    if (sourceSlotIndex === targetSlotIndex) return; // No swap needed
    
    console.log(`Starting lane swap for ${team} team: slot ${sourceSlotIndex} <-> slot ${targetSlotIndex}`);
    
    // Update lane assignments
    setLaneAssignments(prev => {
      const newAssignments = { ...prev };
      const teamLanes = [...newAssignments[team]];
      
      // Swap the lanes
      const temp = teamLanes[sourceSlotIndex];
      teamLanes[sourceSlotIndex] = teamLanes[targetSlotIndex];
      teamLanes[targetSlotIndex] = temp;
      
      newAssignments[team] = teamLanes;
      
      console.log(`Swapped lanes between slots ${sourceSlotIndex} and ${targetSlotIndex} for ${team} team:`, {
        sourceLane: temp,
        targetLane: teamLanes[sourceSlotIndex]
      });
      
      return newAssignments;
    });

    // CRITICAL: Also swap the hero assignments in draftPicks to maintain hero-lane consistency
    setDraftPicks(prev => {
      const currentTeamPicks = [...(prev[team] || [])];
      
      // Get the heroes at both slots
      const sourceHero = currentTeamPicks[sourceSlotIndex];
      const targetHero = currentTeamPicks[targetSlotIndex];
      
      // Swap the heroes between slots
      currentTeamPicks[sourceSlotIndex] = targetHero;
      currentTeamPicks[targetSlotIndex] = sourceHero;
      
      console.log(`Swapped heroes between slots ${sourceSlotIndex} and ${targetSlotIndex} for ${team} team:`, {
        sourceHero: sourceHero?.name || 'empty',
        targetHero: targetHero?.name || 'empty'
      });
      
      return {
        ...prev,
        [team]: currentTeamPicks
      };
    });

    // CRITICAL: Also swap the player assignments to maintain player-lane consistency
    setPlayerAssignments(prev => {
      const currentTeamPlayers = [...(prev[team] || [])];
      
      // Get the players at both slots
      const sourcePlayer = currentTeamPlayers[sourceSlotIndex];
      const targetPlayer = currentTeamPlayers[targetSlotIndex];
      
      // Swap the players between slots
      currentTeamPlayers[sourceSlotIndex] = targetPlayer;
      currentTeamPlayers[targetSlotIndex] = sourcePlayer;
      
      console.log(`Swapped players between slots ${sourceSlotIndex} and ${targetSlotIndex} for ${team} team:`, {
        sourcePlayer: sourcePlayer?.name || 'empty',
        targetPlayer: targetPlayer?.name || 'empty'
      });
      
      return {
        ...prev,
        [team]: currentTeamPlayers
      };
    });
  };

  // Handle player selection when multiple players exist for same role
  const handlePlayerSelection = (selectedPlayer) => {
    if (pendingLaneAssignment) {
      // Handle lane assignment player selection
      const { team, slotIndex, lane } = pendingLaneAssignment;
      
      // Assign both lane and player
      setLaneAssignments(prev => ({
        ...prev,
        [team]: prev[team].map((currentLane, idx) => 
          idx === slotIndex ? lane : currentLane
        )
      }));
      
      setPlayerAssignments(prev => {
        const updated = {
          ...prev,
          [team]: prev[team].map((currentPlayer, idx) => 
            idx === slotIndex ? selectedPlayer : currentPlayer
          )
        };
        console.log(`Assigned ${selectedPlayer.name} to ${lane} lane (slot ${slotIndex}) for ${team} team`);
        console.log(`Updated playerAssignments for ${team}:`, updated[team]);
        console.log(`Lane mapping: slot ${slotIndex} = ${lane} lane`);
        return updated;
      });
      
      // Close modal and reset state
      setShowPlayerSelection(false);
      setPendingLaneAssignment(null);
      setAvailablePlayers([]);
    } else if (pendingHeroSelection) {
      // IMPROVED: Handle hero selection player assignment
      const { hero, lane, team, isEditing, editIndex } = pendingHeroSelection;
      
      if (isEditing && editIndex !== undefined) {
        // This is an edit operation - update the existing pick
        setDraftPicks(prev => {
          const currentTeamPicks = prev[team] || [];
          const existingPick = currentTeamPicks[editIndex];
          
          if (existingPick) {
            // Update the existing pick with the new hero and selected player
            const updatedPick = {
              ...existingPick,
              hero: hero.name || hero,
              name: hero.name || hero,
              player: selectedPlayer
            };
            
            console.log(`Updated edited pick at index ${editIndex}:`, {
              oldPick: existingPick,
              newPick: updatedPick
            });
            
            const newPicks = [...currentTeamPicks];
            newPicks[editIndex] = updatedPick;
            return { ...prev, [team]: newPicks };
          }
          
          return prev;
        });
        
        // Update player assignments for this lane
        const laneIndex = ['exp', 'jungler', 'mid', 'gold', 'roam'].indexOf(lane);
        if (laneIndex !== -1) {
          setPlayerAssignments(prev => {
            const updated = { ...prev };
            updated[team][laneIndex] = selectedPlayer;
            console.log(`Updated playerAssignments for ${lane} lane:`, selectedPlayer.name);
            return updated;
          });
        }
        
        // Close modal and reset state
        setShowPlayerSelection(false);
        setPendingHeroSelection(null);
        setAvailablePlayers([]);
        
        // Close the draft slot selection as well
        setSelectedDraftSlot(null);
        setDraftSlotSearch('');
        
        console.log(`Hero edit with player assignment completed for ${team} team at index ${editIndex}`);
      } else {
        // This is a new hero pick - add to draft picks
        const heroWithLane = {
          ...hero,
          lane: lane,
          player: selectedPlayer
        };
        
        console.log(`Hero pick: ${hero.name} for ${lane} lane, assigned player:`, selectedPlayer);
        
        // Add the hero pick to draft picks
        setDraftPicks(prev => ({
          ...prev,
          [team]: [...prev[team], heroWithLane]
        }));
        
        // Update player assignments for this lane
        const laneIndex = ['exp', 'jungler', 'mid', 'gold', 'roam'].indexOf(lane);
        if (laneIndex !== -1) {
          setPlayerAssignments(prev => {
            const updated = { ...prev };
            updated[team][laneIndex] = selectedPlayer;
            console.log(`Updated playerAssignments for ${lane} lane:`, selectedPlayer.name);
            return updated;
          });
        }
        
        // Close modal and reset state
        setShowPlayerSelection(false);
        setPendingHeroSelection(null);
        setAvailablePlayers([]);
        
        // Move to next step
        if (currentStep < draftSteps.length - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          // Draft is complete
          setDraftFinished(true);
        }
      }
    }
  };

  // Get all banned and picked heroes for filtering
  const getAllBannedAndPickedHeroes = () => {
    const banNames = [...(draftBans.blue||[]), ...(draftBans.red||[])]
      .map(h => h?.hero?.name ?? h?.name ?? h)
      .filter(Boolean);

    const pickNames = [...(draftPicks.blue||[]), ...(draftPicks.red||[])]
      .map(p => p?.hero?.name ?? p?.name ?? p)
      .filter(Boolean);

    return [...new Set([...banNames, ...pickNames])];
  };

   // Validate draft data integrity before sending to parent
   const validateDraftData = (banningData, picksData) => {
     const errors = [];
     
     // Team name validation is now handled at the button level
     
     // Validate that team names are not empty
     if (!blueTeam || blueTeam.trim() === '') {
       errors.push('Blue team name is required');
     }
     if (!redTeam || redTeam.trim() === '') {
       errors.push('Red team name is required');
     }
     
     // Validate banning data structure
     if (!banningData.blue1 || !Array.isArray(banningData.blue1)) {
       errors.push('Blue team phase 1 bans are missing or invalid');
     }
     if (!banningData.blue2 || !Array.isArray(banningData.blue2)) {
       errors.push('Blue team phase 2 bans are missing or invalid');
     }
     if (!banningData.red1 || !Array.isArray(banningData.red1)) {
       errors.push('Red team phase 1 bans are missing or invalid');
     }
     if (!banningData.red2 || !Array.isArray(banningData.red2)) {
       errors.push('Red team phase 2 bans are missing or invalid');
     }
     
     // Validate picks data structure
     if (!picksData.blue || !picksData.blue[1] || !picksData.blue[2]) {
       errors.push('Blue team picks structure is invalid');
     }
     if (!picksData.red || !picksData.red[1] || !picksData.red[2]) {
       errors.push('Red team picks structure is invalid');
     }
     
     // Validate that picks have both hero and lane
     const validatePicks = (teamPicks, teamName) => {
       if (Array.isArray(teamPicks[1])) {
         teamPicks[1].forEach((pick, index) => {
           if (!pick || !pick.hero || !pick.lane) {
             errors.push(`${teamName} team phase 1 pick ${index + 1} is missing hero or lane`);
           }
           // For opponent teams, player assignment is optional
           // For your team (CG), player assignment is required
           if (teamName === 'Blue' && !pick.player) {
             errors.push(`${teamName} team phase 1 pick ${index + 1} (${pick.lane}) is missing player assignment`);
           }
         });
       }
       if (Array.isArray(teamPicks[2])) {
         teamPicks[2].forEach((pick, index) => {
           if (!pick || !pick.hero || !pick.lane) {
             errors.push(`${teamName} team phase 2 pick ${index + 1} is missing hero or lane`);
           }
           // For opponent teams, player assignment is optional
           // For your team (CG), player assignment is required
           if (teamName === 'Blue' && !pick.player) {
             errors.push(`${teamName} team phase 2 pick ${index + 1} (${pick.lane}) is missing player assignment`);
           }
         });
       }
     };
     
     validatePicks(picksData.blue, 'Blue');
     validatePicks(picksData.red, 'Red');
     
     return errors;
   };

  return (
    <>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-70 animate-fadeIn">
        <div 
          style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', background: 'rgba(30, 41, 59, 0.85)', zIndex: 10001 }} 
          onClick={handleBackgroundClick} 
        />
        <div className="modal-box w-full max-w-[110rem] rounded-2xl shadow-2xl p-8 px-20" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10002, borderRadius: 24, background: '#101014', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
          {/* Focus trap to prevent date input from being auto-focused */}
          <button
            type="button"
            tabIndex={0}
            style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
            aria-hidden="true"
            id="modal-focus-trap"
          />
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-white">
                {isEditing ? 'Edit Match Data' : 'Data Draft Input'}
                {actualCurrentTeamName && (
                  <span className="text-2xl text-gray-300 font-normal ml-2">
                    for <span className="text-blue-300 font-semibold">{actualCurrentTeamName}</span>
                  </span>
                )}
              </h2>
              <div className="text-gray-400 text-sm bg-gray-800 px-3 py-1 rounded-lg border border-gray-600">
                ℹ️ Team names are case-sensitive
              </div>
            </div>
          </div>
          
          {/* Comprehensive Draft Button */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
            <div className="flex items-center justify-between">
                             <div>
                 <h3 className="text-white text-lg font-bold">
                   {isEditing ? 'Edit Draft' : 'Complete Draft'}
                 </h3>
                 <p className="text-blue-100 text-sm">
                   {isEditing 
                     ? 'Review and modify existing bans and picks for both teams'
                     : 'Handle all bans and picks for both teams in one session'
                   }
                 </p>
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
                 {isEditing ? 'Edit Draft' : 'Enter Complete Draft'}
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
              <div className="flex items-center gap-2">
                <div className="relative flex items-center bg-[#181A20] rounded px-2 py-1 flex-1">
                  <input
                    type="date"
                    className="bg-transparent text-white rounded w-full focus:outline-none pr-8"
                    id="match-date-input"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    max={getTodayDate()}
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
                <button
                  type="button"
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                  onClick={() => setMatchDate(getTodayDate())}
                  title="Set to today's date"
                >
                  Today
                </button>
              </div>

              {/* Winner Field */}
              <div className="flex-1">
                <input 
                  type="text" 
                  placeholder="Winner" 
                  className={`bg-[#181A20] text-white rounded px-2 py-1 w-full focus:outline-none ${
                    winner && actualCurrentTeamName && 
                    winner !== actualCurrentTeamName && 
                    winner !== blueTeam && 
                    winner !== redTeam
                      ? 'border-2 border-red-500' 
                      : ''
                  }`}
                  id="winner-input"
                  value={winner}
                  onChange={(e) => setWinner(e.target.value)}
                />
              </div>
              {/* Blue Team */}
              <div className="flex items-center bg-[#181A20] rounded px-2 py-1">
                <span className="mr-2 text-blue-400 text-lg">🔵</span>
                <div className="flex-1">
                  <input 
                    type="text" 
                    placeholder="Blue Team" 
                    className="bg-transparent text-white rounded focus:outline-none w-full"
                    id="blue-team-input"
                    value={blueTeam}
                    onChange={(e) => setBlueTeam(e.target.value)}
                  />
                </div>
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
              {/* Empty cell for Date column alignment */}
              <div></div>
              {/* Empty cell for Results column alignment */}
              <div></div>
              {/* Red Team - aligns with Team column */}
              <div className="flex items-center bg-[#181A20] rounded px-2 py-1">
                <span className="mr-2 text-red-400 text-lg">🔴</span>
                <div className="flex-1">
                  <input 
                    type="text" 
                    placeholder="Red Team" 
                    className="bg-transparent text-white rounded focus:outline-none w-full" 
                    id="red-team-input"
                    value={redTeam}
                    onChange={(e) => setRedTeam(e.target.value)}
                  />
                </div>
              </div>
              {/* Banning Phase 1 */}
              <button
                type="button"
                className="w-full px-4 py-2 rounded-lg border border-current text-white font-semibold bg-transparent hover:bg-white/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-400"
                onClick={() => onBanClick('red1')}
              >
                {banning.red1.length === 0 ? 'Choose a hero to ban' : banning.red1.join(', ')}
              </button>
              {/* Pick 1 */}
              <button
                type="button"
                className="w-full px-4 py-2 rounded-lg border border-current text-white font-semibold bg-transparent hover:bg-white/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-400"
                onClick={() => onPickClick('red', 1)}
              >
                {Array.isArray(picks.red[1]) && picks.red[1].length > 0
                  ? picks.red[1].filter(p => p && p.lane && p.hero).map(p => p.hero).join(', ')
                  : 'Choose a hero to pick'}
              </button>
              {/* Banning Phase 2 */}
              <button
                type="button"
                className="w-full px-4 py-2 rounded-lg border border-current text-white font-semibold bg-transparent hover:bg-white/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-400"
                onClick={() => onBanClick('red2')}
              >
                {banning.red2.length === 0 ? 'Choose a hero to ban' : banning.red2.join(', ')}
              </button>
              {/* Pick 2 */}
              <button
                type="button"
                className="w-full px-4 py-2 rounded-lg border border-current text-white font-semibold bg-transparent hover:bg-white/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-400"
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
                      type="text"
                      placeholder="0"
                      value={turtleTakenBlue}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow positive numbers and empty string
                        if (value === '' || (!isNaN(value) && parseInt(value) >= 0)) {
                          setTurtleTakenBlue(value);
                        }
                      }}
                      className="w-16 px-2 py-1 bg-[#181A20] text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">🔴</span>
                    <input
                      type="text"
                      placeholder="0"
                      value={turtleTakenRed}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow positive numbers and empty string
                        if (value === '' || (!isNaN(value) && parseInt(value) >= 0)) {
                          setTurtleTakenRed(value);
                        }
                      }}
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
                      type="text"
                      placeholder="0"
                      value={lordTakenBlue}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow positive numbers and empty string
                        if (value === '' || (!isNaN(value) && parseInt(value) >= 0)) {
                          setLordTakenBlue(value);
                        }
                      }}
                      className="w-16 px-2 py-1 bg-[#181A20] text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">🔴</span>
                    <input
                      type="text"
                      placeholder="0"
                      value={lordTakenRed}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow positive numbers and empty string
                        if (value === '' || (!isNaN(value) && parseInt(value) >= 0)) {
                          setLordTakenRed(value);
                        }
                      }}
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
                                   onClick={() => {
                    // Reset form data without closing modal
                    setMatchDate(getTodayDate());
                    setWinner('');
                    setBlueTeam('');
                   setRedTeam('');
                   setBanning({
                     blue1: [], blue2: [], red1: [], red2: []
                   });
                   setPicks({ blue: { 1: [], 2: [] }, red: { 1: [], 2: [] } });
                   setTurtleTakenBlue('');
                   setTurtleTakenRed('');
                   setLordTakenBlue('');
                   setLordTakenRed('');
                   setNotes('');
                   setPlaystyle('');
                 }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reset
              </button>
               <button
                 type="button"
                 onClick={onClose}
                 className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
               >
                 Cancel
               </button>
              <button
                type="button"
                onClick={handleConfirmWithSync}
                disabled={isExportDisabled()}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  isExportDisabled() 
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                title={isExportDisabled() ? `Requirements: One team name must match "${actualCurrentTeamName}" (case-sensitive), Results must be valid, Turtle/Lord taken must have values, and Complete Draft must be finished` : ''}
              >
                {isEditing ? 'Update Match' : 'Export Match'}
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
                   <h3 className="text-white text-2xl font-bold">
                     {isEditing ? 'Edit Match Draft' : 'Complete Draft'}
                   </h3>
                   <p className="text-gray-400 text-sm">
                     {isEditing 
                       ? 'Review and modify existing bans and picks for both teams'
                       : 'Draft all bans and picks for both teams'
                     }
                   </p>
                 </div>
                <div className="flex gap-3">
                   {/* Draft Status Message */}
                   {draftFinished && (
                     <div className="flex items-center px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg">
                       <span className="text-green-400 text-sm font-medium">
                         ✅ Draft Complete - Heroes are no longer selectable
                       </span>
                     </div>
                   )}
                   
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
                    {isEditing ? 'Save Changes' : 'Complete Draft'}
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
                  customLaneAssignments={customLaneAssignments}
                  onLaneReassign={handleLaneAssignment}
                  onLaneSwap={handleLaneSwap}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Picker Modal for Draft Slot Editing */}
      {selectedDraftSlot && (
        <div 
          className="fixed inset-0 z-[10003] flex items-center justify-center bg-black bg-opacity-80"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedDraftSlot(null);
              setDraftSlotSearch('');
            }
          }}
        >
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
                  if (bannedAndPickedHeroes.some(n => n?.toLowerCase() === hero.name.toLowerCase())) {
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
                        src={`${process.env.REACT_APP_API_URL || 'https://api.coachdatastatistics.site'}/api/hero-image/${hero.role?.trim().toLowerCase()}/${encodeURIComponent(hero.image)}`}
                        alt={hero.name}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          console.log(`Failed to load image for ${hero.name}:`, e.target.src);
                          // Fallback to direct API if proxy fails
                          e.target.src = `https://api.coachdatastatistics.site/heroes/${hero.role?.trim().toLowerCase()}/${hero.image}`;
                        }}
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
                className="btn bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold"
                onClick={() => {
                  // Remove the hero from the slot
                  if (selectedDraftSlot) {
                    handleHeroRemove(selectedDraftSlot.type, selectedDraftSlot.team, selectedDraftSlot.index);
                  }
                  setSelectedDraftSlot(null);
                  setDraftSlotSearch('');
                }}
              >
                Remove
              </button>
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

       {/* Lane Assignment Alert Modal */}
       {showLaneAlert && (
         <div className="fixed inset-0 z-[10004] flex items-center justify-center bg-black bg-opacity-80">
           <div className="modal-box w-full max-w-md bg-[#23232a] rounded-2xl shadow-2xl p-8">
             <div className="text-center">
               {/* Alert Icon */}
               <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 mb-4">
                 <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                 </svg>
               </div>
               
               {/* Alert Message */}
               <h3 className="text-xl font-bold text-white mb-4">
                 Lane Assignment Required
               </h3>
               <p className="text-gray-300 mb-6">
                 Please assign a lane to this slot before selecting a hero.
               </p>
               
               {/* Action Button */}
               <button
                 type="button"
                 onClick={() => setShowLaneAlert(false)}
                 className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
               >
                 Got it!
              </button>
            </div>
          </div>
        </div>
      )}

       {/* Player Selection Modal */}
       {showPlayerSelection && (
         <div className="fixed inset-0 z-[10005] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm animate-fadeIn">
           <div className="w-full max-w-lg bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-gray-600 shadow-2xl p-8 mx-4 animate-slideIn">
             <div className="text-center">
               {/* Header with Role Icon */}
               <div className="flex items-center justify-center gap-3 mb-6">
                 {/* Role Icon */}
                 {(() => {
                   const role = pendingLaneAssignment?.lane || pendingHeroSelection?.lane || 'mid';
                   const roleIcon = getRoleIcon(role);
                   const roleLabel = getRoleLabel(role);
                   
                   return (
                     <div className="relative">
                       {/* Outer glow effect */}
                       <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse" 
                            style={{ filter: 'blur(12px)', transform: 'scale(1.5)' }} />
                       {/* Inner glow effect */}
                       <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/30 to-purple-400/30 animate-pulse" 
                            style={{ filter: 'blur(8px)', transform: 'scale(1.3)' }} />
                       <div className="relative w-16 h-16 rounded-xl flex items-center justify-center border-2 border-blue-400/50"
                            style={{
                              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)',
                              boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                            }}>
                         <img 
                           src={roleIcon} 
                           alt={roleLabel} 
                           className="w-10 h-10 object-contain drop-shadow-lg" 
                         />
                       </div>
                     </div>
                   );
                 })()}
                 
                 {/* Title */}
                 <div className="text-left">
                   <h3 className="text-2xl font-bold text-white mb-1">
                     {pendingLaneAssignment ? (
                       `Select ${pendingLaneAssignment.lane} Player`
                     ) : pendingHeroSelection ? (
                       `Who will play ${pendingHeroSelection.hero.name}?`
                     ) : (
                       'Select Player'
                     )}
                   </h3>
                   <p className="text-blue-400 text-sm font-medium">
                     {(() => {
                       const role = pendingLaneAssignment?.lane || pendingHeroSelection?.lane || 'mid';
                       return getRoleLabel(role);
                     })()}
                   </p>
                 </div>
               </div>
               
               {/* Description */}
               <p className="text-gray-300 mb-8 text-center max-w-md mx-auto">
                 {pendingLaneAssignment ? (
                   'Multiple players found for this role. Choose who will play this lane in the current match.'
                 ) : pendingHeroSelection ? (
                   `Multiple players found for ${pendingHeroSelection.lane} role. Choose who will play ${pendingHeroSelection.hero.name}.`
                 ) : (
                   'Choose a player for this role.'
                 )}
               </p>
               
               {/* Match Context Info */}
               {pendingLaneAssignment && (
                 <div className="mb-6 p-4 rounded-xl border border-blue-500/30"
                      style={{
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)'
                      }}>
                   <div className="flex items-center justify-center gap-2 mb-2">
                     <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                     <span className="text-blue-400 text-sm font-medium">Match Context</span>
                   </div>
                   <p className="text-gray-300 text-sm">
                     This selection will be used for the current match draft. Consider player performance, hero synergy, and current form.
                   </p>
                 </div>
               )}
               
               {/* Player Options with Enhanced Styling */}
               <div className="space-y-4 mb-8">
                 {availablePlayers.map((player, index) => (
                   <button
                     key={player.name}
                     onClick={() => handlePlayerSelection(player)}
                     className="w-full group relative overflow-hidden"
                   >
                     <div className="relative p-4 rounded-2xl border-2 border-transparent transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                          style={{
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
                            backdropFilter: 'blur(10px)'
                          }}>
                       {/* Hover Effect Background */}
                       <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                       
                       {/* Player Content */}
                       <div className="relative flex items-center gap-4">
                         {/* Player Photo */}
                         <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-lg">
                           <img 
                             src={player.photo || defaultPlayer} 
                             alt={player.name}
                             className="w-full h-full object-cover"
                             onError={(e) => {
                               e.target.src = defaultPlayer;
                             }}
                           />
                         </div>
                         
                         {/* Player Info */}
                         <div className="flex-1 text-left">
                           <div className="flex items-center gap-3 mb-1">
                             <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors duration-300">
                               {player.name}
                             </h4>
                             {/* Role Badge */}
                             <span className="px-2 py-1 text-xs font-medium rounded-full"
                                   style={{
                                     background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)',
                                     border: '1px solid rgba(59, 130, 246, 0.3)',
                                     color: '#60a5fa'
                                   }}>
                               {player.role}
                             </span>
                           </div>
                           
                           {/* Player Stats/Info */}
                           <div className="flex items-center gap-4 text-sm text-gray-400">
                             <span className="flex items-center gap-1">
                               <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                               Available
                             </span>
                             {player.team_id && (
                               <span className="flex items-center gap-1">
                                 <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                 Team Member
                               </span>
                             )}
                             {/* Player Experience Indicator */}
                             {player.experience && (
                               <span className="flex items-center gap-1">
                                 <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                 {player.experience} matches
                               </span>
                             )}
                           </div>
                         </div>
                         
                         {/* Selection Indicator */}
                         <div className="w-6 h-6 rounded-full border-2 border-gray-500 group-hover:border-blue-400 transition-colors duration-300 flex items-center justify-center">
                           <div className="w-3 h-3 rounded-full bg-transparent group-hover:bg-blue-400 transition-all duration-300" />
                         </div>
                       </div>
                       
                       {/* Hover Border Effect */}
                       <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-400/50 transition-all duration-300" />
                     </div>
                   </button>
                 ))}
               </div>
               
               {/* Action Buttons */}
               <div className="flex justify-center">
                 <button
                   onClick={() => {
                     setShowPlayerSelection(false);
                     setPendingLaneAssignment(null);
                     setPendingHeroSelection(null);
                     setAvailablePlayers([]);
                   }}
                   className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 border border-gray-600 hover:border-gray-500"
                 >
                   Cancel
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
       
       {/* Custom CSS for animations */}
       <style jsx>{`
         @keyframes fadeIn {
           from { opacity: 0; }
           to { opacity: 1; }
         }
         
         @keyframes slideIn {
           from { 
             opacity: 0;
             transform: translateY(-20px) scale(0.95);
           }
           to { 
             opacity: 1;
             transform: translateY(0) scale(1);
           }
         }
         
         .animate-fadeIn {
           animation: fadeIn 0.3s ease-out;
         }
         
         .animate-slideIn {
           animation: slideIn 0.4s ease-out;
         }
         
         /* Hover effects for player cards */
         .player-card-hover {
           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
         }
         
         .player-card-hover:hover {
           transform: translateY(-2px);
           box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
         }
       `}</style>
    </>
  );
} 