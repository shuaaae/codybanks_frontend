import React from 'react';
import PlayerCard from './PlayerCard';
import defaultPlayer from '../../assets/default.png';
import { LANES } from './constants';

// Global lane icon mapping function
const getLaneIconByRole = (role) => {
  if (!role) return defaultPlayer;
  
  const normalizedRole = role.toLowerCase().trim();
  
  // Map any role to its base lane icon
  if (normalizedRole.includes('exp') || normalizedRole.includes('explane')) {
    return LANES[0]?.icon || defaultPlayer;
  } else if (normalizedRole.includes('mid') || normalizedRole.includes('midlane')) {
    return LANES[1]?.icon || defaultPlayer;
  } else if (normalizedRole.includes('jungle') || normalizedRole.includes('jungler')) {
    return LANES[2]?.icon || defaultPlayer;
  } else if (normalizedRole.includes('gold') || normalizedRole.includes('marksman')) {
    return LANES[3]?.icon || defaultPlayer;
  } else if (normalizedRole.includes('roam') || normalizedRole.includes('roamer')) {
    return LANES[4]?.icon || defaultPlayer;
  } else if (normalizedRole.includes('sub') || normalizedRole.includes('substitute')) {
    return defaultPlayer;
  }
  

  return defaultPlayer;
};

const PlayerGrid = ({
  teamPlayers,
  players, 
  lanePlayers, 
  LANES, 
  PLAYER, 
  getPlayerNameForLane, 
  getRoleByLaneKey, 
  getHeroForLaneByLaneKey,
  getPlayerIdentifier, 
  getPlayerPhoto,
  onPlayerClick,
  isSubstitutePlayer,
  getMainPlayersForRole
}) => {
  // Ensure players is always an array
  const safePlayers = Array.isArray(players) ? players : [];

  // Get players array from team data
  const playersArray = teamPlayers?.players_data || teamPlayers?.players;
  
  // Check player counts for different layouts
  const playerCount = playersArray ? playersArray.length : 0;
  const hasTwoPlayers = playerCount === 2;
  const hasThreePlayers = playerCount === 3;
  const hasFourPlayers = playerCount === 4;
  const hasFivePlayers = playerCount === 5;
  const hasSixPlayers = playerCount === 6;
  const hasSevenPlayers = playerCount === 7;
  const hasEightPlayers = playerCount === 8;
  const hasMoreThanSixPlayers = playerCount > 6;

  // Safety check: don't render until we have valid data
  if (!teamPlayers || !safePlayers || !Array.isArray(safePlayers)) {
    return (
      <div className="w-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading player data...</p>
        </div>
      </div>
    );
  }

  // Case 1: Exactly 2 players - 1x2 grid layout
  if (hasTwoPlayers) {
    return (
      <div className="w-full flex flex-col items-center space-y-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          {playersArray.map((player, idx) => {
            const role = player.role || getRoleByLaneKey(idx);
            const playerIdentifier = getPlayerIdentifier(player.name, role);
            const hero = getHeroForLaneByLaneKey(role, lanePlayers);

            return (
              <div key={idx} className="flex justify-center">
                <PlayerCard
                  lane={LANES[idx] || { key: `player-${idx}`, label: `Player ${idx + 1}` }}
                  player={{ ...player, role, identifier: playerIdentifier }}
                  hero={hero}
                  onClick={() =>
                    onPlayerClick({
                      lane: LANES[idx] || { key: `player-${idx}`, label: `Player ${idx + 1}` },
                      player: { ...player, role, identifier: playerIdentifier },
                      hero,
                    })
                  }
                  getPlayerPhoto={(name) => getPlayerPhoto(name, role)}
                  teamPlayers={teamPlayers}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Case 2: Exactly 3 players - 1x3 grid layout
  if (hasThreePlayers) {
    return (
      <div className="w-full flex flex-col items-center space-y-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
          {playersArray.map((player, idx) => {
            const role = player.role || getRoleByLaneKey(idx);
            const playerIdentifier = getPlayerIdentifier(player.name, role);
            const hero = getHeroForLaneByLaneKey(role, lanePlayers);

            return (
              <div key={idx} className="flex justify-center">
                <PlayerCard
                  lane={LANES[idx] || { key: `player-${idx}`, label: `Player ${idx + 1}` }}
                  player={{ ...player, role, identifier: playerIdentifier }}
                  hero={hero}
                  onClick={() =>
                    onPlayerClick({
                      lane: LANES[idx] || { key: `player-${idx}`, label: `Player ${idx + 1}` },
                      player: { ...player, role, identifier: playerIdentifier },
                      hero,
                    })
                  }
                  getPlayerPhoto={(name) => getPlayerPhoto(name, role)}
                  teamPlayers={teamPlayers}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Case 3: Exactly 4 players - 2x2 grid layout
  if (hasFourPlayers) {
    return (
      <div className="w-full flex flex-col items-center space-y-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {playersArray.map((player, idx) => {
            const role = player.role || getRoleByLaneKey(idx);
            const playerIdentifier = getPlayerIdentifier(player.name, role);
            const hero = getHeroForLaneByLaneKey(role, lanePlayers);

            return (
              <div key={idx} className="flex justify-center">
                <PlayerCard
                  lane={LANES[idx] || { key: `player-${idx}`, label: `Player ${idx + 1}` }}
                  player={{ ...player, role, identifier: playerIdentifier }}
                  hero={hero}
                  onClick={() =>
                    onPlayerClick({
                      lane: LANES[idx] || { key: `player-${idx}`, label: `Player ${idx + 1}` },
                      player: { ...player, role, identifier: playerIdentifier },
                      hero,
                    })
                  }
                  getPlayerPhoto={(name) => getPlayerPhoto(name, role)}
                  teamPlayers={teamPlayers}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Case 4: Exactly 6 players - Use the current 6-player JSX block
  if (hasSixPlayers) {
    // 3x3 grid layout: 3 players on left, 3 on right
    return (
      <div className="w-full flex flex-col items-center space-y-8 px-4">
        {/* Two columns: Left (3 players) and Right (3 players) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 w-full max-w-7xl">
          {/* Left Column: exp, mid, jungler */}
          <div className="flex flex-col space-y-6">
            {(() => {
                          const playerName = getPlayerNameForLane('exp', 0);
            const playerRole = getRoleByLaneKey('exp');
            const playerObj = safePlayers.find(p => p.name === playerName) || { ...PLAYER, name: playerName, role: playerRole };
              const playerIdentifier = getPlayerIdentifier(playerName, playerRole);
              return (
                <div key="exp" className="flex justify-center">
                  <PlayerCard 
                    lane={LANES[0]} 
                    player={playerObj} 
                    hero={getHeroForLaneByLaneKey('exp', lanePlayers)} 
                    onClick={() => onPlayerClick({ 
                      lane: LANES[0], 
                      player: { ...playerObj, role: playerRole, identifier: playerIdentifier }, 
                      hero: getHeroForLaneByLaneKey('exp', lanePlayers) 
                    })} 
                    getPlayerPhoto={(name) => getPlayerPhoto(name, playerRole)} 
                    teamPlayers={teamPlayers}
                  />
                </div>
              );
            })()}
            
            {(() => {
                          const playerName = getPlayerNameForLane('mid', 1);
            const playerRole = getRoleByLaneKey('mid');
            const playerObj = safePlayers.find(p => p.name === playerName) || { ...PLAYER, name: playerName, role: playerRole };
              const playerIdentifier = getPlayerIdentifier(playerName, playerRole);
              return (
                <div key="mid" className="flex justify-center">
                  <PlayerCard 
                    lane={LANES[1]} 
                    player={playerObj} 
                    hero={getHeroForLaneByLaneKey('mid', lanePlayers)} 
                    onClick={() => onPlayerClick({ 
                      lane: LANES[1], 
                      player: { ...playerObj, role: playerRole, identifier: playerIdentifier }, 
                      hero: getHeroForLaneByLaneKey('mid', lanePlayers) 
                    })} 
                    getPlayerPhoto={(name) => getPlayerPhoto(name, playerRole)} 
                    teamPlayers={teamPlayers}
                  />
                </div>
              );
            })()}
            
            {(() => {
              const playerName = getPlayerNameForLane('jungler', 2);
              const playerRole = getRoleByLaneKey('jungler');
              const playerObj = safePlayers.find(p => p.name === playerName) || { ...PLAYER, name: playerName, role: playerRole };
              const playerIdentifier = getPlayerIdentifier(playerName, playerRole);
            return (
                <div key="jungler" className="flex justify-center">
                <PlayerCard
                    lane={LANES[2]} 
                    player={playerObj} 
                    hero={getHeroForLaneByLaneKey('jungler', lanePlayers)} 
                    onClick={() => onPlayerClick({ 
                      lane: LANES[2], 
                      player: { ...playerObj, role: playerRole, identifier: playerIdentifier }, 
                      hero: getHeroForLaneByLaneKey('jungler', lanePlayers) 
                    })} 
                    getPlayerPhoto={(name) => getPlayerPhoto(name, playerRole)} 
                  teamPlayers={teamPlayers}
                />
              </div>
            );
            })()}
        </div>
        
          {/* Right Column: gold, roam, substitute */}
          <div className="flex flex-col space-y-6">
            {(() => {
              const playerName = getPlayerNameForLane('gold', 3);
              const playerRole = getRoleByLaneKey('gold');
              const playerObj = safePlayers.find(p => p.name === playerName) || { ...PLAYER, name: playerName, role: playerRole };
              const playerIdentifier = getPlayerIdentifier(playerName, playerRole);
              return (
                <div key="gold" className="flex justify-center">
                  <PlayerCard 
                    lane={LANES[3]} 
                    player={playerObj} 
                    hero={getHeroForLaneByLaneKey('gold', lanePlayers)} 
                    onClick={() => onPlayerClick({ 
                      lane: LANES[3], 
                      player: { ...playerObj, role: playerRole, identifier: playerIdentifier }, 
                      hero: getHeroForLaneByLaneKey('gold', lanePlayers) 
                    })} 
                    getPlayerPhoto={(name) => getPlayerPhoto(name, playerRole)} 
                    teamPlayers={teamPlayers}
                  />
                </div>
              );
            })()}
            
            {(() => {
              const playerName = getPlayerNameForLane('roam', 4);
              const playerRole = getRoleByLaneKey('roam');
              const playerObj = safePlayers.find(p => p.name === playerName) || { ...PLAYER, name: playerName, role: playerRole };
              const playerIdentifier = getPlayerIdentifier(playerName, playerRole);
            return (
                <div key="roam" className="flex justify-center">
                <PlayerCard
                    lane={LANES[4]} 
                    player={playerObj} 
                    hero={getHeroForLaneByLaneKey('roam', lanePlayers)} 
                    onClick={() => onPlayerClick({ 
                      lane: LANES[4], 
                      player: { ...playerObj, role: playerRole, identifier: playerIdentifier }, 
                      hero: getHeroForLaneByLaneKey('roam', lanePlayers) 
                    })} 
                    getPlayerPhoto={(name) => getPlayerPhoto(name, playerRole)} 
                    teamPlayers={teamPlayers}
                  />
                </div>
              );
            })()}
            
            {(() => {
              // 6th player - get the actual 6th player from the team data
              const playersArray = teamPlayers?.players_data || teamPlayers?.players;
              const sixthPlayer = playersArray && playersArray.length >= 6 ? playersArray[5] : null;
              
              if (sixthPlayer && sixthPlayer.name) {
                const playerName = sixthPlayer.name;
                const playerObj = safePlayers.find(p => p.name === playerName) || sixthPlayer;
                
                if (playerObj && playerObj.role) {
                  // Check if this player has a specific role (like "gold" for yuki)
                  const actualRole = playerObj.role.toLowerCase();
                  let laneKey = 'sub';
                  let laneLabel = 'PLAYER 6';
                  let laneIcon = defaultPlayer;
                  let isSubstitute = false;
                  
                  // Map the actual role to lane key and determine if it's a substitute
                  if (actualRole.includes('roam') || actualRole.includes('support')) {
                    laneKey = 'roam';
                    // Count how many roam players we have so far
                    const roamCount = playersArray.slice(0, 6).filter(p => 
                      p.role && p.role.toLowerCase().includes('roam')
                    ).length;
                    laneLabel = roamCount === 1 ? 'ROAMER' : `ROAMER ${roamCount}`;
                    laneIcon = getLaneIconByRole(actualRole);
                    isSubstitute = true;
                  } else if (actualRole.includes('exp') || actualRole.includes('explane')) {
                    laneKey = 'exp';
                    // Count how many exp players we have so far
                    const expCount = playersArray.slice(0, 6).filter(p => 
                      p.role && p.role.toLowerCase().includes('exp')
                    ).length;
                    laneLabel = expCount === 1 ? 'EXPLANER' : `EXPLANER ${expCount}`;
                    laneIcon = getLaneIconByRole(actualRole);
                    isSubstitute = true;
                  } else if (actualRole.includes('mid') || actualRole.includes('midlane')) {
                    laneKey = 'mid';
                    // Count how many mid players we have so far
                    const midCount = playersArray.slice(0, 6).filter(p => 
                      p.role && p.role.toLowerCase().includes('mid')
                    ).length;
                    laneLabel = midCount === 1 ? 'MIDLANER' : `MIDLANER ${midCount}`;
                    laneIcon = getLaneIconByRole(actualRole);
                    isSubstitute = true;
                  } else if (actualRole.includes('jungle') || actualRole.includes('jungler')) {
                    laneKey = 'jungler';
                    // Count how many jungler players we have so far
                    const junglerCount = playersArray.slice(0, 6).filter(p => 
                      p.role && p.role.toLowerCase().includes('jungle')
                    ).length;
                    laneLabel = junglerCount === 1 ? 'JUNGLER' : `JUNGLER ${junglerCount}`;
                    laneIcon = getLaneIconByRole(actualRole);
                    isSubstitute = true;
                  } else if (actualRole.includes('gold') || actualRole.includes('marksman')) {
                    laneKey = 'gold';
                    // Count how many gold players we have so far
                    const goldCount = playersArray.slice(0, 6).filter(p => 
                      p.role && p.role.toLowerCase().includes('gold')
                    ).length;
                    laneLabel = goldCount === 1 ? 'GOLD LANER' : `GOLD LANER ${goldCount}`;
                    laneIcon = getLaneIconByRole(actualRole);
                    isSubstitute = true;
                  } else if (actualRole.includes('sub') || actualRole.includes('substitute')) {
                    laneKey = 'sub';
                    laneLabel = 'SUBSTITUTE';
                    laneIcon = defaultPlayer;
                    isSubstitute = true;
                  }
                  
                  const playerRole = playerObj.role;
                  const playerIdentifier = getPlayerIdentifier(playerName, playerRole);
                  
                  return (
                    <div key="substitute" className="flex justify-center">
                      <PlayerCard 
                        lane={{ 
                          key: laneKey, 
                          label: laneLabel, 
                          icon: laneIcon,
                          isSubstitute: isSubstitute,
                          originalRole: actualRole
                        }} 
                        player={playerObj} 
                        hero={getHeroForLaneByLaneKey(laneKey, lanePlayers)} 
                        onClick={() => onPlayerClick({ 
                          lane: { 
                            key: laneKey, 
                            label: laneLabel, 
                            icon: laneIcon,
                            isSubstitute: isSubstitute,
                            originalRole: actualRole
                          }, 
                          player: { ...playerObj, role: playerRole, identifier: playerIdentifier }, 
                          hero: getHeroForLaneByLaneKey(laneKey, lanePlayers) 
                        })} 
                        getPlayerPhoto={(name) => getPlayerPhoto(name, playerRole)} 
                  teamPlayers={teamPlayers}
                />
              </div>
            );
                } else {
                  // Fallback for players without roles
                  const playerRole = getRoleByLaneKey('sub');
                  const playerIdentifier = getPlayerIdentifier(playerName, playerRole);
                  
                  return (
                    <div key="substitute" className="flex justify-center">
                      <PlayerCard 
                        lane={{ 
                          key: 'sub', 
                          label: 'PLAYER 6', 
                          icon: defaultPlayer,
                          isSubstitute: true
                        }} 
                        player={playerObj || { ...PLAYER, name: playerName, role: playerRole }} 
                        hero={getHeroForLaneByLaneKey('sub', lanePlayers)} 
                        onClick={() => onPlayerClick({ 
                          lane: { 
                            key: 'sub', 
                            label: 'PLAYER 6', 
                            icon: defaultPlayer,
                            isSubstitute: true
                          }, 
                          player: { ...playerObj, role: playerRole, identifier: playerIdentifier }, 
                          hero: getHeroForLaneByLaneKey('sub', lanePlayers) 
                        })} 
                        getPlayerPhoto={(name) => getPlayerPhoto(name, playerRole)} 
                        teamPlayers={teamPlayers}
                      />
                    </div>
                  );
                }
              } else {
                // No 6th player found
                return (
                  <div key="no-substitute" className="flex justify-center">
                    <div className="w-full max-w-580px h-180px rounded-20px border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400">
                      No Substitute Player
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      </div>
    );
  }

  // Case 5: Exactly 5 players - Use the current 5-player JSX block
  if (hasFivePlayers) {
    // Enhanced responsive 5-player layout
    return (
      <div className="w-full flex flex-col items-center space-y-8 px-4">
        {/* Top row - 2 players (exp, mid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-5xl">
          {(() => {
            const playerName = getPlayerNameForLane('exp', 0);
            const playerRole = getRoleByLaneKey('exp');
            const playerObj = safePlayers.find(p => p.name === playerName) || { ...PLAYER, name: playerName, role: playerRole };
            const playerIdentifier = getPlayerIdentifier(playerName, playerRole);
            return (
              <div key="exp" className="flex justify-center">
                          <PlayerCard 
                lane={LANES[0]} 
                player={playerObj} 
                hero={getHeroForLaneByLaneKey('exp', lanePlayers)} 
                onClick={() => onPlayerClick({ 
                  lane: LANES[0], 
                  player: { ...playerObj, role: playerRole, identifier: playerIdentifier }, 
                  hero: getHeroForLaneByLaneKey('exp', lanePlayers) 
                })} 
                getPlayerPhoto={(name) => getPlayerPhoto(name, playerRole)} 
                teamPlayers={teamPlayers}
              />
              </div>
            );
          })()}
          {(() => {
            const playerName = getPlayerNameForLane('mid', 1);
            const playerRole = getRoleByLaneKey('mid');
            const playerObj = safePlayers.find(p => p.name === playerName) || { ...PLAYER, name: playerName, role: playerRole };
            const playerIdentifier = getPlayerIdentifier(playerName, playerRole);
            return (
              <div key="mid" className="flex justify-center">
                          <PlayerCard 
                lane={LANES[1]} 
                player={playerObj} 
                hero={getHeroForLaneByLaneKey('mid', lanePlayers)} 
                onClick={() => onPlayerClick({ 
                  lane: LANES[1], 
                  player: { ...playerObj, role: playerRole, identifier: playerIdentifier }, 
                  hero: getHeroForLaneByLaneKey('mid', lanePlayers) 
                })} 
                getPlayerPhoto={(name) => getPlayerPhoto(name, playerRole)} 
                teamPlayers={teamPlayers}
              />
              </div>
            );
          })()}
        </div>
        
        {/* Middle row - 1 player (jungler) */}
        <div className="flex justify-center w-full max-w-2xl">
          {(() => {
                      const playerName = getPlayerNameForLane('jungler', 2);
            const playerRole = getRoleByLaneKey('jungler');
            const playerObj = safePlayers.find(p => p.name === playerName) || { ...PLAYER, name: playerName, role: playerRole };
            const playerIdentifier = getPlayerIdentifier(playerName, playerRole);
            return (
              <PlayerCard 
                lane={LANES[2]} 
                player={playerObj} 
                hero={getHeroForLaneByLaneKey('jungler', lanePlayers)} 
                onClick={() => onPlayerClick({ 
                  lane: LANES[2], 
                  player: { ...playerObj, role: playerRole, identifier: playerIdentifier }, 
                  hero: getHeroForLaneByLaneKey('jungler', lanePlayers) 
                })} 
                getPlayerPhoto={(name) => getPlayerPhoto(name, playerRole)} 
                teamPlayers={teamPlayers}
              />
            );
          })()}
        </div>
        
        {/* Bottom row - 2 players (gold, roam) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-5xl">
          {(() => {
                      const playerName = getPlayerNameForLane('gold', 3);
            const playerRole = getRoleByLaneKey('gold');
            const playerObj = safePlayers.find(p => p.name === playerName) || { ...PLAYER, name: playerName, role: playerRole };
            const playerIdentifier = getPlayerIdentifier(playerName, playerRole);
            return (
              <div key="gold" className="flex justify-center">
                <PlayerCard
                lane={LANES[3]} 
                player={playerObj} 
                hero={getHeroForLaneByLaneKey('gold', lanePlayers)} 
                onClick={() => onPlayerClick({ 
                  lane: LANES[3], 
                  player: { ...playerObj, role: playerRole, identifier: playerIdentifier }, 
                  hero: getHeroForLaneByLaneKey('gold', lanePlayers) 
                })} 
                getPlayerPhoto={(name) => getPlayerPhoto(name, playerRole)} 
                  teamPlayers={teamPlayers}
                />
              </div>
            );
          })()}
          {(() => {
                      const playerName = getPlayerNameForLane('roam', 4);
            const playerRole = getRoleByLaneKey('roam');
            const playerObj = safePlayers.find(p => p.name === playerName) || { ...PLAYER, name: playerName, role: playerRole };
            const playerIdentifier = getPlayerIdentifier(playerName, playerRole);
            return (
              <div key="roam" className="flex justify-center">
                          <PlayerCard 
                lane={LANES[4]} 
                player={playerObj} 
                hero={getHeroForLaneByLaneKey('roam', lanePlayers)} 
                onClick={() => onPlayerClick({ 
                  lane: LANES[4], 
                  player: { ...playerObj, role: playerRole, identifier: playerIdentifier }, 
                  hero: getHeroForLaneByLaneKey('roam', lanePlayers) 
                })} 
                getPlayerPhoto={(name) => getPlayerPhoto(name, playerRole)} 
                teamPlayers={teamPlayers}
              />
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  // Case 6: Exactly 7 players - Enhanced 2-column layout with scrollable rows
  if (hasSevenPlayers) {
    return (
      <div className="w-full px-4">
        <div className="flex justify-center">
          <div className="grid gap-6 grid-cols-2 w-full max-w-6xl">
            {playersArray.map((player, idx) => {
              // Map player index to proper lane keys for background
              let laneKey = 'sub';
              let laneLabel = `Player ${idx + 1}`;
              let laneIcon = defaultPlayer;
              
              // Map the first 5 players to their standard roles for proper background
              if (idx === 0) {
                laneKey = 'exp';
                laneLabel = 'EXPLANER';
                laneIcon = getLaneIconByRole('exp');
              } else if (idx === 1) {
                laneKey = 'mid';
                laneLabel = 'MID LANER';
                laneIcon = getLaneIconByRole('mid');
              } else if (idx === 2) {
                laneKey = 'jungler';
                laneLabel = 'JUNGLER';
                laneIcon = getLaneIconByRole('jungler');
              } else if (idx === 3) {
                laneKey = 'gold';
                laneLabel = 'GOLD LANER';
                laneIcon = getLaneIconByRole('gold');
              } else if (idx === 4) {
                laneKey = 'roam';
                laneLabel = 'ROAMER';
                laneIcon = getLaneIconByRole('roam');
              } else {
                // For 6th and 7th players, use their actual role if available
                if (player.role) {
                  const actualRole = player.role.toLowerCase();
                  if (actualRole.includes('exp') || actualRole.includes('explane')) {
                    laneKey = 'exp';
                    // Count how many exp players we have so far
                    const expCount = playersArray.slice(0, idx + 1).filter(p => 
                      p.role && p.role.toLowerCase().includes('exp')
                    ).length;
                    laneLabel = expCount === 1 ? 'EXPLANER' : `EXPLANER ${expCount}`;
                  } else if (actualRole.includes('mid') || actualRole.includes('midlane')) {
                    laneKey = 'mid';
                    // Count how many mid players we have so far
                    const midCount = playersArray.slice(0, idx + 1).filter(p => 
                      p.role && p.role.toLowerCase().includes('mid')
                    ).length;
                    laneLabel = midCount === 1 ? 'MID LANER' : `MID LANER ${midCount}`;
                  } else if (actualRole.includes('jungle') || actualRole.includes('jungler')) {
                    laneKey = 'jungler';
                    // Count how many jungler players we have so far
                    const junglerCount = playersArray.slice(0, idx + 1).filter(p => 
                      p.role && p.role.toLowerCase().includes('jungle')
                    ).length;
                    laneLabel = junglerCount === 1 ? 'JUNGLER' : `JUNGLER ${junglerCount}`;
                  } else if (actualRole.includes('gold') || actualRole.includes('marksman')) {
                    laneKey = 'gold';
                    // Count how many gold players we have so far
                    const goldCount = playersArray.slice(0, idx + 1).filter(p => 
                      p.role && p.role.toLowerCase().includes('gold')
                    ).length;
                    laneLabel = goldCount === 1 ? 'GOLD LANER' : `GOLD LANER ${goldCount}`;
                  } else if (actualRole.includes('roam') || actualRole.includes('support')) {
                    laneKey = 'roam';
                    // Count how many roam players we have so far
                    const roamCount = playersArray.slice(0, idx + 1).filter(p => 
                      p.role && p.role.toLowerCase().includes('roam')
                    ).length;
                    laneLabel = roamCount === 1 ? 'ROAMER' : `ROAMER ${roamCount}`;
                  } else {
                    laneKey = 'sub';
                    laneLabel = player.role.toUpperCase();
                  }
                  
                  // Set the lane icon based on the actual role
                  laneIcon = getLaneIconByRole(actualRole);
                }
              }
              
              const role = player.role || laneKey;
              const playerIdentifier = getPlayerIdentifier(player.name, role);
              const hero = getHeroForLaneByLaneKey(role, lanePlayers);

              return (
                <div key={idx} className="flex justify-center">
                  <PlayerCard
                    lane={{ 
                      key: laneKey, 
                      label: laneLabel, 
                      icon: laneIcon,
                      isSubstitute: idx >= 5
                    }}
                    player={{ ...player, role, identifier: playerIdentifier }}
                    hero={hero}
                    onClick={() =>
                      onPlayerClick({
                        lane: { 
                          key: laneKey, 
                          label: laneLabel, 
                          icon: laneIcon,
                          isSubstitute: idx >= 5
                        },
                        player: { ...player, role, identifier: playerIdentifier },
                        hero,
                      })
                    }
                    getPlayerPhoto={(name) => getPlayerPhoto(name, role)}
                    teamPlayers={teamPlayers}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
    }

  // Case 7: Exactly 8 players - 4x2 grid layout
  if (hasEightPlayers) {
    return (
      <div className="w-full px-4">
        <div className="flex justify-center">
          <div className="grid gap-6 grid-cols-2 w-full max-w-6xl">
            {playersArray.map((player, idx) => {
              // Map player index to proper lane keys for background
              let laneKey = 'sub';
              let laneLabel = `Player ${idx + 1}`;
              let laneIcon = defaultPlayer;
              
              // Map the first 5 players to their standard roles for proper background
              if (idx === 0) {
                laneKey = 'exp';
                laneLabel = 'EXPLANER';
                laneIcon = getLaneIconByRole('exp');
              } else if (idx === 1) {
                laneKey = 'mid';
                laneLabel = 'MID LANER';
                laneIcon = getLaneIconByRole('mid');
              } else if (idx === 2) {
                laneKey = 'jungler';
                laneLabel = 'JUNGLER';
                laneIcon = getLaneIconByRole('jungler');
              } else if (idx === 3) {
                laneKey = 'gold';
                laneLabel = 'GOLD LANER';
                laneIcon = getLaneIconByRole('gold');
              } else if (idx === 4) {
                laneKey = 'roam';
                laneLabel = 'ROAMER';
                laneIcon = getLaneIconByRole('roam');
              } else {
                // For 6th, 7th, and 8th players, use their actual role if available
                if (player.role) {
                  const actualRole = player.role.toLowerCase();
                  if (actualRole.includes('exp') || actualRole.includes('explane')) {
                    laneKey = 'exp';
                    // Count how many exp players we have so far
                    const expCount = playersArray.slice(0, idx + 1).filter(p => 
                      p.role && p.role.toLowerCase().includes('exp')
                    ).length;
                    laneLabel = expCount === 1 ? 'EXPLANER' : `EXPLANER ${expCount}`;
                  } else if (actualRole.includes('mid') || actualRole.includes('midlane')) {
                    laneKey = 'mid';
                    // Count how many mid players we have so far
                    const midCount = playersArray.slice(0, idx + 1).filter(p => 
                      p.role && p.role.toLowerCase().includes('mid')
                    ).length;
                    laneLabel = midCount === 1 ? 'MID LANER' : `MID LANER ${midCount}`;
                  } else if (actualRole.includes('jungle') || actualRole.includes('jungler')) {
                    laneKey = 'jungler';
                    // Count how many jungler players we have so far
                    const junglerCount = playersArray.slice(0, idx + 1).filter(p => 
                      p.role && p.role.toLowerCase().includes('jungle')
                    ).length;
                    laneLabel = junglerCount === 1 ? 'JUNGLER' : `JUNGLER ${junglerCount}`;
                  } else if (actualRole.includes('gold') || actualRole.includes('marksman')) {
                    laneKey = 'gold';
                    // Count how many gold players we have so far
                    const goldCount = playersArray.slice(0, idx + 1).filter(p => 
                      p.role && p.role.toLowerCase().includes('gold')
                    ).length;
                    laneLabel = goldCount === 1 ? 'GOLD LANER' : `GOLD LANER ${goldCount}`;
                  } else if (actualRole.includes('roam') || actualRole.includes('support')) {
                    laneKey = 'roam';
                    // Count how many roam players we have so far
                    const roamCount = playersArray.slice(0, idx + 1).filter(p => 
                      p.role && p.role.toLowerCase().includes('roam')
                    ).length;
                    laneLabel = roamCount === 1 ? 'ROAMER' : `ROAMER ${roamCount}`;
                  } else {
                    laneKey = 'sub';
                    laneLabel = player.role.toUpperCase();
                  }
                  
                  // Set the lane icon based on the actual role
                  laneIcon = getLaneIconByRole(actualRole);
                }
              }
              
              const role = player.role || laneKey;
              const playerIdentifier = getPlayerIdentifier(player.name, role);
              const hero = getHeroForLaneByLaneKey(role, lanePlayers);

              return (
                <div key={idx} className="flex justify-center">
                  <PlayerCard
                    lane={{ 
                      key: laneKey, 
                      label: laneLabel, 
                      icon: laneIcon,
                      isSubstitute: idx >= 5
                    }}
                    player={{ ...player, role, identifier: playerIdentifier }}
                    hero={hero}
                    onClick={() =>
                      onPlayerClick({
                        lane: { 
                          key: laneKey, 
                          label: laneLabel, 
                          icon: laneIcon,
                          isSubstitute: idx >= 5
                        },
                        player: { ...player, role, identifier: playerIdentifier },
                        hero,
                      })
                    }
                    getPlayerPhoto={(name) => getPlayerPhoto(name, role)}
                    teamPlayers={teamPlayers}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Case 9: More than 8 players - Enhanced 2-column layout with scrollable rows
  if (hasMoreThanSixPlayers) {
    return (
      <div className="w-full px-4">
        <div className="flex justify-center">
          <div className="max-w-6xl w-full">
            <div className="grid gap-6 grid-cols-2 w-full">
              <div className="col-span-2 text-center mb-4">
                <div className="text-white text-lg font-semibold bg-gray-800/50 px-4 py-2 rounded-lg inline-block">
                  {playerCount} Players - Scroll to see all players
                </div>
              </div>
            {playersArray.map((player, idx) => {
              // Map player index to proper lane keys for background
              let laneKey = 'sub';
              let laneLabel = `Player ${idx + 1}`;
              let laneIcon = defaultPlayer;
              
              // Map the first 5 players to their standard roles for proper background
              if (idx === 0) {
                laneKey = 'exp';
                laneLabel = 'EXPLANER';
                laneIcon = getLaneIconByRole('exp');
              } else if (idx === 1) {
                laneKey = 'mid';
                laneLabel = 'MID LANER';
                laneIcon = getLaneIconByRole('mid');
              } else if (idx === 2) {
                laneKey = 'jungler';
                laneLabel = 'JUNGLER';
                laneIcon = getLaneIconByRole('jungler');
              } else if (idx === 3) {
                laneKey = 'gold';
                laneLabel = 'GOLD LANER';
                laneIcon = getLaneIconByRole('gold');
              } else if (idx === 4) {
                laneKey = 'roam';
                laneLabel = 'ROAMER';
                laneIcon = getLaneIconByRole('roam');
              } else {
                // For 6th and 7th players, use their actual role if available
                if (player.role) {
                  const actualRole = player.role.toLowerCase();
                  if (actualRole.includes('exp') || actualRole.includes('explane')) {
                    laneKey = 'exp';
                    // Count how many exp players we have so far
                    const expCount = playersArray.slice(0, idx + 1).filter(p => 
                      p.role && p.role.toLowerCase().includes('exp')
                    ).length;
                    laneLabel = expCount === 1 ? 'EXPLANER' : `EXPLANER ${expCount}`;
                  } else if (actualRole.includes('mid') || actualRole.includes('midlane')) {
                    laneKey = 'mid';
                    // Count how many mid players we have so far
                    const midCount = playersArray.slice(0, idx + 1).filter(p => 
                      p.role && p.role.toLowerCase().includes('mid')
                    ).length;
                    laneLabel = midCount === 1 ? 'MID LANER' : `MID LANER ${midCount}`;
                  } else if (actualRole.includes('jungle') || actualRole.includes('jungler')) {
                    laneKey = 'jungler';
                    // Count how many jungler players we have so far
                    const junglerCount = playersArray.slice(0, idx + 1).filter(p => 
                      p.role && p.role.toLowerCase().includes('jungle')
                    ).length;
                    laneLabel = junglerCount === 1 ? 'JUNGLER' : `JUNGLER ${junglerCount}`;
                  } else if (actualRole.includes('gold') || actualRole.includes('marksman')) {
                    laneKey = 'gold';
                    // Count how many gold players we have so far
                    const goldCount = playersArray.slice(0, idx + 1).filter(p => 
                      p.role && p.role.toLowerCase().includes('gold')
                    ).length;
                    laneLabel = goldCount === 1 ? 'GOLD LANER' : `GOLD LANER ${goldCount}`;
                  } else if (actualRole.includes('roam') || actualRole.includes('support')) {
                    laneKey = 'roam';
                    // Count how many roam players we have so far
                    const roamCount = playersArray.slice(0, idx + 1).filter(p => 
                      p.role && p.role.toLowerCase().includes('roam')
                    ).length;
                    laneLabel = roamCount === 1 ? 'ROAMER' : `ROAMER ${roamCount}`;
                  } else {
                    laneKey = 'sub';
                    laneLabel = player.role.toUpperCase();
                  }
                  
                  // Set the lane icon based on the actual role
                  laneIcon = getLaneIconByRole(actualRole);
                }
              }
              
              const role = player.role || laneKey;
              const playerIdentifier = getPlayerIdentifier(player.name, role);
              const hero = getHeroForLaneByLaneKey(role, lanePlayers);

              return (
                <div key={idx} className="flex justify-center">
                  <PlayerCard
                    lane={{ 
                      key: laneKey, 
                      label: laneLabel, 
                      icon: laneIcon,
                      isSubstitute: idx >= 5
                    }}
                    player={{ ...player, role, identifier: playerIdentifier }}
                    hero={hero}
                    onClick={() =>
                      onPlayerClick({
                        lane: { 
                          key: laneKey, 
                          label: laneLabel, 
                          icon: laneIcon,
                          isSubstitute: idx >= 5
                        },
                        player: { ...player, role, identifier: playerIdentifier },
                        hero,
                      })
                    }
                    getPlayerPhoto={(name) => getPlayerPhoto(name, role)}
                    teamPlayers={teamPlayers}
                  />
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for any other case (shouldn't reach here with the current logic)
  return (
    <div className="w-full flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-400 text-sm">Loading players...</p>
      </div>
    </div>
  );
};

export default PlayerGrid; 