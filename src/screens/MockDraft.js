import React, { useEffect, useState } from 'react';
import navbarBg from '../assets/navbarbackground.jpg';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import PageTitle from '../components/PageTitle';
import Header from '../components/Header';
import useSessionTimeout from '../hooks/useSessionTimeout';
import { getHeroData } from '../App';
import { buildApiUrl } from '../config/api';
import {
  DraftBoard,
  DraftControls
} from '../components/MockDraft';
import ProfileModal from '../components/ProfileModal';
import DraftHistoryModal from '../components/MockDraft/DraftHistoryModal';
import DraftAnalysis from '../components/MockDraft/DraftAnalysis';

export default function MockDraft() {
  const navigate = useNavigate();
  const [heroList, setHeroList] = useState([]);
  const [heroLoading, setHeroLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('All');

  const [currentStep, setCurrentStep] = useState(-1); // -1 means not started
  const [timer, setTimer] = useState(50);
  const [timerActive, setTimerActive] = useState(false);
  const [bans, setBans] = useState({ blue: Array(5).fill(null), red: Array(5).fill(null) });
  const [picks, setPicks] = useState({ blue: Array(5).fill(null), red: Array(5).fill(null) });
  const [draftFinished, setDraftFinished] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // Team names state
  const [blueTeamName, setBlueTeamName] = useState('');
  const [redTeamName, setRedTeamName] = useState('');
  // Loading state for save draft
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  // User avatar state
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false); // Add profile modal state
  // Draft history state
  const [showDraftHistory, setShowDraftHistory] = useState(false);
  
  // Draft analysis state
  const [showDraftAnalysis, setShowDraftAnalysis] = useState(false);
  const [currentDraftData, setCurrentDraftData] = useState(null);
  
  // Custom lane assignments for pick slots - start with null (unassigned)
  const [customLaneAssignments, setCustomLaneAssignments] = useState({
    blue: [null, null, null, null, null], // Start unassigned
    red: [null, null, null, null, null]   // Start unassigned
  });

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

  // Automatically set team as active when entering MockDraft
  useEffect(() => {
    const latestTeam = localStorage.getItem('latestTeam');
    if (latestTeam) {
      const teamData = JSON.parse(latestTeam);
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

  // Clear active team when leaving MockDraft
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
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminAuthToken');
    navigate('/');
  };

  // Load hero data with caching
  useEffect(() => {
    const loadHeroData = async () => {
      try {
        setHeroLoading(true);
        console.log('Starting to load hero data...');
        const data = await getHeroData();
        console.log('Loaded heroes:', data);
        console.log('Hero count:', data?.length || 0);
        if (data && data.length > 0) {
          console.log('First hero:', data[0]);
        }
        setHeroList(data);
      } catch (error) {
        console.error('Error loading hero data:', error);
        console.error('Error details:', error.message);
      } finally {
        setHeroLoading(false);
      }
    };

    loadHeroData();
  }, []);

  // Draft phase order: blue-red-blue-red-blue-red (ban), blue-red-blue-red-blue-red (pick), blue-red-blue-red (ban), blue-red-blue-red (pick)
  const draftSteps = [
    // Ban Phase 1
    { type: 'ban', team: 'blue', index: 0 },
    { type: 'ban', team: 'red', index: 0 },
    { type: 'ban', team: 'blue', index: 1 },
    { type: 'ban', team: 'red', index: 1 },
    { type: 'ban', team: 'blue', index: 2 },
    { type: 'ban', team: 'red', index: 2 },
    // Pick Phase 1 (blue, red, red, blue, blue, red)
    { type: 'pick', team: 'blue', index: 0 },
    { type: 'pick', team: 'red', index: 0 },
    { type: 'pick', team: 'red', index: 1 },
    { type: 'pick', team: 'blue', index: 1 },
    { type: 'pick', team: 'blue', index: 2 },
    { type: 'pick', team: 'red', index: 2 },
    // Ban Phase 2 (red, blue, red, blue)
    { type: 'ban', team: 'red', index: 3 },
    { type: 'ban', team: 'blue', index: 3 },
    { type: 'ban', team: 'red', index: 4 },
    { type: 'ban', team: 'blue', index: 4 },
    // Pick Phase 2 (red, blue, blue, red)
    { type: 'pick', team: 'red', index: 3 },
    { type: 'pick', team: 'blue', index: 3 },
    { type: 'pick', team: 'blue', index: 4 },
    { type: 'pick', team: 'red', index: 4 },
  ];

  // Track banned and picked heroes for availability
  const bannedHeroes = [...bans.blue, ...bans.red].filter(Boolean);
  const pickedHeroes = [...picks.blue, ...picks.red].filter(Boolean);
  const unavailableHeroes = [...bannedHeroes, ...pickedHeroes];





  // Check if any hero is selected in bans or picks
  const isDraftStarted = () => {
    return (
      bans.blue.some(Boolean) ||
      bans.red.some(Boolean) ||
      picks.blue.some(Boolean) ||
      picks.red.some(Boolean)
    );
  };

  // Handler to reset all slots
  function handleResetDraft() {
    setCurrentStep(-1);
    setTimer(50);
    setTimerActive(false);
    setBans({ blue: Array(5).fill(null), red: Array(5).fill(null) });
    setPicks({ blue: Array(5).fill(null), red: Array(5).fill(null) });
    setDraftFinished(false); // Reset draft finished state
    // Reset lane assignments to unassigned
    setCustomLaneAssignments({
      blue: [null, null, null, null, null],
      red: [null, null, null, null, null]
    });
  }
  
  // Handle lane reassignment
  function handleLaneReassign(team, slotIndex, newLane) {
    console.log('MockDraft: handleLaneReassign called with:', { team, slotIndex, newLane });
    setCustomLaneAssignments(prev => {
      console.log('MockDraft: Previous assignments:', prev);
      const newAssignments = { ...prev };
      newAssignments[team] = [...newAssignments[team]];
      newAssignments[team][slotIndex] = newLane;
      console.log('MockDraft: New assignments:', newAssignments);
      return newAssignments;
    });
  }
  
  // Check if any lanes have been assigned
  const isLaneOrderModified = () => {
    const unassignedState = [null, null, null, null, null];
    return (
      JSON.stringify(customLaneAssignments.blue) !== JSON.stringify(unassignedState) ||
      JSON.stringify(customLaneAssignments.red) !== JSON.stringify(unassignedState)
    );
  };

  // Check if all lane assignments are completed for both teams
  const areAllLanesAssigned = () => {
    const blueLanes = customLaneAssignments.blue;
    const redLanes = customLaneAssignments.red;
    
    // Check if all 5 lanes are assigned for both teams (no null values)
    const blueComplete = blueLanes.every(lane => lane !== null);
    const redComplete = redLanes.every(lane => lane !== null);
    
    return blueComplete && redComplete;
  };

  // Check if lane assignments are valid (no duplicates within a team)
  const areLaneAssignmentsValid = () => {
    const blueLanes = customLaneAssignments.blue.filter(lane => lane !== null);
    const redLanes = customLaneAssignments.red.filter(lane => lane !== null);
    
    // Check for duplicates within each team
    const blueHasDuplicates = blueLanes.length !== new Set(blueLanes).size;
    const redHasDuplicates = redLanes.length !== new Set(redLanes).size;
    
    return !blueHasDuplicates && !redHasDuplicates;
  };

  // Start draft
  function handleStartDraft() {
    // Check if all lanes are assigned before starting
    if (!areAllLanesAssigned()) {
      alert('Please assign all lanes for both teams before starting the draft.');
      return;
    }
    
    // Check if lane assignments are valid (no duplicates)
    if (!areLaneAssignmentsValid()) {
      alert('Please ensure each lane is assigned only once per team.');
      return;
    }

    if (currentStep === -1) {
      setCurrentStep(0);
      setTimer(50);
      setTimerActive(true);
      setBans({ blue: Array(5).fill(null), red: Array(5).fill(null) });
      setPicks({ blue: Array(5).fill(null), red: Array(5).fill(null) });
      setDraftFinished(false); // Ensure it's false when starting
    } else if (!timerActive && !draftFinished && currentStep >= 0) {
      setTimerActive(true); // Resume timer, do not reset draft
    }
  }

  function handleStopDraft() {
    setTimerActive(false);
  }

  // Timer effect
  useEffect(() => {
    if (draftFinished) return;
    if (!timerActive || currentStep === -1) return;
    if (timer === 0) {
      // Auto-advance step
      if (currentStep + 1 < draftSteps.length) {
        setCurrentStep((step) => step + 1);
        setTimer(50);
      } else {
        setDraftFinished(true);
        setTimerActive(false);
      }
      return;
    }
    const id = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(id);
  }, [timerActive, timer, currentStep, draftFinished]);

  // Advance step after pick/ban
  function handleHeroSelect(hero) {
    if (currentStep === -1 || draftFinished) return;
    
    // Check if all lanes are assigned before allowing hero selection
    if (!areAllLanesAssigned()) {
      alert('Please assign all lanes for both teams before selecting heroes.');
      return;
    }
    
    // Check if lane assignments are valid (no duplicates)
    if (!areLaneAssignmentsValid()) {
      alert('Please ensure each lane is assigned only once per team.');
      return;
    }
    
    const step = draftSteps[currentStep];
    if (!step) return;
    if (step.type === 'ban') {
      setBans((prev) => {
        const updated = { ...prev };
        updated[step.team][step.index] = hero;
        return updated;
      });
    } else if (step.type === 'pick') {
      setPicks((prev) => {
        const updated = { ...prev };
        updated[step.team][step.index] = hero;
        return updated;
      });
    }
    // Next step or finish
    if (currentStep + 1 < draftSteps.length) {
      setCurrentStep((stepIdx) => stepIdx + 1);
      setTimer(50);
    } else {
      setDraftFinished(true);
      setTimerActive(false);
    }
  }

  // Skip ban function
  function handleSkipBan() {
    if (currentStep === -1 || draftFinished) return;
    const step = draftSteps[currentStep];
    if (!step || step.type !== 'ban') return;
    // Just advance to the next step, don't assign a hero
    if (currentStep + 1 < draftSteps.length) {
      setCurrentStep((stepIdx) => stepIdx + 1);
      setTimer(50);
    } else {
      setDraftFinished(true);
      setTimerActive(false);
    }
  }

  // Highlight logic for ban/pick slots
  function isActiveSlot(type, team, idx) {
    if (currentStep === -1 || draftFinished) return false;
    const step = draftSteps[currentStep];
    return step && step.type === type && step.team === team && step.index === idx;
  }

  // Save draft as image and to history
  async function handleSaveDraft() {
    setIsSavingDraft(true);
    try {
      const draftBoard = document.querySelector('.draft-screenshot-area');
      if (!draftBoard) return;
      
      // Temporarily remove box-shadow and transitions for speed
      const prevBoxShadow = draftBoard.style.boxShadow;
      const prevTransition = draftBoard.style.transition;
      draftBoard.style.boxShadow = 'none';
      draftBoard.style.transition = 'none';
      const canvas = await html2canvas(draftBoard, { backgroundColor: null, scale: 2 });
      draftBoard.style.boxShadow = prevBoxShadow;
      draftBoard.style.transition = prevTransition;
      
      // Download the image
      const link = document.createElement('a');
      link.download = 'draft.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      // Save to draft history
      const draftData = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        blueTeamName: blueTeamName || 'Blue Team',
        redTeamName: redTeamName || 'Red Team',
        bluePicks: picks.blue,
        redPicks: picks.red,
        blueBans: bans.blue,
        redBans: bans.red,
        imageData: canvas.toDataURL('image/png'),
        customLaneAssignments: customLaneAssignments
      };
      
      // Get existing drafts and add new one
      const existingDrafts = JSON.parse(localStorage.getItem('savedDrafts') || '[]');
      existingDrafts.unshift(draftData); // Add to beginning of array
      
      // Keep only last 50 drafts to prevent localStorage from getting too large
      const limitedDrafts = existingDrafts.slice(0, 50);
      localStorage.setItem('savedDrafts', JSON.stringify(limitedDrafts));
      
      console.log('Draft saved to history:', draftData);
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsSavingDraft(false);
    }
  }

  const handleShowDraftAnalysis = () => {
    const draftData = {
      blueTeamName: blueTeamName || 'Blue Team',
      redTeamName: redTeamName || 'Red Team',
      bluePicks: picks.blue,
      redPicks: picks.red,
      blueBans: bans.blue,
      redBans: bans.red,
      customLaneAssignments: customLaneAssignments
    };
    
    setCurrentDraftData(draftData);
    setShowDraftAnalysis(true);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${navbarBg}) center/cover, #181A20` }}>
      <PageTitle title="Mock Draft" />
      
      {/* Header Component */}
      <Header 
        currentUser={currentUser}
        onLogout={handleLogout}
        onShowProfile={() => setShowProfileModal(true)}
      />

      {/* Main Draft Board */}
      <div className="side-sections flex justify-center items-center min-h-[calc(100vh-80px)] flex-1" style={{ marginTop: 8 }}>
        <div className="flex flex-col items-center justify-center">
          <DraftBoard
            currentStep={currentStep}
            draftSteps={draftSteps}
            draftFinished={draftFinished}
            timer={timer}
            blueTeamName={blueTeamName}
            setBlueTeamName={setBlueTeamName}
            redTeamName={redTeamName}
            setRedTeamName={setRedTeamName}
            bans={bans}
            picks={picks}
            heroList={heroList}
            heroLoading={heroLoading}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleHeroSelect={handleHeroSelect}
            isActiveSlot={isActiveSlot}
            customLaneAssignments={customLaneAssignments}
            onLaneReassign={handleLaneReassign}
            areAllLanesAssigned={areAllLanesAssigned()}
            areLaneAssignmentsValid={areLaneAssignmentsValid()}
          />
          <DraftControls
            timerActive={timerActive}
            draftFinished={draftFinished}
            currentStep={currentStep}
            draftSteps={draftSteps}
            isDraftStarted={isDraftStarted}
            handleStartDraft={handleStartDraft}
            handleStopDraft={handleStopDraft}
            handleSkipBan={handleSkipBan}
            handleResetDraft={handleResetDraft}
            handleSaveDraft={handleSaveDraft}
            isSavingDraft={isSavingDraft}
            areAllLanesAssigned={areAllLanesAssigned()}
            areLaneAssignmentsValid={areLaneAssignmentsValid()}
            onShowDraftHistory={() => setShowDraftHistory(true)}
            onShowDraftAnalysis={handleShowDraftAnalysis}
          />
        </div>
      </div>
      
      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={currentUser}
      />
      
      {/* Draft History Modal */}
      <DraftHistoryModal 
        isOpen={showDraftHistory}
        onClose={() => setShowDraftHistory(false)}
      />
      
      {/* Draft Analysis Modal */}
      <DraftAnalysis
        isOpen={showDraftAnalysis}
        onClose={() => setShowDraftAnalysis(false)}
        draftData={currentDraftData}
        heroList={heroList}
      />
    </div>
  );
}