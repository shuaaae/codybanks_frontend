import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import defaultPlayer from '../assets/default.png';
import { Chart, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Legend, Tooltip } from 'chart.js';
import PageTitle from '../components/PageTitle';
import Header from '../components/Header';
import ProfileModal from '../components/ProfileModal';
import useSessionTimeout from '../hooks/useSessionTimeout';
import { safelyActivateTeam, clearActiveTeam } from '../utils/teamUtils';
import {
  TeamDisplayCard,
  PlayerModal,
  PerformanceModal,
  ConfirmUploadModal,
  PlayerGrid,
  LANES,
  PLAYER,
  scrollbarHideStyles
} from '../components/PlayersStatistic';
import SuccessModal from '../components/PlayersStatistic/SuccessModal';
import SettingsModal from '../components/PlayersStatistic/SettingsModal';

Chart.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Legend, Tooltip);

function PlayersStatistic() {
  const navigate = useNavigate();
  const [lanePlayers, setLanePlayers] = useState(null);
  const [modalInfo, setModalInfo] = useState(null);
  const [teamPlayers, setTeamPlayers] = useState(null);
  const fileInputRef = useRef();
  const [uploadingPlayer, setUploadingPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [heroStats, setHeroStats] = useState([]);
  const [allPlayerStats, setAllPlayerStats] = useState({}); // cache for all player stats
  const [allPlayerH2HStats, setAllPlayerH2HStats] = useState({}); // cache for all player H2H stats
  const [heroH2HStats, setHeroH2HStats] = useState([]); // current modal H2H stats
  const [isLoadingStats, setIsLoadingStats] = useState(false); // loading state for stats
  const [showPerformanceModal, setShowPerformanceModal] = useState(false); // performance modal state
  const [imageCache, setImageCache] = useState({}); // cache for player images
  const [currentTeamId, setCurrentTeamId] = useState(null); // track current team ID
  const [forceUpdate, setForceUpdate] = useState(0); // force re-render after photo upload
  const statsFetchingRef = useRef(false);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true); // Add loading state for team
  // User avatar state
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false); // Add profile modal state
  
  // User session timeout: 30 minutes
  useSessionTimeout(30, 'currentUser', '/');

  // Check if user is logged in
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
      navigate('/');
      return;
    }
    setCurrentUser(user);
  }, [navigate]);

  // Automatically set team as active when entering PlayersStatistic
  useEffect(() => {
    const latestTeam = localStorage.getItem('latestTeam');
    if (latestTeam) {
      const teamData = JSON.parse(latestTeam);
      
      // Use the utility function to safely activate the team
      safelyActivateTeam(teamData.id);
      
      // Immediately sync team data from localStorage
      setTeamPlayers(teamData);
      setCurrentTeamId(teamData.id);
      
      // Also refresh lanePlayers if no active match
      const latestMatch = JSON.parse(localStorage.getItem('latestMatch'));
      if (!latestMatch || !latestMatch.teams || latestMatch.teams.length === 0) {
        if (teamData.players_data) {
          const allPlayers = teamData.players_data.map(player => ({
            lane: player.role?.toLowerCase().replace(' ', '_') || 'unknown',
            player: player,
            hero: null
          }));
          setLanePlayers(allPlayers);
          console.log('Initial lanePlayers set from localStorage:', allPlayers);
        }
      }
      
      // Also set the players array for immediate access
      if (teamData.players_data) {
        setPlayers(teamData.players_data);
      } else {
        setPlayers([]);
      }
    }
    
    // Immediately load any cached photos from localStorage
    const newImageCache = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('playerPhoto_')) {
        const playerKey = key.replace('playerPhoto_', '');
        const photoPath = localStorage.getItem(key);
        if (photoPath) {
          newImageCache[playerKey] = photoPath;
        }
      }
    }
    setImageCache(newImageCache);
  }, []);

  // Clear active team when leaving PlayersStatistic
  useEffect(() => {
    return () => {
      // Clear active team when component unmounts (user leaves the page)
      clearActiveTeam().catch(error => {
        console.error('Error clearing active team:', error);
      });
    };
  }, []);

  // Helper function to check if a player already exists
  const playerExists = useCallback((playerName, teamId) => {
    if (!teamPlayers || !teamPlayers.players_data) return false;
    
    return teamPlayers.players_data.some(player => 
      player.name === playerName && player.team_id === teamId
    );
  }, [teamPlayers]);

  // Helper function to refresh lanePlayers with current team data
  const refreshLanePlayers = useCallback(() => {
    const latestMatch = JSON.parse(localStorage.getItem('latestMatch'));
    if (latestMatch && latestMatch.teams && latestMatch.teams.length > 0) {
      // If there's an active match, use match data
      const team = latestMatch.teams[0];
      const picks = [
        ...(team.picks1 || []),
        ...(team.picks2 || [])
      ];
      setLanePlayers(picks);
    } else {
      // No active match, populate with all current team players
      // First try to get from current state, then fallback to localStorage
      let teamData = teamPlayers;
      if (!teamData || !teamData.players_data) {
        teamData = JSON.parse(localStorage.getItem('latestTeam'));
      }
      
      // If still no data, try the currentPlayers key as a fallback
      if (!teamData || !teamData.players_data) {
        const currentPlayers = JSON.parse(localStorage.getItem('currentPlayers'));
        if (currentPlayers && currentPlayers.length > 0) {
          teamData = { players_data: currentPlayers };
        }
      }
      
      if (teamData && teamData.players_data) {
        const allPlayers = teamData.players_data.map(player => ({
          lane: player.role?.toLowerCase().replace(' ', '_') || 'unknown',
          player: player,
          hero: null
        }));
        setLanePlayers(allPlayers);
        console.log('Refreshed lanePlayers with team data:', allPlayers);
      }
    }
  }, [teamPlayers]);

  // Create unique player identifier using name and role
  function getPlayerIdentifier(playerName, role) {
    if (!playerName) return 'unknown';
    
    // For substitute players, ensure unique identification
    if (role && (role.toLowerCase().includes('sub') || role.toLowerCase().includes('substitute'))) {
      return `${playerName}_SUBSTITUTE_${role}`;
    }
    
    // For main players, use name and role
    if (role) {
      return `${playerName}_${role}`;
    }
    
    // Fallback to name only
    return playerName;
  }

  // Preload and cache player images
  const preloadPlayerImages = useCallback(async (teamPlayers) => {
    if (!teamPlayers) return;
    
    const playersArray = teamPlayers.players_data || teamPlayers.players;
    if (!playersArray) return;
    
    const newImageCache = { ...imageCache };
    
    // For each player, set default photo immediately and only fetch if we know they have a photo
    playersArray.forEach((player) => {
      if (!player.name) return;
      
      const playerIdentifier = getPlayerIdentifier(player.name, player.role);
      
              // Only set default photo if we don't have an uploaded photo
      if (!newImageCache[playerIdentifier]) {
          // Check if we have an uploaded photo in localStorage first
          const uploadedPhoto = localStorage.getItem(`playerPhoto_${playerIdentifier}`);
          if (uploadedPhoto) {
            newImageCache[playerIdentifier] = uploadedPhoto;
          } else {
        newImageCache[playerIdentifier] = defaultPlayer;
          }
          
        setImageCache(prev => ({
          ...prev,
            [playerIdentifier]: newImageCache[playerIdentifier]
        }));
      }
    });
    
    // Only attempt to fetch photos for players that might have them
    // This prevents unnecessary API calls and console errors
    const imagePromises = playersArray.map(async (player) => {
      if (!player.name) return;
      
      const playerIdentifier = getPlayerIdentifier(player.name, player.role);
      
      // Skip if already cached with a real photo
      if (newImageCache[playerIdentifier] && newImageCache[playerIdentifier] !== defaultPlayer) return;
      
      try {
        // Try to fetch player photo from server
        const response = await fetch(`/api/players/photo-by-name?playerName=${encodeURIComponent(player.name)}`, {
          method: 'GET',
          headers: {
            'X-Active-Team-ID': teamPlayers.id
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.photo_path) {
            // Construct the full image URL
            let imageUrl = data.photo_path;
            
            // If photo_path is not a full URL, construct it
            if (!imageUrl.startsWith('http')) {
              if (imageUrl.startsWith('/')) {
                imageUrl = `${window.location.origin}${imageUrl}`;
              } else {
                imageUrl = `${window.location.origin}/${imageUrl}`;
              }
            }
            
            // Preload the image
            const img = new Image();
            img.onload = () => {
              setImageCache(prev => ({
                ...prev,
                [playerIdentifier]: imageUrl
              }));
            };
            img.onerror = () => {
              // If image fails to load, keep the default photo
            };
            img.src = imageUrl;
          }
        }
        // Don't log 404 errors - this is expected for players without photos
      } catch (error) {
        // Don't log network errors - just use default photo silently
      }
    });
    
    await Promise.all(imagePromises);
  }, []); // Remove imageCache dependency to prevent infinite loops

  // Function to refresh team data from backend
  const refreshTeamDataFromBackend = useCallback(async () => {
    if (!teamPlayers?.id) {
      console.log('No team ID available for refresh');
      return false;
    }

    try {
      console.log('Refreshing team data from backend...');
      const response = await fetch(`/api/teams/active`, {
        headers: {
          'X-Active-Team-ID': teamPlayers.id
        }
      });
      
      if (response.ok) {
        const activeTeam = await response.json();
        console.log('Fresh team data from backend:', activeTeam);
        
        // Update localStorage with fresh backend data
        const updatedTeamData = {
          teamName: activeTeam.name,
          players_data: activeTeam.players_data || activeTeam.players || [],
          id: activeTeam.id,
          logo_path: activeTeam.logo_path || null
        };
        
        localStorage.setItem('latestTeam', JSON.stringify(updatedTeamData));
        
        // Update state with fresh backend data
        setTeamPlayers(updatedTeamData);
        setPlayers(updatedTeamData.players_data || []);
        
        // Refresh lanePlayers with fresh data
        refreshLanePlayers();
        
        // Preload images for all players
        preloadPlayerImages(updatedTeamData);
        
        console.log('Successfully refreshed team data from backend');
        return true;
      } else {
        console.warn('Failed to fetch fresh team data from backend');
        return false;
      }
    } catch (error) {
      console.error('Error refreshing team data from backend:', error);
      return false;
    }
  }, [teamPlayers?.id, refreshLanePlayers, preloadPlayerImages]);

  const handlePlayerCreate = async (newPlayer) => {
    console.log('Creating new player:', newPlayer);
    
    // Normalize the role to ensure consistency
    const normalizedPlayer = {
      ...newPlayer,
      role: normalizeRole(newPlayer.role)
    };
    
    console.log('Normalized player data:', normalizedPlayer);
    
    // Add to players array
    setPlayers(prev => {
      const updated = [...prev, normalizedPlayer];
      console.log('Updated players array:', updated);
      return updated;
    });
    
    // Add to teamPlayers state
    setTeamPlayers(prev => {
      if (!prev) return prev;
      const playersArray = prev.players_data || prev.players;
      if (!playersArray) return prev;
      
      const updatedPlayers = [...playersArray, normalizedPlayer];
      console.log('Updated teamPlayers:', { ...prev, players_data: updatedPlayers, players: updatedPlayers });
      
      // Update localStorage with the new player data
      const updatedTeamData = {
        ...prev,
        players_data: updatedPlayers,
        players: updatedPlayers
      };
      
      // Update localStorage to persist the new player
      localStorage.setItem('latestTeam', JSON.stringify(updatedTeamData));
      console.log('Updated localStorage with new player:', updatedTeamData);
      
      // Also update the players array in localStorage for immediate access
      localStorage.setItem('currentPlayers', JSON.stringify(updatedPlayers));
      
      return updatedTeamData;
    });

    // Refresh lanePlayers to show all current team players
    refreshLanePlayers();
    
    // Force a re-render to ensure the new player is displayed
    setForceUpdate(prev => prev + 1);

    // IMPORTANT: Sync with backend to ensure data consistency
    try {
      console.log('Syncing with backend after player creation...');
      
      // Use the refresh function to get fresh data from backend
      const success = await refreshTeamDataFromBackend();
      
      if (success) {
        console.log('Successfully synced with backend after player creation');
      } else {
        console.warn('Failed to sync with backend, using local data');
      }
    } catch (error) {
      console.error('Error syncing with backend after player creation:', error);
      console.log('Continuing with local data update');
    }
  };

  // Auto-refresh team data periodically and when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && teamPlayers) {
        console.log('Page became visible, auto-refreshing team data...');
        refreshTeamDataFromBackend();
      }
    };

    // Refresh data when component mounts
    if (teamPlayers?.id) {
      console.log('Component mounted, refreshing team data...');
      refreshTeamDataFromBackend();
    }

    // Set up periodic refresh (every 30 seconds)
    const interval = setInterval(() => {
      if (teamPlayers?.id) {
        console.log('Periodic refresh of team data...');
        refreshTeamDataFromBackend();
      }
    }, 30000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [teamPlayers?.id, refreshTeamDataFromBackend]);

  // Manual sync function to ensure data consistency
  const manualSyncData = async () => {
    console.log('Manual data sync triggered');
    
    try {
      // First try to get fresh data from backend
      const success = await refreshTeamDataFromBackend();
      
      if (success) {
        // Force re-render
        setForceUpdate(prev => prev + 1);
        console.log('Manual sync completed with fresh backend data');
        return;
      }
    } catch (error) {
      console.error('Error fetching fresh data from backend:', error);
      console.log('Falling back to localStorage data');
    }
    
    // Fallback to localStorage data if backend fetch fails
    const latestTeam = JSON.parse(localStorage.getItem('latestTeam'));
    const currentPlayers = JSON.parse(localStorage.getItem('currentPlayers'));
    
    if (latestTeam) {
      // Update team state
      setTeamPlayers(latestTeam);
      setCurrentTeamId(latestTeam.id);
      
      // Update players array
      if (latestTeam.players_data && Array.isArray(latestTeam.players_data)) {
        setPlayers(latestTeam.players_data);
      } else if (currentPlayers && Array.isArray(currentPlayers)) {
        setPlayers(currentPlayers);
      } else {
        setPlayers([]);
      }
      
      // Refresh lanePlayers
      refreshLanePlayers();
      
      // Force re-render
      setForceUpdate(prev => prev + 1);
      
      console.log('Manual sync completed with localStorage data');
    }
  };

  // Auto-sync data when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && teamPlayers) {
        console.log('Page became visible, auto-syncing data...');
        manualSyncData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [teamPlayers, manualSyncData]);



  const handleLogout = () => {
    // Clear active team when logging out
    clearActiveTeam().catch(error => {
      console.error('Error clearing active team on logout:', error);
    });

    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminAuthToken');
    navigate('/');
  };

  // Hero evaluation state
  const [heroEvaluation, setHeroEvaluation] = useState(() => {
    const currentPlayerName = modalInfo?.player?.name || '';
    const saved = localStorage.getItem(`heroEvaluation_${currentPlayerName}`);
    return saved ? JSON.parse(saved) : {
      date: '',
      blackHeroes: Array(15).fill(''),
      blueHeroes: Array(15).fill(''),
      redHeroes: Array(15).fill(''),
      commitment: '',
      goal: '',
      roleMeaning: ''
    };
  });
  
  // Player evaluation state
  const [playerEvaluation, setPlayerEvaluation] = useState(() => {
    const currentPlayerName = modalInfo?.player?.name || '';
    const saved = localStorage.getItem(`playerEvaluation_${currentPlayerName}`);
    return saved ? JSON.parse(saved) : {
      date: '',
      name: '',
      role: '',
      notes: '',
      qualities: {
        'In-Game knowledge': null,
        'Reflex': null,
        'Skills': null,
        'Communications': null,
        'Technical Skill': null,
        'Attitude': null,
        'Decision Making': null,
        'Hero Pool': null,
        'Skillshots': null,
        'Team Material': null
      },
      comments: Array(10).fill('')
    };
  });

  // Load team players and preload images
  useEffect(() => {
    const latestMatch = JSON.parse(localStorage.getItem('latestMatch'));
    if (latestMatch && latestMatch.teams && latestMatch.teams.length > 0) {
      const team = latestMatch.teams[0];
      const picks = [
        ...(team.picks1 || []),
        ...(team.picks2 || [])
      ];
      setLanePlayers(picks);
      
      // Store match data for player disambiguation
      localStorage.setItem('currentMatchData', JSON.stringify(latestMatch));
    } else {
      // No active match, so populate lanePlayers with all current team players
      const latestTeam = JSON.parse(localStorage.getItem('latestTeam'));
      if (latestTeam && latestTeam.players_data) {
        const allPlayers = latestTeam.players_data.map(player => ({
          lane: player.role?.toLowerCase().replace(' ', '_') || 'unknown',
          player: player,
          hero: null
        }));
        setLanePlayers(allPlayers);
    } else {
      setLanePlayers(null);
      }
      localStorage.removeItem('currentMatchData');
    }

    const loadTeamData = async () => {
      setIsLoadingTeam(true);
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setIsLoadingTeam(false);
      }, 10000); // Increased to 10 seconds
      
      try {
        // First try to get team data from localStorage for immediate display
        const latestTeam = JSON.parse(localStorage.getItem('latestTeam'));
        
        if (latestTeam && latestTeam.teamName) {
          // Set team data immediately from localStorage for fast display
          // Preserve logo_path if it exists
          const teamDataWithLogo = {
            ...latestTeam,
            logo_path: latestTeam.logo_path || null
          };
          setTeamPlayers(teamDataWithLogo);
          setCurrentTeamId(latestTeam.id);
          setIsLoadingTeam(false); // Stop loading immediately when we have data
          
          // Then fetch fresh data from backend in background
          try {
            const response = await fetch(`/api/teams/active`, {
              headers: {
                'X-Active-Team-ID': latestTeam.id
              }
            });
            if (response.ok) {
              const activeTeam = await response.json();
              
              // Update localStorage with fresh data
              const updatedTeamData = {
                teamName: activeTeam.name,
                players_data: activeTeam.players_data || activeTeam.players || [],
                id: activeTeam.id,
                logo_path: activeTeam.logo_path || null
              };
              
              localStorage.setItem('latestTeam', JSON.stringify(updatedTeamData));
              setTeamPlayers(updatedTeamData);
              setCurrentTeamId(activeTeam.id);
              
              // Update lanePlayers with all current team players if no match is active
              const latestMatch = JSON.parse(localStorage.getItem('latestMatch'));
              if (!latestMatch || !latestMatch.teams || latestMatch.teams.length === 0) {
                const allPlayers = updatedTeamData.players_data.map(player => ({
                  lane: player.role?.toLowerCase().replace(' ', '_') || 'unknown',
                  player: player,
                  hero: null
                }));
                setLanePlayers(allPlayers);
              }
              
              // Preload player images for the team
              preloadPlayerImages(updatedTeamData);
            }
          } catch (error) {
            console.error('Error fetching fresh team data:', error);
            // Keep using localStorage data if API fails
          }
        } else {
          // Try to fetch active team from API
          try {
            const response = await fetch(`/api/teams/active`);
            if (response.ok) {
              const activeTeam = await response.json();
              const teamData = {
                teamName: activeTeam.name,
                players_data: activeTeam.players_data || activeTeam.players || [],
                id: activeTeam.id,
                logo_path: activeTeam.logo_path || null
              };
              localStorage.setItem('latestTeam', JSON.stringify(teamData));
              setTeamPlayers(teamData);
              setCurrentTeamId(activeTeam.id);
              
              // Update lanePlayers with all current team players if no match is active
              const latestMatch = JSON.parse(localStorage.getItem('latestMatch'));
              if (!latestMatch || !latestMatch.teams || latestMatch.teams.length === 0) {
                const allPlayers = teamData.players_data.map(player => ({
                  lane: player.role?.toLowerCase().replace(' ', '_') || 'unknown',
                  player: player,
                  hero: null
                }));
                setLanePlayers(allPlayers);
              }
              
              preloadPlayerImages(teamData);
            } else {
              setTeamPlayers(null);
            }
          } catch (error) {
            console.error('Error fetching active team:', error);
            setTeamPlayers(null);
          }
        }
      } catch (error) {
        console.error('Error loading team data:', error);
        // Fallback to localStorage data
        const latestTeam = JSON.parse(localStorage.getItem('latestTeam'));
        setTeamPlayers(latestTeam || null);
      } finally {
        clearTimeout(timeoutId);
        setIsLoadingTeam(false);
      }
    };

    loadTeamData();
  }, [currentTeamId]); // Only re-run when team changes, not when preloadPlayerImages changes

  // Listen for team changes and page visibility changes
  useEffect(() => {
    const checkTeamChange = () => {
      const latestTeam = JSON.parse(localStorage.getItem('latestTeam'));
      if (latestTeam) {
        // Check if team data has changed (not just ID)
        const currentTeam = teamPlayers;
        const hasTeamChanged = !currentTeam || 
          currentTeam.id !== latestTeam.id ||
          JSON.stringify(currentTeam.players_data) !== JSON.stringify(latestTeam.players_data);
        
        if (hasTeamChanged) {
          console.log('Team data changed, updating state:', latestTeam);
          setCurrentTeamId(latestTeam.id);
          // Preserve logo_path if it exists
          const teamDataWithLogo = {
            ...latestTeam,
            logo_path: latestTeam.logo_path || null
          };
          setTeamPlayers(teamDataWithLogo);
          preloadPlayerImages(teamDataWithLogo);
          
          // Also refresh lanePlayers if no active match
          const latestMatch = JSON.parse(localStorage.getItem('latestMatch'));
          if (!latestMatch || !latestMatch.teams || latestMatch.teams.length === 0) {
            refreshLanePlayers();
          }
          
          // Also update the players array
          if (latestTeam.players_data && Array.isArray(latestTeam.players_data)) {
            setPlayers(latestTeam.players_data);
          } else {
            setPlayers([]);
          }
        }
      }
    };

    // Check when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkTeamChange();
      }
    };

    // Check periodically for team changes (reduced frequency)
    const interval = setInterval(checkTeamChange, 10000); // Increased to 10 seconds to be less aggressive

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentTeamId, teamPlayers]); // Added teamPlayers dependency for better change detection

  // Get cached player photo or default
  const getPlayerPhoto = useCallback((playerName, playerRole) => {
    const playerIdentifier = getPlayerIdentifier(playerName, playerRole);
    
    // Check localStorage first for immediate access to uploaded photos
    const localStoragePhoto = localStorage.getItem(`playerPhoto_${playerIdentifier}`);
    const nameOnlyPhoto = !playerRole ? localStorage.getItem(`playerPhoto_${playerName}`) : null;
    

    
    // Check localStorage first for immediate access (highest priority)
    if (localStoragePhoto) {
      return localStoragePhoto;
    }
    
    if (nameOnlyPhoto) {
      return nameOnlyPhoto;
    }
    
    // Check for role variations in localStorage
    if (playerRole) {
      const roleVariations = [
        playerRole.toLowerCase(),
        playerRole.toLowerCase().replace('lane', ''),
        playerRole.toLowerCase().replace('laner', ''),
        playerRole.toLowerCase().replace('lane', 'laner')
      ];
      
      for (const roleVar of roleVariations) {
        const variationKey = `${playerName}_${roleVar}`;
        const localStoragePhoto = localStorage.getItem(`playerPhoto_${variationKey}`);
        if (localStoragePhoto) {
          return localStoragePhoto;
        }
      }
    }
    
    // Check memory cache with the full identifier
    if (imageCache[playerIdentifier]) {
      const cachedPhoto = imageCache[playerIdentifier];
      // CRITICAL: Don't return default images if we're looking for a specific player
      if (cachedPhoto && !cachedPhoto.includes('default')) {
        return cachedPhoto;
      }
    }
    
    // If not found and we have a role, try to find by name only (for players with null roles in DB)
    if (playerRole && !imageCache[playerIdentifier]) {
      const nameOnlyIdentifier = playerName;
      if (imageCache[nameOnlyIdentifier]) {
        return imageCache[nameOnlyIdentifier];
      }
    }
    
    // Check for role variations in memory cache
    if (playerRole) {
      const roleVariations = [
        playerRole.toLowerCase(),
        playerRole.toLowerCase().replace('lane', ''),
        playerRole.toLowerCase().replace('laner', ''),
        playerRole.toLowerCase().replace('lane', 'laner')
      ];
      
      for (const roleVar of roleVariations) {
        const variationKey = `${playerName}_${roleVar}`;
        if (imageCache[variationKey]) {
          return imageCache[variationKey];
        }
      }
    }
    
    // Special handling for NULL roles - check name-only cache first
    if (!playerRole || playerRole === null || playerRole === 'null') {
      if (imageCache[playerName]) {
        return imageCache[playerName];
      }
    }
    
    // Check if player exists in players array and has a photo
    let player = players.find(p => p.name === playerName && p.role === playerRole);
    
    // If not found and role is null, try to find by name only
    if (!player && (playerRole === null || playerRole === undefined)) {
      player = players.find(p => p.name === playerName);
    }
    
    if (player && player.photo) {
      return player.photo;
    }
    
    return defaultPlayer;
  }, [imageCache, players, forceUpdate]); // Add forceUpdate dependency to trigger re-renders

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const response = await fetch('/api/players');
        const data = await response.json();
        
        // Ensure data is an array before setting it
        if (Array.isArray(data)) {
          console.log('Setting players from API:', data);
          setPlayers(data);
        } else {
          console.error('API returned non-array data:', data);
          setPlayers([]);
        }
        
        // Cache any existing player photos
        const newImageCache = { ...imageCache };
        data.forEach(player => {
          if (player.name && player.photo) {
            // Cache by name only for players with null role
            const cacheKey = player.role ? `${player.name}_${player.role}` : player.name;
            newImageCache[cacheKey] = player.photo;
            localStorage.setItem(`playerPhoto_${cacheKey}`, player.photo);
            
            // For players with NULL roles, also cache with name-only key for compatibility
            if (!player.role || player.role === null || player.role === 'null') {
              newImageCache[player.name] = player.photo;
              localStorage.setItem(`playerPhoto_${player.name}`, player.photo);
            }
          }
        });
        setImageCache(newImageCache);
      } catch (error) {
        console.error('Error loading players:', error);
      }
    };
    
    loadPlayers();
  }, []); // Only run once on component mount

  // Pre-fetch all player stats and H2H stats for the current team
  useEffect(() => {
    const playersArray = teamPlayers?.players_data || teamPlayers?.players;
    if (teamPlayers && playersArray && teamPlayers.teamName) {
      // Prevent multiple simultaneous fetches
      if (isLoadingStats || statsFetchingRef.current) return;
      
      statsFetchingRef.current = true;
      setIsLoadingStats(true);
      
      const fetchAllStats = async () => {
        try {
          const statsObj = {};
          const h2hStatsObj = {};
          
          await Promise.all(
            playersArray.map(async (p) => {
              if (!p.name || !p.role) return;
              
              const playerIdentifier = getPlayerIdentifier(p.name, p.role);
              
              // Fetch stats for all players (including substitutes) to ensure accurate data
              // The backend will handle role-based filtering
              try {
                const [statsRes, h2hRes] = await Promise.all([
                  fetch(`/api/players/${encodeURIComponent(p.name)}/hero-stats-by-team?teamName=${encodeURIComponent(teamPlayers.teamName)}&role=${encodeURIComponent(p.role)}`, {
                    
                    headers: {
                      'X-Active-Team-ID': teamPlayers.id
                    }
                  }),
                  fetch(`/api/players/${encodeURIComponent(p.name)}/hero-h2h-stats-by-team?teamName=${encodeURIComponent(teamPlayers.teamName)}&role=${encodeURIComponent(p.role)}`, {
                    headers: {
                      'X-Active-Team-ID': teamPlayers.id
                    }
                  })
                ]);
                
                const statsData = await statsRes.json();
                const h2hData = await h2hRes.json();
                
                statsObj[playerIdentifier] = statsData;
                h2hStatsObj[playerIdentifier] = h2hData;
              } catch (error) {
                console.error(`Error fetching stats for ${p.name}:`, error);
              }
            })
          );
          
          setAllPlayerStats(statsObj);
          setAllPlayerH2HStats(h2hStatsObj);
        } catch (error) {
          console.error('Error fetching player stats:', error);
        } finally {
          setIsLoadingStats(false);
          statsFetchingRef.current = false;
        }
      };
      fetchAllStats();
    }
  }, [teamPlayers?.id, teamPlayers?.teamName]); // Remove isLoadingStats and teamPlayers to prevent loops

  useEffect(() => {
    const latestMatch = JSON.parse(localStorage.getItem('latestMatch'));
    if (latestMatch && latestMatch.teams && latestMatch.teams.length > 0) {
      const team = latestMatch.teams[0];
      const picks = [
        ...(team.picks1 || []),
        ...(team.picks2 || [])
      ];
      setLanePlayers(picks);
    } else {
      setLanePlayers(null);
    }
  }, [isLoadingStats]);

  const getCurrentTeamName = useCallback(() => {
    if (isLoadingTeam) {
      return 'Loading Team...';
    }
    return teamPlayers && teamPlayers.teamName ? teamPlayers.teamName : 'Unknown Team';
  }, [teamPlayers, isLoadingTeam]);

  // Function to get team logo URL
  const getTeamLogo = useCallback(() => {
    if (!teamPlayers || !teamPlayers.logo_path) {
      return null;
    }
    
    let logoUrl;
    
    // If logo_path is already a full URL, return it as is
    if (teamPlayers.logo_path.startsWith('http')) {
      logoUrl = teamPlayers.logo_path;
    }
    // If logo_path is a relative path, construct the full URL
    else if (teamPlayers.logo_path.startsWith('/')) {
      logoUrl = teamPlayers.logo_path;
    }
    // If logo_path is a storage path, construct the full URL
    else if (teamPlayers.logo_path.startsWith('storage/')) {
      logoUrl = `/${teamPlayers.logo_path}`;
    }
    // Default fallback
    else {
      logoUrl = `/${teamPlayers.logo_path}`;
    }
    
    return logoUrl;
  }, [teamPlayers]);

  // Use cached stats for modal - instant display
  useEffect(() => {
    if (modalInfo && modalInfo.player && modalInfo.player.name) {
      const playerIdentifier = modalInfo.player.identifier || getPlayerIdentifier(modalInfo.player.name, modalInfo.player.role);
      const cached = allPlayerStats[playerIdentifier];
      const cachedH2H = allPlayerH2HStats[playerIdentifier];
      
      // Set loading state when modal opens and clear previous stats
      setIsLoadingStats(true);
      setHeroStats([]);
      setHeroH2HStats([]);
      
      // Set stats immediately from cache if available
      if (cached) {
        setHeroStats(cached);
      }
      if (cachedH2H) {
        setHeroH2HStats(cachedH2H);
      }
      
      // If both are cached, we can hide loading immediately
      if (cached && cachedH2H) {
        setIsLoadingStats(false);
      }
      
      // Load player evaluation data for this specific player
      const savedPlayerEvaluation = localStorage.getItem(`playerEvaluation_${playerIdentifier}`);
      if (savedPlayerEvaluation) {
        setPlayerEvaluation(JSON.parse(savedPlayerEvaluation));
      } else {
        // Reset to default state for new player
        setPlayerEvaluation({
          date: '',
          name: '',
          role: '',
          notes: '',
          qualities: {
            'In-Game knowledge': null,
            'Reflex': null,
            'Skills': null,
            'Communications': null,
            'Technical Skill': null,
            'Attitude': null,
            'Decision Making': null,
            'Hero Pool': null,
            'Skillshots': null,
            'Team Material': null
          },
          comments: Array(10).fill('')
        });
      }
      
      // Load hero evaluation data for this specific player
      const savedHeroEvaluation = localStorage.getItem(`heroEvaluation_${playerIdentifier}`);
      if (savedHeroEvaluation) {
        setHeroEvaluation(JSON.parse(savedHeroEvaluation));
      } else {
        // Reset to default state for new player
        setHeroEvaluation({
          date: '',
          blackHeroes: Array(15).fill(''),
          blueHeroes: Array(15).fill(''),
          redHeroes: Array(15).fill(''),
          commitment: '',
          goal: '',
          roleMeaning: ''
        });
      }
      
      // If not cached, fetch (fallback)
      if (!cached || !cachedH2H) {
        const teamName = getCurrentTeamName();
        const role = modalInfo.player.role;
        
        const fetchPromises = [];
        
        if (!cached) {
          fetchPromises.push(
            fetch(`/api/players/${encodeURIComponent(modalInfo.player.name)}/hero-stats-by-team?teamName=${encodeURIComponent(teamName)}&role=${encodeURIComponent(role)}`, {
              headers: {
                'X-Active-Team-ID': teamPlayers?.id
              }
            })
              .then(res => res.json())
              .then(data => setHeroStats(data))
          );
        }
        
        if (!cachedH2H) {
          fetchPromises.push(
            fetch(`/api/players/${encodeURIComponent(modalInfo.player.name)}/hero-h2h-stats-by-team?teamName=${encodeURIComponent(teamName)}&role=${encodeURIComponent(role)}`, {
              headers: {
                'X-Active-Team-ID': teamPlayers?.id
              }
            })
              .then(res => res.json())
              .then(data => setHeroH2HStats(data))
          );
        }
        
        // Wait for all fetches to complete before hiding loading
        Promise.all(fetchPromises)
          .then(() => {
            setIsLoadingStats(false);
          })
          .catch((error) => {
            console.error('Error fetching player stats:', error);
            setIsLoadingStats(false);
          });
      } else {
        // If all data is cached, hide loading immediately since both tables will show
        setIsLoadingStats(false);
      }
    } else {
      setHeroStats([]);
      setHeroH2HStats([]);
      setIsLoadingStats(false);
    }
  }, [modalInfo, allPlayerStats, allPlayerH2HStats, getCurrentTeamName, teamPlayers?.id]);

  // Utility functions
  function getPlayerNameForLane(laneKey, laneIdx) {
    // Show loading state while team is being loaded
    if (isLoadingTeam) {
      return 'Loading...';
    }
    
    // Remove excessive logging to prevent infinite loops
    if (!teamPlayers) {
      return `Player ${laneIdx + 1}`;
    }
    
    // Check for both players_data and players properties
    const playersArray = teamPlayers.players_data || teamPlayers.players;
    
    if (!playersArray || !Array.isArray(playersArray)) {
      return `Player ${laneIdx + 1}`;
    }
    
      // For 6 players, use role-based assignment to avoid data mixing
  if (playersArray.length === 6) {
    // First, try to find players by their actual role (more accurate)
    let found = playersArray.find(
      p => p.role && p.role.toLowerCase() === laneKey.toLowerCase()
    );
    
    // If no exact match, try partial match
    if (!found) {
      found = playersArray.find(
        p => p.role && p.role.toLowerCase().includes(laneKey.toLowerCase())
      );
    }
    
    // If still no match, try common role variations
    if (!found) {
      const roleVariations = {
        'exp': ['exp', 'explainer', 'explane', 'exp lane'],
        'mid': ['mid', 'midlaner', 'mid lane'],
        'jungler': ['jungler', 'jungle', 'jungle lane'],
        'gold': ['gold', 'goldlaner', 'gold lane', 'marksman'],
        'roam': ['roam', 'roamer', 'roam lane', 'support'],
        'sub': ['sub', 'substitute', 'sub player', 'backup']
      };
      
      const variations = roleVariations[laneKey] || [laneKey];
      found = playersArray.find(
        p => p.role && variations.some(variation => 
          p.role.toLowerCase().includes(variation.toLowerCase())
        )
      );
    }
    
    // If found by role, return that player
    if (found && found.name) {
      return found.name;
    }
    
    // Fallback to index-based lookup only if no role-based match found
    const indexMapping = {
      0: 'exp',    // 1st player = exp
      1: 'mid',    // 2nd player = mid
      2: 'jungler', // 3rd player = jungler
      3: 'gold',   // 4th player = gold
      4: 'roam',   // 5th player = roam
      5: 'sub'     // 6th player = substitute
    };
    
    // Check if the requested lane matches the index mapping
    if (indexMapping[laneIdx] === laneKey) {
      if (playersArray[laneIdx] && playersArray[laneIdx].name) {
        return playersArray[laneIdx].name;
      }
    }
    
    // If no match found, return the player at that index anyway
    if (playersArray[laneIdx] && playersArray[laneIdx].name) {
      return playersArray[laneIdx].name;
    }
    
    return `Player ${laneIdx + 1}`;
  }
    
    // For 5 or fewer players, use the original role-based logic
    // First try exact role match
    let found = playersArray.find(
      p => p.role && p.role.toLowerCase() === laneKey.toLowerCase()
    );
    
    // If no exact match, try partial match
    if (!found) {
      found = playersArray.find(
        p => p.role && p.role.toLowerCase().includes(laneKey.toLowerCase())
      );
    }
    
    // If still no match, try common role variations
    if (!found) {
      const roleVariations = {
        'exp': ['exp', 'explainer', 'explane', 'exp lane'],
        'mid': ['mid', 'midlaner', 'mid lane'],
        'jungler': ['jungler', 'jungle', 'jungle lane'],
        'gold': ['gold', 'goldlaner', 'gold lane', 'marksman'],
        'roam': ['roam', 'roamer', 'roam lane', 'support']
      };
      
      const variations = roleVariations[laneKey] || [laneKey];
      found = playersArray.find(
        p => p.role && variations.some(variation => 
          p.role.toLowerCase().includes(variation.toLowerCase())
        )
      );
    }
    
    if (found && found.name) {
      return found.name;
    }
    
    // Fallback to index-based lookup
    if (playersArray[laneIdx] && playersArray[laneIdx].name) {
      return playersArray[laneIdx].name;
    }
    
    return `Player ${laneIdx + 1}`;
  }

  // Enhanced function to get player name with role disambiguation
  function getPlayerNameForLaneWithRole(laneKey, laneIdx, matchData = null) {
    // If we have match data with player assignments, use that for accuracy
    if (matchData && matchData.teams) {
      // Look for the specific player assigned to this lane in the match
      for (const team of matchData.teams) {
        const picks = [...(team.picks1 || []), ...(team.picks2 || [])];
        const lanePick = picks.find(p => p.lane && p.lane.toLowerCase() === laneKey.toLowerCase());
        
        if (lanePick && lanePick.player) {
          // Handle both object and string player data
          if (typeof lanePick.player === 'object' && lanePick.player.name) {
            return lanePick.player.name; // Return the specific player name from object
          } else if (typeof lanePick.player === 'string') {
            return lanePick.player; // Return the player name string
          }
        }
      }
    }
    
    // Fallback to the original logic if no match data
    return getPlayerNameForLane(laneKey, laneIdx);
  }

  // Get player role by lane key
  function getRoleByLaneKey(laneKey) {
    const roleMap = {
      'exp': 'exp',
      'mid': 'mid', 
      'jungler': 'jungler',
      'gold': 'gold',
      'roam': 'roam',
      'sub': 'substitute',
      'substitute': 'substitute',
      // Add mapping for the new role format
      'top_laner': 'exp',
      'mid_laner': 'mid',
      'adc': 'gold',
      'support': 'roam'
    };
    return roleMap[laneKey] || laneKey;
  }

  // Normalize role values to ensure consistency
  function normalizeRole(role) {
    if (!role) return role;
    
    const normalizedRole = role.toLowerCase().trim();
    
    // Map various role formats to standard ones
    const roleMap = {
      // Standard roles
      'exp': 'exp',
      'mid': 'mid',
      'jungler': 'jungler',
      'gold': 'gold',
      'roam': 'roam',
      'sub': 'substitute',
      'substitute': 'substitute',
      
      // Common variations
      'explane': 'exp',
      'explaner': 'exp',
      'top': 'exp',
      'top_laner': 'exp',
      'toplaner': 'exp',
      
      'midlane': 'mid',
      'mid_laner': 'mid',
      'midlaner': 'mid',
      'middle': 'mid',
      
      'jungle': 'jungler',
      'jungler': 'jungler',
      
      'adc': 'gold',
      'marksman': 'gold',
      'gold_lane': 'gold',
      'goldlane': 'gold',
      'carry': 'gold',
      
      'support': 'roam',
      'roamer': 'roam',
      'roam_lane': 'roam',
      'roamlane': 'roam',
      
      'backup': 'substitute',
      'reserve': 'substitute',
      'sub': 'substitute'
    };
    
    return roleMap[normalizedRole] || normalizedRole;
  }

  // Check if a player is a substitute
  function isSubstitutePlayer(player) {
    if (!player || !player.role) return false;
    
    const normalizedRole = normalizeRole(player.role);
    return normalizedRole === 'substitute';
  }

  // Get main players (non-substitutes) for a specific role
  function getMainPlayersForRole(roleKey) {
    if (!teamPlayers) return [];
    
    const playersArray = teamPlayers.players_data || teamPlayers.players;
    if (!playersArray) return [];
    
    const normalizedTargetRole = normalizeRole(roleKey);
    
    return playersArray.filter(p => {
      if (!p.role) return false;
      
      const normalizedPlayerRole = normalizeRole(p.role);
      
      // Check if player has the target role using normalized values
      const hasTargetRole = normalizedPlayerRole === normalizedTargetRole;
      
      // Return only if has target role AND is NOT a substitute
      return hasTargetRole && !isSubstitutePlayer(p);
    });
  }

  function getHeroForLaneByLaneKey(laneKey, lanePlayers) {
    if (!lanePlayers) return null;
    const found = Array.isArray(lanePlayers)
      ? lanePlayers.find(p => p && p.lane && p.lane.toLowerCase() === laneKey)
      : null;
    return found ? found.hero : null;
  }

  // Data recovery and sync functions
  const syncTeamPlayers = async () => {
    if (!teamPlayers?.id) {
      setSuccessMessage('No active team found. Please select a team first.');
      setShowSuccessModal(true);
      return;
    }

    try {
      console.log('Syncing team players for team ID:', teamPlayers.id);
      const response = await fetch('/api/teams/sync-players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ team_id: teamPlayers.id }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Team players synced successfully:', result);
        
        // Refresh team data from backend
        const success = await refreshTeamDataFromBackend();
        if (success) {
          setSuccessMessage(`Team players synced successfully! ${result.synced_count} new players created, ${result.updated_count} players updated.`);
          setShowSuccessModal(true);
        } else {
          setSuccessMessage(`Team players synced but failed to refresh data. ${result.synced_count} new players created, ${result.updated_count} players updated.`);
          setShowSuccessModal(true);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to sync team players:', errorData);
        setSuccessMessage(`Failed to sync team players: ${errorData.error || 'Unknown error'}`);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error('Error syncing team players:', error);
      setSuccessMessage('Network error while syncing team players: ' + error.message);
      setShowSuccessModal(true);
    }
  };

  const diagnoseTeamData = async () => {
    if (!teamPlayers?.id) {
      alert('No active team found. Please select a team first.');
      return;
    }

    try {
      console.log('Diagnosing team data for team ID:', teamPlayers.id);
      
      // Get current frontend state
      const frontendPlayerCount = players.length;
      const frontendPlayers = players.map(p => ({ name: p.name, role: p.role }));
      
      // Get backend player count
      const response = await fetch(`/api/players?team_id=${teamPlayers.id}`);
      if (response.ok) {
        const backendPlayers = await response.json();
        const backendPlayerCount = backendPlayers.length;
        const backendPlayerData = backendPlayers.map(p => ({ name: p.name, role: p.role, id: p.id }));
        
        // Get team data from backend
        const teamResponse = await fetch(`/api/teams/${teamPlayers.id}`);
        let teamPlayerData = [];
        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          teamPlayerData = teamData.players_data || [];
        }
        
        const diagnosis = {
          team_id: teamPlayers.id,
          team_name: teamPlayers.teamName || 'Unknown',
          frontend: {
            player_count: frontendPlayerCount,
            players: frontendPlayers
          },
          backend: {
            player_count: backendPlayerCount,
            players: backendPlayerData
          },
          team_data: {
            player_count: teamPlayerData.length,
            players: teamPlayerData
          }
        };
        
        console.log('Team Data Diagnosis:', diagnosis);
        
        // Show diagnosis in alert
        const message = `Team Data Diagnosis for ${diagnosis.team_name} (ID: ${diagnosis.team_id}):
        
Frontend Players: ${diagnosis.frontend.player_count}
- ${diagnosis.frontend.players.map(p => `${p.name} (${p.role || 'NO ROLE'})`).join('\n- ')}

Backend Players: ${diagnosis.backend.player_count}
- ${diagnosis.backend.players.map(p => `${p.name} (${p.role || 'NULL'})`).join('\n- ')}

Team Data Players: ${diagnosis.team_data.player_count}
- ${diagnosis.team_data.players.map(p => `${p.name} (${p.role || 'NO ROLE'})`).join('\n- ')}

Issues Found:
${diagnosis.frontend.player_count !== diagnosis.backend.player_count ? '❌ Player count mismatch between frontend and backend' : '✅ Player count matches'}
${diagnosis.backend.players.some(p => !p.role) ? '❌ Some backend players have NULL roles' : '✅ All backend players have roles'}
${diagnosis.team_data.players.some(p => !p.role) ? '❌ Some team data players have no roles' : '✅ All team data players have roles'}`;

        alert(message);
        
      } else {
        throw new Error('Failed to fetch backend players');
      }
    } catch (error) {
      console.error('Error diagnosing team data:', error);
      alert('Error diagnosing team data: ' + error.message);
    }
  };



  // Event handlers
  function handleFileSelect(e, playerName, playerRole) {
    const file = e.target.files[0];
    if (!file || !playerName) return;
    const playerIdentifier = getPlayerIdentifier(playerName, playerRole);
    setPendingPhoto({ file, playerName, playerRole, playerIdentifier });
    setShowConfirmModal(true);
  }

  /**
   * Updates the photo cache with all possible identifier variations
   * @param {string} playerIdentifier - Full identifier (e.g., "adds_exp")
   * @param {string} playerNameOnly - Player name only (e.g., "adds")
   * @param {string} timestampedPath - Photo path with timestamp
   */
  const updatePhotoCache = (playerIdentifier, playerNameOnly, timestampedPath) => {
    const newCache = { ...imageCache };
    
    // Remove any default images for this player to prioritize uploaded photos
    Object.keys(newCache).forEach(key => {
      if (key.includes(pendingPhoto.playerName) && newCache[key] && newCache[key].includes('default')) {
        delete newCache[key];
      }
    });
    
    // Cache with the full identifier (e.g., "adds_exp")
    newCache[playerIdentifier] = timestampedPath;
    
    // Cache with name only (e.g., "adds") for players with null roles
    if (!pendingPhoto.playerRole || pendingPhoto.playerRole === null || pendingPhoto.playerRole === 'null') {
      newCache[pendingPhoto.playerName] = timestampedPath;
    }
    
    // Cache with role variations for better compatibility
    if (pendingPhoto.playerRole) {
      const roleVariations = [
        pendingPhoto.playerRole.toLowerCase(),
        pendingPhoto.playerRole.toLowerCase().replace('lane', ''),
        pendingPhoto.playerRole.toLowerCase().replace('laner', ''),
        pendingPhoto.playerRole.toLowerCase().replace('lane', 'laner')
      ];
      
      roleVariations.forEach(roleVar => {
        const variationKey = `${pendingPhoto.playerName}_${roleVar}`;
        newCache[variationKey] = timestampedPath;
      });
    }
    
    // Update state immediately
    setImageCache(newCache);
    
    // Clear localStorage first, then set new values
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('playerPhoto_') && key.includes(pendingPhoto.playerName)) {
        localStorage.removeItem(key);
      }
    });
    
    // Update localStorage with ALL possible keys for maximum compatibility
    localStorage.setItem(`playerPhoto_${playerIdentifier}`, timestampedPath);
    
          if (!pendingPhoto.playerRole || pendingPhoto.playerRole === null || pendingPhoto.playerRole === 'null') {
      localStorage.setItem(`playerPhoto_${pendingPhoto.playerName}`, timestampedPath);
    }
    
    // Also cache role variations in localStorage
    if (pendingPhoto.playerRole) {
      const roleVariations = [
        pendingPhoto.playerRole.toLowerCase(),
        pendingPhoto.playerRole.toLowerCase().replace('lane', ''),
        pendingPhoto.playerRole.toLowerCase().replace('laner', ''),
        pendingPhoto.playerRole.toLowerCase().replace('lane', 'laner')
      ];
      
      roleVariations.forEach(roleVar => {
        const variationKey = `${pendingPhoto.playerName}_${roleVar}`;
        localStorage.setItem(`playerPhoto_${variationKey}`, timestampedPath);
      });
    }
  };

  /**
   * Updates both players and teamPlayers arrays with the new photo
   * @param {string} timestampedPath - Photo path with timestamp
   * @param {Object} playerData - Player data from backend response
   */
  const updatePlayerArrays = (timestampedPath, playerData) => {
    // Update players array with new photo
    setPlayers(prev => {
      const updatedPlayers = prev.map(p => {
        if (p.name === pendingPhoto.playerName && 
            (pendingPhoto.playerRole === null ? p.role === null : p.role === pendingPhoto.playerRole)) {
          return { ...p, photo: timestampedPath };
        }
        return p;
      });
      
      // If player not found, add them
      const playerExists = updatedPlayers.some(p => 
        p.name === pendingPhoto.playerName && 
        (pendingPhoto.playerRole === null ? p.role === null : p.role === pendingPhoto.playerRole)
      );
      
      if (!playerExists && playerData) {
        return [...updatedPlayers, { ...playerData, photo: timestampedPath }];
      }
      
      return updatedPlayers;
    });
    
    // Update teamPlayers state with new photo
    setTeamPlayers(prev => {
      if (!prev) return prev;
      const playersArray = prev.players_data || prev.players;
      if (!playersArray) return prev;
      
      const updatedPlayers = playersArray.map(p => {
        if (p.name === pendingPhoto.playerName && 
            (pendingPhoto.playerRole === null ? p.role === null : p.role === pendingPhoto.playerRole)) {
          return { ...p, photo: timestampedPath };
        }
        return p;
      });
      
      return {
        ...prev,
        players_data: updatedPlayers,
        players: updatedPlayers
      };
    });
  };

  // Player CRUD operation handlers
  const handlePlayerUpdate = (updatedPlayer) => {
    // Normalize the role to ensure consistency
    const normalizedPlayer = {
      ...updatedPlayer,
      role: normalizeRole(updatedPlayer.role)
    };
    
    console.log('Normalized updated player data:', normalizedPlayer);
    
    // Update players array
    setPlayers(prev => prev.map(p => p.id === normalizedPlayer.id ? normalizedPlayer : p));
    
    // Update teamPlayers state
    setTeamPlayers(prev => {
      if (!prev) return prev;
      const playersArray = prev.players_data || prev.players;
      if (!playersArray) return prev;
      
      const updatedPlayers = playersArray.map(p => p.id === normalizedPlayer.id ? normalizedPlayer : p);
      
      const updatedTeamData = {
        ...prev,
        players_data: updatedPlayers,
        players: updatedPlayers
      };
      
      // Update localStorage with the updated player data
      localStorage.setItem('latestTeam', JSON.stringify(updatedTeamData));
      console.log('Updated localStorage with updated player:', updatedTeamData);
      
      return updatedTeamData;
    });

    // Refresh lanePlayers to show all current team players
    refreshLanePlayers();
  };

  const handlePlayerDelete = (playerIdOrPlayer) => {
    console.log('handlePlayerDelete called with:', playerIdOrPlayer);
    console.log('Type of playerIdOrPlayer:', typeof playerIdOrPlayer);
    console.log('Is it a number?', typeof playerIdOrPlayer === 'number');
    console.log('Is it a string?', typeof playerIdOrPlayer === 'string');
    
    // Check if we received a player ID (number) or a player object
    if (typeof playerIdOrPlayer === 'number' || typeof playerIdOrPlayer === 'string') {
      // Standard deletion for players with database IDs
      const playerId = playerIdOrPlayer;
      console.log('Deleting player with ID:', playerId);
      
    // Remove from players array
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    
    // Remove from teamPlayers state
    setTeamPlayers(prev => {
      if (!prev) return prev;
      const playersArray = prev.players_data || prev.players;
      if (!playersArray) return prev;
      
      const updatedPlayers = playersArray.filter(p => p.id !== playerId);
      
      const updatedTeamData = {
        ...prev,
        players_data: updatedPlayers,
        players: updatedPlayers
      };
      
      // Update localStorage with the updated player data
      localStorage.setItem('latestTeam', JSON.stringify(updatedTeamData));
      console.log('Updated localStorage with deleted player:', updatedTeamData);
      
      return updatedTeamData;
    });
    } else {
      // Special handling for players without IDs (from create team)
      const playerToRemove = playerIdOrPlayer;
      console.log('Deleting player without ID:', playerToRemove);
      
      // Remove from players array using name and role
      console.log('Filtering players array. Before:', players.length);
      setPlayers(prev => {
        const filtered = prev.filter(p => {
          const shouldKeep = !(p.name === playerToRemove.name && p.role === playerToRemove.role);
          if (!shouldKeep) {
            console.log('Removing player:', p.name, p.role, 'because it matches:', playerToRemove.name, playerToRemove.role);
          }
          return shouldKeep;
        });
        console.log('Filtered players array. After:', filtered.length);
        console.log('Removed player:', playerToRemove.name, playerToRemove.role);
        return filtered;
      });
      
      // Remove from teamPlayers state using name and role
      setTeamPlayers(prev => {
        if (!prev) return prev;
        const playersArray = prev.players_data || prev.players;
        if (!playersArray) return prev;
        
        console.log('Filtering teamPlayers. Before:', playersArray.length);
        const updatedPlayers = playersArray.filter(p => {
          const shouldKeep = !(p.name === playerToRemove.name && p.role === playerToRemove.role);
          if (!shouldKeep) {
            console.log('Removing from teamPlayers:', p.name, p.role, 'because it matches:', playerToRemove.name, playerToRemove.role);
          }
          return shouldKeep;
        });
        console.log('Filtered teamPlayers. After:', updatedPlayers.length);
        
        const updatedTeamData = {
          ...prev,
          players_data: updatedPlayers,
          players: updatedPlayers
        };
        
        // Update localStorage with the updated player data
        localStorage.setItem('latestTeam', JSON.stringify(updatedTeamData));
        console.log('Updated localStorage with deleted player (no ID):', updatedTeamData);
        
        return updatedTeamData;
      });
      
      // Also update lanePlayers state immediately for players without IDs
      setLanePlayers(prev => {
        if (!prev) return prev;
        return prev.filter(lanePlayer => 
          !(lanePlayer.player.name === playerToRemove.name && lanePlayer.player.role === playerToRemove.role)
        );
      });
    }

    // Refresh lanePlayers to show all current team players
    refreshLanePlayers();
  };

  // Function to fix data issues and recover lost data
  const fixDataIssues = async () => {
    console.log('Running data fix and recovery in PlayersStatistic...');
    
    if (!teamPlayers?.id) {
      alert('No active team found. Please select a team first.');
      return null;
    }

    try {
      // 1. First, sync team players to fix any missing player records
      console.log('Syncing team players for team ID:', teamPlayers.id);
      const syncResponse = await fetch('/api/teams/sync-players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ team_id: teamPlayers.id }),
      });

      if (syncResponse.ok) {
        const syncResult = await syncResponse.json();
        console.log('Team players synced successfully:', syncResult);
        
        // 2. Check localStorage for team data
      const latestTeam = JSON.parse(localStorage.getItem('latestTeam'));
      console.log('Latest team from localStorage:', latestTeam);
      
        // 3. Fetch fresh data from backend
      const response = await fetch('/api/teams/active');
      if (response.ok) {
        const activeTeam = await response.json();
        console.log('Active team from backend:', activeTeam);
        
          // 4. Merge data - prioritize backend data but keep localStorage photos
        const mergedTeamData = {
          ...activeTeam,
          players_data: activeTeam.players_data || activeTeam.players || [],
          logo_path: latestTeam?.logo_path || activeTeam.logo_path
        };
        
          // 5. Update localStorage with merged data
        localStorage.setItem('latestTeam', JSON.stringify(mergedTeamData));
        localStorage.setItem('currentPlayers', JSON.stringify(mergedTeamData.players_data || []));
        console.log('Updated localStorage with merged data:', mergedTeamData);
        
          // 6. Update state
        setTeamPlayers(mergedTeamData);
        setCurrentTeamId(mergedTeamData.id);
        
          // 7. Refresh lanePlayers
        if (!mergedTeamData.players_data || mergedTeamData.players_data.length === 0) {
          setLanePlayers(null);
        } else {
          const allPlayers = mergedTeamData.players_data.map(player => ({
            lane: player.role?.toLowerCase().replace(' ', '_') || 'unknown',
            player: player,
            hero: null
          }));
          setLanePlayers(allPlayers);
        }
        
          // 8. Update players array
        setPlayers(mergedTeamData.players_data || []);
        
          // 9. Force re-render
        setForceUpdate(prev => prev + 1);
        
          alert(`Data has been recovered and synchronized! ${syncResult.synced_count} players recovered, ${syncResult.updated_count} players updated.`);
        return mergedTeamData;
      } else {
        throw new Error('Failed to fetch active team');
        }
      } else {
        const errorData = await syncResponse.json().catch(() => ({}));
        console.error('Failed to sync team players:', errorData);
        alert(`Failed to sync team players: ${errorData.error || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      console.error('Error fixing data issues:', error);
      alert('Failed to recover data. Please check console for details.');
      return null;
    }
  };

  /**
   * Handles the photo upload confirmation process
   * - Closes the confirm modal immediately
   * - Shows loading state
   * - Uploads photo to backend
   * - Updates cache and state arrays
   * - Forces re-render to show new photo
   */
  async function handleConfirmUpload() {
    if (!pendingPhoto) return;
    
    // Close the confirm modal immediately
    setShowConfirmModal(false);
    
    // Show loading state
    setUploadingPlayer(pendingPhoto.playerName);
    
      try {
      // Ensure team is active before uploading
        const latestTeam = localStorage.getItem('latestTeam');
        if (!latestTeam) {
          alert('No team selected. Please select a team first.');
          setUploadingPlayer(null);
          setPendingPhoto(null);
          return;
        }
        
        const teamData = JSON.parse(latestTeam);
        
      // Team should already be active from component mount, no need to activate again
      console.log('Proceeding with photo upload for team:', teamData.id);
      
      // Upload the photo
      const formData = new FormData();
      formData.append('photo', pendingPhoto.file);
      formData.append('playerName', pendingPhoto.playerName);
      formData.append('playerRole', pendingPhoto.playerRole);
      
      // Add team_id to form data as fallback
      if (teamData?.id) {
        formData.append('team_id', teamData.id);
      }
      
      const response = await fetch(`/api/players/photo-by-name`, {
        method: 'POST',
        headers: {
          'X-Active-Team-ID': teamData?.id || ''
        },
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Get player identifiers for caching
        const playerIdentifier = pendingPhoto.playerIdentifier;
        const playerNameOnly = pendingPhoto.playerName;
        
        // Process photo path from backend
        const photoPath = data.photo || data.photo_path;
        
        if (photoPath && photoPath !== 'null' && photoPath !== '') {
          // Handle case where backend returns full URL
          if (photoPath.startsWith('http://localhost:8080')) {
            const relativePath = photoPath.replace('http://localhost:8080', '');
            data.photo = relativePath;
          }
      } else {
          alert('Error: Backend returned invalid photo path. Please check server logs.');
          return;
        }
        
        if (photoPath) {
          // Process image URL
          let imageUrl = data.photo || photoPath;
          
          if (!imageUrl.startsWith('http')) {
            if (imageUrl.startsWith('/')) {
              imageUrl = `${window.location.origin}${imageUrl}`;
            } else {
              imageUrl = `${window.location.origin}/${imageUrl}`;
            }
          }
          
          // Add timestamp to prevent browser caching
          const timestampedPath = `${imageUrl}?t=${Date.now()}`;
          
          // Update cache with all identifier variations
          updatePhotoCache(playerIdentifier, playerNameOnly, timestampedPath);
          
          // Update state arrays
          updatePlayerArrays(timestampedPath, data.player);
          
          // Show success message in custom modal
          setSuccessMessage(`Photo uploaded successfully for ${pendingPhoto.playerName}!`);
          setShowSuccessModal(true);
          
          // Force immediate re-render
          setForceUpdate(prev => prev + 1);
        }
      } else {
        const errorText = await response.text();
        console.error('Upload failed with status:', response.status, 'Response:', errorText);
        alert('Failed to upload photo');
      }
    } catch (err) {
      console.error('Upload error:', err.message);
      alert('Error uploading photo');
    }
    
    setUploadingPlayer(null);
    setPendingPhoto(null);
  }

  function handleCancelUpload() {
    setPendingPhoto(null);
    setShowConfirmModal(false);
  }
  
  // Hero evaluation functions
  function handleHeroEvaluationChange(field, index, value) {
    setHeroEvaluation(prev => {
      const updated = {
        ...prev,
        [field]: prev[field].map((item, i) => i === index ? value : item)
      };
      const playerIdentifier = modalInfo?.player?.identifier || getPlayerIdentifier(modalInfo?.player?.name || '', modalInfo?.player?.role || '');
      localStorage.setItem(`heroEvaluation_${playerIdentifier}`, JSON.stringify(updated));
      return updated;
    });
  }
  
  function handleHeroEvaluationTextChange(field, value) {
    setHeroEvaluation(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      const playerIdentifier = modalInfo?.player?.identifier || getPlayerIdentifier(modalInfo?.player?.name || '', modalInfo?.player?.role || '');
      localStorage.setItem(`heroEvaluation_${playerIdentifier}`, JSON.stringify(updated));
      return updated;
    });
  }
  
  // Player evaluation functions
  function handlePlayerEvaluationChange(field, value) {
    setPlayerEvaluation(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      const playerIdentifier = modalInfo?.player?.identifier || getPlayerIdentifier(modalInfo?.player?.name || '', modalInfo?.player?.role || '');
      localStorage.setItem(`playerEvaluation_${playerIdentifier}`, JSON.stringify(updated));
      return updated;
    });
  }
  
  function handleQualityRating(quality, rating) {
    setPlayerEvaluation(prev => {
      const updated = {
        ...prev,
        qualities: {
          ...prev.qualities,
          [quality]: prev.qualities[quality] === rating ? null : rating
        }
      };
      const playerIdentifier = modalInfo?.player?.identifier || getPlayerIdentifier(modalInfo?.player?.name || '', modalInfo?.player?.role || '');
      localStorage.setItem(`playerEvaluation_${playerIdentifier}`, JSON.stringify(updated));
      return updated;
    });
  }
  
  function handleCommentChange(index, value) {
    setPlayerEvaluation(prev => {
      const updated = {
        ...prev,
        comments: prev.comments.map((comment, i) => i === index ? value : comment)
      };
      const playerIdentifier = modalInfo?.player?.identifier || getPlayerIdentifier(modalInfo?.player?.name || '', modalInfo?.player?.role || '');
      localStorage.setItem(`playerEvaluation_${playerIdentifier}`, JSON.stringify(updated));
      return updated;
    });
  }

  // Helper function to normalize photo paths to public URLs
  function toPublicImageUrl(photoPath) {
    if (!photoPath) return null;
    
    // If backend already returns full URL, use it as-is
    if (photoPath.startsWith('http')) return photoPath;
    
    // If backend returns relative path, construct full URL
    let p = photoPath;
    if (!p.startsWith('/')) p = '/' + p;
    if (!p.startsWith('/storage/')) p = '/storage' + p;
    
    return `${window.location.origin}${p}`;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ 
      background: `
        radial-gradient(ellipse at top, rgba(147, 51, 234, 0.1) 0%, transparent 50%),
        radial-gradient(ellipse at bottom, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
        radial-gradient(ellipse at left, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
        linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 25%, #16213e 50%, #0f1419 100%)
      ` 
    }}>
      <PageTitle title="Players Statistic" />
      <style>{scrollbarHideStyles}</style>
      
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-2 h-2 bg-cyan-400 rounded-full opacity-20 animate-pulse" 
             style={{ top: '10%', left: '20%', animationDelay: '0s', animationDuration: '3s' }}></div>
        <div className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-30 animate-pulse" 
             style={{ top: '30%', left: '80%', animationDelay: '1s', animationDuration: '4s' }}></div>
        <div className="absolute w-3 h-3 bg-blue-400 rounded-full opacity-15 animate-pulse" 
             style={{ top: '60%', left: '10%', animationDelay: '2s', animationDuration: '5s' }}></div>
        <div className="absolute w-2 h-2 bg-emerald-400 rounded-full opacity-25 animate-pulse" 
             style={{ top: '80%', left: '70%', animationDelay: '0.5s', animationDuration: '3.5s' }}></div>
        <div className="absolute w-1 h-1 bg-pink-400 rounded-full opacity-20 animate-pulse" 
             style={{ top: '20%', left: '60%', animationDelay: '1.5s', animationDuration: '4.5s' }}></div>
      </div>

      {/* Header Component */}
      <Header 
        currentUser={currentUser}
        onLogout={handleLogout}
        onShowProfile={() => setShowProfileModal(true)}
      />

      {/* Main Content */}
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center flex-1 relative z-10 px-4" style={{ marginTop: -80 }}>
        {/* Team Display Card */}
        <div className="w-full max-w-7xl mx-auto mb-4 mt-12">
          <TeamDisplayCard 
            teamName={getCurrentTeamName()} 
            teamLogo={getTeamLogo()} 
            onEditPlayers={() => setShowSettingsModal(true)}
          />
          

        </div>
        
        {/* Loading Spinner */}
        {isLoadingTeam && (
          <div className="flex flex-col items-center justify-center mb-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-cyan-400 border-r-purple-400 shadow-lg shadow-cyan-400/20"></div>
              <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-b-blue-400 border-l-emerald-400" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-white text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Loading team data...</p>
              <div className="mt-2 h-1 w-32 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Player Grid */}
        {!isLoadingTeam && teamPlayers && players && Array.isArray(players) && (
          <div className="w-full max-w-7xl mx-auto">
            <PlayerGrid
              key={`player-grid-${forceUpdate}`}
              teamPlayers={teamPlayers}
              players={players}
              lanePlayers={lanePlayers}
              LANES={LANES}
              PLAYER={PLAYER}
              getPlayerNameForLane={getPlayerNameForLane}
              getPlayerNameForLaneWithRole={getPlayerNameForLaneWithRole}
              getRoleByLaneKey={getRoleByLaneKey}
              getHeroForLaneByLaneKey={getHeroForLaneByLaneKey}
              getPlayerIdentifier={getPlayerIdentifier}
              getPlayerPhoto={getPlayerPhoto}
              onPlayerClick={setModalInfo}
              isSubstitutePlayer={isSubstitutePlayer}
              getMainPlayersForRole={getMainPlayersForRole}
            />
          </div>
        )}
      </div>

      {/* Player Modal */}
      <PlayerModal
        key={`player-modal-${forceUpdate}-${modalInfo?.player?.name || 'none'}`}
        modalInfo={modalInfo}
        onClose={() => setModalInfo(null)}
        getPlayerPhoto={getPlayerPhoto}
        heroStats={heroStats}
        heroH2HStats={heroH2HStats}
        isLoadingStats={isLoadingStats}
        onFileSelect={() => fileInputRef.current && fileInputRef.current.click()}
        uploadingPlayer={uploadingPlayer}
        onViewPerformance={() => setShowPerformanceModal(true)}
      />

      {/* Performance Modal */}
      <PerformanceModal
        isOpen={showPerformanceModal}
        onClose={() => setShowPerformanceModal(false)}
        modalInfo={modalInfo}
        heroStats={heroStats}
        heroEvaluation={heroEvaluation}
        playerEvaluation={playerEvaluation}
        onHeroEvaluationChange={handleHeroEvaluationChange}
        onHeroEvaluationTextChange={handleHeroEvaluationTextChange}
        onPlayerEvaluationChange={handlePlayerEvaluationChange}
        onQualityRating={handleQualityRating}
        onCommentChange={handleCommentChange}
      />

      {/* Confirm Upload Modal */}
      <ConfirmUploadModal
        isOpen={showConfirmModal}
        pendingPhoto={pendingPhoto}
        onConfirm={handleConfirmUpload}
        onCancel={handleCancelUpload}
        isUploading={!!uploadingPlayer}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        teamPlayers={teamPlayers}
        onPlayerUpdate={handlePlayerUpdate}
        onPlayerDelete={handlePlayerDelete}
        onPlayerCreate={handlePlayerCreate}
        onShowSuccess={(message) => {
          setSuccessMessage(message);
          setShowSuccessModal(true);
        }}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={currentUser}
      />

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={e => handleFileSelect(e, modalInfo?.player?.name, modalInfo?.player?.role)}
      />
    </div>
  );
}

export default PlayersStatistic;
