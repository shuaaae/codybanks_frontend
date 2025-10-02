import React, { useState, useEffect } from 'react';
import navbarBg from '../assets/navbarbackground.jpg';
import PageTitle from '../components/PageTitle';
import Header from '../components/Header';
import ProfileModal from '../components/ProfileModal';
import userService from '../utils/userService';

const TierListPage = () => {
  const [heroes, setHeroes] = useState([]);
  const [tierData, setTierData] = useState({});
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMode, setSelectedMode] = useState('ranked');
  const [selectedRole, setSelectedRole] = useState('all');
  const [hoveredHero, setHoveredHero] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [heroStats, setHeroStats] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);


  const roles = [
    { name: 'Tank', icon: 'https://mobadraft.com/tank-icon.png' },
    { name: 'Fighter', icon: 'https://mobadraft.com/fighter-icon.png' },
    { name: 'Marksman', icon: 'https://mobadraft.com/marksman-icon.png' },
    { name: 'Assassin', icon: 'https://mobadraft.com/assasin-icon.png' },
    { name: 'Mage', icon: 'https://mobadraft.com/mage-icon.png' },
    { name: 'Support', icon: 'https://mobadraft.com/support-icon.png' }
  ];

  // Load current user on component mount
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        // Try to get user from localStorage first
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
        } else {
          // Fallback to API call if available
          if (userService.getCurrentUser) {
            const result = await userService.getCurrentUser();
            if (result.success) {
              setCurrentUser(result.user);
            }
          }
        }
      } catch (error) {
        console.error('Error loading current user:', error);
        // Set a default user if all else fails
        setCurrentUser({
          name: 'User',
          email: 'user@example.com',
          username: 'user'
        });
      }
    };

    loadCurrentUser();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedMode]);

  // Handle scroll effect for header visibility
  useEffect(() => {
    const scrollContainer = document.querySelector('main');
    
    const handleScroll = () => {
      if (!scrollContainer) return;
      
      const currentScrollY = scrollContainer.scrollTop;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past 100px - hide header
        setIsHeaderVisible(false);
      } else {
        // Scrolling up or at top - show header
        setIsHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [lastScrollY]);

  // Logout handler
  const handleLogout = async () => {
    try {
      await userService.logout();
      setCurrentUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch heroes, tier list, and hero statistics from Mobadraft API based on selected mode
      const [heroesResponse, tierListResponse, statsResponse] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL || 'https://api.coachdatastatistics.site'}/api/heroes`),
        fetch(`${process.env.REACT_APP_API_URL || 'https://api.coachdatastatistics.site'}/api/mobadraft/tier-list?mode=${selectedMode}`),
        fetch(`${process.env.REACT_APP_API_URL || 'https://api.coachdatastatistics.site'}/api/mobadraft/heroes?mode=${selectedMode}`)
      ]);

      // Process heroes data
      if (heroesResponse.ok) {
        const heroesData = await heroesResponse.json();
        setHeroes(heroesData);
      }

      // Process tier list data
      let tierListData = null;
      if (tierListResponse.ok) {
        tierListData = await tierListResponse.json();
        console.log(`Tier list data for ${selectedMode}:`, tierListData);
        if (tierListData.success && tierListData.data) {
          const heroesByTier = tierListData.data.tiers || {
            S: [],
            A: [],
            B: [],
            C: [],
            D: []
          };
          console.log(`Processed tiers for ${selectedMode}:`, heroesByTier);
          console.log(`Tier counts - S: ${heroesByTier.S.length}, A: ${heroesByTier.A.length}, B: ${heroesByTier.B.length}, C: ${heroesByTier.C.length}, D: ${heroesByTier.D.length}`);
          setTierData(heroesByTier);
        } else {
          console.error('Tier list data structure issue:', tierListData);
          setError('Failed to process tier list data from API');
        }
      } else {
        console.error('Tier list API error:', tierListResponse.status, tierListResponse.statusText);
        setError('Failed to fetch tier list data from API');
      }

      // Process hero statistics data
      let statsData = null;
      if (statsResponse.ok) {
        statsData = await statsResponse.json();
        console.log(`Hero statistics data for ${selectedMode}:`, statsData);
        
        // Handle different data structures for ranked vs esports
        let heroesArray = null;
        if (statsData.success && statsData.data) {
          if (selectedMode === 'esports' && statsData.data.statistics) {
            // Esports mode uses 'statistics' array
            heroesArray = statsData.data.statistics;
            console.log(`Using statistics array for esports: ${heroesArray.length} heroes`);
          } else if (statsData.data.heroes) {
            // Ranked mode uses 'heroes' array
            heroesArray = statsData.data.heroes;
            console.log(`Using heroes array for ${selectedMode}: ${heroesArray.length} heroes`);
          }
        }
        
        if (heroesArray && Array.isArray(heroesArray)) {
          const processedStats = {};
          
          console.log(`Processing ${heroesArray.length} heroes for ${selectedMode}`);
          console.log('Sample hero data:', heroesArray[0]);
          
          heroesArray.forEach((hero, index) => {
            if (hero && hero.length >= 6) {
              const [id, name, winRate, banRate, pickRate, image, tier, score, roles, lanes, history] = hero;
              
              // Store statistics
              processedStats[name] = {
                winRate: (winRate * 100).toFixed(1),
                pickRate: (pickRate * 100).toFixed(1),
                banRate: (banRate * 100).toFixed(1),
                tier: tier,
                score: score,
                roles: roles,
                lanes: lanes
              };
            } else if (hero && typeof hero === 'object' && !Array.isArray(hero)) {
              // Handle object structure instead of array
              console.log(`Processing object hero at index ${index}:`, hero);
              const name = hero.name || hero.hero_name || hero.heroName;
              const winRate = hero.win_rate || hero.winRate || hero.winrate || 0;
              const pickRate = hero.pick_rate || hero.pickRate || hero.pickrate || 0;
              const banRate = hero.ban_rate || hero.banRate || hero.banrate || 0;
              const tier = hero.tier || hero.tier_rank || hero.tierRank || 'D';
              
              if (name) {
                processedStats[name] = {
                  winRate: (winRate * 100).toFixed(1),
                  pickRate: (pickRate * 100).toFixed(1),
                  banRate: (banRate * 100).toFixed(1),
                  tier: tier,
                  score: hero.score || 0,
                  roles: hero.roles || [],
                  lanes: hero.lanes || []
                };
              }
            } else {
              console.warn(`Invalid hero data at index ${index}:`, hero);
            }
          });

          console.log(`Processed hero stats for ${selectedMode}:`, Object.keys(processedStats).length, 'heroes');
          console.log('Sample processed stats:', Object.keys(processedStats).slice(0, 3));
          setHeroStats(processedStats);
        } else {
          console.warn(`No hero statistics data available for ${selectedMode}:`, statsData);
        }
      } else {
        console.warn(`Failed to fetch hero statistics data for ${selectedMode}:`, statsResponse.status, statsResponse.statusText);
      }

      // Set last updated time
      if (tierListResponse.ok && tierListData && tierListData.success && tierListData.data && tierListData.data.last_updated) {
        setLastUpdated(new Date(tierListData.data.last_updated).toLocaleDateString());
      } else if (statsResponse.ok && statsData && statsData.success && statsData.data && statsData.data.last_updated) {
        setLastUpdated(new Date(statsData.data.last_updated).toLocaleDateString());
      } else {
        setLastUpdated(new Date().toLocaleDateString());
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data from API');
    } finally {
      setLoading(false);
    }
  };

  const getHeroByName = (heroName) => {
    // Normalize hero name for better matching
    const normalizedName = heroName.replace(/'/g, '_').replace(/\s+/g, '_');
    
    // Try exact match first
    let hero = heroes.find(hero => hero.name === heroName);
    
    // If not found, try normalized name
    if (!hero) {
      hero = heroes.find(hero => 
        hero.name.replace(/'/g, '_').replace(/\s+/g, '_') === normalizedName ||
        hero.name === normalizedName
      );
    }
    
    // If still not found, try case-insensitive match
    if (!hero) {
      hero = heroes.find(hero => 
        hero.name.toLowerCase() === heroName.toLowerCase() ||
        hero.name.toLowerCase().replace(/'/g, '_') === heroName.toLowerCase().replace(/'/g, '_')
      );
    }
    
    return hero || { 
      name: heroName, 
      role: 'Unknown', 
      image: 'default.webp' 
    };
  };

  const getFilteredHeroes = (tier) => {
    let tierHeroes = tierData[tier] || [];
    
    if (selectedRole !== 'all') {
      tierHeroes = tierHeroes.filter(heroName => {
        const hero = getHeroByName(heroName);
        return hero.role?.toLowerCase() === selectedRole.toLowerCase();
      });
    }
    
    return tierHeroes;
  };

  // Get real hero statistics from API data
  const getHeroStats = (heroName) => {
    // Check if we have real data for this hero
    if (heroStats[heroName]) {
      return {
        winRate: heroStats[heroName].winRate,
        pickRate: heroStats[heroName].pickRate,
        banRate: heroStats[heroName].banRate
      };
    }
    
    // Return default values if no data available
    return {
      winRate: '0.0',
      pickRate: '0.0',
      banRate: '0.0'
    };
  };

  // Handle mouse events for tooltip
  const handleMouseEnter = (heroName, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredHero(heroName);
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleMouseLeave = () => {
    setHoveredHero(null);
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'S': return 'from-red-600 to-red-800';
      case 'A': return 'from-orange-500 to-orange-700';
      case 'B': return 'from-green-600 to-green-800';
      case 'C': return 'from-lime-500 to-lime-700';
      case 'D': return 'from-blue-500 to-blue-700';
      default: return 'from-gray-600 to-gray-800';
    }
  };


  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${navbarBg}) center/cover, #181A20` }}>
      <PageTitle title="Hero Tier List" />
      
       {/* Header Component */}
       <div 
         className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
           isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
         }`}
       >
         <Header 
           currentUser={currentUser}
           onLogout={handleLogout}
           onShowProfile={() => setShowProfileModal(true)}
           currentMode="scrim"
         />
       </div>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto" style={{ marginTop: 80, paddingTop: 0 }}>
        <div className="flex flex-col items-center px-2 min-h-full">
          <div className="w-[1600px] max-w-[95vw] mx-auto p-2 rounded-2xl" style={{ background: '#23232a', boxShadow: '0 4px 24px 0 rgba(0,0,0,0.25)', border: '1px solid #23283a', marginTop: 0 }}>
            
            {/* Mode Selection and Filters */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-white">Hero Tier List</h1>
                
                 {/* Mode Selection */}
                 <div className="flex space-x-2">
                   <button
                     onClick={() => setSelectedMode('ranked')}
                     disabled={loading}
                     className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                       selectedMode === 'ranked'
                         ? 'bg-blue-600 text-white'
                         : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                     } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                   >
                     {loading && selectedMode === 'ranked' ? 'Loading...' : 'Ranked'}
                   </button>
                   <button
                     onClick={() => setSelectedMode('esports')}
                     disabled={loading}
                     className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                       selectedMode === 'esports'
                         ? 'bg-blue-600 text-white'
                         : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                     } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                   >
                     {loading && selectedMode === 'esports' ? 'Loading...' : 'Esports'}
                   </button>
                 </div>
              </div>

              {/* Role Filter */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div>
                    <h3 className="text-white text-sm font-semibold mb-2">Roles</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedRole('all')}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                          selectedRole === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        All
                      </button>
                      {roles.map(role => (
                        <button
                          key={role.name}
                          onClick={() => setSelectedRole(role.name)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            selectedRole === role.name
                              ? 'bg-blue-600 ring-2 ring-blue-400'
                              : 'bg-gray-700 hover:bg-gray-600'
                          }`}
                          title={role.name}
                        >
                          <img
                            src={role.icon}
                            alt={role.name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <span className="text-xs font-bold text-white hidden">
                            {role.name.charAt(0)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                 {/* Last Updated & Error */}
                 <div className="text-right">
                   <div className="flex items-center justify-end space-x-2 mb-1">
                     <span className="text-blue-400 text-sm font-semibold capitalize">
                       {selectedMode} Mode
                     </span>
                   </div>
                   {lastUpdated && (
                     <p className="text-gray-400 text-sm">
                       Last updated: {lastUpdated}
                     </p>
                   )}
                   {error && (
                     <p className="text-yellow-400 text-sm mt-1">
                       {error}
                     </p>
                   )}
                 </div>
              </div>
            </div>

            {/* Tier List Content */}
            <div className="text-white">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-white">Loading heroes...</div>
          </div>
        ) : (
           <div className="space-y-4">
            {['S', 'A', 'B', 'C', 'D'].map(tier => {
              const tierHeroes = getFilteredHeroes(tier);
              if (tierHeroes.length === 0) return null;

              return (
                 <div key={tier} className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <div className={`bg-gradient-to-r ${getTierColor(tier)} text-white px-6 py-3 rounded-lg font-bold text-xl`}>
                      {tier} Tier
                    </div>
                    <span className="text-gray-400 text-sm">
                      {tierHeroes.length} hero{tierHeroes.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                   <div className="grid grid-cols-10 gap-1">
                    {tierHeroes.map(heroName => {
                      const hero = getHeroByName(heroName);
                      return (
                        <div 
                          key={heroName} 
                          className="flex flex-col items-center group cursor-pointer"
                          onMouseEnter={(e) => handleMouseEnter(heroName, e)}
                          onMouseLeave={handleMouseLeave}
                        >
                           <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-b from-gray-700 to-gray-800 border-2 border-gray-600 hover:border-blue-400 transition-all duration-200 shadow-lg">
                            <img
                              src={`${process.env.REACT_APP_API_URL || 'https://api.coachdatastatistics.site'}/api/hero-image/${hero.role?.trim().toLowerCase()}/${encodeURIComponent(hero.image)}`}
                              alt={hero.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log(`Failed to load image for ${hero.name}:`, e.target.src);
                                e.target.src = `https://api.coachdatastatistics.site/heroes/${hero.role?.trim().toLowerCase()}/${hero.image}`;
                              }}
                            />
                          </div>
                           <span className="text-white text-xs font-semibold text-center mt-1 w-14 truncate group-hover:text-blue-400 transition-colors">
                            {hero.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            </div>
          )}
            </div>
          </div>
        </div>
      </main>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={currentUser}
        onUserUpdate={(updatedUser) => {
          setCurrentUser(updatedUser);
        }}
      />

      {/* Hero Statistics Tooltip */}
      {hoveredHero && (
        <div
          className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 min-w-[200px]"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          <div className="text-white">
            <div className="font-bold text-lg mb-3 text-center">{hoveredHero}</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-gray-300">Win Rate:</span>
                </div>
                <span className="text-white font-semibold">{getHeroStats(hoveredHero).winRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">★</span>
                  </div>
                  <span className="text-gray-300">Pick Rate:</span>
                </div>
                <span className="text-white font-semibold">{getHeroStats(hoveredHero).pickRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✕</span>
                  </div>
                  <span className="text-gray-300">Ban Rate:</span>
                </div>
                <span className="text-white font-semibold">{getHeroStats(hoveredHero).banRate}%</span>
              </div>
            </div>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default TierListPage;
