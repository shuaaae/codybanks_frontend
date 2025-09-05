import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import navbarBg from '../assets/navbarbackground.jpg';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import { buildApiUrl } from '../config/api';
import PageTitle from '../components/PageTitle';
import Header from '../components/Header';
import useSessionTimeout from '../hooks/useSessionTimeout';
import { getMatchesData, clearMatchesCache, clearMatchesCacheForCombination } from '../App';
import userService from '../utils/userService';
import { safelyActivateTeam } from '../utils/teamUtils';
import {
  MatchTable,
  ExportModal,
  HeroPickerModal,
  LaneSelectModal,
  AlertModal,
  DeleteConfirmModal,
  MatchHoverModal,
  TopControls,
  HeroStats
} from '../components/HomePage';
import ProfileModal from '../components/ProfileModal';

// Add lane options
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



export default function HomePage() {
  const location = useLocation();
  const [matches, setMatches] = useState([]);
  const [hoveredMatchId, setHoveredMatchId] = useState(null);
  const [banning, setBanning] = useState({
    blue1: [], blue2: [], red1: [], red2: []
  });
  const [heroPickerTarget, setHeroPickerTarget] = useState(null);
  const [modalState, setModalState] = useState('none'); // 'none' | 'export' | 'heroPicker' | 'deleteConfirm'
  const [picks, setPicks] = useState({ blue: { 1: [], 2: [] }, red: { 1: [], 2: [] } }); // { blue: {1: [{lane, hero}], 2: [...]}, red: {...} }
  const [pickTarget, setPickTarget] = useState(null); // { team: 'blue'|'red', pickNum: 1|2, lane: null|string }
  const [heroPickerMode, setHeroPickerMode] = useState(null); // 'ban' | 'pick' | null
  const [heroList, setHeroList] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false); // Add profile modal state

  const [currentPickSession, setCurrentPickSession] = useState(null); // { team, pickNum, remainingPicks }
  const [pickerStep, setPickerStep] = useState('lane'); // 'lane' or 'hero' - tracks current step in pick flow
  // New state for extra fields
  const [turtleTakenBlue, setTurtleTakenBlue] = useState('');
  const [turtleTakenRed, setTurtleTakenRed] = useState('');
  const [lordTakenBlue, setLordTakenBlue] = useState('');
  const [lordTakenRed, setLordTakenRed] = useState('');
  const [notes, setNotes] = useState('');
  const [playstyle, setPlaystyle] = useState('');
  const [deleteConfirmMatch, setDeleteConfirmMatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [isRefreshing, setIsRefreshing] = useState(false); // Track refresh state
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // Show 20 matches per page
  const loadingTimeoutRef = useRef(null); // Add timeout ref for 3-second loading limit
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success'); // 'success' or 'error'
  const [showHeroStatsModal, setShowHeroStatsModal] = useState(false);

  const [heroPickerSelected, setHeroPickerSelected] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const isMountedRef = useRef(true);

  // Form field states for ExportModal
  const [matchDate, setMatchDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [winner, setWinner] = useState('');
  const [blueTeam, setBlueTeam] = useState('');
  const [redTeam, setRedTeam] = useState('');
  
  // Edit match state
  const [isEditing, setIsEditing] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState(null);
  
  // Current team state
  const [currentTeamName, setCurrentTeamName] = useState('');

  // Match mode state
  const [matchMode, setMatchMode] = useState(() => {
    // Load saved mode from localStorage, default to 'scrim'
    const savedMode = localStorage.getItem('selectedMatchMode');
    return savedMode || 'scrim';
  });

  // Handle mode change
  const handleModeChange = async (newMode) => {
    console.log('Switching to mode:', newMode);
    
    // If currently editing a match, warn the user
    if (isEditing) {
      const confirmed = window.confirm(
        'You are currently editing a match. Switching modes will discard your changes. Are you sure you want to continue?'
      );
      if (!confirmed) {
        return;
      }
      // Reset editing state
      setIsEditing(false);
      setEditingMatchId(null);
      resetFormData();
    }
    
    // Save mode to localStorage
    localStorage.setItem('selectedMatchMode', newMode);
    
    // Don't clear the entire cache - just switch modes
    setMatchMode(newMode);
    
    // Check if we already have data for this mode
    const latestTeam = localStorage.getItem('latestTeam');
    const teamData = latestTeam ? JSON.parse(latestTeam) : null;
    const teamId = teamData?.id;
    
    if (teamId) {
      try {
        // Try to get cached data first
        const data = await getMatchesData(teamId, newMode);
        if (data && data.length > 0) {
          console.log(`Found ${data.length} cached matches for ${newMode} mode`);
          setMatches(data);
          setIsLoading(false);
          setErrorMessage('');
        } else {
          // No cached data, fetch from API
          console.log(`No cached data for ${newMode} mode, fetching from API`);
          setIsLoading(true);
          setErrorMessage('');
          
          const freshData = await getMatchesData(teamId, newMode);
          setMatches(freshData || []);
        }
      } catch (error) {
        console.error('Error loading matches data for mode:', newMode, error);
        setErrorMessage('Failed to load matches');
        setMatches([]);
        setIsLoading(false);
      }
    } else {
      setMatches([]);
      setIsLoading(false);
    }
  };


  // User session timeout: 30 minutes
  useSessionTimeout(30, 'currentUser', '/');



  // Helper function to show alert modals
  const showAlert = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  // Check if user is logged in and fetch fresh data from database
  useEffect(() => {
    const loadUser = async () => {
      try {
        const result = await userService.getCurrentUserWithPhoto();
        if (result.success) {
          setCurrentUser(result.user);
        } else {
          // Fallback to localStorage if database fetch fails
          const localUser = JSON.parse(localStorage.getItem('currentUser'));
          if (localUser) {
            setCurrentUser(localUser);
          } else {
            navigate('/');
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
        // Fallback to localStorage
        const localUser = JSON.parse(localStorage.getItem('currentUser'));
        if (localUser) {
          setCurrentUser(localUser);
        } else {
          navigate('/');
        }
      }
    };

    loadUser();
  }, [navigate]);

  // Automatically set team as active when entering HomePage
  useEffect(() => {
    const latestTeam = localStorage.getItem('latestTeam');
    if (latestTeam) {
      const teamData = JSON.parse(latestTeam);
      setCurrentTeamName(teamData.teamName || '');
      // Set this team as active when entering the page
      fetch(buildApiUrl('/teams/set-active'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ team_id: teamData.id }),
      }).catch(error => {
        console.error('Error setting team as active:', error);
      });
    }
  }, []);

  // Clear active team when leaving HomePage
  useEffect(() => {
    return () => {
      // Clear active team when component unmounts (user leaves the page)
      fetch(buildApiUrl('/teams/set-active'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ team_id: null }),
      }).catch(error => {
        console.error('Error clearing active team:', error);
      });
    };
  }, []);

  // Load matches data with global caching
  useEffect(() => {
    const loadMatchesData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');
        
        // Get current team from localStorage
        const latestTeam = localStorage.getItem('latestTeam');
        const teamData = latestTeam ? JSON.parse(latestTeam) : null;
        const teamId = teamData?.id;
        
        // Update current team name
        if (teamData?.teamName) {
          setCurrentTeamName(teamData.teamName);
        }
        
        console.log('Loading matches data for team:', teamId);
        const data = await getMatchesData(teamId, matchMode);
        
        console.log('Loaded matches:', data);
        setMatches(data || []);
        
        // Preload data for the other mode to ensure smooth switching
        if (teamId) {
          const otherMode = matchMode === 'scrim' ? 'tournament' : 'scrim';
          console.log('Preloading data for other mode:', otherMode);
          getMatchesData(teamId, otherMode).catch(error => {
            console.log('Preload failed for mode:', otherMode, error);
            // Don't show error for preload failures
          });
        }
        
      } catch (error) {
        console.error('Error loading matches data:', error);
        setErrorMessage('Failed to load matches');
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMatchesData();
  }, [matchMode]); // Add matchMode to dependency array

  // Load heroes data
  useEffect(() => {
    const loadHeroes = async () => {
      try {
        const response = await fetch(buildApiUrl('/heroes'));
        const data = await response.json();
        setHeroList(data);
      } catch (error) {
        console.error('Error loading heroes:', error);
      }
    };

    loadHeroes();
  }, []);

  // Periodic activity update to keep team session alive
  useEffect(() => {
    const updateActivity = async () => {
      const latestTeam = localStorage.getItem('latestTeam');
      if (latestTeam) {
        try {
          const teamData = JSON.parse(latestTeam);
          // Call getActive to update last activity timestamp
          await fetch(buildApiUrl('/teams/active'), {
            headers: {
              'X-Active-Team-ID': teamData.id
            }
          });
        } catch (error) {
          console.error('Error updating activity:', error);
        }
      }
    };

    // Update activity every 2 minutes
    const interval = setInterval(updateActivity, 2 * 60 * 1000);
    
    // Also update immediately
    updateActivity();
    
    return () => clearInterval(interval);
  }, []);

  // Create heroMap for O(1) lookup performance
  const heroMap = useMemo(() => {
    const map = new Map();
    heroList.forEach(hero => {
      map.set(hero.name, hero);
    });
    return map;
  }, [heroList]);

  // Preload critical hero images for better perceived performance
  useEffect(() => {
    if (heroList.length > 0) {
              const criticalHeroes = heroList.slice(0, 10); // Preload first 10 heroes
        criticalHeroes.forEach(hero => {
          const img = new Image();
          img.src = `https://api.coachdatastatistics.site/heroes/${hero.role.toLowerCase()}/${hero.image}`;
        });
    }
  }, [heroList]);





  // Function to clear all data when switching to a new team
  const clearAllData = useCallback(() => {
    console.log('Clearing all data for new team...');
    setMatches([]);
    setTurtleTakenBlue('');
    setTurtleTakenRed('');
    setLordTakenBlue('');
    setLordTakenRed('');
    setNotes('');
    setPlaystyle('');
    // Clear the global matches cache when switching teams
    clearMatchesCache();
  }, []);

  // Function to reset all form data
  function resetFormData() {
    // Reset all state variables
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
    
    // Reset form field states
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setMatchDate(`${year}-${month}-${day}`);
    setWinner('');
    setBlueTeam('');
    setRedTeam('');
    
    // Reset pick flow state
    setCurrentPickSession(null);
    setHeroPickerMode(null);
    setPickerStep('lane');
    
    // Reset editing state
    setIsEditing(false);
    setEditingMatchId(null);
    
    // Reset form inputs (for backward compatibility)
    const matchDateInput = document.getElementById('match-date-input');
    const winnerInput = document.getElementById('winner-input');
    const blueTeamInput = document.getElementById('blue-team-input');
    const redTeamInput = document.getElementById('red-team-input');
    
    if (matchDateInput) matchDateInput.value = '';
    if (winnerInput) winnerInput.value = '';
    if (blueTeamInput) blueTeamInput.value = '';
    if (redTeamInput) redTeamInput.value = '';
  }

  // Function to handle editing a match
  function handleEditMatch(match) {
    setIsEditing(true);
    setEditingMatchId(match.id);

    // Set match mode to match the existing match type
    if (match.match_type && match.match_type !== matchMode) {
      setMatchMode(match.match_type);
      localStorage.setItem('selectedMatchMode', match.match_type);
    }

    // Basic fields
    setMatchDate(match.match_date);
    setWinner(match.winner);
    setNotes(match.notes || '');
    setPlaystyle(match.playstyle || '');

    const blue = match.teams?.find(t => t.team_color === 'blue');
    const red  = match.teams?.find(t => t.team_color === 'red');

    // Teams names
    setBlueTeam(blue?.team || '');
    setRedTeam(red?.team || '');

    // Bans
    setBanning({
      blue1: blue?.banning_phase1 || [],
      blue2: blue?.banning_phase2 || [],
      red1:  red?.banning_phase1  || [],
      red2:  red?.banning_phase2  || [],
    });

    // Picks (normalize shape)
    const normP = (p) => ({ lane: p.lane, hero: p.hero });
    setPicks({
      blue: {
        1: (blue?.picks1 || []).map(normP),
        2: (blue?.picks2 || []).map(normP),
      },
      red: {
        1: (red?.picks1 || []).map(normP),
        2: (red?.picks2 || []).map(normP),
      },
    });

    // Objective counts
    if (match.turtle_taken) {
      const [b, r] = match.turtle_taken.split('-').map(Number);
      setTurtleTakenBlue(b || '');
      setTurtleTakenRed(r || '');
    } else {
      setTurtleTakenBlue('');
      setTurtleTakenRed('');
    }

    if (match.lord_taken) {
      const [b, r] = match.lord_taken.split('-').map(Number);
      setLordTakenBlue(b || '');
      setLordTakenRed(r || '');
    } else {
      setLordTakenBlue('');
      setLordTakenRed('');
    }

    // Close hover modal and open edit modal
    setHoveredMatchId(null);
    setModalState('export');
  }

  // Function to start the pick flow
  function startPickFlow(team, pickNum) {
    const maxPicks = pickNum === 1 ? 3 : 2; // Phase 1: 3 picks, Phase 2: 2 picks
    const currentPicks = Array.isArray(picks[team][pickNum]) ? picks[team][pickNum] : [];
    const remainingPicks = maxPicks - currentPicks.length;
    
    if (remainingPicks > 0) {
      setCurrentPickSession({
        team,
        pickNum,
        remainingPicks,
        maxPicks
      });
      setPickerStep('lane'); // Start with lane selection
      setHeroPickerMode(null); // Reset hero picker mode to ensure we start with lane selection
      setHeroPickerTarget(null); // Reset hero picker target to prevent banning modal from showing
      setModalState('heroPicker'); // Set modal state to enable the pick flow
    }
  }

  // Function to handle lane selection in pick flow
  function handleLaneSelection(lane) {
    setPickTarget({ team: currentPickSession.team, pickNum: currentPickSession.pickNum, lane });
    setHeroPickerMode('pick');
    setPickerStep('hero'); // Move to hero selection step
    setModalState('heroPicker');
  }

  // Function to handle hero selection in pick flow
  function handleHeroSelection(selectedHero) {
    if (selectedHero && selectedHero.length > 0) {
      const hero = selectedHero[0];
      setPicks(prev => ({
        ...prev,
        [currentPickSession.team]: {
          ...prev[currentPickSession.team],
          [currentPickSession.pickNum]: [
            ...((Array.isArray(prev[currentPickSession.team][currentPickSession.pickNum]) ? prev[currentPickSession.team][currentPickSession.pickNum] : [])),
            { lane: pickTarget.lane, hero: hero }
          ]
        }
      }));

      // Clear the hero picker selection
      setHeroPickerSelected([]);

      // Check if we need to continue picking
      const newRemainingPicks = currentPickSession.remainingPicks - 1;
      if (newRemainingPicks > 0) {
        // Continue with next pick - go back to lane selection
        setCurrentPickSession(prev => ({
          ...prev,
          remainingPicks: newRemainingPicks
        }));
        setPickerStep('lane'); // Go back to lane selection step
        setHeroPickerMode(null); // Reset hero picker mode
        setModalState('heroPicker'); // Reopen modal in lane-select mode
      } else {
        // All picks complete, close the flow
        setCurrentPickSession(null);
        setPickerStep('lane'); // Reset step
        setModalState('export');
        setHeroPickerMode(null);
      }
    }
  }

  async function handleExportConfirm({ banning, picks }) {
    try {
      const latestTeam = JSON.parse(localStorage.getItem('latestTeam'));
      const currentTeamId = latestTeam?.id;

      const payload = {
        match_date: matchDate,
        winner,
        notes,
        playstyle,
        turtle_taken: `${turtleTakenBlue || 0}-${turtleTakenRed || 0}`,
        lord_taken:   `${lordTakenBlue || 0}-${lordTakenRed || 0}`,
        team_id: currentTeamId,
        match_type: matchMode,
      };

      if (isEditing && editingMatchId) {
        // One request only; backend recreates children from teams
        const updated = await updateMatch(editingMatchId, payload, { banning, picks });
        console.log('Match update completed, updating local state:', { updated, editingMatchId });
        
        // Clear cache and refresh matches list to ensure we have the latest data
        clearMatchesCacheForCombination(currentTeamId, matchMode);
        const refreshedMatches = await getMatchesData(currentTeamId, matchMode);
        
        if (refreshedMatches && refreshedMatches.length > 0) {
          refreshedMatches.sort((a, b) => {
            if (a.match_date === b.match_date) return b.id - a.id;
            return new Date(b.match_date) - new Date(a.match_date);
          });
          setMatches(refreshedMatches);
          console.log('Matches list refreshed after update:', refreshedMatches);
        }
        
        showAlert('Match updated!', 'success');
      } else {
        await createMatch(payload, { banning, picks }); // keep your create flow
        showAlert('Match exported!', 'success');
      }

      setModalState('none');
      setIsEditing(false);
      setEditingMatchId(null);
      resetFormData();
    } catch (e) {
      console.error(e);
      showAlert('Failed to save match', 'error');
    }
  }

  // Add (or update) updateMatch helper in the same file:
  async function updateMatch(matchId, matchPayload, { banning, picks }) {
    // Get the current team ID from localStorage
    const latestTeam = JSON.parse(localStorage.getItem('latestTeam'));
    const currentTeamId = latestTeam?.id;
    
    console.log('Updating match with data:', {
      matchId,
      matchPayload,
      banning,
      picks,
      blueTeam,
      redTeam,
      currentTeamId
    });
    
    // 1) Update parent match with teams data
    const fullMatchPayload = {
      ...matchPayload,
      teams: [
        {
          team: blueTeam,
          team_color: 'blue',
          banning_phase1: banning.blue1 || [],
          banning_phase2: banning.blue2 || [],
          picks1: picks.blue?.[1] || [],
          picks2: picks.blue?.[2] || [],
        },
        {
          team: redTeam,
          team_color: 'red',
          banning_phase1: banning.red1 || [],
          banning_phase2: banning.red2 || [],
          picks1: picks.red?.[1] || [],
          picks2: picks.red?.[2] || [],
        }
      ]
    };

    console.log('Full match payload being sent:', fullMatchPayload);

    // Ensure team is activated before updating match
    if (currentTeamId) {
      try {
        console.log('Activating team before match update:', currentTeamId);
        const activationSuccess = await safelyActivateTeam(currentTeamId);
        if (!activationSuccess) {
          console.warn('Team activation had issues, but proceeding with match update');
        }
        
        // Wait a moment for the activation to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error activating team before match update:', error);
        // Continue anyway - the backend will handle team activation
      }
    }

    // Prepare headers with team ID for backend compatibility
    const headers = { 
      'Content-Type': 'application/json', 
      'Accept': 'application/json' 
    };
    
    if (currentTeamId) {
      headers['X-Active-Team-ID'] = currentTeamId;
    }

    console.log('Making API call to:', buildApiUrl(`/matches/${matchId}`));
    console.log('Request headers:', headers);

    const res = await fetch(buildApiUrl(`/matches/${matchId}`), {
      method: 'PUT',
      headers,
      body: JSON.stringify(fullMatchPayload),
    });
    
    console.log('API response status:', res.status);
    console.log('API response headers:', res.headers);
    
    if (!res.ok) {
      const txt = await res.text();
      console.error('Update match failed:', res.status, txt);
      throw new Error(`Update match failed: ${res.status} ${txt}`);
    }

    // Backend now handles all team updates in one transaction
    // Return the updated match data for frontend state update
    const updated = await res.json();
    console.log('Updated match data received:', updated);
    
    // Trigger player statistics refresh after match update
    window.dispatchEvent(new CustomEvent('matchUpdated', { 
      detail: { 
        matchId, 
        teamId: currentTeamId,
        matchData: updated 
      } 
    }));
    
    return updated;
  }

  // Create match helper for new matches
  async function createMatch(matchPayload, { banning, picks }) {
    // Get player assignments for blue and red teams from localStorage
    let bluePlayers = [];
    let redPlayers = [];
    let latestTeam = null;
    
    try {
      latestTeam = JSON.parse(localStorage.getItem('latestTeam'));
      if (latestTeam && latestTeam.teamName && latestTeam.players) {
        if (latestTeam.teamName === blueTeam) bluePlayers = latestTeam.players;
        if (latestTeam.teamName === redTeam) redPlayers = latestTeam.players;
      }
    } catch (e) {}

    // Helper to get player name - CRITICAL: Only use stored player data to prevent data mixing
    const getPlayerName = (p, playersArr) => {
      console.log(`getPlayerName called with:`, { pick: p, playersArr });
      
      // If player data is already stored in the pick, use it (this handles substitute players correctly)
      if (p.player && typeof p.player === 'object' && p.player.name) {
        console.log(`Using stored player object: ${p.player.name}`);
        return p.player.name;
      }
      
      // If player is just a string name, use it
      if (p.player && typeof p.player === 'string') {
        console.log(`Using stored player string: ${p.player}`);
        return p.player;
      }
      
      // CRITICAL: No fallback to role-based lookup - this prevents data mixing
      // If no player data is stored, we cannot accurately attribute the hero usage
      console.warn(`Pick missing player data - cannot accurately attribute hero usage:`, p);
      console.warn(`This pick will be skipped in player statistics to prevent data mixing`);
      return null; // Return null to indicate no player assignment
    };

    const fullPayload = {
      ...matchPayload,
      teams: [
        {
          team: blueTeam,
          team_color: "blue",
          banning_phase1: banning.blue1,
          picks1: picks.blue[1].map(p => {
            const playerName = getPlayerName(p, bluePlayers);
            console.log(`Blue pick1 ${p.lane}:`, { lane: p.lane, hero: p.hero, player: p.player, resolvedPlayer: playerName });
            return {
              team: blueTeam,
              lane: p.lane,
              hero: p.hero,
              player: playerName
            };
          }),
          banning_phase2: banning.blue2,
          picks2: picks.blue[2].map(p => {
            const playerName = getPlayerName(p, bluePlayers);
            console.log(`Blue pick2 ${p.lane}:`, { lane: p.lane, hero: p.hero, player: p.player, resolvedPlayer: playerName });
            return {
              team: blueTeam,
              lane: p.lane,
              hero: p.hero,
              player: playerName
            };
          })
        },
        {
          team: redTeam,
          team_color: "red",
          banning_phase1: banning.red1,
          picks1: picks.red[1].map(p => {
            const playerName = getPlayerName(p, redPlayers);
            console.log(`Red pick1 ${p.lane}:`, { lane: p.lane, hero: p.hero, player: p.player, resolvedPlayer: playerName });
            return {
              team: redTeam,
              lane: p.lane,
              hero: p.hero,
              player: playerName
            };
          }),
          banning_phase2: banning.red2,
          picks2: picks.red[2].map(p => {
            const playerName = getPlayerName(p, redPlayers);
            console.log(`Red pick2 ${p.lane}:`, { lane: p.lane, hero: p.hero, player: p.player, resolvedPlayer: playerName });
            return {
              team: redTeam,
              lane: p.lane,
              hero: p.hero,
              player: playerName
            };
          })
        }
      ]
    };

    // Ensure team is activated before creating match
    if (latestTeam?.id) {
      try {
        console.log('Activating team before match creation:', latestTeam.id);
        const activationSuccess = await safelyActivateTeam(latestTeam.id);
        if (!activationSuccess) {
          console.warn('Team activation had issues, but proceeding with match creation');
        }
        
        // Wait a moment for the activation to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error activating team before match creation:', error);
        // Continue anyway - the backend will handle team activation
      }
    }

    // Prepare headers with team ID for backend compatibility
    const headers = { 
      'Content-Type': 'application/json', 
      'Accept': 'application/json' 
    };
    
    if (latestTeam?.id) {
      headers['X-Active-Team-ID'] = latestTeam.id;
    }

    const response = await fetch(buildApiUrl('/matches'), {
      method: 'POST',
      headers,
      body: JSON.stringify(fullPayload)
    });

    if (!response.ok) {
      throw new Error(`Create match failed: ${response.status}`);
    }

    // Save to localStorage for Player Statistics
    if (latestTeam && (blueTeam === latestTeam.teamName || redTeam === latestTeam.teamName)) {
      localStorage.setItem('latestMatch', JSON.stringify(fullPayload));
    }

    // Refresh matches list for current mode only
    clearMatchesCacheForCombination(matchPayload.team_id, matchMode);
    const data = await getMatchesData(matchPayload.team_id, matchMode);
    if (data && data.length > 0) {
      data.sort((a, b) => {
        if (a.match_date === b.match_date) return b.id - a.id;
        return new Date(b.match_date) - new Date(a.match_date);
      });
      setMatches(data);
    } else {
      setMatches([]);
    }
    
    // Trigger player statistics refresh after new match creation
    window.dispatchEvent(new CustomEvent('matchUpdated', { 
      detail: { 
        matchId: null, // New match, no ID yet
        teamId: matchPayload.team_id,
        matchData: fullPayload 
      } 
    }));
  }

  React.useEffect(() => {
    if (modalState === 'export' || modalState === 'heroPicker') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [modalState]);

  // Delete match handler
  async function handleDeleteMatch(matchId) {
    try {
      // Get the current team ID from localStorage
      const latestTeam = JSON.parse(localStorage.getItem('latestTeam'));
      const currentTeamId = latestTeam?.id;
      
      // Prepare headers with team ID for backend compatibility
      const headers = {};
      if (currentTeamId) {
        headers['X-Active-Team-ID'] = currentTeamId;
      }
      
              const response = await fetch(buildApiUrl(`/matches/${matchId}`), { 
        method: 'DELETE',
        headers
      });
      if (response.ok) {
        // Clear cache to ensure fresh data
        clearMatchesCache();
        setMatches(prev => prev.filter(m => m.id !== matchId));
        setModalState('none');
        setDeleteConfirmMatch(null);
        showAlert('Match deleted successfully!', 'success');
      } else {
        const errorData = await response.text();
        console.error('Server error:', response.status, errorData);
        showAlert(`Failed to delete match: ${response.status} - ${errorData}`, 'error');
      }
    } catch (err) {
      console.error('Network error:', err);
      showAlert('Network error: ' + err.message, 'error');
    }
  }

  // Logout handler
  const handleLogout = () => {
    // Clear active team when logging out
    fetch(buildApiUrl('/teams/set-active'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ team_id: null }),
    }).catch(error => {
      console.error('Error clearing active team on logout:', error);
    });

    localStorage.removeItem('currentUser');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${navbarBg}) center/cover, #181A20` }}>
      <PageTitle title="Data Draft" />
      
      {/* Header Component */}
      <Header 
        currentUser={currentUser}
        onLogout={handleLogout}
        onShowProfile={() => setShowProfileModal(true)}
      />

      {/* Main Content */}
      <main className="flex flex-col items-center px-2 flex-1" style={{ marginTop: 80, paddingTop: 0 }}>
        <div className="flex flex-col items-center w-full">
          <div className="w-[1600px] max-w-[95vw] mx-auto p-4 rounded-2xl" style={{ background: '#23232a', boxShadow: '0 4px 24px 0 rgba(0,0,0,0.25)', border: '1px solid #23283a', marginTop: 0 }}>
            {/* Top Controls */}
            <TopControls 
              onExportClick={() => {
                setHoveredMatchId(null);
                setModalState('export');
              }}
              onHeroStatsClick={() => setShowHeroStatsModal(true)}
              currentMode={matchMode}
              onModeChange={handleModeChange}
            />
            {/* Match Table */}
            <MatchTable 
              matches={matches}
              isLoading={isLoading}
              isRefreshing={isRefreshing}
              errorMessage={errorMessage}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              hoveredMatchId={hoveredMatchId}
              setHoveredMatchId={setHoveredMatchId}
              onDeleteMatch={(match) => {
                setDeleteConfirmMatch(match);
                setModalState('deleteConfirm');
              }}
              onEditMatch={handleEditMatch}
              heroMap={heroMap}
              setCurrentPage={setCurrentPage}
            />
          </div>
        </div>
      </main>
      {/* Export Modal */}
      <ExportModal 
        isOpen={modalState === 'export' || modalState === 'heroPicker'}
        onClose={() => {
          resetFormData();
          setModalState('none');
        }}
        onConfirm={handleExportConfirm}
        onReset={() => {
          resetFormData();
          setModalState('none');
        }}
        banning={banning}
        picks={picks}
        turtleTakenBlue={turtleTakenBlue}
        setTurtleTakenBlue={setTurtleTakenBlue}
        turtleTakenRed={turtleTakenRed}
        setTurtleTakenRed={setTurtleTakenRed}
        lordTakenBlue={lordTakenBlue}
        setLordTakenBlue={setLordTakenBlue}
        lordTakenRed={lordTakenRed}
        setLordTakenRed={setLordTakenRed}
        notes={notes}
        setNotes={setNotes}
        playstyle={playstyle}
        setPlaystyle={setPlaystyle}
        matchDate={matchDate}
        setMatchDate={setMatchDate}
        winner={winner}
        setWinner={setWinner}
        blueTeam={blueTeam}
        setBlueTeam={setBlueTeam}
        redTeam={redTeam}
        setRedTeam={setRedTeam}
        onBanClick={(target) => { 
          setHeroPickerTarget(target); 
          setHeroPickerMode('ban'); 
          setModalState('heroPicker'); 
        }}
        onPickClick={(team, pickNum) => startPickFlow(team, pickNum)}
        setBanning={setBanning}
        setPicks={setPicks}
        heroList={heroList}
        setModalState={setModalState}
        isEditing={isEditing}
        editingMatchId={editingMatchId}
        match={matches.find(m => m.id === editingMatchId)}
        currentTeamName={currentTeamName}
        matchMode={matchMode}
      />
      {/* Lane Select Modal */}
      <LaneSelectModal
        open={modalState === 'heroPicker' && pickerStep === 'lane' && currentPickSession}
        onClose={() => {
          setModalState('export');
          setCurrentPickSession(null);
          setPickerStep('lane');
        }}
        availableLanes={(() => {
          // For pick phase 2, filter out lanes already picked in phase 1 for the same team
          const currentTeam = currentPickSession?.team;
          const currentPickNum = currentPickSession?.pickNum;
          let usedLanes = [];
          if (currentPickNum === 2) {
            usedLanes = (Array.isArray(picks[currentTeam]?.[1]) ? picks[currentTeam][1] : []).map(p => p && p.lane).filter(Boolean);
          }
          // Also filter out lanes already picked in this phase
          const alreadyPicked = (Array.isArray(picks[currentTeam]?.[currentPickNum]) ? picks[currentTeam][currentPickNum] : []).map(p => p && p.lane).filter(Boolean);
          return LANE_OPTIONS.filter(lane => !usedLanes.includes(lane.key) && !alreadyPicked.includes(lane.key));
        })()}
        onSelect={handleLaneSelection}
        currentPickSession={currentPickSession}
      />
      {/* Hero Picker Modal for Banning */}
      <HeroPickerModal
        open={modalState === 'heroPicker' && heroPickerMode === 'ban' && heroPickerTarget && !currentPickSession}
        onClose={() => setModalState('export')}
        selected={banning[heroPickerTarget] || []}
        setSelected={selected => {
          setBanning(prev => ({
            ...prev,
            [heroPickerTarget]: selected
          }));
        }}
        maxSelect={heroPickerTarget?.endsWith('1') ? 3 : 2}
        bannedHeroes={Object.values(banning).flat().filter((h, i, arr) => arr.indexOf(h) !== i ? false : true)}
        heroList={heroList}
        heroPickerMode={heroPickerMode}
        pickTarget={pickTarget}
        picks={picks}
        banning={banning}
        heroPickerTarget={heroPickerTarget}
      />
      
      {/* Hero Picker Modal for Picks */}
      <HeroPickerModal
        open={modalState === 'heroPicker' && pickerStep === 'hero' && pickTarget && pickTarget.lane && currentPickSession}
        onClose={() => {
          setModalState('export');
          setCurrentPickSession(null);
          setPickerStep('lane');
          setHeroPickerSelected([]);
        }}
        selected={heroPickerSelected}
        setSelected={setHeroPickerSelected}
        onConfirm={handleHeroSelection}
        maxSelect={1}
        bannedHeroes={Object.values(banning).flat()}
        filterType={LANE_TYPE_MAP[pickTarget?.lane]}
        heroList={heroList}
        heroPickerMode={heroPickerMode}
        pickTarget={pickTarget}
        picks={picks}
        banning={banning}
        heroPickerTarget={heroPickerTarget}
      />
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal 
        isOpen={modalState === 'deleteConfirm' && deleteConfirmMatch}
        onClose={() => {
          setModalState('none');
          setDeleteConfirmMatch(null);
        }}
        onConfirm={handleDeleteMatch}
        match={deleteConfirmMatch}
      />



      {/* CSS Animation for hover modal */}
      <style>
        {`
          @keyframes fadeInSlide {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      
      {/* Match Hover Modal */}
      <MatchHoverModal 
        match={matches.find(m => m.id === hoveredMatchId)}
        heroMap={heroMap}
        isVisible={!!hoveredMatchId}
        onMouseEnter={() => {
          // Keep the modal open when hovering inside it
          // Don't change hoveredMatchId
        }}
        onMouseLeave={() => {
          // Close the modal when leaving it
          setHoveredMatchId(null);
        }}
      />
      
      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={currentUser}
        onUserUpdate={(updatedUser) => {
          setCurrentUser(updatedUser);
        }}
      />
      
      {/* Alert Modal */}
      <AlertModal 
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        message={alertMessage}
        type={alertType}
      />
      
      {/* Hero Stats Modal */}
      <HeroStats 
        isOpen={showHeroStatsModal}
        onClose={() => setShowHeroStatsModal(false)}
        matches={matches}
      />
    </div>
  );
}