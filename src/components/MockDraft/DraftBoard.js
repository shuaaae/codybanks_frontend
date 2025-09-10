import React, { useState, useEffect, useCallback } from 'react';
import bgImg from '../../assets/bg.jpg';
import DraftSlots from './DraftSlots';
import TeamNameInputs from './TeamNameInputs';
import DraftTimer from './DraftTimer';
import HeroGrid from './HeroGrid';
import LoadingScreen from '../../screens/loadingScreen';

export default function DraftBoard({
  currentStep,
  draftSteps,
  draftFinished,
  timer,
  blueTeamName,
  setBlueTeamName,
  redTeamName,
  setRedTeamName,
  bans,
  picks,
  heroList,
  heroLoading,
  selectedType,
  setSelectedType,
  searchTerm,
  setSearchTerm,
  handleHeroSelect,
  isActiveSlot,
  handleHeroRemove,
  handleDraftSlotClick,
  handleDraftSlotEdit,
  isCompleteDraft = false,
  customLaneAssignments,
  onLaneReassign,
  onLaneSwap,
  areAllLanesAssigned = true,
  areLaneAssignmentsValid = true
}) {
  // Normalize picks to ensure consistent hero object structure
  const normalize = (arr = []) => arr.map(x => {
    if (!x) return null;
    // If it's already a string, return it
    if (typeof x === 'string') return x;
    // If it's an object with hero property, return the hero
    if (x.hero) return x.hero;
    // If it's an object with name property, return the name
    if (x.name) return x.name;
    // Otherwise return the object itself
    return x;
  });

  // State for hero rank data and processed picks
  const [heroRankData, setHeroRankData] = useState([]);
  const [processedPicks, setProcessedPicks] = useState({ blue: [], red: [] });

  // Fetch hero rank data from MobaDraft API
  const fetchMLBBHeroData = useCallback(async () => {
    try {
      console.log('Fetching hero data from MobaDraft API...');
      const response = await fetch('https://mobadraft.com/api/heroes', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('MobaDraft API response:', data);
        
        if (data.heroes && Array.isArray(data.heroes)) {
          // Transform the API response to match our expected format
          const transformedData = data.heroes.map(hero => ({
            hero_name: hero[1], // Name is at index 1
            win_rate: hero[2] * 100, // Convert to percentage (0.570238 -> 57.0238)
            pick_rate: hero[4] * 100, // Appearance rate as pick rate
            ban_rate: hero[3] * 100, // Ban rate
            tier: hero[5], // Tier (S, A, B, C, D)
            score: hero[6], // Score
            roles: hero[7], // Roles array
            image_url: hero[8] // Image URL
          }));
          
          console.log('Successfully fetched and transformed hero data from MobaDraft API');
          return transformedData;
        }
      }
      
      console.log('MobaDraft API failed, using fallback data');
      return [];
    } catch (error) {
      console.error('Error fetching hero data:', error);
      return [];
    }
  }, []);

  // Hero name normalization function to handle different naming conventions
  const normalizeHeroName = useCallback((name) => {
    if (!name) return '';
    
    // Convert to lowercase and handle common variations
    let normalized = name.toLowerCase().trim();
    
    // Handle specific hero name variations
    const nameMappings = {
      'chang_e': 'chang\'e',
      'chang\'e': 'chang\'e',
      'chang e': 'chang\'e',
      'chang-e': 'chang\'e',
      'chang e': 'chang\'e'
    };
    
    return nameMappings[normalized] || normalized;
  }, []);

  // Process team picks with winrate data
  const processTeamPicks = useCallback((teamPicks, heroRankData) => {
    return teamPicks.map(heroPick => {
      const hero = heroPick.hero || heroPick;
      
      if (!hero || !hero.name) {
        return { hero, winrate: 0, heroData: null };
      }
      
      // Normalize hero name for better matching
      const normalizedHeroName = normalizeHeroName(hero.name);
      
      // Find rank data by hero name - try multiple matching strategies
      let rankData = heroRankData.find(h => h.hero_name === hero.name);
      if (!rankData) {
        rankData = heroRankData.find(h => h.hero_name.toLowerCase() === hero.name.toLowerCase());
      }
      if (!rankData) {
        rankData = heroRankData.find(h => h.hero_name === normalizedHeroName);
      }
      if (!rankData) {
        rankData = heroRankData.find(h => h.hero_name.toLowerCase() === normalizedHeroName.toLowerCase());
      }
      if (!rankData) {
        // Try partial matching for names with special characters
        rankData = heroRankData.find(h => 
          h.hero_name.toLowerCase().replace(/[^a-z0-9]/g, '') === 
          hero.name.toLowerCase().replace(/[^a-z0-9]/g, '')
        );
      }
      
      return {
        hero,
        winrate: rankData ? rankData.win_rate : 0,
        heroData: rankData
      };
    });
  }, [normalizeHeroName]);

  // Fetch hero data and process picks when draft is finished
  useEffect(() => {
    if (draftFinished && heroRankData.length === 0) {
      fetchMLBBHeroData().then(data => {
        setHeroRankData(data);
      });
    }
  }, [draftFinished, heroRankData.length, fetchMLBBHeroData]);

  // Process picks when hero data is available
  useEffect(() => {
    if (heroRankData.length > 0 && draftFinished) {
      const blueProcessed = processTeamPicks(picks.blue, heroRankData);
      const redProcessed = processTeamPicks(picks.red, heroRankData);
      setProcessedPicks({ blue: blueProcessed, red: redProcessed });
    }
  }, [heroRankData, picks, draftFinished, processTeamPicks]);

  // Show loading screen when heroes are still loading
  if (heroLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="draft-screenshot-area">
      <div className="draft-container flex flex-col items-center justify-center">
        <div
          id="draft-capture-root"
          className="relative w-[1200px] h-[650px] rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl"
          style={{
            backgroundImage: `url(${bgImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            marginTop: 40,
          }}
        >
          {/* Structured Top Ban Slots */}
          <div className="absolute left-0 right-0 top-0 flex flex-row justify-center items-start w-full pt-8 z-30">
            <div className="container flex flex-row justify-between items-start w-full" style={{ width: '100%' }}>
              {/* Blue team name input */}
              <div className="flex flex-col items-start pl-2" style={{ position: 'relative' }}>
                {!isCompleteDraft && (
                  <TeamNameInputs
                    blueTeamName={blueTeamName}
                    setBlueTeamName={setBlueTeamName}
                    redTeamName={redTeamName}
                    setRedTeamName={setRedTeamName}
                  />
                )}
                <div id="left-container" className="box flex flex-row gap-2" style={{ marginTop: 0 }}>
                  <DraftSlots 
                    type="ban" 
                    team="blue" 
                    heroes={bans.blue} 
                    size="w-12 h-12" 
                    isActiveSlot={isActiveSlot}
                    handleHeroRemove={handleHeroRemove}
                    handleDraftSlotClick={handleDraftSlotClick}
                    handleDraftSlotEdit={handleDraftSlotEdit}
                    isCompleteDraft={isCompleteDraft}
                    customLaneAssignments={customLaneAssignments}
                    onLaneSwap={onLaneSwap}
                    heroList={heroList}
                  />
                </div>
              </div>
              <div className="middle-content flex-1 flex flex-col items-center justify-center" style={{ minWidth: 220 }}>
                {!isCompleteDraft && (
                  <DraftTimer
                    currentStep={currentStep}
                    draftFinished={draftFinished}
                    draftSteps={draftSteps}
                    timer={timer}
                    areAllLanesAssigned={areAllLanesAssigned}
                    areLaneAssignmentsValid={areLaneAssignmentsValid}
                  />
                )}
              </div>
              {/* Red team name input */}
              <div className="flex flex-col items-end pr-2" style={{ position: 'relative' }}>
                {!isCompleteDraft && (
                  <input
                    id="red-team-name"
                    type="text"
                    value={redTeamName}
                    onChange={e => setRedTeamName(e.target.value)}
                    placeholder="Team Red"
                    className="px-3 py-1 rounded bg-red-700 text-white font-bold text-lg text-right mb-2 pr-2 w-32 focus:outline-none focus:ring-2 focus:ring-red-400"
                    maxLength={20}
                    style={{ zIndex: 2, position: 'relative' }}
                  />
                )}
                <div id="right-container" className="box flex flex-row gap-2" style={{ marginTop: 0 }}>
                  <DraftSlots 
                    type="ban" 
                    team="red" 
                    heroes={bans.red} 
                    size="w-12 h-12" 
                    isActiveSlot={isActiveSlot}
                    handleHeroRemove={handleHeroRemove}
                    handleDraftSlotClick={handleDraftSlotClick}
                    handleDraftSlotEdit={handleDraftSlotEdit}
                    isCompleteDraft={isCompleteDraft}
                    customLaneAssignments={customLaneAssignments}
                    onLaneSwap={onLaneSwap}
                    heroList={heroList}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Blue side pick slots (left) */}
          <div className="absolute left-0 flex flex-col gap-y-3" style={{ top: '140px' }}>
            <DraftSlots 
              type="pick" 
              team="blue" 
              heroes={normalize(picks.blue)} 
              size="w-16 h-16" 
              isActiveSlot={isActiveSlot}
              handleHeroRemove={handleHeroRemove}
              handleDraftSlotClick={handleDraftSlotClick}
              handleDraftSlotEdit={handleDraftSlotEdit}
              isCompleteDraft={isCompleteDraft}
              customLaneAssignments={customLaneAssignments}
              onLaneSwap={onLaneSwap}
              heroList={heroList}
            />
          </div>
          {/* Red side pick slots (right) */}
          <div className="absolute right-0 flex flex-col gap-y-3" style={{ top: '140px' }}>
            <DraftSlots 
              type="pick" 
              team="red" 
              heroes={normalize(picks.red)} 
              size="w-16 h-16" 
              isActiveSlot={isActiveSlot}
              handleHeroRemove={handleHeroRemove}
              handleDraftSlotClick={handleDraftSlotClick}
              handleDraftSlotEdit={handleDraftSlotEdit}
              isCompleteDraft={isCompleteDraft}
              customLaneAssignments={customLaneAssignments}
              onLaneSwap={onLaneSwap}
              heroList={heroList}
            />
          </div>
          {/* Inner Panel - Fixed duplicate margins */}
          {!draftFinished ? (
            <div className="relative w-[900px] h-[480px] rounded-2xl bg-gradient-to-br from-[#181A20cc] via-[#23232acc] to-[#181A20cc] flex flex-col items-center justify-start pt-8 z-20 mt-24 overflow-y-auto">
              <HeroGrid
                heroList={heroList}
                heroLoading={heroLoading}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                handleHeroSelect={handleHeroSelect}
                currentStep={currentStep}
                draftSteps={draftSteps}
                bans={bans}
                picks={picks}
                areAllLanesAssigned={areAllLanesAssigned}
                areLaneAssignmentsValid={areLaneAssignmentsValid}
              />
            </div>
          ) : (
            /* Draft Analysis Preview - Transparent Background */
            <div className="relative w-full h-full flex flex-col items-center justify-center z-20 mt-8">
              {/* Loading State or Team Advantage Header */}
              <div className="text-center mb-6">
                {heroRankData.length === 0 ? (
                  /* Loading State */
                  <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                    <h2 className="text-2xl font-bold text-white">Analyzing Draft</h2>
                    <p className="text-gray-300">Fetching hero win rates and meta data...</p>
                  </div>
                ) : (
                  /* Team Advantage Header */
                  (() => {
                    const blueTotalWinrate = processedPicks.blue.length > 0 ? 
                      processedPicks.blue.reduce((sum, pickData) => sum + (pickData.winrate || 0), 0) / processedPicks.blue.length : 0;
                    const redTotalWinrate = processedPicks.red.length > 0 ? 
                      processedPicks.red.reduce((sum, pickData) => sum + (pickData.winrate || 0), 0) / processedPicks.red.length : 0;
                    
                    const advantage = blueTotalWinrate > redTotalWinrate ? 'blue' : 
                                    redTotalWinrate > blueTotalWinrate ? 'red' : 'balanced';
                    const difference = Math.abs(blueTotalWinrate - redTotalWinrate);
                    
                    if (advantage === 'balanced') {
                      return (
                        <h2 className="text-3xl font-bold text-gray-300">Teams are evenly matched</h2>
                      );
                    } else {
                      const teamName = advantage === 'blue' ? 'Blue' : 'Red';
                      const teamColor = advantage === 'blue' ? 'text-blue-400' : 'text-red-400';
                      return (
                        <h2 className={`text-3xl font-bold ${teamColor}`}>
                          {teamName} Team Advantage (+{difference.toFixed(2)}%)
                        </h2>
                      );
                    }
                  })()
                )}
              </div>
              
              {/* Team Analysis Tables */}
              {heroRankData.length === 0 ? (
                /* Loading State for Tables */
                <div className="flex justify-center gap-8 w-full max-w-5xl">
                  <div className="flex-1 max-w-md">
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-blue-500/30">
                      <h3 className="text-xl font-semibold text-blue-400 mb-4 text-center">{blueTeamName || 'Blue Team'}</h3>
                      <div className="space-y-2">
                        {picks.blue.map((hero, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-800/40">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                                <span className="text-blue-400 text-xs font-bold">
                                  {customLaneAssignments.blue[index]?.charAt(0) || '?'}
                                </span>
                              </div>
                              <span className="text-white font-medium">{hero?.name || 'Empty'}</span>
                            </div>
                            <div className="text-gray-400 text-sm">Loading...</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-600/50">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">Total Winrate:</span>
                          <span className="text-gray-400 text-lg">Loading...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 max-w-md">
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-red-500/30">
                      <h3 className="text-xl font-semibold text-red-400 mb-4 text-center">{redTeamName || 'Red Team'}</h3>
                      <div className="space-y-2">
                        {picks.red.map((hero, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-800/40">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center">
                                <span className="text-red-400 text-xs font-bold">
                                  {customLaneAssignments.red[index]?.charAt(0) || '?'}
                                </span>
                              </div>
                              <span className="text-white font-medium">{hero?.name || 'Empty'}</span>
                            </div>
                            <div className="text-gray-400 text-sm">Loading...</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-600/50">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">Total Winrate:</span>
                          <span className="text-gray-400 text-lg">Loading...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Actual Team Tables with Data */
                <div className="flex justify-center gap-8 w-full max-w-5xl">
                  {/* {blueTeamName || 'Blue Team'} Table */}
                  <div className="flex-1 max-w-md">
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-blue-500/30">
                      <h3 className="text-xl font-semibold text-blue-400 mb-4 text-center">{blueTeamName || 'Blue Team'}</h3>
                      <div className="space-y-2">
                        {processedPicks.blue.map((pickData, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-800/40 hover:bg-gray-700/40 transition-colors">
                            <div className="flex items-center space-x-3">
                              {/* Hero Image */}
                              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-blue-500/50">
                                {pickData.hero?.name ? (
                                  <img
                                    src={`${process.env.REACT_APP_API_URL || 'https://api.coachdatastatistics.site'}/api/hero-image/${pickData.hero.role?.trim().toLowerCase()}/${encodeURIComponent(pickData.hero.image || pickData.hero.name + '.webp')}`}
                                    alt={pickData.hero.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      console.log(`Failed to load image for ${pickData.hero.name}:`, e.target.src);
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div className="w-full h-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold" style={{ display: pickData.hero?.name ? 'none' : 'flex' }}>
                                  {customLaneAssignments.blue[index]?.charAt(0) || '?'}
                                </div>
                              </div>
                              <span className="text-white font-medium">{pickData.hero?.name || 'Empty'}</span>
                            </div>
                            <div className="text-blue-400 font-semibold">
                              {pickData.winrate ? `${pickData.winrate.toFixed(2)}%` : 'N/A'}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-600/50">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">Total Winrate:</span>
                          <span className="text-blue-400 font-bold text-lg">
                            {processedPicks.blue.length > 0 ? 
                              (processedPicks.blue.reduce((sum, pickData) => sum + (pickData.winrate || 0), 0) / processedPicks.blue.length).toFixed(2) + '%' : 
                              'N/A'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* {redTeamName || 'Red Team'} Table */}
                  <div className="flex-1 max-w-md">
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-red-500/30">
                      <h3 className="text-xl font-semibold text-red-400 mb-4 text-center">{redTeamName || 'Red Team'}</h3>
                      <div className="space-y-2">
                        {processedPicks.red.map((pickData, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-800/40 hover:bg-gray-700/40 transition-colors">
                            <div className="flex items-center space-x-3">
                              {/* Hero Image */}
                              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-red-500/50">
                                {pickData.hero?.name ? (
                                  <img
                                    src={`${process.env.REACT_APP_API_URL || 'https://api.coachdatastatistics.site'}/api/hero-image/${pickData.hero.role?.trim().toLowerCase()}/${encodeURIComponent(pickData.hero.image || pickData.hero.name + '.webp')}`}
                                    alt={pickData.hero.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      console.log(`Failed to load image for ${pickData.hero.name}:`, e.target.src);
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div className="w-full h-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold" style={{ display: pickData.hero?.name ? 'none' : 'flex' }}>
                                  {customLaneAssignments.red[index]?.charAt(0) || '?'}
                                </div>
                              </div>
                              <span className="text-white font-medium">{pickData.hero?.name || 'Empty'}</span>
                            </div>
                            <div className="text-red-400 font-semibold">
                              {pickData.winrate ? `${pickData.winrate.toFixed(2)}%` : 'N/A'}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-600/50">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">Total Winrate:</span>
                          <span className="text-red-400 font-bold text-lg">
                            {processedPicks.red.length > 0 ? 
                              (processedPicks.red.reduce((sum, pickData) => sum + (pickData.winrate || 0), 0) / processedPicks.red.length).toFixed(2) + '%' : 
                              'N/A'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 