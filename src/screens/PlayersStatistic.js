import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import defaultPlayer from '../assets/default.png';
import { Chart, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Legend, Tooltip } from 'chart.js';
import PageTitle from '../components/PageTitle';
import Header from '../components/Header';
import ProfileModal from '../components/ProfileModal';
import useSessionTimeout from '../hooks/useSessionTimeout';
import { safelyActivateTeam, clearActiveTeam } from '../utils/teamUtils';
import playerService from '../utils/playerService';
import { buildApiUrl } from '../config/api';
import { getMatchesData } from '../App';
import userService from '../utils/userService';
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
  const [showScrollToTop, setShowScrollToTop] = useState(false); // Add scroll to top state
  const [hideTeamCard, setHideTeamCard] = useState(false); // Add team card hide state
  
  // User session timeout: 30 minutes
  useSessionTimeout(30, 'currentUser', '/');

  // Match mode state - load from localStorage
  const [matchMode, setMatchMode] = useState(() => {
    const savedMode = localStorage.getItem('selectedMatchMode');
    return savedMode || 'scrim';
  });

  // Calculate hero stats from match data (same as Weekly Report)
  const calculateHeroStatsFromMatches = useCallback(async (playerIdentifier, player) => {
    if (!teamPlayers?.id || !teamPlayers?.teamName) return;

    try {
      console.log(`🔄 Calculating hero stats from matches for ${player.name}...`);
      console.log(`📊 Match mode: ${matchMode}, Team ID: ${teamPlayers.id}`);
      
      // Get matches data using the same method as Weekly Report
      const matches = await getMatchesData(teamPlayers.id, matchMode);
      console.log(`📈 Retrieved ${matches?.length || 0} matches for ${matchMode} mode`);
      console.log(`📋 Match details:`, matches?.map(m => ({ id: m.id, match_type: m.match_type, match_date: m.match_date, winner: m.winner })));
      
      if (!matches || matches.length === 0) {
        console.log(`No matches found for ${player.name}`);
        setHeroStats([]);
        return;
      }

      const heroStats = {};
      const currentTeam = teamPlayers.teamName;

      // Process each match (same logic as Weekly Report)
      matches.forEach(match => {
        // Double-check match type to prevent data mixing
        if (match.match_type !== matchMode) {
          console.warn(`⚠️ Skipping match ${match.id} - wrong match type: ${match.match_type} (expected: ${matchMode})`);
          return;
        }
        
        const matchWinner = match.winner;
        
        // Process each team in the match
        match.teams.forEach(team => {
          const isWinningTeam = team.team === matchWinner;
          
          // Count picks
          const allPicks = [
            ...(team.picks1 || []),
            ...(team.picks2 || [])
          ];
          
          allPicks.forEach(pick => {
            // Check if this pick belongs to the current player
            const pickPlayerName = pick.player?.name || pick.player_name || pick.player;
            if (pickPlayerName && pickPlayerName.toLowerCase() === player.name.toLowerCase()) {
              const heroName = pick.hero || pick.name;
              if (heroName) {
                if (!heroStats[heroName]) {
                  heroStats[heroName] = {
                    hero: heroName,
                    win: 0,
                    lose: 0,
                    total: 0,
                    winrate: 0
                  };
                }
                
                heroStats[heroName].total++;
                if (isWinningTeam) {
                  heroStats[heroName].win++;
                } else {
                  heroStats[heroName].lose++;
                }
              }
            }
          });
        });
      });

      // Calculate win rates
      const result = Object.values(heroStats).map(hero => {
        const winrate = hero.total > 0 ? Math.round((hero.win / hero.total) * 100) : 0;
        return {
          ...hero,
          winrate
        };
      }).sort((a, b) => b.total - a.total);

      console.log(`✅ Hero stats calculated for ${player.name}:`, result);
      setHeroStats(result);
      
      // Cache the results
      const dataString = JSON.stringify(result);
      localStorage.setItem(`heroStats_${playerIdentifier}`, dataString);
      setAllPlayerStats(prev => ({ ...prev, [playerIdentifier]: result }));
      
      if (!window.playerStatsCache) window.playerStatsCache = {};
      window.playerStatsCache[playerIdentifier] = result;
      
    } catch (error) {
      console.error(`❌ Error calculating hero stats for ${player.name}:`, error);
      setHeroStats([]);
    } finally {
      setIsLoadingStats(false);
    }
  }, [teamPlayers, matchMode]);

  // Calculate H2H stats from match data
  const calculateH2HStatsFromMatches = useCallback(async (playerIdentifier, player) => {
    if (!teamPlayers?.id || !teamPlayers?.teamName) return;

    try {
      console.log(`🔄 Calculating H2H stats from matches for ${player.name}...`);
      console.log(`📊 Match mode: ${matchMode}, Team ID: ${teamPlayers.id}`);
      
      const matches = await getMatchesData(teamPlayers.id, matchMode);
      console.log(`📈 Retrieved ${matches?.length || 0} matches for ${matchMode} mode`);
      console.log(`📋 Match details:`, matches?.map(m => ({ id: m.id, match_type: m.match_type, match_date: m.match_date, winner: m.winner })));
      
      if (!matches || matches.length === 0) {
        setHeroH2HStats([]);
        return;
      }

      const h2hStats = {};
      const currentTeam = teamPlayers.teamName;

      matches.forEach(match => {
        // Double-check match type to prevent data mixing
        if (match.match_type !== matchMode) {
          console.warn(`⚠️ Skipping match ${match.id} - wrong match type: ${match.match_type} (expected: ${matchMode})`);
          return;
        }
        
        const matchWinner = match.winner;
        
        // Find our team and enemy team
        let ourTeam = null;
        let enemyTeam = null;
        
        match.teams.forEach(team => {
          if (team.team === currentTeam) {
            ourTeam = team;
          } else {
            enemyTeam = team;
          }
        });
        
        if (!ourTeam || !enemyTeam) return;
        
        const isWinningTeam = ourTeam.team === matchWinner;
        
        // Get all picks for both teams
        const ourPicks = [
          ...(ourTeam.picks1 || []),
          ...(ourTeam.picks2 || [])
        ];
        
        const enemyPicks = [
          ...(enemyTeam.picks1 || []),
          ...(enemyTeam.picks2 || [])
        ];
        
        // Find our player's pick
        const ourPlayerPick = ourPicks.find(pick => {
          const pickPlayerName = pick.player?.name || pick.player_name || pick.player;
          return pickPlayerName && pickPlayerName.toLowerCase() === player.name.toLowerCase();
        });
        
        if (ourPlayerPick) {
          const ourHero = ourPlayerPick.hero || ourPlayerPick.name;
          const ourPlayerRole = player.role || 'unknown';
          
          // Find enemy player with the SAME LANE for proper H2H matchup
          let enemyPlayerPick = null;
          
          // Get our player's lane from the pick data
          const ourPlayerLane = ourPlayerPick.lane || 'unknown';
          console.log(`🔍 Looking for enemy in ${ourPlayerLane} lane among ${enemyPicks.length} enemy picks`);
          
          enemyPicks.forEach((enemyPick, index) => {
            const enemyLane = enemyPick.lane || 'unknown';
            const enemyHero = enemyPick.hero || enemyPick.name;
            console.log(`🔍 Enemy pick ${index}: ${enemyHero} in lane: ${enemyLane}`);
          });
          
          // First, try to find exact lane match
          enemyPlayerPick = enemyPicks.find(enemyPick => {
            const enemyLane = enemyPick.lane || 'unknown';
            const isMatch = enemyLane && enemyLane.toLowerCase() === ourPlayerLane.toLowerCase();
            if (isMatch) {
              console.log(`✅ Found exact lane match: ${enemyPick.hero || enemyPick.name} (${enemyLane}) matches ${ourPlayerLane}`);
            }
            return isMatch;
          });
          
          // If no exact lane match found, try flexible lane matching
          if (!enemyPlayerPick) {
            console.log(`⚠️ No exact lane match for ${ourPlayerLane}, trying flexible matching...`);
            
            // Try common lane variations
            const laneVariations = {
              'mid': ['mid', 'midlaner', 'middle', 'mid lane', 'midlaner'],
              'jungle': ['jungle', 'jungler', 'jungle lane', 'jungler'],
              'gold': ['gold', 'gold laner', 'gold lane', 'goldlaner', 'adc', 'marksman', 'carry'],
              'roam': ['roam', 'roamer', 'support', 'tank', 'roamer'],
              'exp': ['exp', 'explorer', 'offlaner', 'fighter', 'explore', 'explorer']
            };
            
            const ourLaneVariations = laneVariations[ourPlayerLane.toLowerCase()] || [ourPlayerLane.toLowerCase()];
            console.log(`🔍 Looking for lanes: ${ourLaneVariations.join(', ')}`);
            
            enemyPlayerPick = enemyPicks.find(enemyPick => {
              const enemyLane = (enemyPick.lane || 'unknown').toLowerCase();
              console.log(`🔍 Checking enemy lane: ${enemyLane} against variations: ${ourLaneVariations.join(', ')}`);
              
              // Check if enemy lane matches any of our lane variations
              const matches = ourLaneVariations.some(lane => 
                enemyLane.includes(lane) || lane.includes(enemyLane)
              );
              
              if (matches) {
                console.log(`✅ Found lane match: ${enemyLane} matches ${ourPlayerLane}`);
              }
              
              return matches;
            });
          }
          
          // If still no match, try to match by position in the team (fallback)
          if (!enemyPlayerPick && enemyPicks.length > 0) {
            console.log(`⚠️ No lane match found, trying position-based matching...`);
            
            // Try to match by position in the team structure
            // This is a last resort fallback
            const positionMap = {
              'mid': 1, // Usually 2nd pick
              'jungle': 0,  // Usually 1st pick
              'gold': 4, // Usually 5th pick
              'roam': 2,   // Usually 3rd pick
              'exp': 3  // Usually 4th pick
            };
            
            const ourPosition = positionMap[ourPlayerLane.toLowerCase()];
            if (ourPosition !== undefined && enemyPicks[ourPosition]) {
              enemyPlayerPick = enemyPicks[ourPosition];
              console.log(`📍 Using position-based match: ${enemyPlayerPick.hero || enemyPlayerPick.name} at position ${ourPosition}`);
            }
          }
          
          // Final fallback - use first enemy pick only if absolutely necessary
          if (!enemyPlayerPick && enemyPicks.length > 0) {
            console.log(`⚠️ No lane or position match found, using first enemy pick as final fallback`);
            enemyPlayerPick = enemyPicks[0];
          }
          
          if (enemyPlayerPick) {
            const enemyHero = enemyPlayerPick.hero || enemyPlayerPick.name;
            const enemyLane = enemyPlayerPick.lane || 'unknown';
            const h2hKey = `${ourHero}_vs_${enemyHero}`;
            
            if (!h2hStats[h2hKey]) {
              h2hStats[h2hKey] = {
                player_hero: ourHero,
                enemy_hero: enemyHero,
                win: 0,
                lose: 0,
                total: 0,
                winrate: 0
              };
            }
            
            h2hStats[h2hKey].total++;
            if (isWinningTeam) {
              h2hStats[h2hKey].win++;
            } else {
              h2hStats[h2hKey].lose++;
            }
            
            console.log(`🎯 H2H Matchup: ${ourPlayerLane} ${ourHero} vs ${enemyLane} ${enemyHero} (${isWinningTeam ? 'WIN' : 'LOSE'})`);
          } else {
            console.log(`⚠️ No enemy player found for H2H matchup with ${ourHero} in ${ourPlayerLane} lane`);
          }
        }
      });

      const result = Object.values(h2hStats).map(h2h => {
        const winrate = h2h.total > 0 ? Math.round((h2h.win / h2h.total) * 100) : 0;
        return {
          ...h2h,
          winrate
        };
      }).sort((a, b) => b.total - a.total);

      console.log(`✅ H2H stats calculated for ${player.name}:`, result);
      setHeroH2HStats(result);
      
      const dataString = JSON.stringify(result);
      localStorage.setItem(`heroH2HStats_${playerIdentifier}`, dataString);
      setAllPlayerH2HStats(prev => ({ ...prev, [playerIdentifier]: result }));
      
      if (!window.playerH2HStatsCache) window.playerH2HStatsCache = {};
      window.playerH2HStatsCache[playerIdentifier] = result;
      
    } catch (error) {
      console.error(`❌ Error calculating H2H stats for ${player.name}:`, error);
      setHeroH2HStats([]);
    }
  }, [teamPlayers, matchMode]);

  // Auto-refresh data when component mounts or matchMode changes (like Weekly Report)
  useEffect(() => {
    const refreshAllPlayerData = async () => {
      if (!teamPlayers?.id || !teamPlayers?.players_data) return;
      
      console.log(`🔄 Auto-refreshing all player data for match mode: ${matchMode}`);
      
      // Clear existing cache to force fresh calculation
      setAllPlayerStats({});
      setAllPlayerH2HStats({});
      
      // Clear matches cache to ensure fresh data from API
      if (window.matchesCache) {
        const teamId = teamPlayers.id;
        Object.keys(window.matchesCache.data || {}).forEach(key => {
          if (key.includes(teamId)) {
            delete window.matchesCache.data[key];
          }
        });
        Object.keys(window.matchesCache.isLoading || {}).forEach(key => {
          if (key.includes(teamId)) {
            delete window.matchesCache.isLoading[key];
          }
        });
      }
      
      // Clear localStorage cache for this team
      const teamId = teamPlayers.id;
      Object.keys(localStorage).forEach(key => {
        if (key.includes(`heroStats_${teamId}`) || key.includes(`heroH2HStats_${teamId}`)) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear all player-specific caches
      if (window.playerStatsCache) {
        Object.keys(window.playerStatsCache).forEach(key => {
          if (key.includes(teamId)) {
            delete window.playerStatsCache[key];
          }
        });
      }
      
      if (window.playerH2HStatsCache) {
        Object.keys(window.playerH2HStatsCache).forEach(key => {
          if (key.includes(teamId)) {
            delete window.playerH2HStatsCache[key];
          }
        });
      }
      
      // Calculate stats for all players in parallel
      const players = teamPlayers.players_data || teamPlayers.players || [];
      const promises = players.map(player => {
        const playerIdentifier = `${player.name}_${player.role || 'unknown'}`;
        return Promise.allSettled([
          calculateHeroStatsFromMatches(playerIdentifier, player),
          calculateH2HStatsFromMatches(playerIdentifier, player)
        ]);
      });
      
      await Promise.allSettled(promises);
      console.log(`✅ Auto-refresh completed for all players`);
    };
    
    refreshAllPlayerData();
  }, [teamPlayers, matchMode, calculateHeroStatsFromMatches, calculateH2HStatsFromMatches]);

  // Listen for match mode changes in localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'selectedMatchMode' && e.newValue) {
        setMatchMode(e.newValue);
        // Clear cached stats when mode changes to force fresh data
        setAllPlayerStats({});
        setAllPlayerH2HStats({});
        setHeroStats([]);
        setHeroH2HStats([]);
        
        // If a player modal is open, trigger immediate recalculation
        if (modalInfo && modalInfo.player) {
          console.log(`🔄 Mode changed to ${e.newValue}, recalculating stats for open modal: ${modalInfo.player.name}`);
          // Trigger recalculation by updating the modal info to force useEffect
          setModalInfo({ ...modalInfo, forceRecalc: Date.now() });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check for changes on focus (for same-tab updates)
    const handleFocus = () => {
      const currentMode = localStorage.getItem('selectedMatchMode');
      if (currentMode && currentMode !== matchMode) {
        setMatchMode(currentMode);
        setAllPlayerStats({});
        setAllPlayerH2HStats({});
        setHeroStats([]);
        setHeroH2HStats([]);
        
        // If a player modal is open, trigger immediate recalculation
        if (modalInfo && modalInfo.player) {
          console.log(`🔄 Mode changed to ${currentMode}, recalculating stats for open modal: ${modalInfo.player.name}`);
          // Trigger recalculation by updating the modal info to force useEffect
          setModalInfo({ ...modalInfo, forceRecalc: Date.now() });
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [matchMode, modalInfo]);

  // ULTRA-AGGRESSIVE data restoration on component mount and team change
  useEffect(() => {
    const loadCachedPlayerStats = () => {
      if (teamPlayers?.players_data) {
        const cachedStats = {};
        const cachedH2HStats = {};
        
        console.log(`🔄 ULTRA-AGGRESSIVE data restoration for ${teamPlayers.players_data.length} players`);
        
        teamPlayers.players_data.forEach(player => {
          if (player.name && player.role) {
            const playerIdentifier = getPlayerIdentifier(player.name, player.role);
            
            // Check ALL possible sources for hero stats
            let heroStatsData = null;
            let h2hStatsData = null;
            
            // Source 1: Component state
            if (allPlayerStats[playerIdentifier]) {
              heroStatsData = allPlayerStats[playerIdentifier];
              console.log(`📊 Found hero stats in component state for ${player.name}`);
            }
            // Source 2: localStorage
            else if (localStorage.getItem(`heroStats_${playerIdentifier}`)) {
              try {
                heroStatsData = JSON.parse(localStorage.getItem(`heroStats_${playerIdentifier}`));
                console.log(`📊 Found hero stats in localStorage for ${player.name}`);
              } catch (error) {
                console.error(`❌ Error parsing localStorage hero stats for ${player.name}:`, error);
              }
            }
            // Source 3: sessionStorage
            else if (sessionStorage.getItem(`heroStats_${playerIdentifier}`)) {
              try {
                heroStatsData = JSON.parse(sessionStorage.getItem(`heroStats_${playerIdentifier}`));
                console.log(`📊 Found hero stats in sessionStorage for ${player.name}`);
              } catch (error) {
                console.error(`❌ Error parsing sessionStorage hero stats for ${player.name}:`, error);
              }
            }
            // Source 4: Global cache
            else if (window.playerStatsCache?.[playerIdentifier]) {
              heroStatsData = window.playerStatsCache[playerIdentifier];
              console.log(`📊 Found hero stats in global cache for ${player.name}`);
            }
            
            // Check ALL possible sources for H2H stats
            if (allPlayerH2HStats[playerIdentifier]) {
              h2hStatsData = allPlayerH2HStats[playerIdentifier];
              console.log(`📊 Found H2H stats in component state for ${player.name}`);
            }
            else if (localStorage.getItem(`heroH2HStats_${playerIdentifier}`)) {
              try {
                h2hStatsData = JSON.parse(localStorage.getItem(`heroH2HStats_${playerIdentifier}`));
                console.log(`📊 Found H2H stats in localStorage for ${player.name}`);
              } catch (error) {
                console.error(`❌ Error parsing localStorage H2H stats for ${player.name}:`, error);
              }
            }
            else if (sessionStorage.getItem(`heroH2HStats_${playerIdentifier}`)) {
              try {
                h2hStatsData = JSON.parse(sessionStorage.getItem(`heroH2HStats_${playerIdentifier}`));
                console.log(`📊 Found H2H stats in sessionStorage for ${player.name}`);
              } catch (error) {
                console.error(`❌ Error parsing sessionStorage H2H stats for ${player.name}:`, error);
              }
            }
            else if (window.playerH2HStatsCache?.[playerIdentifier]) {
              h2hStatsData = window.playerH2HStatsCache[playerIdentifier];
              console.log(`📊 Found H2H stats in global cache for ${player.name}`);
            }
            
            // Store found data
            if (heroStatsData) {
              cachedStats[playerIdentifier] = heroStatsData;
              
              // Update ALL storage layers to ensure consistency
              const dataString = JSON.stringify(heroStatsData);
              localStorage.setItem(`heroStats_${playerIdentifier}`, dataString);
              sessionStorage.setItem(`heroStats_${playerIdentifier}`, dataString);
              if (!window.playerStatsCache) window.playerStatsCache = {};
              window.playerStatsCache[playerIdentifier] = heroStatsData;
            }
            
            if (h2hStatsData) {
              cachedH2HStats[playerIdentifier] = h2hStatsData;
              
              // Update ALL storage layers to ensure consistency
              const dataString = JSON.stringify(h2hStatsData);
              localStorage.setItem(`heroH2HStats_${playerIdentifier}`, dataString);
              sessionStorage.setItem(`heroH2HStats_${playerIdentifier}`, dataString);
              if (!window.playerH2HStatsCache) window.playerH2HStatsCache = {};
              window.playerH2HStatsCache[playerIdentifier] = h2hStatsData;
            }
          }
        });
        
        if (Object.keys(cachedStats).length > 0) {
          setAllPlayerStats(cachedStats);
          console.log(`✅ ULTRA-AGGRESSIVE: Loaded ${Object.keys(cachedStats).length} cached hero stats on mount`);
        }
        
        if (Object.keys(cachedH2HStats).length > 0) {
          setAllPlayerH2HStats(cachedH2HStats);
          console.log(`✅ ULTRA-AGGRESSIVE: Loaded ${Object.keys(cachedH2HStats).length} cached H2H stats on mount`);
        }
      }
    };

    loadCachedPlayerStats();
  }, [teamPlayers?.players_data]); // Re-run when team players change

  // ULTRA-AGGRESSIVE data restoration on page focus/visibility change
  useEffect(() => {
    const handlePageFocus = () => {
      if (teamPlayers?.players_data) {
        console.log(`🔄 ULTRA-AGGRESSIVE page focus restoration...`);
        const cachedStats = {};
        const cachedH2HStats = {};
        
        teamPlayers.players_data.forEach(player => {
          if (player.name && player.role) {
            const playerIdentifier = getPlayerIdentifier(player.name, player.role);
            
            // Check ALL possible sources for hero stats
            let heroStatsData = null;
            let h2hStatsData = null;
            
            // Source 1: Component state
            if (allPlayerStats[playerIdentifier]) {
              heroStatsData = allPlayerStats[playerIdentifier];
            }
            // Source 2: localStorage
            else if (localStorage.getItem(`heroStats_${playerIdentifier}`)) {
              try {
                heroStatsData = JSON.parse(localStorage.getItem(`heroStats_${playerIdentifier}`));
              } catch (error) {
                console.error(`❌ Error parsing localStorage hero stats for ${player.name}:`, error);
              }
            }
            // Source 3: sessionStorage
            else if (sessionStorage.getItem(`heroStats_${playerIdentifier}`)) {
              try {
                heroStatsData = JSON.parse(sessionStorage.getItem(`heroStats_${playerIdentifier}`));
              } catch (error) {
                console.error(`❌ Error parsing sessionStorage hero stats for ${player.name}:`, error);
              }
            }
            // Source 4: Global cache
            else if (window.playerStatsCache?.[playerIdentifier]) {
              heroStatsData = window.playerStatsCache[playerIdentifier];
            }
            
            // Check ALL possible sources for H2H stats
            if (allPlayerH2HStats[playerIdentifier]) {
              h2hStatsData = allPlayerH2HStats[playerIdentifier];
            }
            else if (localStorage.getItem(`heroH2HStats_${playerIdentifier}`)) {
              try {
                h2hStatsData = JSON.parse(localStorage.getItem(`heroH2HStats_${playerIdentifier}`));
              } catch (error) {
                console.error(`❌ Error parsing localStorage H2H stats for ${player.name}:`, error);
              }
            }
            else if (sessionStorage.getItem(`heroH2HStats_${playerIdentifier}`)) {
              try {
                h2hStatsData = JSON.parse(sessionStorage.getItem(`heroH2HStats_${playerIdentifier}`));
              } catch (error) {
                console.error(`❌ Error parsing sessionStorage H2H stats for ${player.name}:`, error);
              }
            }
            else if (window.playerH2HStatsCache?.[playerIdentifier]) {
              h2hStatsData = window.playerH2HStatsCache[playerIdentifier];
            }
            
            // Store found data
            if (heroStatsData) {
              cachedStats[playerIdentifier] = heroStatsData;
              console.log(`💾 ULTRA-AGGRESSIVE: Restored hero stats for ${player.name} on focus`);
            }
            
            if (h2hStatsData) {
              cachedH2HStats[playerIdentifier] = h2hStatsData;
              console.log(`💾 ULTRA-AGGRESSIVE: Restored H2H stats for ${player.name} on focus`);
            }
          }
        });
        
        // Update cache with any missing data
        if (Object.keys(cachedStats).length > 0) {
          setAllPlayerStats(prev => ({ ...prev, ...cachedStats }));
          console.log(`✅ ULTRA-AGGRESSIVE: Restored ${Object.keys(cachedStats).length} missing hero stats on focus`);
        }
        
        if (Object.keys(cachedH2HStats).length > 0) {
          setAllPlayerH2HStats(prev => ({ ...prev, ...cachedH2HStats }));
          console.log(`✅ ULTRA-AGGRESSIVE: Restored ${Object.keys(cachedH2HStats).length} missing H2H stats on focus`);
        }
      }
    };

    window.addEventListener('focus', handlePageFocus);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        handlePageFocus();
      }
    });

    return () => {
      window.removeEventListener('focus', handlePageFocus);
      document.removeEventListener('visibilitychange', handlePageFocus);
    };
  }, [teamPlayers?.players_data, allPlayerStats, allPlayerH2HStats]);

  // ULTRA-AGGRESSIVE data integrity check with global cache restoration
  useEffect(() => {
    const validateAndRestoreData = () => {
      if (teamPlayers?.players_data) {
        console.log(`🔍 ULTRA-AGGRESSIVE data integrity check...`);
        let restoredCount = 0;
        
        teamPlayers.players_data.forEach(player => {
          if (player.name && player.role) {
            const playerIdentifier = getPlayerIdentifier(player.name, player.role);
            const hasCachedHeroStats = allPlayerStats[playerIdentifier];
            const hasCachedH2HStats = allPlayerH2HStats[playerIdentifier];
            
            // Check ALL possible sources for missing data
            let heroStatsData = null;
            let h2hStatsData = null;
            
            if (!hasCachedHeroStats) {
              // Check localStorage
              const savedHeroStats = localStorage.getItem(`heroStats_${playerIdentifier}`);
              if (savedHeroStats) {
                try {
                  heroStatsData = JSON.parse(savedHeroStats);
                } catch (error) {
                  console.error(`❌ Error parsing localStorage hero stats for ${player.name}:`, error);
                }
              }
              // Check sessionStorage
              else if (sessionStorage.getItem(`heroStats_${playerIdentifier}`)) {
                try {
                  heroStatsData = JSON.parse(sessionStorage.getItem(`heroStats_${playerIdentifier}`));
                } catch (error) {
                  console.error(`❌ Error parsing sessionStorage hero stats for ${player.name}:`, error);
                }
              }
              // Check global cache
              else if (window.playerStatsCache?.[playerIdentifier]) {
                heroStatsData = window.playerStatsCache[playerIdentifier];
              }
            }
            
            if (!hasCachedH2HStats) {
              // Check localStorage
              const savedH2HStats = localStorage.getItem(`heroH2HStats_${playerIdentifier}`);
              if (savedH2HStats) {
                try {
                  h2hStatsData = JSON.parse(savedH2HStats);
                } catch (error) {
                  console.error(`❌ Error parsing localStorage H2H stats for ${player.name}:`, error);
                }
              }
              // Check sessionStorage
              else if (sessionStorage.getItem(`heroH2HStats_${playerIdentifier}`)) {
                try {
                  h2hStatsData = JSON.parse(sessionStorage.getItem(`heroH2HStats_${playerIdentifier}`));
                } catch (error) {
                  console.error(`❌ Error parsing sessionStorage H2H stats for ${player.name}:`, error);
                }
              }
              // Check global cache
              else if (window.playerH2HStatsCache?.[playerIdentifier]) {
                h2hStatsData = window.playerH2HStatsCache[playerIdentifier];
              }
            }
            
            // Restore found data
            if (heroStatsData) {
              setAllPlayerStats(prev => ({ ...prev, [playerIdentifier]: heroStatsData }));
              console.log(`🔧 ULTRA-AGGRESSIVE: Restored missing hero stats for ${player.name}`);
              restoredCount++;
            }
            
            if (h2hStatsData) {
              setAllPlayerH2HStats(prev => ({ ...prev, [playerIdentifier]: h2hStatsData }));
              console.log(`🔧 ULTRA-AGGRESSIVE: Restored missing H2H stats for ${player.name}`);
              restoredCount++;
            }
          }
        });
        
        if (restoredCount > 0) {
          console.log(`✅ ULTRA-AGGRESSIVE data integrity check completed: restored ${restoredCount} missing data sets`);
        }
      }
    };

    // Run validation every 3 seconds (more frequent)
    const validationInterval = setInterval(validateAndRestoreData, 3000);
    
    // Also run on component mount
    validateAndRestoreData();

    return () => clearInterval(validationInterval);
  }, [teamPlayers?.players_data, allPlayerStats, allPlayerH2HStats]);

  // Navigation event listener for ultra-aggressive data restoration
  useEffect(() => {
    const handleNavigationReturn = () => {
      console.log(`🔄 Navigation return detected - ULTRA-AGGRESSIVE data restoration`);
      
      if (teamPlayers?.players_data) {
        const cachedStats = {};
        const cachedH2HStats = {};
        
        teamPlayers.players_data.forEach(player => {
          if (player.name && player.role) {
            const playerIdentifier = getPlayerIdentifier(player.name, player.role);
            
            // Check ALL possible sources
            let heroStatsData = null;
            let h2hStatsData = null;
            
            // Check global cache first (most reliable for navigation)
            if (window.playerStatsCache?.[playerIdentifier]) {
              heroStatsData = window.playerStatsCache[playerIdentifier];
            }
            else if (localStorage.getItem(`heroStats_${playerIdentifier}`)) {
              try {
                heroStatsData = JSON.parse(localStorage.getItem(`heroStats_${playerIdentifier}`));
              } catch (error) {
                console.error(`❌ Error parsing localStorage hero stats for ${player.name}:`, error);
              }
            }
            else if (sessionStorage.getItem(`heroStats_${playerIdentifier}`)) {
              try {
                heroStatsData = JSON.parse(sessionStorage.getItem(`heroStats_${playerIdentifier}`));
              } catch (error) {
                console.error(`❌ Error parsing sessionStorage hero stats for ${player.name}:`, error);
              }
            }
            
            if (window.playerH2HStatsCache?.[playerIdentifier]) {
              h2hStatsData = window.playerH2HStatsCache[playerIdentifier];
            }
            else if (localStorage.getItem(`heroH2HStats_${playerIdentifier}`)) {
              try {
                h2hStatsData = JSON.parse(localStorage.getItem(`heroH2HStats_${playerIdentifier}`));
              } catch (error) {
                console.error(`❌ Error parsing localStorage H2H stats for ${player.name}:`, error);
              }
            }
            else if (sessionStorage.getItem(`heroH2HStats_${playerIdentifier}`)) {
              try {
                h2hStatsData = JSON.parse(sessionStorage.getItem(`heroH2HStats_${playerIdentifier}`));
              } catch (error) {
                console.error(`❌ Error parsing sessionStorage H2H stats for ${player.name}:`, error);
              }
            }
            
            if (heroStatsData) {
              cachedStats[playerIdentifier] = heroStatsData;
            }
            
            if (h2hStatsData) {
              cachedH2HStats[playerIdentifier] = h2hStatsData;
            }
          }
        });
        
        // Update component state
        if (Object.keys(cachedStats).length > 0) {
          setAllPlayerStats(cachedStats);
          console.log(`✅ ULTRA-AGGRESSIVE navigation: Restored ${Object.keys(cachedStats).length} hero stats`);
        }
        
        if (Object.keys(cachedH2HStats).length > 0) {
          setAllPlayerH2HStats(cachedH2HStats);
          console.log(`✅ ULTRA-AGGRESSIVE navigation: Restored ${Object.keys(cachedH2HStats).length} H2H stats`);
        }
      }
    };

    // Listen for page show events (when returning from another page)
    window.addEventListener('pageshow', handleNavigationReturn);
    
    // Also listen for focus events
    window.addEventListener('focus', handleNavigationReturn);
    
    // Listen for custom navigation events
    window.addEventListener('navigationReturn', handleNavigationReturn);

    return () => {
      window.removeEventListener('pageshow', handleNavigationReturn);
      window.removeEventListener('focus', handleNavigationReturn);
      window.removeEventListener('navigationReturn', handleNavigationReturn);
    };
  }, [teamPlayers?.players_data]);

  // Handle scroll events for scroll-to-top button and team card hide
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollToTop(scrollTop > 300);
      setHideTeamCard(scrollTop > 100); // Hide team card after scrolling 100px
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Check if user is logged in and fetch fresh data from database
  useEffect(() => {
    const loadUser = async () => {
      try {
        const result = await userService.getCurrentUserWithPhoto();
        if (result.success) {
          console.log('PlayersStatistic: Setting currentUser from database:', result.user);
          setCurrentUser(result.user);
        } else {
          // Fallback to localStorage if database fetch fails
          const localUser = JSON.parse(localStorage.getItem('currentUser'));
          if (localUser) {
            console.log('PlayersStatistic: Setting currentUser from localStorage:', localUser);
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

  // Automatically set team as active when entering PlayersStatistic
  useEffect(() => {
    const latestTeam = localStorage.getItem('latestTeam');
    if (latestTeam) {
      const teamData = JSON.parse(latestTeam);
      
      // Use the utility function to safely activate the team
      safelyActivateTeam(teamData.id);
      
      // Set the active team ID in the PlayerService
      playerService.setActiveTeamId(teamData.id);
      
      // Immediately sync team data from localStorage
      setTeamPlayers(teamData);
      setCurrentTeamId(teamData.id);
      
      // Also refresh lanePlayers if no active match
      const latestMatch = JSON.parse(localStorage.getItem('latestMatch'));
      if (!latestMatch || !latestMatch.teams || latestMatch.teams.length === 0) {
        const playersData = teamData.players_data || teamData.players;
        if (playersData && Array.isArray(playersData)) {
          const allPlayers = playersData.map(player => ({
            lane: player.role?.toLowerCase().replace(' ', '_') || 'unknown',
            player: player,
            hero: null
          }));
          setLanePlayers(allPlayers);
        }
      }
      
      // Also set the players array for immediate access
      // Handle both field names for backward compatibility
      const playersData = teamData.players_data || teamData.players;
      if (playersData && Array.isArray(playersData)) {
        setPlayers(playersData);
        // Stop loading if we have players data
        setIsLoadingTeam(false);
      } else {
        setPlayers([]);
        // Keep loading if no players data
        setIsLoadingTeam(true);
      }
    } else {
      // No team found, keep loading
      setIsLoadingTeam(true);
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
    if (!teamPlayers || (!teamPlayers.players_data && !teamPlayers.players)) return false;
    
    const playersArray = teamPlayers.players_data || teamPlayers.players;
    return playersArray.some(player => 
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
      if (!teamData || (!teamData.players_data && !teamData.players)) {
        teamData = JSON.parse(localStorage.getItem('latestTeam'));
      }
      
      // If still no data, try the currentPlayers key as a fallback
      if (!teamData || (!teamData.players_data && !teamData.players)) {
        const currentPlayers = JSON.parse(localStorage.getItem('currentPlayers'));
        if (currentPlayers && currentPlayers.length > 0) {
          teamData = { players_data: currentPlayers };
        }
      }
      
      const playersData = teamData?.players_data || teamData?.players;
      if (playersData && Array.isArray(playersData)) {
        const allPlayers = playersData.map(player => ({
          lane: player.role?.toLowerCase().replace(' ', '_') || 'unknown',
          player: player,
          hero: null
        }));
        setLanePlayers(allPlayers);
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

  // Preload and cache player images (optimized to prevent excessive API calls)
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
    
    // Only attempt to fetch photos for players that don't have cached photos
    // This prevents unnecessary API calls and console errors
    const imagePromises = playersArray.map(async (player) => {
      if (!player.name) return;
      
      const playerIdentifier = getPlayerIdentifier(player.name, player.role);
      
      // Skip if already cached with a real photo or if we've tried recently
      if (newImageCache[playerIdentifier] && newImageCache[playerIdentifier] !== defaultPlayer) return;
      
      // Check if we've tried to fetch this player's photo recently (within last 5 minutes)
      const lastFetchKey = `lastPhotoFetch_${playerIdentifier}`;
      const lastFetch = localStorage.getItem(lastFetchKey);
      if (lastFetch && (Date.now() - parseInt(lastFetch)) < 300000) {
        return; // Skip if we tried recently
      }
      
      try {
        // Mark that we're trying to fetch this player's photo
        localStorage.setItem(lastFetchKey, Date.now().toString());
        
        // Try to fetch player photo from server
        const response = await fetch(buildApiUrl(`/players/photo-by-name?playerName=${encodeURIComponent(player.name)}`), {
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
      const response = await fetch(buildApiUrl(`/teams/active`), {
        headers: {
          'X-Active-Team-ID': teamPlayers.id
        }
      });
      
      if (response.ok) {
        const activeTeam = await response.json();
        console.log('Fresh team data from backend:', activeTeam);
        console.log('Players data structure:', activeTeam.players_data);
        
        // Check if players have IDs
        if (activeTeam.players_data && activeTeam.players_data.length > 0) {
          const playersWithIds = activeTeam.players_data.filter(p => p.id);
          const playersWithoutIds = activeTeam.players_data.filter(p => !p.id);
          console.log(`Players with IDs: ${playersWithIds.length}, Players without IDs: ${playersWithoutIds.length}`);
          
          if (playersWithoutIds.length > 0) {
            console.warn('Some players still missing IDs:', playersWithoutIds);
          }
        }
        
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
        setCurrentTeamId(updatedTeamData.id);
        setPlayers(updatedTeamData.players_data || []);
        
        // Update PlayerService with new team ID
        playerService.setActiveTeamId(updatedTeamData.id);
        
        // Refresh lanePlayers with fresh data
        refreshLanePlayers();
        
        // Preload images for all players (only once per team change)
        if (!imageCache[`team_${updatedTeamData.id}`]) {
          preloadPlayerImages(updatedTeamData);
          setImageCache(prev => ({ ...prev, [`team_${updatedTeamData.id}`]: true }));
        }
        
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
    
    // Add to players array
    setPlayers(prev => {
      const updated = [...prev, newPlayer];
      console.log('Updated players array:', updated);
      return updated;
    });
    
    // Add to teamPlayers state
    setTeamPlayers(prev => {
      if (!prev) return prev;
      const playersArray = prev.players_data || prev.players;
      if (!playersArray) return prev;
      
      const updatedPlayers = [...playersArray, newPlayer];
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

    // Note: We don't immediately sync with backend to avoid overwriting the newly created player
    // The backend will be synced during the next periodic refresh or when the user manually refreshes
    console.log('Player created successfully, using local state update');
  };

  // Auto-refresh team data periodically (reduced frequency to prevent excessive calls)
  useEffect(() => {
    // Only set up periodic refresh if we have a team
    if (!teamPlayers?.id) return;

    // Set up periodic refresh (every 5 minutes instead of 30 seconds)
    const interval = setInterval(() => {
      if (teamPlayers?.id) {
        console.log('Periodic refresh of team data...');
        refreshTeamDataFromBackend();
      }
    }, 300000); // 5 minutes

    return () => {
      clearInterval(interval);
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
  }, []); // Empty dependency array for initial load

  // Load team data when team changes
  useEffect(() => {
    const loadTeamData = async () => {
      setIsLoadingTeam(true);
      
      // Add timeout to prevent infinite loading, but only if we don't have data
      let timeoutId;
      if (!teamPlayers || !teamPlayers.players_data || teamPlayers.players_data.length === 0) {
        timeoutId = setTimeout(() => {
          setIsLoadingTeam(false);
        }, 5000); // Reduced to 5 seconds for better UX
      }
      
      // Cleanup function to clear timeout
      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
      
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
          
          // Clear timeout since we have data
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          // Then fetch fresh data from backend in background
          try {
            const response = await fetch(buildApiUrl(`/teams/active`), {
              headers: {
                  'X-Active-Team-ID': latestTeam.id,
                  'Content-Type': 'application/json'
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
              
              // Preload player images for the team (only once per team change)
              if (!imageCache[`team_${updatedTeamData.id}`]) {
                preloadPlayerImages(updatedTeamData);
                setImageCache(prev => ({ ...prev, [`team_${updatedTeamData.id}`]: true }));
              }
            }
          } catch (error) {
            console.error('Error fetching fresh team data:', error);
            // Keep using localStorage data if API fails
          }
        } else {
          // Try to fetch active team from API
          try {
              const response = await fetch(buildApiUrl(`/teams/active`), {
                headers: {
                  'Content-Type': 'application/json'
                }
              });
            if (response.ok) {
              const activeTeam = await response.json();
                
                // Check if we have a valid team or if it's the "no teams" response
                if (activeTeam.has_teams === false || !activeTeam.id) {
                  console.log('No active team found, setting teamPlayers to null');
                  setTeamPlayers(null);
                  setCurrentTeamId(null);
                } else {
              const teamData = {
                teamName: activeTeam.name,
                players_data: activeTeam.players_data || activeTeam.players || [],
                id: activeTeam.id,
                logo_path: activeTeam.logo_path || null
              };
              localStorage.setItem('latestTeam', JSON.stringify(teamData));
              setTeamPlayers(teamData);
              setCurrentTeamId(activeTeam.id);
              
              // Clear timeout since we have data
              if (timeoutId) {
                clearTimeout(timeoutId);
              }
              
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
              
              // Preload player images for the team (only once per team change)
              if (!imageCache[`team_${teamData.id}`]) {
                preloadPlayerImages(teamData);
                setImageCache(prev => ({ ...prev, [`team_${teamData.id}`]: true }));
                  }
              }
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
        cleanup(); // Call cleanup function
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
          // Preload player images for the team (only once per team change)
          if (!imageCache[`team_${teamDataWithLogo.id}`]) {
            preloadPlayerImages(teamDataWithLogo);
            setImageCache(prev => ({ ...prev, [`team_${teamDataWithLogo.id}`]: true }));
          }
          
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
        const response = await fetch(buildApiUrl('/players'));
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
          // First, try to calculate statistics directly from match data (like Hero Statistics)
          console.log('Attempting to calculate player statistics from match data...');
          
          // Calculate stats for all players in parallel
          const players = teamPlayers?.players_data || teamPlayers?.players || [];
          const promises = players.map(player => {
            const playerIdentifier = `${player.name}_${player.role || 'unknown'}`;
            return Promise.allSettled([
              calculateHeroStatsFromMatches(playerIdentifier, player),
              calculateH2HStatsFromMatches(playerIdentifier, player)
            ]);
          });
          
          await Promise.allSettled(promises);
          
          // Check if we got any data from the direct calculation
          const hasData = Object.keys(allPlayerStats).length > 0;
          if (hasData) {
            console.log('Successfully calculated player statistics from match data');
            setIsLoadingStats(false);
            statsFetchingRef.current = false;
            return;
          }
          
          // Fallback to API approach if direct calculation fails or returns no data
          console.log('Falling back to API-based player statistics...');
          console.log('Starting to fetch player statistics from API...', {
            teamPlayers: teamPlayers?.teamName,
            matchMode,
            playersCount: playersArray.length
          });
          
          const statsObj = {};
          const h2hStatsObj = {};
          
          await Promise.all(
            playersArray.map(async (p) => {
              if (!p.name || !p.role) return;
              
              const playerIdentifier = getPlayerIdentifier(p.name, p.role);
              
              // Fetch stats for all players (including substitutes) to ensure accurate data
              // The backend will handle role-based filtering
              try {
                const statsUrl = buildApiUrl(`/players/${encodeURIComponent(p.name)}/hero-stats-by-team?teamName=${encodeURIComponent(teamPlayers.teamName)}&role=${encodeURIComponent(p.role)}&match_type=${matchMode}`);
                const h2hUrl = buildApiUrl(`/players/${encodeURIComponent(p.name)}/hero-h2h-stats-by-team?teamName=${encodeURIComponent(teamPlayers.teamName)}&role=${encodeURIComponent(p.role)}&match_type=${matchMode}`);
                
                console.log(`Fetching stats for ${p.name} (${p.role}):`, { statsUrl, h2hUrl });
                
                const [statsRes, h2hRes] = await Promise.all([
                  fetch(statsUrl, {
                    headers: {
                      'X-Active-Team-ID': teamPlayers.id
                    }
                  }),
                  fetch(h2hUrl, {
                    headers: {
                      'X-Active-Team-ID': teamPlayers.id
                    }
                  })
                ]);
                
                console.log(`API responses for ${p.name}:`, {
                  statsStatus: statsRes.status,
                  h2hStatus: h2hRes.status,
                  statsOk: statsRes.ok,
                  h2hOk: h2hRes.ok
                });
                
                if (!statsRes.ok || !h2hRes.ok) {
                  console.error(`API error for ${p.name}:`, {
                    statsStatus: statsRes.status,
                    h2hStatus: h2hRes.status
                  });
                  return;
                }
                
                const statsData = await statsRes.json();
                const h2hData = await h2hRes.json();
                
                console.log(`Stats data for ${p.name}:`, { statsData, h2hData });
                
                statsObj[playerIdentifier] = statsData;
                h2hStatsObj[playerIdentifier] = h2hData;
              } catch (error) {
                console.error(`Error fetching stats for ${p.name}:`, error);
              }
            })
          );
          
          console.log('Final stats objects:', { statsObj, h2hStatsObj });
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
  }, [teamPlayers?.id, teamPlayers?.teamName, teamPlayers?.players_data, teamPlayers?.players, matchMode, forceUpdate]); // Include players data to refetch when players change

  // Listen for match updates to refresh player statistics
  useEffect(() => {
    const handleMatchUpdate = async (event) => {
      const { matchId, teamId, matchData } = event.detail;
      
      // Only refresh if the update is for the current team
      if (teamId && teamPlayers?.id && teamId === teamPlayers.id) {
        console.log('🔄 Match updated, clearing cache and refreshing player statistics...', { matchId, teamId, matchData });
        
        // Clear the cache to force fresh data fetch
        setAllPlayerStats({});
        setAllPlayerH2HStats({});
        
        // Clear localStorage for all players to force fresh data
        const playersArray = teamPlayers?.players_data || teamPlayers?.players || [];
        playersArray.forEach(player => {
          if (player.name && player.role) {
            const playerIdentifier = getPlayerIdentifier(player.name, player.role);
            localStorage.removeItem(`heroStats_${playerIdentifier}`);
            localStorage.removeItem(`heroH2HStats_${playerIdentifier}`);
          }
        });
        console.log(`🗑️ Cleared localStorage for all players due to match update`);
        
        // Force refresh by incrementing the forceUpdate counter
        // This will trigger the main useEffect that fetches stats from the backend API
        setForceUpdate(prev => prev + 1);
        
        // Also clear the global caches to ensure fresh data
        if (window.playerStatsCache) {
          Object.keys(window.playerStatsCache).forEach(key => {
            if (key.includes(teamId)) {
              delete window.playerStatsCache[key];
            }
          });
        }
        
        if (window.playerH2HStatsCache) {
          Object.keys(window.playerH2HStatsCache).forEach(key => {
            if (key.includes(teamId)) {
              delete window.playerH2HStatsCache[key];
            }
          });
        }
        
        // Clear matches cache to ensure fresh data from API
        if (window.matchesCache) {
          Object.keys(window.matchesCache.data || {}).forEach(key => {
            if (key.includes(teamId)) {
              delete window.matchesCache.data[key];
            }
          });
          Object.keys(window.matchesCache.isLoading || {}).forEach(key => {
            if (key.includes(teamId)) {
              delete window.matchesCache.isLoading[key];
            }
          });
        }
        
        console.log(`🔄 All caches cleared for team ${teamId}, forcing fresh data fetch`);
        
        // If a modal is currently open, refresh its data too
        if (modalInfo && modalInfo.player) {
          console.log(`🔄 Refreshing modal data for ${modalInfo.player.name} due to match update`);
          // Trigger a re-fetch for the currently open modal
          const playerIdentifier = modalInfo.player.identifier || getPlayerIdentifier(modalInfo.player.name, modalInfo.player.role);
          setAllPlayerStats(prev => {
            const newStats = { ...prev };
            delete newStats[playerIdentifier]; // Remove from cache to force refresh
            return newStats;
          });
          setAllPlayerH2HStats(prev => {
            const newH2HStats = { ...prev };
            delete newH2HStats[playerIdentifier]; // Remove from cache to force refresh
            return newH2HStats;
          });
        }
      }
    };

    // Add event listener for match updates
    window.addEventListener('matchUpdated', handleMatchUpdate);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('matchUpdated', handleMatchUpdate);
    };
  }, [teamPlayers?.id, modalInfo]); // Include modalInfo to handle current modal refresh

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
    // If logo_path is a storage path, use the new API route
    else if (teamPlayers.logo_path.startsWith('storage/teams/')) {
      const filename = teamPlayers.logo_path.replace('storage/teams/', '');
      logoUrl = `https://api.coachdatastatistics.site/api/team-logo/${filename}`;
    }
    // If logo_path is a storage path, construct the full URL with the base domain (not API)
    else if (teamPlayers.logo_path.startsWith('storage/')) {
      logoUrl = `https://coachdatastatistics.site/${teamPlayers.logo_path}`;
    }
    // Default fallback - construct full URL with base domain
    else {
      logoUrl = `https://coachdatastatistics.site/${teamPlayers.logo_path}`;
    }
    
    return logoUrl;
  }, [teamPlayers]);

  // ULTRA-ROBUST data loading with aggressive persistence and recovery
  useEffect(() => {
    if (modalInfo && modalInfo.player && modalInfo.player.name) {
      const playerIdentifier = modalInfo.player.identifier || getPlayerIdentifier(modalInfo.player.name, modalInfo.player.role);
      
      console.log(`🚀 Opening modal for player: ${modalInfo.player.name} (${playerIdentifier})`);
      
      // FORCE FRESH CALCULATION - Clear cache and recalculate
      const loadPlayerData = async () => {
      setIsLoadingStats(true);
        
        console.log(`🔄 FORCING fresh calculation for ${modalInfo.player.name} - clearing all caches`);
        
        // Clear all caches for this player to force fresh calculation
        const teamId = teamPlayers?.id;
        if (teamId) {
          // Clear localStorage
          Object.keys(localStorage).forEach(key => {
            if (key.includes(`heroStats_${playerIdentifier}`) || key.includes(`heroH2HStats_${playerIdentifier}`)) {
              localStorage.removeItem(key);
            }
          });
          
          // Clear sessionStorage
          Object.keys(sessionStorage).forEach(key => {
            if (key.includes(`heroStats_${playerIdentifier}`) || key.includes(`heroH2HStats_${playerIdentifier}`)) {
              sessionStorage.removeItem(key);
            }
          });
          
          // Clear global caches
          if (window.playerStatsCache && window.playerStatsCache[playerIdentifier]) {
            delete window.playerStatsCache[playerIdentifier];
          }
          if (window.playerH2HStatsCache && window.playerH2HStatsCache[playerIdentifier]) {
            delete window.playerH2HStatsCache[playerIdentifier];
          }
          
          // Clear component state
          setAllPlayerStats(prev => {
            const newState = { ...prev };
            delete newState[playerIdentifier];
            return newState;
          });
          setAllPlayerH2HStats(prev => {
            const newState = { ...prev };
            delete newState[playerIdentifier];
            return newState;
          });
        }
        
        // Force fresh calculation
        try {
          console.log(`🔄 Calculating fresh hero stats for ${modalInfo.player.name}`);
          await calculateHeroStatsFromMatches(playerIdentifier, modalInfo.player);
          
          console.log(`🔄 Calculating fresh H2H stats for ${modalInfo.player.name}`);
          await calculateH2HStatsFromMatches(playerIdentifier, modalInfo.player);
          
          console.log(`✅ Fresh calculation completed for ${modalInfo.player.name}`);
        } catch (error) {
          console.error(`❌ Error in fresh calculation for ${modalInfo.player.name}:`, error);
        } finally {
          setIsLoadingStats(false);
        }
      };
      
      loadPlayerData();
      } else {
      setHeroStats([]);
      setHeroH2HStats([]);
        setIsLoadingStats(false);
      }
  }, [modalInfo, teamPlayers?.id, matchMode, calculateHeroStatsFromMatches, calculateH2HStatsFromMatches]);

  // Handle mode changes specifically - trigger hero stats recalculation when modal is open
  useEffect(() => {
    if (modalInfo && modalInfo.player && teamPlayers?.id) {
      console.log(`🔄 Mode changed to ${matchMode}, triggering hero stats recalculation for ${modalInfo.player.name}`);
      
      // Clear current stats to force fresh calculation
      setHeroStats([]);
      setHeroH2HStats([]);
      setIsLoadingStats(true);
      
      // Force fresh calculation from matches for the modal
      const playerIdentifier = `${modalInfo.player.name}_${modalInfo.player.role || 'unknown'}`;
      const recalculateStats = async () => {
        try {
          await Promise.allSettled([
            calculateHeroStatsFromMatches(playerIdentifier, modalInfo.player),
            calculateH2HStatsFromMatches(playerIdentifier, modalInfo.player)
          ]);
        } catch (error) {
          console.error('Error recalculating stats after mode change:', error);
        }
      };
      
      recalculateStats();
    }
  }, [matchMode, calculateHeroStatsFromMatches, calculateH2HStatsFromMatches]); // Only trigger when matchMode changes

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

  // Check if a player is a substitute
  function isSubstitutePlayer(player) {
    return playerService.isSubstitutePlayer(player);
  }

  // Get main players (non-substitutes) for a specific role
  function getMainPlayersForRole(roleKey) {
    if (!teamPlayers) return [];
    
    const playersArray = teamPlayers.players_data || teamPlayers.players;
    if (!playersArray) return [];
    
    return playerService.getMainPlayersForRole(playersArray, roleKey);
  }

  function getHeroForLaneByLaneKey(laneKey, lanePlayers) {
    if (!lanePlayers) return null;
    const found = Array.isArray(lanePlayers)
      ? lanePlayers.find(p => p && p.lane && p.lane.toLowerCase() === laneKey)
      : null;
    return found ? found.hero : null;
  }

  // Refresh function for success modal
  const handleRefreshData = () => {
    console.log('Refreshing page after player operation...');
    
    // Reload the entire page to ensure all data is fresh
    window.location.reload();
  };

  // Data recovery and sync functions
  const syncTeamPlayers = async () => {
    if (!teamPlayers?.id) {
      setSuccessMessage('No active team found. Please select a team first.');
      setShowSuccessModal(true);
      return;
    }

    try {
      console.log('Syncing team players for team ID:', teamPlayers.id);
      const response = await fetch(buildApiUrl('/teams/sync-players'), {
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
      const response = await fetch(buildApiUrl(`/players?team_id=${teamPlayers.id}`));
      if (response.ok) {
        const backendPlayers = await response.json();
        const backendPlayerCount = backendPlayers.length;
        const backendPlayerData = backendPlayers.map(p => ({ name: p.name, role: p.role, id: p.id }));
        
        // Get team data from backend
        const teamResponse = await fetch(buildApiUrl(`/teams/${teamPlayers.id}`));
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
  const handlePlayerUpdate = async (updatedPlayer) => {
    console.log('Updated player data:', updatedPlayer);
    
    // Update players array
    setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
    
    // Update teamPlayers state
    setTeamPlayers(prev => {
      if (!prev) return prev;
      const playersArray = prev.players_data || prev.players;
      if (!playersArray) return prev;
      
      const updatedPlayers = playersArray.map(p => p.id === updatedPlayer.id ? updatedPlayer : p);
      
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
    
    // Force a re-render to ensure the updated player is displayed
    setForceUpdate(prev => prev + 1);

    // Recalculate player statistics to reflect the updated player data
    try {
      console.log('Recalculating player statistics after player update...');
      
      // Calculate stats for all players in parallel
      const players = teamPlayers?.players_data || teamPlayers?.players || [];
      const promises = players.map(player => {
        const playerIdentifier = `${player.name}_${player.role || 'unknown'}`;
        return Promise.allSettled([
          calculateHeroStatsFromMatches(playerIdentifier, player),
          calculateH2HStatsFromMatches(playerIdentifier, player)
        ]);
      });
      
      await Promise.allSettled(promises);
      console.log('Player statistics recalculated successfully after update');
    } catch (error) {
      console.error('Error recalculating player statistics after player update:', error);
    }
  };

  const handlePlayerDelete = async (playerIdOrPlayer) => {
    console.log('handlePlayerDelete called with:', playerIdOrPlayer);
    
    // Check if we received a player ID (number) or a player object
    if (typeof playerIdOrPlayer === 'number' || typeof playerIdOrPlayer === 'string') {
      // Standard deletion for players with database IDs
      const playerId = playerIdOrPlayer;
      console.log('Deleting player with ID:', playerId);
      
      // Don't update local state immediately - wait for backend confirmation
      // This prevents the "No players to display" issue
      console.log('Waiting for backend deletion confirmation before updating UI...');
      
      // Refresh data from backend immediately to get the updated state
      try {
        console.log('Refreshing team data from backend after deletion...');
        const success = await refreshTeamDataFromBackend();
        if (success) {
          console.log('Successfully refreshed team data after deletion');
          // UI will be updated automatically by refreshTeamDataFromBackend
        } else {
          console.warn('Failed to refresh team data after deletion, falling back to local update');
          // Fallback: update local state if backend refresh fails
          setPlayers(prev => prev.filter(p => p.id !== playerId));
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
            
            localStorage.setItem('latestTeam', JSON.stringify(updatedTeamData));
            console.log('Fallback: Updated localStorage with deleted player:', updatedTeamData);
            
            return updatedTeamData;
          });
        }
      } catch (error) {
        console.error('Error refreshing team data after deletion:', error);
        // Fallback: update local state if backend refresh fails
        setPlayers(prev => prev.filter(p => p.id !== playerId));
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
          
          localStorage.setItem('latestTeam', JSON.stringify(updatedTeamData));
          console.log('Fallback: Updated localStorage with deleted player:', updatedTeamData);
          
          return updatedTeamData;
        });
      }
      
    } else {
      // Special handling for players without IDs (from create team)
      const playerToRemove = playerIdOrPlayer;
      console.log('Deleting player without ID:', playerToRemove);
      
      // Remove from players array using name and role
      setPlayers(prev => prev.filter(p => 
        !(p.name === playerToRemove.name && p.role === playerToRemove.role)
      ));
      
      // Remove from teamPlayers state using name and role
      setTeamPlayers(prev => {
        if (!prev) return prev;
        const playersArray = prev.players_data || prev.players;
        if (!playersArray) return prev;
        
        const updatedPlayers = playersArray.filter(p => 
          !(p.name === playerToRemove.name && p.role === playerToRemove.role)
        );
        
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
      
      const response = await fetch(buildApiUrl(`/players/photo-by-name`), {
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
      <style>{`
        /* Custom scrollbar styling */
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #9333ea, #3b82f6);
          border-radius: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #7c3aed, #2563eb);
        }
        
        /* Ensure header doesn't overlap content */
        .pt-24 {
          padding-top: 6rem;
        }
        
        /* Smooth scrolling for the entire page */
        html {
          scroll-behavior: smooth;
        }
        
        /* Team card transition styles */
        .team-card-transition {
          transition: all 0.5s ease-in-out;
        }
        
        /* Ensure smooth hiding/showing of team card */
        .team-card-hidden {
          opacity: 0;
          transform: translateY(-1rem);
          pointer-events: none;
        }
        
        .team-card-visible {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        
        /* Prevent horizontal scrolling */
        body, html {
          overflow-x: hidden;
        }
        
        /* Ensure main content doesn't cause horizontal scroll */
        .overflow-x-hidden {
          overflow-x: hidden !important;
        }
        
        /* Global horizontal scroll prevention */
        * {
          max-width: 100%;
          box-sizing: border-box;
        }
        
        /* Ensure player cards don't overflow */
        .player-grid-container {
          overflow-x: hidden;
          width: 100%;
        }
      `}</style>
      
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
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-start flex-1 relative z-10 px-4 pt-24 overflow-y-auto overflow-x-hidden scroll-smooth" style={{ marginTop: -80 }}>
        {/* Team Display Card */}
        <div className={`w-full max-w-7xl mx-auto mb-8 mt-16 transition-all duration-500 ease-in-out transform ${
          hideTeamCard 
            ? 'opacity-0 -translate-y-4 pointer-events-none' 
            : 'opacity-100 translate-y-0'
        }`}>
          <TeamDisplayCard 
            teamName={getCurrentTeamName()} 
            teamLogo={getTeamLogo()} 
            onEditPlayers={() => setShowSettingsModal(true)}
            onRefresh={handleRefreshData}
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
          <div className="w-full max-w-7xl mx-auto mb-8 overflow-x-hidden">
            {/* Debug info */}
            {console.log('Rendering PlayerGrid with:', { 
              isLoadingTeam, 
              hasTeamPlayers: !!teamPlayers, 
              hasPlayers: !!players, 
              playersIsArray: Array.isArray(players),
              playersLength: players?.length,
              teamPlayersData: teamPlayers?.players_data?.length
            })}
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
        
        {/* Debug: Show why PlayerGrid is not rendering */}
        {!isLoadingTeam && (!teamPlayers || !players || !Array.isArray(players)) && (
          <div className="w-full max-w-7xl mx-auto mb-8 p-8 bg-gray-800/50 rounded-xl border border-gray-600">
            <div className="text-center">
              <h3 className="text-white text-lg font-semibold mb-4">Debug Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-gray-300">Loading State:</p>
                  <p className="text-white font-mono">{isLoadingTeam ? 'true' : 'false'}</p>
                </div>
                <div className="bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-gray-300">Has Team Players:</p>
                  <p className="text-white font-mono">{teamPlayers ? 'true' : 'false'}</p>
                </div>
                <div className="bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-gray-300">Has Players Array:</p>
                  <p className="text-white font-mono">{players && Array.isArray(players) ? 'true' : 'false'}</p>
                </div>
                <div className="bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-gray-300">Players Length:</p>
                  <p className="text-white font-mono">{players?.length || 0}</p>
                </div>
                <div className="bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-gray-300">Team Players Data:</p>
                  <p className="text-white font-mono">{teamPlayers?.players_data?.length || 0}</p>
                </div>
                <div className="bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-gray-300">Current Team ID:</p>
                  <p className="text-white font-mono">{currentTeamId || 'null'}</p>
                </div>
              </div>
            </div>
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
        matchMode={matchMode}
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
        onRefresh={handleRefreshData}
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
        onUserUpdate={(updatedUser) => {
          setCurrentUser(updatedUser);
        }}
      />

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={e => handleFileSelect(e, modalInfo?.player?.name, modalInfo?.player?.role)}
      />

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110"
          title="Scroll to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}


    </div>
  );
}

export default PlayersStatistic;
