import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import navbarBg from '../assets/navbarbackground.jpg';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import PageTitle from '../components/PageTitle';
import Header from '../components/Header';
import useSessionTimeout from '../hooks/useSessionTimeout';
import { getMatchesData, clearMatchesCache } from '../App';
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
  const [matchDate, setMatchDate] = useState('');
  const [winner, setWinner] = useState('');
  const [blueTeam, setBlueTeam] = useState('');
  const [redTeam, setRedTeam] = useState('');


  // User session timeout: 30 minutes
  useSessionTimeout(30, 'currentUser', '/');



  // Helper function to show alert modals
  const showAlert = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  // Check if user is logged in and is not admin
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
      navigate('/');
      return;
    }
    setCurrentUser(user);
  }, [navigate]);

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
        
        console.log('Loading matches data for team:', teamId);
        const data = await getMatchesData(teamId);
        
        console.log('Loaded matches:', data);
        setMatches(data || []);
        
      } catch (error) {
        console.error('Error loading matches data:', error);
        setErrorMessage('Failed to load matches');
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMatchesData();
  }, []);

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

    loadHeroes();
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
        img.src = `/public/heroes/${hero.role}/${hero.image.replace('.png', '.webp')}`;
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
    setMatchDate('');
    setWinner('');
    setBlueTeam('');
    setRedTeam('');
    
    // Reset pick flow state
    setCurrentPickSession(null);
    setHeroPickerMode(null);
    setPickerStep('lane');
    
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

  async function handleExportConfirm() {
    // Use state variables instead of getting values from DOM
    // Basic validation with specific field checking
    const missingFields = [];
    if (!matchDate) missingFields.push('Date');
    if (!winner) missingFields.push('Results');
    if (!blueTeam) missingFields.push('Blue Team');
    if (!redTeam) missingFields.push('Red Team');
    
    if (missingFields.length > 0) {
      const fieldList = missingFields.join(', ');
      showAlert(`Please fill in the following required fields: ${fieldList}`, 'error');
      return;
    }

    // Get player assignments for blue and red teams from localStorage
    let bluePlayers = [];
    let redPlayers = [];
    try {
      const latestTeam = JSON.parse(localStorage.getItem('latestTeam'));
      if (latestTeam && latestTeam.teamName && latestTeam.players) {
        if (latestTeam.teamName === blueTeam) bluePlayers = latestTeam.players;
        if (latestTeam.teamName === redTeam) redPlayers = latestTeam.players;
      }
      // If you support multiple teams in localStorage, you may need to adjust this logic
    } catch (e) {}

    // Helper to get player name by lane for a team
    const getPlayerName = (playersArr, laneKey) => {
      if (!Array.isArray(playersArr)) return '';
      const found = playersArr.find(p => p.role === laneKey);
      return found && found.name ? found.name : '';
    };

    // Get team_id from localStorage
    const latestTeam = JSON.parse(localStorage.getItem('latestTeam'));
    const teamId = latestTeam?.id;
    
    console.log('Creating match for team:', { latestTeam, teamId });
    
    // Use your state for bans and picks
    const payload = {
      match_date: matchDate,
      winner: winner,
      turtle_taken: (turtleTakenBlue || turtleTakenRed) ? `${turtleTakenBlue || 0}-${turtleTakenRed || 0}` : null,
      lord_taken: (lordTakenBlue || lordTakenRed) ? `${lordTakenBlue || 0}-${lordTakenRed || 0}` : null,
      notes: notes,
      playstyle: playstyle,
      team_id: teamId, // Add team_id to payload
      teams: [
        {
          team: blueTeam,
          team_color: "blue",
          banning_phase1: banning.blue1,
          picks1: picks.blue[1].map(p => ({
            team: blueTeam,
            lane: p.lane,
            hero: p.hero,
            player: getPlayerName(bluePlayers, p.lane)
          })),
          banning_phase2: banning.blue2,
          picks2: picks.blue[2].map(p => ({
            team: blueTeam,
            lane: p.lane,
            hero: p.hero,
            player: getPlayerName(bluePlayers, p.lane)
          }))
        },
        {
          team: redTeam,
          team_color: "red",
          banning_phase1: banning.red1,
          picks1: picks.red[1].map(p => ({
            team: redTeam,
            lane: p.lane,
            hero: p.hero,
            player: getPlayerName(redPlayers, p.lane)
          })),
          banning_phase2: banning.red2,
          picks2: picks.red[2].map(p => ({
            team: redTeam,
            lane: p.lane,
            hero: p.hero,
            player: getPlayerName(redPlayers, p.lane)
          }))
        }
      ]
    };

    try {
      console.log('Sending payload:', payload); // Debug log
      const response = await fetch('/public/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        // Save the exported match to localStorage for Player Statistics
        // Only save if the match involves the current active team
        const latestTeam = JSON.parse(localStorage.getItem('latestTeam'));
        if (latestTeam && (blueTeam === latestTeam.teamName || redTeam === latestTeam.teamName)) {
          localStorage.setItem('latestMatch', JSON.stringify(payload));
        }
        
        // Clear form data
        setModalState('none');
        setTurtleTakenBlue('');
        setTurtleTakenRed('');
        setLordTakenBlue('');
        setLordTakenRed('');
        setNotes('');
        setPlaystyle('');
        
        // Reset form field states
        setMatchDate('');
        setWinner('');
        setBlueTeam('');
        setRedTeam('');
        
        // Reset banning and picks
        setBanning({
          blue1: [], blue2: [], red1: [], red2: []
        });
        setPicks({ blue: { 1: [], 2: [] }, red: { 1: [], 2: [] } });
        
        // Reset pick flow state
        setCurrentPickSession(null);
        setHeroPickerMode(null);
        setPickerStep('lane');
        setHeroPickerSelected([]);
        
        // Show refreshing state
        setIsRefreshing(true);
        
        // Clear the matches cache to force a fresh fetch
        clearMatchesCache();
        
        // Refetch matches for current team only
        const currentTeamData = JSON.parse(localStorage.getItem('latestTeam'));
        const teamId = currentTeamData?.id;
        
        // Reload matches data after clearing cache
        try {
          // Add a small delay to show the refresh state
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const data = await getMatchesData(teamId);
          if (data && data.length > 0) {
            data.sort((a, b) => {
              if (a.match_date === b.match_date) return b.id - a.id;
              return new Date(b.match_date) - new Date(a.match_date);
            });
            setMatches(data);
          } else {
            setMatches([]);
          }
        } catch (error) {
          console.error('Error refetching matches after export:', error);
          // On error, still clear the form and close modal
          setMatches([]);
        } finally {
          setIsRefreshing(false);
          // Show success message with more details
          showAlert('Match exported successfully! The match has been added to your data table.', 'success');
        }
      } else {
        // Get the error response from the server
        const errorData = await response.text();
        console.error('Server error:', response.status, errorData);
        showAlert(`Failed to export match: ${response.status} - ${errorData}`, 'error');
      }
    } catch (err) {
      console.error('Network error:', err);
      showAlert('Network error: ' + err.message, 'error');
    }
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
      const response = await fetch(`/public/api/matches/${matchId}`, { method: 'DELETE' });
      if (response.ok) {
        // Clear cache to ensure fresh data
        clearMatchesCache();
        setMatches(prev => prev.filter(m => m.id !== matchId));
        setModalState('none');
        setDeleteConfirmMatch(null);
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
              onExportClick={() => setModalState('export')}
              onHeroStatsClick={() => setShowHeroStatsModal(true)}
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
      />
      
      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={currentUser}
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