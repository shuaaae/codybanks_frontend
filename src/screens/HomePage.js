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
  const [turtleTakenBlue, setTurtleTakenBlue] = useState('0');
  const [turtleTakenRed, setTurtleTakenRed] = useState('0');
  const [lordTakenBlue, setLordTakenBlue] = useState('0');
  const [lordTakenRed, setLordTakenRed] = useState('0');
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

  // Player assignments state - stores current team player assignments by role
  const [playerAssignments, setPlayerAssignments] = useState({
    blue: {
      exp: [],
      jungler: [],
      mid: [],
      gold: [],
      roam: []
    },
    red: {
      exp: [],
      jungler: [],
      mid: [],
      gold: [],
      roam: []
    }
  });

  const [heroPickerSelected, setHeroPickerSelected] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const isMountedRef = useRef(true);

  // Load current team player assignments
  const loadPlayerAssignments = useCallback(async () => {
    try {
      const latestTeam = JSON.parse(localStorage.getItem('latestTeam') || '{}');
      const teamId = latestTeam.id;

      if (!teamId) {
        console.log('No team ID found, skipping player assignments load');
        return;
      }

      // Try the simple working endpoint first
      const response = await fetch(`/api/players/assignments/${teamId}`);

      if (response.ok) {
        const result = await response.json();

        if (result.assignments) {
          // Convert assignments to playerAssignments format - handle multiple players per role
          const blueAssignments = {};
          const redAssignments = {};

          // Initialize role arrays
          ['exp', 'jungler', 'mid', 'gold', 'roam'].forEach(role => {
            blueAssignments[role] = [];
            redAssignments[role] = [];
          });

          // Map assignments by role (multiple players per role supported)
          result.assignments.forEach(assignment => {
            const playerData = {
              name: assignment.player?.name || 'Unknown',
              role: assignment.role,
              hero_name: assignment.hero_name,
              is_substitute: assignment.is_substitute || false
            };

            // Determine team color based on current team
            const currentTeamName = latestTeam.teamName || latestTeam.name;
            if (assignment.team === currentTeamName) {
              blueAssignments[assignment.role].push(playerData);
            } else {
              redAssignments[assignment.role].push(playerData);
            }
          });

          setPlayerAssignments({
            blue: blueAssignments,
            red: redAssignments
          });

          console.log('Player assignments loaded:', {
            blue: blueAssignments,
            red: redAssignments
          });
        }
      } else {
        console.log('Failed to load player assignments, using defaults');
        // Set default assignments based on current team players - handle multiple players per role
        const currentPlayers = JSON.parse(localStorage.getItem('currentPlayers') || '[]');
        const defaultAssignments = {};

        // Initialize role arrays
        ['exp', 'jungler', 'mid', 'gold', 'roam'].forEach(role => {
          defaultAssignments[role] = [];
        });

        // Map current players to roles (multiple players per role supported)
        currentPlayers.forEach(player => {
          if (defaultAssignments[player.role]) {
            defaultAssignments[player.role].push({
              name: player.name,
              role: player.role,
              hero_name: null,
              is_substitute: player.is_substitute || false
            });
          }
        });

        setPlayerAssignments({
          blue: defaultAssignments,
          red: {}
        });
      }
    } catch (error) {
      console.error('Error loading player assignments:', error);
      // Set empty assignments on error
      const emptyAssignments = {};
      ['exp', 'jungler', 'mid', 'gold', 'roam'].forEach(role => {
        emptyAssignments[role] = [];
      });
      setPlayerAssignments({
        blue: emptyAssignments,
        red: emptyAssignments
      });
    }
  }, []);

  // Load player assignments when component mounts and when export modal opens
  useEffect(() => {
    if (modalState === 'export') {
      loadPlayerAssignments();
    }
  }, [modalState, loadPlayerAssignments]);

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
  const [annualMap, setAnnualMap] = useState('');

  // Debug annualMap state changes
  useEffect(() => {
    console.log('HomePage - annualMap state changed:', annualMap);
    console.log('HomePage - annualMap type:', typeof annualMap);
  }, [annualMap]);

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

  // Search state
  const [searchFilters, setSearchFilters] = useState({
    term: '',
    type: 'all',
    date: ''
  });
  const [filteredMatches, setFilteredMatches] = useState([]);

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

        // Debug: Log banning data for each match
        if (data && data.length > 0) {
          console.log('=== MATCH DATA DEBUG ===');
          data.forEach((match, index) => {
            console.log(`Match ${index + 1}:`, {
              id: match.id,
              match_date: match.match_date,
              annual_map: match.annual_map,
              teams: match.teams?.map(team => ({
                team: team.team,
                team_color: team.team_color,
                banning_phase1: team.banning_phase1,
                banning_phase2: team.banning_phase2,
                picks1: team.picks1,
                picks2: team.picks2
              }))
            });
          });
          console.log('=== END MATCH DATA DEBUG ===');
        }

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

  // Search filtering logic
  useEffect(() => {
    if (!matches || matches.length === 0) {
      setFilteredMatches([]);
      return;
    }

    let filtered = [...matches];

    // Apply search filters
    if (searchFilters.term || searchFilters.date) {
      filtered = matches.filter(match => {
        const searchTerm = searchFilters.term.toLowerCase();
        const matchDate = match.match_date;

        // Date filter
        if (searchFilters.date) {
          const filterDate = new Date(searchFilters.date).toISOString().split('T')[0];
          const matchDateFormatted = new Date(matchDate).toISOString().split('T')[0];
          if (matchDateFormatted !== filterDate) {
            return false;
          }
        }

        // If no search term, and date matches (or no date filter), include the match
        if (!searchTerm) {
          return true;
        }

        // Search by type
        switch (searchFilters.type) {
          case 'heroes':
            return matchContainsHero(match, searchTerm);
          case 'teams':
            return matchContainsTeam(match, searchTerm);
          case 'date':
            // Date filtering is already handled above
            return true;
          case 'all':
          default:
            return matchContainsHero(match, searchTerm) || matchContainsTeam(match, searchTerm);
        }
      });
    }

    setFilteredMatches(filtered);
  }, [matches, searchFilters]);

  // Helper function to check if match contains a specific hero
  const matchContainsHero = (match, searchTerm) => {
    if (!match.teams) return false;

    return match.teams.some(team => {
      // Check picks1
      if (team.picks1 && Array.isArray(team.picks1)) {
        const hasHeroInPicks1 = team.picks1.some(pick => {
          const heroName = typeof pick === 'string' ? pick : pick?.hero;
          return heroName && heroName.toLowerCase().includes(searchTerm);
        });
        if (hasHeroInPicks1) return true;
      }

      // Check picks2
      if (team.picks2 && Array.isArray(team.picks2)) {
        const hasHeroInPicks2 = team.picks2.some(pick => {
          const heroName = typeof pick === 'string' ? pick : pick?.hero;
          return heroName && heroName.toLowerCase().includes(searchTerm);
        });
        if (hasHeroInPicks2) return true;
      }

      // Check banning_phase1
      if (team.banning_phase1 && Array.isArray(team.banning_phase1)) {
        const hasHeroInBans1 = team.banning_phase1.some(ban => {
          const heroName = typeof ban === 'string' ? ban : ban?.hero || ban?.name || ban?.heroName;
          return heroName && heroName.toLowerCase().includes(searchTerm);
        });
        if (hasHeroInBans1) return true;
      }

      // Check banning_phase2
      if (team.banning_phase2 && Array.isArray(team.banning_phase2)) {
        const hasHeroInBans2 = team.banning_phase2.some(ban => {
          const heroName = typeof ban === 'string' ? ban : ban?.hero || ban?.name || ban?.heroName;
          return heroName && heroName.toLowerCase().includes(searchTerm);
        });
        if (hasHeroInBans2) return true;
      }

      return false;
    });
  };

  // Helper function to check if match contains a specific team name
  const matchContainsTeam = (match, searchTerm) => {
    if (!match.teams) return false;

    return match.teams.some(team => {
      return team.team && team.team.toLowerCase().includes(searchTerm);
    });
  };

  // Search handlers - memoized to prevent unnecessary re-renders
  const handleSearch = useCallback((searchData) => {
    setSearchFilters(searchData);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchFilters({
      term: '',
      type: 'all',
      date: ''
    });
    setCurrentPage(1);
  }, []);

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
    setTurtleTakenBlue('0');
    setTurtleTakenRed('0');
    setLordTakenBlue('0');
    setLordTakenRed('0');
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
    setTurtleTakenBlue('0');
    setTurtleTakenRed('0');
    setLordTakenBlue('0');
    setLordTakenRed('0');
    setAnnualMap('');
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
  async function handleEditMatch(match) {
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
    const red = match.teams?.find(t => t.team_color === 'red');

    // Teams names
    setBlueTeam(blue?.team || '');
    setRedTeam(red?.team || '');

    // Bans
    setBanning({
      blue1: blue?.banning_phase1 || [],
      blue2: blue?.banning_phase2 || [],
      red1: red?.banning_phase1 || [],
      red2: red?.banning_phase2 || [],
    });

    // Picks (normalize shape and include player data)
    const normP = (p) => {
      // Handle different data formats that might come from the backend
      if (typeof p === 'string') {
        // If it's just a string (hero name), create a basic structure
        return {
          lane: null,
          hero: p,
          player: null
        };
      } else if (p && typeof p === 'object') {
        // If it's an object, normalize it
        return {
          lane: p.lane || null,
          hero: p.hero || p.heroName || p.name || null,
          player: p.player || null
        };
      }
      // Fallback for null/undefined
      return {
        lane: null,
        hero: null,
        player: null
      };
    };
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

    // Load player assignments from database
    try {
      const latestTeam = JSON.parse(localStorage.getItem('latestTeam') || '{}');
      const teamId = latestTeam.id;

      if (teamId) {
        console.log('Loading player assignments for match:', match.id, 'team:', teamId);
        const apiUrl = `${process.env.REACT_APP_API_URL || 'https://api.coachdatastatistics.site'}/api/match-player-assignments/match/${match.id}?team_id=${teamId}`;
        console.log('Fetching player assignments from:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          mode: 'cors'
        });

        if (!response.ok) {
          console.warn('Failed to load player assignments:', response.status, response.statusText);
          console.warn('Response URL:', response.url);
          // Continue with edit modal even if player assignments fail to load
        } else {
          const result = await response.json();

          if (result.assignments) {
            // Convert assignments to playerAssignments format
            const blueAssignments = [];
            const redAssignments = [];

            // Initialize arrays with null values
            for (let i = 0; i < 5; i++) {
              blueAssignments.push(null);
              redAssignments.push(null);
            }

            // Process assignments by role
            Object.entries(result.assignments).forEach(([role, assignments]) => {
              if (assignments && assignments.length > 0) {
                const assignment = assignments[0]; // Get the first assignment for this role
                const player = assignment.player;
                const laneIndex = ['exp', 'jungler', 'mid', 'gold', 'roam'].indexOf(role);

                if (laneIndex !== -1 && player) {
                  // Determine if this is blue or red team based on team name
                  const isBlueTeam = blue?.team === currentTeamName;
                  const isRedTeam = red?.team === currentTeamName;

                  console.log('Processing assignment:', {
                    role,
                    player: player.name,
                    hero_name: assignment.hero_name,
                    isBlueTeam,
                    isRedTeam,
                    currentTeamName,
                    blueTeam: blue?.team,
                    redTeam: red?.team
                  });

                  if (isBlueTeam) {
                    blueAssignments[laneIndex] = {
                      ...player,
                      hero_name: assignment.hero_name
                    };
                    console.log(`Assigned ${player.name} to blue team ${role} lane`);
                  } else if (isRedTeam) {
                    redAssignments[laneIndex] = {
                      ...player,
                      hero_name: assignment.hero_name
                    };
                    console.log(`Assigned ${player.name} to red team ${role} lane`);
                  } else {
                    console.log(`Player ${player.name} not assigned to current team (${currentTeamName})`);
                  }
                }
              }
            });

            // Update picks with player data
            setPicks(prev => {
              const updatedPicks = { ...prev };

              // Update both blue and red picks with player data
              ['blue', 'red'].forEach(team => {
                [1, 2].forEach(phase => {
                  if (updatedPicks[team] && updatedPicks[team][phase]) {
                    updatedPicks[team][phase] = updatedPicks[team][phase].map((pick, index) => {
                      if (pick && pick.lane) {
                        const laneIndex = ['exp', 'jungler', 'mid', 'gold', 'roam'].indexOf(pick.lane);
                        const player = team === 'blue' ? blueAssignments[laneIndex] : redAssignments[laneIndex];

                        if (player) {
                          console.log(`Updated ${team} team ${phase} pick ${index} with player:`, player);
                          return {
                            ...pick,
                            player: player
                          };
                        }
                      }
                      return pick;
                    });
                  }
                });
              });

              return updatedPicks;
            });

            console.log('Loaded player assignments for match:', {
              blueAssignments,
              redAssignments,
              currentTeamName
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading player assignments:', error);
      // Continue with edit modal even if player assignments fail to load
    }

    // Objective counts
    if (match.turtle_taken) {
      const [b, r] = match.turtle_taken.split('-').map(Number);
      setTurtleTakenBlue(b || '0');
      setTurtleTakenRed(r || '0');
    } else {
      setTurtleTakenBlue('0');
      setTurtleTakenRed('0');
    }

    if (match.lord_taken) {
      const [b, r] = match.lord_taken.split('-').map(Number);
      setLordTakenBlue(b || '0');
      setLordTakenRed(r || '0');
    } else {
      setLordTakenBlue('0');
      setLordTakenRed('0');
    }

    // Annual map
    setAnnualMap(match.annual_map || '');

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

  async function handleExportConfirm(exportData) {
    try {
      const latestTeam = JSON.parse(localStorage.getItem('latestTeam'));
      const currentTeamId = latestTeam?.id;

      // Check if this is comprehensive draft data (new format) or regular export data (old format)
      let banning, picks;

      if (exportData.draftBans && exportData.draftPicks && exportData.laneAssignments && exportData.playerAssignments) {
        // This is comprehensive draft data - convert to the expected format
        console.log('Processing comprehensive draft data:', exportData);

        // Convert draftBans to the expected banning format
        banning = {
          blue1: exportData.draftBans.blue.slice(0, 3) || [],
          blue2: exportData.draftBans.blue.slice(3, 5) || [],
          red1: exportData.draftBans.red.slice(0, 3) || [],
          red2: exportData.draftBans.red.slice(3, 5) || []
        };

        // Convert draftPicks to the expected picks format with lane assignments
        const convertDraftPicks = (teamPicks, teamLanes, teamPlayerAssignments) => {
          const picks1 = [];
          const picks2 = [];

          teamPicks.forEach((hero, index) => {
            if (hero) {
              const lane = teamLanes[index] || 'unknown';

              // Find the player assigned to this lane from playerAssignments
              let assignedPlayer = null;
              if (teamPlayerAssignments && teamPlayerAssignments[lane] && teamPlayerAssignments[lane].length > 0) {
                // Get the first (primary) player for this lane
                assignedPlayer = teamPlayerAssignments[lane][0];
              }

              const pickData = {
                lane: lane,
                hero: hero.name || hero,
                player: assignedPlayer ? assignedPlayer.name : null
              };

              console.log(`Converted pick: ${hero.name || hero} (${lane}) -> ${assignedPlayer ? assignedPlayer.name : 'null'}`, {
                hero,
                lane,
                assignedPlayer,
                teamPlayerAssignments
              });

              // Distribute picks between phase 1 (first 3) and phase 2 (last 2)
              if (index < 3) {
                picks1.push(pickData);
              } else {
                picks2.push(pickData);
              }
            }
          });

          return { 1: picks1, 2: picks2 };
        };

        picks = {
          blue: convertDraftPicks(exportData.draftPicks.blue, exportData.laneAssignments.blue, exportData.playerAssignments.blue),
          red: convertDraftPicks(exportData.draftPicks.red, exportData.laneAssignments.red, exportData.playerAssignments.red)
        };

        console.log('Converted comprehensive draft data:', { banning, picks });
      } else {
        // This is regular export data - use as is
        banning = exportData.banning;
        picks = exportData.picks;
      }

      const payload = {
        match_date: matchDate,
        winner,
        notes,
        playstyle,
        annual_map: annualMap,
        turtle_taken: `${turtleTakenBlue || 0}-${turtleTakenRed || 0}`,
        lord_taken: `${lordTakenBlue || 0}-${lordTakenRed || 0}`,
        team_id: currentTeamId,
        match_type: matchMode,
        // Include player assignments for comprehensive draft data
        player_assignments: exportData.playerAssignments ? {
          blue: exportData.playerAssignments.blue,
          red: exportData.playerAssignments.red
        } : null
      };

      console.log('HomePage - Saving match with payload:', payload);
      console.log('HomePage - Annual map value:', annualMap);
      console.log('HomePage - Annual map type:', typeof annualMap);

      // Validate payload before sending
      console.log('HomePage - Validating payload:', {
        match_date: payload.match_date,
        winner: payload.winner,
        blueTeam: blueTeam,
        redTeam: redTeam,
        turtle_taken: payload.turtle_taken,
        lord_taken: payload.lord_taken,
        annual_map: payload.annual_map,
        team_id: payload.team_id,
        match_type: payload.match_type
      });

      // Validate winner field specifically
      if (!payload.winner || typeof payload.winner !== 'string' || payload.winner.trim() === '') {
        console.error('HomePage - Invalid winner field:', payload.winner);
        showAlert('Winner field is required and must be a valid team name', 'error');
        return;
      }

      // Validate team names
      if (!blueTeam || !redTeam) {
        console.error('HomePage - Missing team names:', { blueTeam, redTeam });
        showAlert('Both team names are required', 'error');
        return;
      }
      console.log('HomePage - Annual map length:', annualMap ? annualMap.length : 'null/undefined');
      console.log('HomePage - Payload annual_map field:', payload.annual_map);
      console.log('HomePage - Payload keys:', Object.keys(payload));

      if (isEditing && editingMatchId) {
        // One request only; backend recreates children from teams
        const updated = await updateMatch(editingMatchId, payload, { banning, picks });
        console.log('Match update completed, updating local state:', { updated, editingMatchId });
        console.log('UpdateMatch - API response annual_map:', updated.annual_map);
        console.log('UpdateMatch - API response keys:', Object.keys(updated));

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

        // Dispatch match updated event for player statistics refresh
        window.dispatchEvent(new CustomEvent('matchUpdated', {
          detail: {
            matchId: editingMatchId,
            teamId: currentTeamId,
            matchData: { banning, picks, ...payload },
            action: 'update'
          }
        }));
      } else {
        const newMatch = await createMatch(payload, { banning, picks }); // keep your create flow
        showAlert('Match exported!', 'success');

        // Dispatch match updated event for player statistics refresh
        window.dispatchEvent(new CustomEvent('matchUpdated', {
          detail: {
            matchId: newMatch?.id || 'new',
            teamId: currentTeamId,
            matchData: { banning, picks, ...payload },
            action: 'create'
          }
        }));
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

    // Debug the banning and picks data
    console.log('Debug banning data:', {
      blue1: banning.blue1,
      blue2: banning.blue2,
      red1: banning.red1,
      red2: banning.red2
    });

    console.log('Debug picks data:', {
      blue1: picks.blue?.[1],
      blue2: picks.blue?.[2],
      red1: picks.red?.[1],
      red2: picks.red?.[2]
    });

    // 1) Update parent match with teams data
    // Only include picks and bans if they have actual data
    const buildTeamData = (teamName, teamColor, teamBanning, teamPicks) => {
      const teamData = {
        team: teamName,
        team_color: teamColor,
      };

      // Only include banning data if it has content
      if (Array.isArray(teamBanning.phase1) && teamBanning.phase1.length > 0) {
        teamData.banning_phase1 = teamBanning.phase1;
      }
      if (Array.isArray(teamBanning.phase2) && teamBanning.phase2.length > 0) {
        teamData.banning_phase2 = teamBanning.phase2;
      }

      // Only include picks data if it has content
      if (Array.isArray(teamPicks[1]) && teamPicks[1].length > 0) {
        teamData.picks1 = teamPicks[1];
      }
      if (Array.isArray(teamPicks[2]) && teamPicks[2].length > 0) {
        teamData.picks2 = teamPicks[2];
      }

      return teamData;
    };

    const fullMatchPayload = {
      ...matchPayload,
      teams: [
        buildTeamData(blueTeam, 'blue', { phase1: banning.blue1, phase2: banning.blue2 }, picks.blue || {}),
        buildTeamData(redTeam, 'red', { phase1: banning.red1, phase2: banning.red2 }, picks.red || {})
      ],
      // Include player assignments if available
      player_assignments: matchPayload.player_assignments || null
    };

    console.log('Full match payload being sent:', fullMatchPayload);
    console.log('Full match payload annual_map field:', fullMatchPayload.annual_map);
    console.log('Full match payload keys:', Object.keys(fullMatchPayload));

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
      console.error('Request payload that failed:', fullMatchPayload);
      console.error('Response details:', {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body: txt
      });
      throw new Error(`Update match failed: ${res.status} ${txt}`);
    }

    // Backend now handles all team updates in one transaction
    // Return the updated match data for frontend state update
    const updated = await res.json();
    console.log('Updated match data received:', updated);

    // Update player assignments in the database to reflect hero changes
    if (currentTeamId && updated.teams) {
      try {
        console.log('Updating player assignments for match:', matchId);

        // Process both teams
        for (const team of updated.teams) {
          const teamColor = team.team_color;
          const teamName = team.team;

          // Get all picks for this team
          const allPicks = [
            ...(team.picks1 || []),
            ...(team.picks2 || [])
          ];

          // Filter picks that have hero data and can be mapped to players
          const picksWithPlayers = allPicks.filter(pick =>
            (pick.hero || pick.name) && (pick.lane || pick.role)
          );

          if (picksWithPlayers.length > 0) {
            console.log(`Updating player assignments for ${teamColor} team (${teamName}):`, picksWithPlayers);

            // Get the appropriate players array for this team
            const latestTeam = JSON.parse(localStorage.getItem('latestTeam') || '{}');
            const teamPlayers = latestTeam?.players || [];

            // Prepare assignments for this team with lane-based mapping
            const assignments = picksWithPlayers.map(pick => {
              // Find player ID by lane mapping
              let playerId = null;
              if (pick.player && typeof pick.player === 'object' && pick.player.id) {
                playerId = pick.player.id;
              } else if (pick.player && typeof pick.player === 'string') {
                // Find player by name in the team players array
                const player = teamPlayers.find(p => p.name === pick.player);
                playerId = player ? player.id : null;
              } else if (teamPlayers && teamPlayers.length > 0 && pick.lane) {
                // Lane-based mapping: find player by role
                const roleMapping = {
                  'exp': 'exp',
                  'mid': 'mid',
                  'jungler': 'jungler',
                  'gold': 'gold',
                  'roam': 'roam'
                };
                const mappedRole = roleMapping[pick.lane];
                if (mappedRole) {
                  const player = teamPlayers.find(p =>
                    p.role && p.role.toLowerCase() === mappedRole.toLowerCase()
                  );
                  playerId = player ? player.id : null;
                }
              }

              return {
                player_id: playerId,
                role: pick.lane || pick.role,
                hero_name: pick.hero || pick.name,
                is_starting_lineup: true,
                substitute_order: null,
                notes: null
              };
            }).filter(assignment => assignment.player_id); // Only include assignments with valid player IDs

            // Skip API call if no valid assignments
            if (assignments.length === 0) {
              console.warn(`No valid player assignments found for ${teamColor} team, skipping assign API call`);
              continue;
            }

            // Update player assignments
            try {
              const assignUrl = buildApiUrl('/match-player-assignments/assign');
              console.log(`Making assign request to: ${assignUrl}`);
              console.log(`Assign payload for ${teamColor} team:`, {
                match_id: matchId,
                team_id: currentTeamId,
                assignments: assignments
              });

              const assignmentResponse = await fetch(assignUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  match_id: matchId,
                  team_id: currentTeamId,
                  assignments: assignments
                })
              });

              console.log(`Assign response status: ${assignmentResponse.status}`);
              console.log(`Assign response URL: ${assignmentResponse.url}`);

              if (assignmentResponse.ok) {
                const result = await assignmentResponse.json();
                console.log(`✅ Player assignments updated for ${teamColor} team:`, result);
              } else {
                const errorText = await assignmentResponse.text();
                console.warn(`⚠️ Failed to update player assignments for ${teamColor} team:`, errorText);
              }
            } catch (fetchError) {
              console.error(`❌ Network error updating player assignments for ${teamColor} team:`, fetchError);
              console.error(`❌ Error details:`, {
                name: fetchError.name,
                message: fetchError.message,
                stack: fetchError.stack
              });
              // Continue execution - don't throw
            }
          }
        }
      } catch (error) {
        console.error('Error updating player assignments:', error);
        // Don't throw - the match update was successful
      }
    }

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
      if (latestTeam && latestTeam.teamName) {
        const players = latestTeam.players || latestTeam.players_data || [];
        console.log('🔍 HomePage player data debug:', {
          latestTeam: latestTeam.teamName,
          blueTeam,
          redTeam,
          hasPlayers: players.length > 0,
          playerCount: players.length,
          players: players.map(p => ({ name: p.name, role: p.role }))
        });
        if (latestTeam.teamName === blueTeam) bluePlayers = players;
        if (latestTeam.teamName === redTeam) redPlayers = players;
      }
    } catch (e) {
      console.error('Error loading team data:', e);
    }

    // Helper to get player name with lane-based mapping
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

      // Lane-based mapping: Find player by lane assignment
      if (p.lane && playersArr && playersArr.length > 0) {
        const roleMapping = {
          'exp': 'exp',
          'mid': 'mid',
          'jungler': 'jungler',
          'gold': 'gold',
          'roam': 'roam'
        };

        const mappedRole = roleMapping[p.lane];
        if (mappedRole) {
          const playerByRole = playersArr.find(player =>
            player.role && player.role.toLowerCase() === mappedRole.toLowerCase()
          );

          if (playerByRole) {
            console.log(`Using lane-based mapping (${p.lane} -> ${mappedRole}): ${playerByRole.name}`);
            return playerByRole.name;
          }
        }
      }

      // If no player found, log a warning but don't skip the pick
      console.warn(`Pick missing player data for ${p.lane} lane with hero ${p.hero} - using fallback`);
      return 'Unknown Player'; // Return a fallback instead of null
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

    console.log('CreateMatch - Full payload being sent:', fullPayload);
    console.log('CreateMatch - Full payload annual_map field:', fullPayload.annual_map);
    console.log('CreateMatch - Full payload keys:', Object.keys(fullPayload));

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

    // Get the created match data
    const createdMatch = await response.json();
    console.log('Created match data:', createdMatch);
    console.log('CreateMatch - API response annual_map:', createdMatch.annual_map);
    console.log('CreateMatch - API response keys:', Object.keys(createdMatch));

    // Create player assignments for the created match
    if (latestTeam?.id && createdMatch.id) {
      try {
        console.log('Creating player assignments for new match:', createdMatch.id);

        // Process both teams
        for (const team of createdMatch.teams || fullPayload.teams) {
          const teamColor = team.team_color;
          const teamName = team.team;

          // Get all picks for this team
          const allPicks = [
            ...(team.picks1 || []),
            ...(team.picks2 || [])
          ];

          // Filter picks that have hero data and can be mapped to players
          const picksWithPlayers = allPicks.filter(pick =>
            (pick.hero || pick.name) && (pick.lane || pick.role)
          );

          if (picksWithPlayers.length > 0) {
            console.log(`Creating player assignments for ${teamColor} team (${teamName}):`, picksWithPlayers);

            // Get the appropriate players array for this team
            const teamPlayers = teamColor === 'blue' ? bluePlayers : redPlayers;

            // Prepare assignments for this team with lane-based mapping
            const assignments = picksWithPlayers.map(pick => {
              // Find player ID by lane mapping
              let playerId = null;
              if (pick.player && typeof pick.player === 'object' && pick.player.id) {
                playerId = pick.player.id;
              } else if (pick.player && typeof pick.player === 'string') {
                // Find player by name in the team players array
                const player = teamPlayers.find(p => p.name === pick.player);
                playerId = player ? player.id : null;
              } else if (teamPlayers && teamPlayers.length > 0 && pick.lane) {
                // Lane-based mapping: find player by role
                const roleMapping = {
                  'exp': 'exp',
                  'mid': 'mid',
                  'jungler': 'jungler',
                  'gold': 'gold',
                  'roam': 'roam'
                };
                const mappedRole = roleMapping[pick.lane];
                if (mappedRole) {
                  const player = teamPlayers.find(p =>
                    p.role && p.role.toLowerCase() === mappedRole.toLowerCase()
                  );
                  playerId = player ? player.id : null;
                }
              }

              return {
                player_id: playerId,
                role: pick.lane || pick.role,
                hero_name: pick.hero || pick.name,
                is_starting_lineup: true,
                substitute_order: null,
                notes: null
              };
            }).filter(assignment => assignment.player_id); // Only include assignments with valid player IDs

            // Skip API call if no valid assignments
            if (assignments.length === 0) {
              console.warn(`No valid player assignments found for ${teamColor} team, skipping assign API call`);
              continue;
            }

            // Create player assignments
            try {
              const assignUrl = buildApiUrl('/match-player-assignments/assign');
              console.log(`Making assign request to: ${assignUrl}`);
              console.log(`Assign payload for ${teamColor} team:`, {
                match_id: createdMatch.id,
                team_id: latestTeam.id,
                assignments: assignments
              });

              const assignmentResponse = await fetch(assignUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  match_id: createdMatch.id,
                  team_id: latestTeam.id,
                  assignments: assignments
                })
              });

              console.log(`Assign response status: ${assignmentResponse.status}`);
              console.log(`Assign response URL: ${assignmentResponse.url}`);

              if (assignmentResponse.ok) {
                const result = await assignmentResponse.json();
                console.log(`✅ Player assignments created for ${teamColor} team:`, result);
              } else {
                const errorText = await assignmentResponse.text();
                console.warn(`⚠️ Failed to create player assignments for ${teamColor} team:`, errorText);
              }
            } catch (fetchError) {
              console.error(`❌ Network error creating player assignments for ${teamColor} team:`, fetchError);
              console.error(`❌ Error details:`, {
                name: fetchError.name,
                message: fetchError.message,
                stack: fetchError.stack
              });
              // Continue execution - don't throw
            }
          }
        }
      } catch (error) {
        console.error('Error creating player assignments:', error);
        // Don't throw - the match creation was successful
      }
    }

    // Save to localStorage for Player Statistics
    if (latestTeam && (blueTeam === latestTeam.teamName || redTeam === latestTeam.teamName)) {
      // Ensure annual_map is included in localStorage
      const matchWithAnnualMap = {
        ...fullPayload,
        annual_map: annualMap
      };
      localStorage.setItem('latestMatch', JSON.stringify(matchWithAnnualMap));
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
        currentMode={matchMode}
      />

      {/* Main Content */}
      <main className="flex flex-col items-center px-2 flex-1" style={{ marginTop: 80, paddingTop: 0 }}>
        <div className="flex flex-col items-center w-full">
          <div className="w-[1600px] max-w-[95vw] mx-auto p-4 rounded-2xl" style={{ background: '#23232a', boxShadow: '0 4px 24px 0 rgba(0,0,0,0.25)', border: '1px solid #23283a', marginTop: 0 }}>
            {/* Top Controls */}
            <TopControls
              onExportClick={() => {
                console.log('HomePage - Export button clicked');
                console.log('HomePage - Current annualMap before opening modal:', annualMap);
                setHoveredMatchId(null);
                setModalState('export');
              }}
              onHeroStatsClick={() => setShowHeroStatsModal(true)}
              currentMode={matchMode}
              onModeChange={handleModeChange}
              onSearch={handleSearch}
              onClearSearch={handleClearSearch}
              totalMatches={matches.length}
            />
            {/* Match Table */}
            <MatchTable
              matches={filteredMatches.length > 0 || searchFilters.term || searchFilters.date ? filteredMatches : matches}
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
              totalMatches={matches.length}
              isFiltered={!!(searchFilters.term || searchFilters.date)}
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
        annualMap={annualMap}
        setAnnualMap={setAnnualMap}
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
        playerAssignments={playerAssignments}
        setPlayerAssignments={setPlayerAssignments}
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
        onConfirm={(selectedHero) => {
          if (selectedHero && selectedHero.length > 0) {
            setBanning(prev => ({
              ...prev,
              [heroPickerTarget]: selectedHero
            }));
          }
          setModalState('export');
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