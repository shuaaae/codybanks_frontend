import React, { useState, useEffect, useMemo } from 'react';
import { FaSort, FaSortUp, FaSortDown, FaSearch, FaFilter, FaTrophy, FaBan, FaHandPaper, FaTimes } from 'react-icons/fa';

const HeroStats = ({ isOpen, onClose, matches = [] }) => {
  // Get current team from localStorage
  const getCurrentTeam = () => {
    try {
      const latestTeam = JSON.parse(localStorage.getItem('latestTeam'));
      return latestTeam?.teamName || 'Unknown Team';
    } catch (error) {
      console.error('Error parsing latestTeam from localStorage:', error);
      return 'Unknown Team';
    }
  };

  const currentTeam = getCurrentTeam();
  const [sortConfig, setSortConfig] = useState({ key: 'pick', direction: 'desc' }); // Default sort by picks descending
  const [heroList, setHeroList] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  
  // New state for enhanced features
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [showOnlyUsedHeroes, setShowOnlyUsedHeroes] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'top', 'used'

  // Load heroes data
  useEffect(() => {
    const loadHeroes = async () => {
      try {
        const response = await fetch('/public/api/heroes');
        const data = await response.json();
        setHeroList(data);
      } catch (error) {
        console.error('Error loading heroes:', error);
      }
    };

    if (isOpen) {
      loadHeroes();
    }
  }, [isOpen]);

  // Calculate team winrate
  const teamWinrate = useMemo(() => {
    if (!matches || matches.length === 0) return { wins: 0, total: 0, rate: 0 };

    // Filter matches for selected month
    const monthlyMatches = matches.filter(match => {
      const matchDate = new Date(match.match_date);
      const matchMonth = `${matchDate.getFullYear()}-${String(matchDate.getMonth() + 1).padStart(2, '0')}`;
      return matchMonth === selectedMonth;
    });

    let teamWins = 0;
    let teamTotal = 0;

    monthlyMatches.forEach(match => {
      // Check if current team participated in this match
      const teamParticipated = match.teams.some(team => team.team === currentTeam);
      
      if (teamParticipated) {
        teamTotal++;
        if (match.winner === currentTeam) {
          teamWins++;
        }
      }
    });

    const winrate = teamTotal > 0 ? ((teamWins / teamTotal) * 100).toFixed(1) : 0;
    
    return {
      wins: teamWins,
      total: teamTotal,
      rate: winrate
    };
  }, [matches, selectedMonth, currentTeam]);

  // Calculate hero statistics from matches data
  const heroStats = useMemo(() => {
    if (!matches || matches.length === 0) return [];

    const stats = {};
    
    // Filter matches for selected month
    const monthlyMatches = matches.filter(match => {
      const matchDate = new Date(match.match_date);
      const matchMonth = `${matchDate.getFullYear()}-${String(matchDate.getMonth() + 1).padStart(2, '0')}`;
      return matchMonth === selectedMonth;
    });
    
    const totalMatches = monthlyMatches.length;

    // Initialize stats for all heroes
    heroList.forEach(hero => {
      stats[hero.name] = {
        hero: hero.name,
        heroImage: `/public/heroes/${hero.role?.trim().toLowerCase()}/${hero.image.replace('.png', '.webp')}`,
        heroRole: hero.role,
        pick: 0,
        ban: 0,
        win: 0,
        pickRate: 0,
        banRate: 0,
        winRate: 0
      };
    });

    // Process each match
    monthlyMatches.forEach(match => {
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
          const heroName = typeof pick === 'string' ? pick : pick.hero;
          if (heroName && stats[heroName]) {
            stats[heroName].pick++;
            if (isWinningTeam) {
              stats[heroName].win++;
            }
          }
        });
        
        // Count bans
        const allBans = [
          ...(team.banning_phase1 || []),
          ...(team.banning_phase2 || [])
        ];
        
        allBans.forEach(ban => {
          if (ban && stats[ban]) {
            stats[ban].ban++;
          }
        });
      });
    });

    // Calculate rates
    Object.values(stats).forEach(hero => {
      hero.pickRate = totalMatches > 0 ? ((hero.pick / (totalMatches * 10)) * 100).toFixed(1) : 0;
      hero.banRate = totalMatches > 0 ? ((hero.ban / (totalMatches * 10)) * 100).toFixed(1) : 0;
      hero.winRate = hero.pick > 0 ? ((hero.win / hero.pick) * 100).toFixed(1) : 0;
    });

    return Object.values(stats);
  }, [matches, heroList, selectedMonth]);

  // Filter and sort data
  const filteredAndSortedStats = useMemo(() => {
    let filtered = [...heroStats];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(hero => 
        hero.hero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hero.heroRole.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (selectedRole !== 'All') {
      filtered = filtered.filter(hero => hero.heroRole === selectedRole);
    }

    // Apply "used heroes only" filter
    if (showOnlyUsedHeroes) {
      filtered = filtered.filter(hero => hero.pick > 0 || hero.ban > 0);
    }

    // Apply view mode filter
    if (viewMode === 'top') {
      // Show top 20 heroes by pick rate
      filtered = filtered.filter(hero => parseFloat(hero.pickRate) > 0);
      filtered = filtered.sort((a, b) => parseFloat(b.pickRate) - parseFloat(a.pickRate));
      filtered = filtered.slice(0, 20);
    } else if (viewMode === 'used') {
      // Show only heroes that were picked or banned
      filtered = filtered.filter(hero => hero.pick > 0 || hero.ban > 0);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      // Convert to numbers for numeric sorting
      if (['pick', 'ban', 'win', 'pickRate', 'banRate', 'winRate'].includes(sortConfig.key)) {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [heroStats, searchTerm, selectedRole, showOnlyUsedHeroes, viewMode, sortConfig]);

  // Get unique roles for filter
  const uniqueRoles = useMemo(() => {
    const roles = [...new Set(heroList.map(hero => hero.role))];
    return ['All', ...roles.sort()];
  }, [heroList]);

  // Sort function
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-400" />;
    return sortConfig.direction === 'asc' ? 
      <FaSortUp className="text-blue-400" /> : 
      <FaSortDown className="text-blue-400" />;
  };

  // Get performance indicator color
  const getPerformanceColor = (value, type) => {
    const numValue = parseFloat(value);
    if (type === 'winRate') {
      if (numValue >= 60) return 'text-green-400';
      if (numValue >= 50) return 'text-yellow-400';
      return 'text-red-400';
    }
    if (type === 'pickRate' || type === 'banRate') {
      if (numValue >= 10) return 'text-green-400';
      if (numValue >= 5) return 'text-yellow-400';
      return 'text-gray-400';
    }
    return 'text-white';
  };

  // Get performance indicator
  const getPerformanceIndicator = (hero) => {
    const pickRate = parseFloat(hero.pickRate);
    const winRate = parseFloat(hero.winRate);
    
    if (pickRate > 0 && winRate >= 60) return <FaTrophy className="text-yellow-400 text-xs" />;
    if (pickRate > 0) return <FaHandPaper className="text-blue-400 text-xs" />;
    if (parseFloat(hero.banRate) > 0) return <FaBan className="text-red-400 text-xs" />;
    return null;
  };

     // Close month picker when clicking outside
   useEffect(() => {
     const handleClickOutside = (event) => {
       if (showMonthPicker && !event.target.closest('.month-picker-container')) {
         setShowMonthPicker(false);
       }
     };

     document.addEventListener('mousedown', handleClickOutside);
     return () => {
       document.removeEventListener('mousedown', handleClickOutside);
     };
   }, [showMonthPicker]);

   // Close modal when clicking outside
   useEffect(() => {
     const handleModalClickOutside = (event) => {
       if (isOpen && !event.target.closest('.modal-box')) {
         onClose();
       }
     };

     document.addEventListener('mousedown', handleModalClickOutside);
     return () => {
       document.removeEventListener('mousedown', handleModalClickOutside);
     };
   }, [isOpen, onClose]);

  if (!isOpen) return null;

     return (
     <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80 animate-fadeIn">
       <div className="modal-box w-full max-w-7xl bg-[#23232a] rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-hidden animate-slideIn relative">
         {/* Close Button - X Icon */}
         <button
           onClick={onClose}
           className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-20"
         >
           <FaTimes className="w-6 h-6" />
         </button>

         {/* Header */}
         <div className="flex justify-center items-center mb-6">
           <h2 className="text-3xl font-bold text-white">
             HEROES STATISTIC<span className="text-red-500">S</span>
           </h2>
         </div>

         {/* Modern Month Selector */}
         <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-white font-semibold">Select Month:</label>
            <div className="relative month-picker-container">
              <button
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className="flex items-center gap-2 px-4 py-2 bg-[#181A20] text-white rounded-lg border border-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
              >
                <span>{new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
                             {/* Custom Month Picker Modal */}
               {showMonthPicker && (
                 <div className="absolute top-full left-0 mt-2 z-50">
                   <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 min-w-[240px]">
                     {/* Year Selector */}
                     <div className="mb-3">
                       <input
                         type="number"
                         value={selectedMonth.split('-')[0]}
                         onChange={(e) => {
                           const year = e.target.value;
                           const month = selectedMonth.split('-')[1];
                           setSelectedMonth(`${year}-${month}`);
                         }}
                         className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900 text-center text-sm font-semibold"
                         min="2020"
                         max="2030"
                       />
                     </div>
                     
                     {/* Month Grid */}
                     <div className="grid grid-cols-3 gap-1 mb-3">
                       {[
                         'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                       ].map((month, index) => {
                         const monthNum = String(index + 1).padStart(2, '0');
                         const year = selectedMonth.split('-')[0];
                         const monthValue = `${year}-${monthNum}`;
                         const isSelected = monthValue === selectedMonth;
                         const isCurrentMonth = monthValue === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                         
                         return (
                           <button
                             key={month}
                             onClick={() => {
                               setSelectedMonth(monthValue);
                               setShowMonthPicker(false);
                             }}
                             className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                               isSelected 
                                 ? 'bg-blue-600 text-white' 
                                 : isCurrentMonth 
                                   ? 'border border-gray-400 text-gray-900' 
                                   : 'text-gray-700 hover:bg-gray-100'
                             }`}
                           >
                             {month}
                           </button>
                         );
                       })}
                     </div>
                     
                     {/* Action Buttons */}
                     <div className="flex justify-between">
                       <button
                         onClick={() => setShowMonthPicker(false)}
                         className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                       >
                         Clear
                       </button>
                       <button
                         onClick={() => {
                           const now = new Date();
                           const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                           setSelectedMonth(currentMonth);
                           setShowMonthPicker(false);
                         }}
                         className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                       >
                         This month
                       </button>
                     </div>
                   </div>
                 </div>
               )}
            </div>
          </div>
                     <div className="text-sm text-gray-400">
             {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
               year: 'numeric', 
               month: 'long' 
             })}
           </div>
         </div>

                   {/* Gaming Style Team Winrate Display */}
          <div className="mb-4">
            <div className="relative overflow-hidden bg-gray-900 rounded-xl border border-gray-700 shadow-lg">
              {/* Gaming accent line */}
              
              
              <div className="relative p-3">
                <div className="flex items-center justify-between">
                  {/* Team Info */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md border border-blue-500">
                        <span className="text-white font-bold text-xs">{currentTeam.charAt(0)}</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-gray-900"></div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs font-medium">Active Team</div>
                      <div className="text-white font-bold text-base">{currentTeam}</div>
                    </div>
                  </div>

                  {/* Winrate Stats */}
                  <div className="text-right">
                    <div className="text-gray-400 text-xs font-medium mb-1">Win Rate</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {teamWinrate.rate}%
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-white text-xs font-medium">{teamWinrate.wins}W</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-white text-xs font-medium">{teamWinrate.total - teamWinrate.wins}L</span>
                      </div>
                      <span className="text-gray-400 text-xs">({teamWinrate.total} matches)</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-gray-400 text-xs mb-1">
                    <span>Performance</span>
                    <span>{teamWinrate.rate}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${teamWinrate.rate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Filters and Controls */}
          <div className="mb-4 flex flex-wrap gap-4 items-center justify-between">
            {/* Search and Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search heroes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-[#181A20] text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>

              {/* Role Filter */}
              <div className="relative">
                <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-[#181A20] text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent appearance-none"
                >
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              {/* Used Heroes Only Toggle */}
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyUsedHeroes}
                  onChange={(e) => setShowOnlyUsedHeroes(e.target.checked)}
                  className="rounded border-gray-600 bg-[#181A20] text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Used Only</span>
              </label>
            </div>

            {/* View Mode Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-[#181A20] text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setViewMode('top')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'top' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-[#181A20] text-gray-400 hover:text-white'
                }`}
              >
                Top 20
              </button>
              <button
                onClick={() => setViewMode('used')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'used' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-[#181A20] text-gray-400 hover:text-white'
                }`}
              >
                Used
              </button>
            </div>
          </div>

        {/* Enhanced Table */}
        <div className="overflow-x-auto" style={{ maxHeight: '45vh' }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr>
                <th 
                  className="py-3 px-4 text-left font-bold bg-yellow-500 text-black cursor-pointer hover:bg-yellow-400 transition-colors"
                  onClick={() => handleSort('hero')}
                >
                  <div className="flex items-center gap-2">
                    HERO
                    {getSortIcon('hero')}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 text-center font-bold bg-black text-white cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('pick')}
                >
                  <div className="flex items-center justify-center gap-2">
                    PICK
                    {getSortIcon('pick')}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 text-center font-bold bg-black text-white cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('pickRate')}
                >
                  <div className="flex items-center justify-center gap-2">
                    PICK RATE
                    {getSortIcon('pickRate')}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 text-center font-bold bg-black text-white cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('ban')}
                >
                  <div className="flex items-center justify-center gap-2">
                    BAN
                    {getSortIcon('ban')}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 text-center font-bold bg-black text-white cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('banRate')}
                >
                  <div className="flex items-center justify-center gap-2">
                    BAN RATE
                    {getSortIcon('banRate')}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 text-center font-bold bg-black text-white cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('win')}
                >
                  <div className="flex items-center justify-center gap-2">
                    WIN
                    {getSortIcon('win')}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 text-center font-bold bg-black text-white cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort('winRate')}
                >
                  <div className="flex items-center justify-center gap-2">
                    WIN RATE
                    {getSortIcon('winRate')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedStats.map((hero, index) => (
                <tr 
                  key={hero.hero}
                  className={`transition-colors duration-200 hover:bg-gray-700/30 ${
                    index % 2 === 0 ? 'bg-yellow-500/20' : 'bg-gray-600/20'
                  }`}
                >
                  <td className="py-3 px-4 text-left">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={hero.heroImage}
                          alt={hero.hero}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-600"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div 
                          className="w-12 h-12 rounded-full bg-gray-700 border-2 border-gray-600 items-center justify-center text-xs font-bold text-white hidden"
                          style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)' }}
                        >
                          {hero.hero.substring(0, 2)}
                        </div>
                        {/* Performance indicator */}
                        <div className="absolute -top-1 -right-1">
                          {getPerformanceIndicator(hero)}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-white">{hero.hero}</div>
                        <div className="text-xs text-gray-400">{hero.heroRole}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-semibold ${parseFloat(hero.pick) > 0 ? 'text-blue-400' : 'text-gray-400'}`}>
                      {hero.pick}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-semibold ${getPerformanceColor(hero.pickRate, 'pickRate')}`}>
                      {hero.pickRate}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-semibold ${parseFloat(hero.ban) > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                      {hero.ban}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-semibold ${getPerformanceColor(hero.banRate, 'banRate')}`}>
                      {hero.banRate}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-semibold ${parseFloat(hero.win) > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                      {hero.win}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`font-semibold ${getPerformanceColor(hero.winRate, 'winRate')}`}>
                      {hero.winRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Enhanced Footer */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="text-sm text-gray-400 flex-1">
            Showing {filteredAndSortedStats.length} of {heroStats.length} heroes from {matches.filter(match => {
              const matchDate = new Date(match.match_date);
              const matchMonth = `${matchDate.getFullYear()}-${String(matchDate.getMonth() + 1).padStart(2, '0')}`;
              return matchMonth === selectedMonth;
            }).length} matches in {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long' 
            })}
            {searchTerm && ` • Filtered by "${searchTerm}"`}
            {selectedRole !== 'All' && ` • Role: ${selectedRole}`}
            {showOnlyUsedHeroes && ' • Used heroes only'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroStats; 