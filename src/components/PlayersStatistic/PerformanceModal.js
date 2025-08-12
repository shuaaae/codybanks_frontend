import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';

const PerformanceModal = ({ 
  isOpen, 
  onClose, 
  modalInfo, 
  heroStats, 
  heroEvaluation, 
  playerEvaluation,
  onHeroEvaluationChange,
  onHeroEvaluationTextChange,
  onPlayerEvaluationChange,
  onQualityRating,
  onCommentChange
}) => {
  // Player identifier for per-player storage
  const playerIdentifier = useMemo(() => {
    const name = (modalInfo?.player?.name || '').trim();
    const role = (modalInfo?.player?.role || '').trim();
    const id = modalInfo?.player?.identifier || `${name}_${role}`;
    return id.toLowerCase().replace(/\s+/g, '-');
  }, [modalInfo]);

  // Global date selector for the whole panel set
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  // Ensure current day is shown whenever the modal opens
  useEffect(() => {
    if (isOpen) setSelectedDate(todayStr);
  }, [isOpen, todayStr]);

  // Storage keys
  const heroKey = useMemo(() => `heroEvaluationByDate_${playerIdentifier}`, [playerIdentifier]);
  const playerKey = useMemo(() => `playerEvaluationByDate_${playerIdentifier}`, [playerIdentifier]);
  const coachingKey = useMemo(() => `coachingByDate_${playerIdentifier}`, [playerIdentifier]);
  const autosaveKey = useMemo(() => `lastAutosaveDate_${playerIdentifier}`, [playerIdentifier]);

  // Default shapes
  const defaultHeroEval = useMemo(() => ({
    blackHeroes: Array(10).fill(''),
    blueHeroes: Array(10).fill(''),
    redHeroes: Array(10).fill(''),
    commitment: '',
    goal: '',
    roleMeaning: ''
  }), []);

  const defaultPlayerEval = useMemo(() => ({
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
  }), []);

  const defaultCoaching = useMemo(() => ({
    topic: '',
    roleMeaning: '',
    commitment: '',
    goal: ''
  }), []);

  // Maps of date -> data
  const [heroByDate, setHeroByDate] = useState({});
  const [playerByDate, setPlayerByDate] = useState({});
  const [coachingByDate, setCoachingByDate] = useState({});

  // Load persisted maps when modal opens / identifier changes
  useEffect(() => {
    if (!isOpen) return;
    try {
      const hero = JSON.parse(localStorage.getItem(heroKey) || '{}');
      const player = JSON.parse(localStorage.getItem(playerKey) || '{}');
      const coach = JSON.parse(localStorage.getItem(coachingKey) || '{}');
      setHeroByDate(hero);
      setPlayerByDate(player);
      setCoachingByDate(coach);
    } catch (_) {
      setHeroByDate({});
      setPlayerByDate({});
      setCoachingByDate({});
    }
  }, [isOpen, heroKey, playerKey, coachingKey]);

  // Current date-bound slices with fallback to the most recent earlier record
  const heroState = useMemo(() => {
    const direct = heroByDate[selectedDate];
    if (direct) return direct;
    const keys = Object.keys(heroByDate || {}).filter(d => d && d <= selectedDate).sort();
    const last = keys[keys.length - 1];
    return last ? heroByDate[last] : defaultHeroEval;
  }, [heroByDate, selectedDate, defaultHeroEval]);

  const playerState = useMemo(() => {
    const direct = playerByDate[selectedDate];
    if (direct) return direct;
    const keys = Object.keys(playerByDate || {}).filter(d => d && d <= selectedDate).sort();
    const last = keys[keys.length - 1];
    return last ? playerByDate[last] : defaultPlayerEval;
  }, [playerByDate, selectedDate, defaultPlayerEval]);
  const [coaching, setCoaching] = useState(defaultCoaching);

  // Keep coaching state in sync with selectedDate map, with fallback to most recent earlier record
  useEffect(() => {
    const direct = coachingByDate[selectedDate];
    if (direct) {
      setCoaching(direct);
      return;
    }
    const keys = Object.keys(coachingByDate || {}).filter(d => d && d <= selectedDate).sort();
    const last = keys[keys.length - 1];
    setCoaching(last ? coachingByDate[last] : defaultCoaching);
  }, [selectedDate, coachingByDate, defaultCoaching]);

  // Helpers to persist maps
  const persistHero = useCallback((next) => {
    localStorage.setItem(heroKey, JSON.stringify(next));
  }, [heroKey]);
  const persistPlayer = useCallback((next) => {
    localStorage.setItem(playerKey, JSON.stringify(next));
  }, [playerKey]);
  const persistCoaching = useCallback((next) => {
    localStorage.setItem(coachingKey, JSON.stringify(next));
  }, [coachingKey]);

  // Update functions
  function updateHeroArray(field, index, value) {
    setHeroByDate(prev => {
      const current = { ...(prev[selectedDate] || defaultHeroEval) };
      current[field] = current[field].map((v, i) => (i === index ? value : v));
      const next = { ...prev, [selectedDate]: current };
      persistHero(next);
      return next;
    });
  }

  function updateHeroField(field, value) {
    setHeroByDate(prev => {
      const current = { ...(prev[selectedDate] || defaultHeroEval), [field]: value };
      const next = { ...prev, [selectedDate]: current };
      persistHero(next);
      return next;
    });
  }

  // Arrow key navigation for hero evaluation grid
  const handleHeroKeyDown = useCallback((e, currentColumn, currentRow) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    
    e.preventDefault();
    
    let nextColumn = currentColumn;
    let nextRow = currentRow;
    
    switch (e.key) {
      case 'ArrowLeft':
        nextColumn = Math.max(0, currentColumn - 1);
        break;
      case 'ArrowRight':
        nextColumn = Math.min(2, currentColumn + 1);
        break;
      case 'ArrowUp':
        nextRow = Math.max(0, currentRow - 1);
        break;
      case 'ArrowDown':
        nextRow = Math.min(9, currentRow + 1);
        break;
      default:
        // No action needed for other keys
        return;
    }
    
    // Focus the target input
    const targetInput = document.querySelector(`[data-hero-input="${nextColumn}-${nextRow}"]`);
    if (targetInput) {
      targetInput.focus();
    }
  }, []);

  function updatePlayerField(field, value) {
    setPlayerByDate(prev => {
      const current = { ...(prev[selectedDate] || defaultPlayerEval), [field]: value };
      const next = { ...prev, [selectedDate]: current };
      persistPlayer(next);
      return next;
    });
  }

  function updateQuality(quality, rating) {
    setPlayerByDate(prev => {
      const current = { ...(prev[selectedDate] || defaultPlayerEval) };
      current.qualities = {
        ...current.qualities,
        [quality]: current.qualities?.[quality] === rating ? null : rating
      };
      const next = { ...prev, [selectedDate]: current };
      persistPlayer(next);
      return next;
    });
  }

  function updateCoaching(field, value) {
    setCoaching(prev => ({ ...prev, [field]: value }));
    setCoachingByDate(prev => {
      const current = { ...(prev[selectedDate] || defaultCoaching), [field]: value };
      const next = { ...prev, [selectedDate]: current };
      persistCoaching(next);
      return next;
    });
  }

  // Date picker dropdown of existing records
  const availableDates = useMemo(() => {
    const set = new Set([
      ...Object.keys(heroByDate || {}),
      ...Object.keys(playerByDate || {}),
      ...Object.keys(coachingByDate || {})
    ]);
    // Also include the currently selected date so users can re-save for today
    if (selectedDate) set.add(selectedDate);
    const arr = Array.from(set).filter(d => d && d <= todayStr);
    return arr.sort((a, b) => b.localeCompare(a));
  }, [heroByDate, playerByDate, coachingByDate, selectedDate, todayStr]);

  const [showDateMenu, setShowDateMenu] = useState(false);
  const dateMenuRef = useRef(null);
  const newDateInputRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (dateMenuRef.current && !dateMenuRef.current.contains(e.target)) {
        setShowDateMenu(false);
      }
    }
    if (showDateMenu) document.addEventListener('mousedown', onDocClick, true);
    return () => document.removeEventListener('mousedown', onDocClick, true);
  }, [showDateMenu]);

  // Daily autosave rollover: when the calendar day advances, create a new entry for today
  useEffect(() => {
    const init = () => {
      const last = localStorage.getItem(autosaveKey);
      const today = todayStr;
      if (!last) {
        localStorage.setItem(autosaveKey, today);
        return;
      }
      if (last < today) {
        // Clone the most recent previous state into today's date to start a new day snapshot
        setHeroByDate(prev => {
          if (prev[today]) return prev;
          const base = prev[last] || defaultHeroEval;
          const next = { ...prev, [today]: { ...base } };
          persistHero(next);
          return next;
        });
        setPlayerByDate(prev => {
          if (prev[today]) return prev;
          const base = prev[last] || defaultPlayerEval;
          const next = { ...prev, [today]: { ...base } };
          persistPlayer(next);
          return next;
        });
        setCoachingByDate(prev => {
          if (prev[today]) return prev;
          const base = prev[last] || defaultCoaching;
          const next = { ...prev, [today]: { ...base } };
          persistCoaching(next);
          return next;
        });
        setSelectedDate(today);
        localStorage.setItem(autosaveKey, today);
      }
    };

    init();
    const interval = setInterval(init, 60 * 1000); // check every minute
    return () => clearInterval(interval);
  }, [autosaveKey, todayStr, defaultHeroEval, defaultPlayerEval, defaultCoaching, persistHero, persistPlayer, persistCoaching]);

  if (!isOpen || !modalInfo) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90 animate-fadeIn" style={{ pointerEvents: 'auto' }}>
      <div className="bg-[#23232a] rounded-2xl shadow-2xl p-6 min-w-[1400px] max-w-[95vw] h-[800px] flex flex-col z-[10000] animate-slideInUp">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3 relative" ref={dateMenuRef}>
            <h2 className="text-white text-xl font-bold"><span className="text-blue-400">{modalInfo.player.name}</span> - Performance Analysis</h2>
            <button
              type="button"
              onClick={() => setShowDateMenu(v => !v)}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-haspopup="listbox"
              aria-expanded={showDateMenu}
            >
              {selectedDate}
            </button>
            {showDateMenu && (
              <div className="absolute top-10 left-0 bg-gray-800 rounded-md shadow-lg border border-gray-700 w-64 z-[10001]">
                <div className="p-2 text-xs text-gray-300">Pick a saved date</div>
                <ul className="max-h-60 overflow-y-auto" role="listbox">
                  {availableDates.length === 0 && (
                    <li className="px-3 py-2 text-gray-400 text-sm">No saved dates yet</li>
                  )}
                  {availableDates.map(d => (
                    <li key={d}>
                      <button
                        type="button"
                        onClick={() => { setSelectedDate(d); setShowDateMenu(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 ${d === selectedDate ? 'bg-gray-700 text-white' : 'text-gray-200'}`}
                      >
                        {d}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-gray-700 mt-1" />
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-blue-300 hover:bg-gray-700"
                  onClick={() => newDateInputRef.current?.showPicker?.() || newDateInputRef.current?.focus()}
                >
                  Pick another date…
                </button>
                <input
                  ref={newDateInputRef}
                  type="date"
                  className="sr-only"
                  max={todayStr}
                  onChange={(e) => {
                    if (e.target.value) {
                      const chosen = e.target.value > todayStr ? todayStr : e.target.value;
                      setSelectedDate(chosen);
                      setShowDateMenu(false);
                    }
                  }}
                />
              </div>
            )}
          </div>
          <button 
            className="text-gray-400 hover:text-white text-2xl font-bold" 
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
          {/* Date selector moved to header */}
          {/* Evaluation Forms Section - Now on top */}
          <div className="w-full flex gap-4">
            {/* Hero Evaluation */}
            <div className="flex-1 bg-gray-800 p-3 rounded-lg">
              <div className="text-yellow-300 font-bold mb-2 text-sm">HERO EVALUATION</div>
              <div className="flex gap-2 mb-2">
                <div className="flex-1">
                  <label className="text-white text-xs">Commitment:</label>
                  <input
                    type="text"
                    value={heroState.commitment}
                    onChange={(e) => updateHeroField('commitment', e.target.value)}
                    className="w-full px-1 py-1 bg-gray-700 text-white rounded text-xs"
                    placeholder="Commitment"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-white text-xs">Goal:</label>
                  <input
                    type="text"
                    value={heroState.goal}
                    onChange={(e) => updateHeroField('goal', e.target.value)}
                    className="w-full px-1 py-1 bg-gray-700 text-white rounded text-xs"
                    placeholder="Goal"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-1 mb-2">
                <div className="bg-black text-white text-center text-xs py-1 rounded">Black</div>
                <div className="bg-blue-600 text-white text-center text-xs py-1 rounded">Blue</div>
                <div className="bg-red-600 text-white text-center text-xs py-1 rounded">Red</div>
              </div>
              
              <div className="space-y-1 max-h-48 overflow-y-scroll scrollbar-hide">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className="grid grid-cols-3 gap-1">
                    <input
                      type="text"
                      value={heroState.blackHeroes[index]}
                      onChange={(e) => updateHeroArray('blackHeroes', index, e.target.value)}
                      onKeyDown={(e) => handleHeroKeyDown(e, 0, index)}
                      data-hero-input={`0-${index}`}
                      className="px-1 py-1 bg-black text-white rounded text-xs text-center"
                      placeholder="Hero"
                    />
                    <input
                      type="text"
                      value={heroState.blueHeroes[index]}
                      onChange={(e) => updateHeroArray('blueHeroes', index, e.target.value)}
                      onKeyDown={(e) => handleHeroKeyDown(e, 1, index)}
                      data-hero-input={`1-${index}`}
                      className="px-1 py-1 bg-blue-600 text-white rounded text-xs text-center"
                      placeholder="Hero"
                    />
                    <input
                      type="text"
                      value={heroState.redHeroes[index]}
                      onChange={(e) => updateHeroArray('redHeroes', index, e.target.value)}
                      onKeyDown={(e) => handleHeroKeyDown(e, 2, index)}
                      data-hero-input={`2-${index}`}
                      className="px-1 py-1 bg-red-600 text-white rounded text-xs text-center"
                      placeholder="Hero"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Player Evaluation */}
            <div className="flex-1 bg-gray-800 p-3 rounded-lg">
              <div className="text-yellow-300 font-bold mb-2 text-sm">PLAYER EVALUATION</div>
              <div className="flex gap-2 mb-2">
                <div className="flex-1">
                  <label className="text-white text-xs">Notes:</label>
                  <textarea
                    value={playerState.notes || ''}
                    onChange={(e) => updatePlayerField('notes', e.target.value)}
                    className="w-full px-1 py-1 bg-green-600 text-white rounded text-xs resize-none"
                    placeholder="Notes"
                    rows="2"
                    style={{ height: 'auto', minHeight: '32px' }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-1 mb-2">
                <div className="bg-green-600 text-white text-center py-1 text-xs font-bold">Quality</div>
                <div className="bg-green-600 text-white text-center py-1 text-xs font-bold">1-4</div>
                <div className="bg-green-600 text-white text-center py-1 text-xs font-bold">5-6</div>
                <div className="bg-green-600 text-white text-center py-1 text-xs font-bold">7-8</div>
                <div className="bg-green-600 text-white text-center py-1 text-xs font-bold">9-10</div>
              </div>
              
              <div className="space-y-1 max-h-48 overflow-y-scroll scrollbar-hide">
                {Object.entries(playerState.qualities).slice(0, 10).map(([quality, rating], index) => (
                  <div key={quality} className="grid grid-cols-5 gap-1">
                    <div className="bg-green-200 text-black px-1 py-1 text-xs font-semibold truncate">{quality}</div>
                    <button
                      onClick={() => updateQuality(quality, '1-4')}
                      className={`px-1 py-1 text-xs font-bold ${rating === '1-4' ? 'bg-green-500 text-white' : 'bg-white text-black'} rounded cursor-pointer hover:bg-green-300`}
                    >
                      {rating === '1-4' ? '✓' : ''}
                    </button>
                    <button
                      onClick={() => updateQuality(quality, '5-6')}
                      className={`px-1 py-1 text-xs font-bold ${rating === '5-6' ? 'bg-green-500 text-white' : 'bg-white text-black'} rounded cursor-pointer hover:bg-green-300`}
                    >
                      {rating === '5-6' ? '✓' : ''}
                    </button>
                    <button
                      onClick={() => updateQuality(quality, '7-8')}
                      className={`px-1 py-1 text-xs font-bold ${rating === '7-8' ? 'bg-green-500 text-white' : 'bg-white text-black'} rounded cursor-pointer hover:bg-green-300`}
                    >
                      {rating === '7-8' ? '✓' : ''}
                    </button>
                    <button
                      onClick={() => updateQuality(quality, '9-10')}
                      className={`px-1 py-1 text-xs font-bold ${rating === '9-10' ? 'bg-green-500 text-white' : 'bg-white text-black'} rounded cursor-pointer hover:bg-green-300`}
                    >
                      {rating === '9-10' ? '✓' : ''}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Chart Section + 1v1 Coaching - Now below the tables */}
          <div className="w-full flex gap-4">
            <div className="w-1/2">
              <div className="text-yellow-300 font-bold mb-3 text-sm">PLAYER'S HERO PERFORMANCE CHART</div>
              {heroStats.length > 0 && (
                <div className="w-full bg-gray-800 rounded-lg p-3" style={{ height: '300px' }}>
                <Bar
                  data={{
                    labels: heroStats.map(row => row.hero),
                    datasets: [
                      {
                        label: 'SUCCESS RATE',
                        data: heroStats.map(row => row.winrate),
                        type: 'line',
                        borderColor: '#facc15',
                        backgroundColor: '#facc15',
                        yAxisID: 'y1',
                        fill: false,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#facc15',
                        order: 0,
                        z: 10,
                      },
                      {
                        label: 'WIN',
                        data: heroStats.map(row => Math.round(row.win)),
                        backgroundColor: '#3b82f6',
                        order: 1,
                      },
                      {
                        label: 'LOSE',
                        data: heroStats.map(row => Math.round(row.lose)),
                        backgroundColor: '#f87171',
                        order: 2,
                      },
                      {
                        label: 'TOTAL',
                        data: heroStats.map(row => Math.round(row.total)),
                        backgroundColor: '#22c55e',
                        order: 3,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      tooltip: { mode: 'index', intersect: false },
                    },
                    scales: {
                      y: { 
                        beginAtZero: true, 
                        title: { display: true, text: 'Count' },
                        ticks: {
                          stepSize: 1,
                          callback: function(value) {
                            return Math.round(value);
                          }
                        }
                      },
                      y1: {
                        beginAtZero: true,
                        position: 'right',
                        title: { display: true, text: 'Success Rate (%)' },
                        min: 0,
                        max: 100,
                        grid: { drawOnChartArea: false },
                      },
                    },
                  }}
                />
                </div>
              )}
            </div>
            {/* 1v1 Coaching Panel */}
            <div className="w-1/2">
              <div className="text-yellow-300 font-bold mb-3 text-sm">1V1 COACHING</div>
              <div className="w-full bg-gray-800 rounded-lg p-4 space-y-3 min-h-[300px]">
                <div className="grid grid-cols-2 gap-2">
                  <textarea
                    value={coaching.topic}
                    onChange={(e) => updateCoaching('topic', e.target.value)}
                    className="px-3 py-2 bg-gray-700 text-white rounded text-sm placeholder-gray-300 min-h-[72px] resize-y"
                    placeholder="Topic discussed"
                    rows={3}
                  />
                  <textarea
                    value={coaching.roleMeaning}
                    onChange={(e) => updateCoaching('roleMeaning', e.target.value)}
                    className="px-3 py-2 bg-gray-700 text-white rounded text-sm placeholder-gray-300 min-h-[72px] resize-y"
                    placeholder="Role meaning"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <textarea
                    value={coaching.commitment}
                    onChange={(e) => updateCoaching('commitment', e.target.value)}
                    className="px-3 py-2 bg-gray-700 text-white rounded text-sm placeholder-gray-300 min-h-[72px] resize-y"
                    placeholder="Commitment"
                    rows={3}
                  />
                  <textarea
                    value={coaching.goal}
                    onChange={(e) => updateCoaching('goal', e.target.value)}
                    className="px-3 py-2 bg-gray-700 text-white rounded text-sm placeholder-gray-300 min-h-[72px] resize-y"
                    placeholder="Goal"
                    rows={3}
                  />
                </div>
                <textarea
                  className="w-full min-h-[140px] h-auto px-2 py-2 bg-gray-700 text-white rounded text-xs placeholder-gray-300 resize-y"
                  placeholder="Additional notes from the coaching session"
                  value={coaching.notes || ''}
                  onChange={(e) => updateCoaching('notes', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceModal; 