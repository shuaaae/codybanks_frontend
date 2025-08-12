import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import defaultPlayer from '../assets/default.png';
import { Chart, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Legend, Tooltip } from 'chart.js';
import PageTitle from '../components/PageTitle';
import Header from '../components/Header';
import ProfileModal from '../components/ProfileModal';
import useSessionTimeout from '../hooks/useSessionTimeout';
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
  const [heroStats, setHeroStats] = useState([]);
  const [allPlayerStats, setAllPlayerStats] = useState({}); // cache for all player stats
  const [allPlayerH2HStats, setAllPlayerH2HStats] = useState({}); // cache for all player H2H stats
  const [heroH2HStats, setHeroH2HStats] = useState([]); // current modal H2H stats
  const [isLoadingStats, setIsLoadingStats] = useState(false); // loading state for stats
  const [showPerformanceModal, setShowPerformanceModal] = useState(false); // performance modal state
  const [imageCache, setImageCache] = useState({}); // cache for player images
  const [currentTeamId, setCurrentTeamId] = useState(null); // track current team ID
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

  const handleLogout = () => {
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

  // Preload and cache player images
  const preloadPlayerImages = useCallback(async (teamPlayers) => {
    if (!teamPlayers) return;
    
    const playersArray = teamPlayers.players_data || teamPlayers.players;
    if (!playersArray) return;
    
    const newImageCache = { ...imageCache };
    const imagePromises = playersArray.map(async (player) => {
      if (!player.name) return;
      
      const playerIdentifier = getPlayerIdentifier(player.name, player.role);
      
      try {
        // Check if image is already cached
        if (newImageCache[playerIdentifier]) return;
        
        // Try to fetch player photo from server
        const response = await fetch(`/public/api/players/photo-by-name?playerName=${encodeURIComponent(player.name)}`, {
          method: 'GET',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.photo_path) {
            // Preload the image
            const img = new Image();
            img.onload = () => {
              setImageCache(prev => ({
                ...prev,
                [playerIdentifier]: data.photo_path
              }));
            };
            img.onerror = () => {
              console.error(`Failed to load image for ${player.name}:`, data.photo_path);
            };
            img.src = data.photo_path;
          }
        }
      } catch (error) {
        console.log(`No photo found for ${player.name}, using default`);
      }
    });
    
    await Promise.all(imagePromises);
  }, [imageCache]);

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
    } else {
      setLanePlayers(null);
    }

    const loadTeamData = async () => {
      setIsLoadingTeam(true);
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setIsLoadingTeam(false);
      }, 5000); // 5 second timeout
      
      try {
        // First try to get team data from localStorage for immediate display
        const latestTeam = JSON.parse(localStorage.getItem('latestTeam'));
        
        if (latestTeam && latestTeam.teamName) {
          // Set team data immediately from localStorage for fast display
          setTeamPlayers(latestTeam);
          setCurrentTeamId(latestTeam.id);
          
          // Then fetch fresh data from backend in background
          try {
            const response = await fetch(`/public/api/teams/active`);
            if (response.ok) {
              const activeTeam = await response.json();
              
              // Update localStorage with fresh data
              const updatedTeamData = {
                teamName: activeTeam.name,
                players_data: activeTeam.players_data || activeTeam.players || [],
                id: activeTeam.id
              };
              
              localStorage.setItem('latestTeam', JSON.stringify(updatedTeamData));
              setTeamPlayers(updatedTeamData);
              setCurrentTeamId(activeTeam.id);
              
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
            const response = await fetch(`/public/api/teams/active`);
            if (response.ok) {
              const activeTeam = await response.json();
              const teamData = {
                teamName: activeTeam.name,
                players_data: activeTeam.players_data || activeTeam.players || [],
                id: activeTeam.id
              };
              localStorage.setItem('latestTeam', JSON.stringify(teamData));
              setTeamPlayers(teamData);
              setCurrentTeamId(activeTeam.id);
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
  }, [currentTeamId]); // Re-run when team changes

  // Listen for team changes and page visibility changes
  useEffect(() => {
    const checkTeamChange = () => {
      const latestTeam = JSON.parse(localStorage.getItem('latestTeam'));
      if (latestTeam && latestTeam.id !== currentTeamId) {
        console.log('Team change detected:', currentTeamId, '->', latestTeam.id);
        setCurrentTeamId(latestTeam.id);
        setTeamPlayers(latestTeam);
        preloadPlayerImages(latestTeam);
      }
    };

    // Check when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkTeamChange();
      }
    };

    // Check periodically for team changes (reduced frequency)
    const interval = setInterval(checkTeamChange, 5000); // Changed from 2000 to 5000ms

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentTeamId]);

  // Get cached player photo or default
  const getPlayerPhoto = useCallback((playerName, playerRole) => {
    const playerIdentifier = getPlayerIdentifier(playerName, playerRole);
    
    // First check memory cache with the full identifier
    if (imageCache[playerIdentifier]) {
      return imageCache[playerIdentifier];
    }
    
    // If not found and we have a role, try to find by name only (for players with null roles in DB)
    if (playerRole && !imageCache[playerIdentifier]) {
      const nameOnlyIdentifier = playerName;
      if (imageCache[nameOnlyIdentifier]) {
        return imageCache[nameOnlyIdentifier];
      }
    }
    
    // Check localStorage for cached photo
    const cachedPhoto = localStorage.getItem(`playerPhoto_${playerIdentifier}`);
    if (cachedPhoto) {
      return cachedPhoto;
    }
    
    // If not found and we have a role, try to find by name only in localStorage
    if (playerRole) {
      const nameOnlyCachedPhoto = localStorage.getItem(`playerPhoto_${playerName}`);
      if (nameOnlyCachedPhoto) {
        return nameOnlyCachedPhoto;
      }
    }
    
    // Check if player exists in players array and has a photo
    // First try to find by name and role
    let player = players.find(p => p.name === playerName && p.role === playerRole);
    
    // If not found and role is null, try to find by name only
    if (!player && (playerRole === null || playerRole === undefined)) {
      player = players.find(p => p.name === playerName);
    }
    
    if (player && player.photo) {
      return player.photo;
    }
    
    return defaultPlayer;
  }, [imageCache, players]);

  useEffect(() => {
    fetch('/public/api/players')
      .then(res => res.json())
      .then(data => {
        setPlayers(data);
        
        // Cache any existing player photos
        const newImageCache = { ...imageCache };
        data.forEach(player => {
          if (player.name && player.photo) {
            // Cache by name only for players with null role
            const cacheKey = player.role ? `${player.name}_${player.role}` : player.name;
            newImageCache[cacheKey] = player.photo;
            localStorage.setItem(`playerPhoto_${cacheKey}`, player.photo);
          }
        });
        setImageCache(newImageCache);
      });
  }, [imageCache]);

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
          console.log('Fetching stats for team:', teamPlayers.teamName);
          const statsObj = {};
          const h2hStatsObj = {};
          
          await Promise.all(
            playersArray.map(async (p) => {
              if (!p.name || !p.role) return;
              
              const playerIdentifier = getPlayerIdentifier(p.name, p.role);
              
              // Fetch both regular stats and H2H stats in parallel
              const [statsRes, h2hRes] = await Promise.all([
                fetch(`/public/api/players/${encodeURIComponent(p.name)}/hero-stats-by-team?teamName=${encodeURIComponent(teamPlayers.teamName)}&role=${encodeURIComponent(p.role)}`),
                fetch(`/public/api/players/${encodeURIComponent(p.name)}/hero-h2h-stats-by-team?teamName=${encodeURIComponent(teamPlayers.teamName)}&role=${encodeURIComponent(p.role)}`)
              ]);
              
              const statsData = await statsRes.json();
              const h2hData = await h2hRes.json();
              
              statsObj[playerIdentifier] = statsData;
              h2hStatsObj[playerIdentifier] = h2hData;
            })
          );
          
          setAllPlayerStats(statsObj);
          setAllPlayerH2HStats(h2hStatsObj);
          console.log('Stats fetched successfully');
        } catch (error) {
          console.error('Error fetching player stats:', error);
        } finally {
          setIsLoadingStats(false);
          statsFetchingRef.current = false;
        }
      };
      fetchAllStats();
    }
  }, [teamPlayers?.id, teamPlayers?.teamName]); // Only depend on team ID and name, not the entire object

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
            fetch(`/public/api/players/${encodeURIComponent(modalInfo.player.name)}/hero-stats-by-team?teamName=${encodeURIComponent(teamName)}&role=${encodeURIComponent(role)}`)
              .then(res => res.json())
              .then(data => setHeroStats(data))
          );
        }
        
        if (!cachedH2H) {
          fetchPromises.push(
            fetch(`/public/api/players/${encodeURIComponent(modalInfo.player.name)}/hero-h2h-stats-by-team?teamName=${encodeURIComponent(teamName)}&role=${encodeURIComponent(role)}`)
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
  }, [modalInfo, allPlayerStats, allPlayerH2HStats, getCurrentTeamName]);

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
    
    // For 6 players, use index-based assignment for proper role mapping
    if (playersArray.length === 6) {
      // Map players by index: 0=exp, 1=mid, 2=jungler, 3=gold, 4=roam, 5=substitute
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

  // Create unique player identifier using name and role
  function getPlayerIdentifier(playerName, role) {
    return role ? `${playerName}_${role}` : playerName;
  }

  // Get player role by lane key
  function getRoleByLaneKey(laneKey) {
    const roleMap = {
      'exp': 'exp',
      'mid': 'mid', 
      'jungler': 'jungler',
      'gold': 'gold',
      'roam': 'roam',
      'sub': 'substitute'
    };
    return roleMap[laneKey] || laneKey;
  }

  function getHeroForLaneByLaneKey(laneKey, lanePlayers) {
    if (!lanePlayers) return null;
    const found = Array.isArray(lanePlayers)
      ? lanePlayers.find(p => p && p.lane && p.lane.toLowerCase() === laneKey)
      : null;
    return found ? found.hero : null;
  }

  // Event handlers
  function handleFileSelect(e, playerName, playerRole) {
    const file = e.target.files[0];
    if (!file || !playerName) return;
    const playerIdentifier = getPlayerIdentifier(playerName, playerRole);
    setPendingPhoto({ file, playerName, playerRole, playerIdentifier });
    setShowConfirmModal(true);
  }

  async function handleConfirmUpload() {
    if (!pendingPhoto) return;
    setUploadingPlayer(pendingPhoto.playerName);
    try {
      const formData = new FormData();
      formData.append('photo', pendingPhoto.file);
      formData.append('playerName', pendingPhoto.playerName);
      formData.append('playerRole', pendingPhoto.playerRole);
      const response = await fetch(`/public/api/players/photo-by-name`, {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        
        // Force clear any existing cached images for this player
        const playerIdentifier = pendingPhoto.playerIdentifier;
        const playerNameOnly = pendingPhoto.playerName;
        
        // Clear from memory cache
        setImageCache(prev => {
          const newCache = { ...prev };
          // Remove all possible cache keys for this player
          delete newCache[playerIdentifier];
          delete newCache[playerNameOnly];
          // Also remove any other variations that might exist
          Object.keys(newCache).forEach(key => {
            if (key.startsWith(pendingPhoto.playerName)) {
              delete newCache[key];
            }
          });
          return newCache;
        });
        
        // Clear from localStorage cache
        localStorage.removeItem(`playerPhoto_${playerIdentifier}`);
        localStorage.removeItem(`playerPhoto_${playerNameOnly}`);
        
        // Force a small delay to ensure cache is cleared, then set new image
        setTimeout(() => {
          if (data.photo_path) {
            // Add timestamp to prevent browser caching
            const timestampedPath = `${data.photo_path}?t=${Date.now()}`;
            
            setImageCache(prev => ({
              ...prev,
              [playerIdentifier]: timestampedPath
            }));
            // Cache in localStorage for persistence
            localStorage.setItem(`playerPhoto_${playerIdentifier}`, timestampedPath);
          }
        }, 100);
        
        setPlayers(prev => {
          // Find player by name and role, or by name only if role is null
          let idx = prev.findIndex(p => 
            p.name === pendingPhoto.playerName && p.role === pendingPhoto.playerRole
          );
          
          if (idx === -1 && (pendingPhoto.playerRole === null || pendingPhoto.playerRole === undefined)) {
            idx = prev.findIndex(p => p.name === pendingPhoto.playerName);
          }
          
          if (idx !== -1) {
            // Update existing player with timestamped path
            const timestampedPath = data.photo_path ? `${data.photo_path}?t=${Date.now()}` : data.photo_path;
            return prev.map(p =>
              (p.name === pendingPhoto.playerName && 
               (pendingPhoto.playerRole === null ? p.role === null : p.role === pendingPhoto.playerRole)) 
                ? { ...p, photo: timestampedPath } 
                : p
            );
          } else {
            // Add new player
            return [...prev, { ...data.player, photo: data.photo_path }];
          }
        });
        
        setTeamPlayers(prev => {
           if (!prev) return prev;
           const playersArray = prev.players_data || prev.players;
           if (!playersArray) return prev;
           
           const timestampedPath = data.photo_path ? `${data.photo_path}?t=${Date.now()}` : data.photo_path;
           const updatedPlayers = playersArray.map(p =>
             (p.name === pendingPhoto.playerName && 
              (pendingPhoto.playerRole === null ? p.role === null : p.role === pendingPhoto.playerRole)) 
               ? { ...p, photo: timestampedPath } 
               : p
           );
           
           return {
             ...prev,
             players_data: updatedPlayers,
             players: updatedPlayers
           };
         });
      } else {
        alert('Failed to upload photo');
      }
    } catch (err) {
      alert('Error uploading photo');
    }
    setUploadingPlayer(null);
    setPendingPhoto(null);
    setShowConfirmModal(false);
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
          <TeamDisplayCard teamName={getCurrentTeamName()} />
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
        {!isLoadingTeam && (
          <div className="w-full max-w-7xl mx-auto">
            <PlayerGrid
              teamPlayers={teamPlayers}
              players={players}
              lanePlayers={lanePlayers}
              LANES={LANES}
              PLAYER={PLAYER}
              getPlayerNameForLane={getPlayerNameForLane}
              getRoleByLaneKey={getRoleByLaneKey}
              getHeroForLaneByLaneKey={getHeroForLaneByLaneKey}
              getPlayerIdentifier={getPlayerIdentifier}
              getPlayerPhoto={getPlayerPhoto}
              onPlayerClick={setModalInfo}
            />
          </div>
        )}
      </div>

      {/* Player Modal */}
      <PlayerModal
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
