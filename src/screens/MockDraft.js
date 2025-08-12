import React, { useEffect, useState } from 'react';
import navbarBg from '../assets/navbarbackground.jpg';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import PageTitle from '../components/PageTitle';
import Header from '../components/Header';
import useSessionTimeout from '../hooks/useSessionTimeout';
import { getHeroData } from '../App';
import {
  DraftBoard,
  DraftControls
} from '../components/MockDraft';
import ProfileModal from '../components/ProfileModal';

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

  // Load hero data with caching
  useEffect(() => {
    const loadHeroData = async () => {
      try {
        setHeroLoading(true);
        const data = await getHeroData();
        console.log('Loaded heroes:', data);
        setHeroList(data);
      } catch (error) {
        console.error('Error loading hero data:', error);
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
  }

  // Start draft
  function handleStartDraft() {
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

  // Save draft as image
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
      const link = document.createElement('a');
      link.download = 'draft.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsSavingDraft(false);
    }
  }

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
          />
        </div>
      </div>
      
      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={currentUser}
      />
    </div>
  );
}