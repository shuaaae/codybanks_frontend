import React, { useEffect, useState } from 'react';
import navbarBg from '../assets/navbarbackground.jpg';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import PageTitle from '../components/PageTitle';
import Header from '../components/Header';
import useSessionTimeout from '../hooks/useSessionTimeout';
import { getHeroData } from '../App';
import { buildApiUrl } from '../config/api';
import userService from '../utils/userService';
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
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
  
  // Hero slot editing state
  const [selectedDraftSlot, setSelectedDraftSlot] = useState(null); // { type: 'ban'|'pick', team: 'blue'|'red', index: number }
  const [draftSlotSearch, setDraftSlotSearch] = useState(''); // For draft slot editing modal
  
  // Custom lane assignments for pick slots - start with null (unassigned)
  const [customLaneAssignments, setCustomLaneAssignments] = useState({
    blue: [null, null, null, null, null], // Start unassigned
    red: [null, null, null, null, null]   // Start unassigned
  });

  // User session timeout: 30 minutes
  useSessionTimeout(30, 'currentUser', '/');

  // Check if user is logged in and fetch fresh data from database
  useEffect(() => {
    const loadUser = async () => {
      try {
        const result = await userService.getCurrentUserWithPhoto();
        if (result.success) {
          setCurrentUser(result.user);
        } else {
          // Fallback to localStorage if database fetch fails
          const localUser = JSON.parse(localStorage.getItem('currentUser'));
          if (localUser) {
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
        
        // Clean up old drafts first to prevent quota issues
        cleanupOldDrafts();
        
        const data = await getHeroData();
        console.log('Loaded heroes:', data);
        console.log('Hero count:', data?.length || 0);
        if (data && data.length > 0) {
          console.log('First hero:', data[0]);
        }
        setHeroList(data);
        
        // Preload hero images for better screenshot quality
        if (data && data.length > 0) {
          preloadHeroImages(data);
        }
      } catch (error) {
        console.error('Error loading hero data:', error);
        console.error('Error details:', error.message);
      } finally {
        setHeroLoading(false);
      }
    };

    loadHeroData();
  }, []);

  // Clean up old drafts to prevent localStorage quota issues
  const cleanupOldDrafts = () => {
    try {
      const existingDrafts = JSON.parse(localStorage.getItem('savedDrafts') || '[]');
      if (existingDrafts.length > 20) {
        // Keep only the 10 most recent drafts
        const recentDrafts = existingDrafts.slice(0, 10);
        localStorage.setItem('savedDrafts', JSON.stringify(recentDrafts));
        console.log(`Cleaned up old drafts, kept ${recentDrafts.length} most recent`);
      }
    } catch (error) {
      console.error('Error cleaning up old drafts:', error);
    }
  };

  // Preload hero images with optimized loading strategy
  const preloadHeroImages = (heroes) => {
    console.log('Preloading hero images...');
    
    // Batch images in groups of 10 for better performance
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < heroes.length; i += batchSize) {
      batches.push(heroes.slice(i, i + batchSize));
    }
    
    const preloadBatch = (batch) => {
      return Promise.allSettled(batch.map(hero => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.loading = 'eager';
          img.decoding = 'async';
          
          // Set timeout to prevent hanging
          const timeout = setTimeout(() => {
            resolve();
          }, 5000);
          
          img.onload = () => {
            clearTimeout(timeout);
            console.log(`Successfully preloaded image for ${hero.name}`);
            resolve();
          };
          
          img.onerror = (error) => {
            clearTimeout(timeout);
            console.log(`Failed to preload image for ${hero.name}:`, error);
            resolve(); // Resolve even if image fails
          };
          
          img.src = `${process.env.REACT_APP_API_URL || 'https://api.coachdatastatistics.site'}/api/hero-image/${hero.role?.trim().toLowerCase()}/${encodeURIComponent(hero.image)}`;
        });
      }));
    };
    
    // Process batches sequentially to avoid overwhelming the browser
    const processBatches = async () => {
      for (const batch of batches) {
        await preloadBatch(batch);
        // Small delay between batches to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      console.log('Hero images preloaded successfully');
    };
    
    processBatches().catch(error => {
      console.error('Error preloading hero images:', error);
    });
  };

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

  // Handle lane swapping between slots via drag and drop
  function handleLaneSwap(team, sourceSlotIndex, targetSlotIndex) {
    if (sourceSlotIndex === targetSlotIndex) return; // No swap needed
    
    console.log(`MockDraft: Swapping lanes between slots ${sourceSlotIndex} and ${targetSlotIndex} for ${team} team`);
    
    setCustomLaneAssignments(prev => {
      const newAssignments = { ...prev };
      const teamLanes = [...newAssignments[team]];
      
      // Swap the lanes
      const temp = teamLanes[sourceSlotIndex];
      teamLanes[sourceSlotIndex] = teamLanes[targetSlotIndex];
      teamLanes[targetSlotIndex] = temp;
      
      newAssignments[team] = teamLanes;
      
      console.log(`MockDraft: Lane swap completed:`, {
        sourceLane: temp,
        targetLane: teamLanes[sourceSlotIndex],
        newAssignments: newAssignments
      });
      
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

  // Handle clicking on draft slots for editing
  const handleDraftSlotClick = (slotType, slotTeam, slotIndex) => {
    setSelectedDraftSlot({ type: slotType, team: slotTeam, index: slotIndex });
  };

  // Handle hero selection for draft slot editing
  const handleDraftSlotEdit = (hero) => {
    if (!selectedDraftSlot) return;
    
    const { type, team, index } = selectedDraftSlot;
    
    // Safety check: ensure the slot exists and is valid
    if (index < 0 || index > 4) {
      console.error(`Invalid slot index: ${index}`);
      setSelectedDraftSlot(null);
      return;
    }
    
    if (type === 'ban') {
      // For bans, simply replace the hero
      setBans(prev => {
        const currentTeamBans = prev[team] || [];
        const newBans = [...currentTeamBans];
        newBans[index] = hero;
        return {
          ...prev,
          [team]: newBans
        };
      });
    } else if (type === 'pick') {
      // For picks, replace the hero
      setPicks(prev => {
        const currentTeamPicks = prev[team] || [];
        const newPicks = [...currentTeamPicks];
        newPicks[index] = hero;
        return {
          ...prev,
          [team]: newPicks
        };
      });
    }
    
    // Close the modal
    setSelectedDraftSlot(null);
    setDraftSlotSearch('');
  };

  // Get all banned and picked heroes for filtering
  const getAllBannedAndPickedHeroes = () => {
    const banNames = [...(bans.blue||[]), ...(bans.red||[])]
      .map(h => h?.hero?.name ?? h?.name ?? h)
      .filter(Boolean);

    const pickNames = [...(picks.blue||[]), ...(picks.red||[])]
      .map(p => p?.hero?.name ?? p?.name ?? p)
      .filter(Boolean);

    return [...new Set([...banNames, ...pickNames])];
  };

  // Highlight logic for ban/pick slots
  function isActiveSlot(type, team, idx) {
    if (currentStep === -1 || draftFinished) return false;
    const step = draftSteps[currentStep];
    return step && step.type === type && step.team === team && step.index === idx;
  }

  // Save draft as image and to database
  async function handleSaveDraft() {
    setIsSavingDraft(true);
    console.log('Starting draft save process...');
    
    try {
      // Find the exact capture element
      const captureEl = document.getElementById('draft-capture-root');
      if (!captureEl) {
        console.error('Draft capture root element not found');
        alert('Error: Could not find draft capture root for screenshot');
        return;
      }
      
      console.log('Found draft capture root:', captureEl);
      console.log('Capture element dimensions:', captureEl.offsetWidth, 'x', captureEl.offsetHeight);
      
      // Close draft analysis modal if it's open to prevent interference
      if (showDraftAnalysis) {
        setShowDraftAnalysis(false);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Lock body scroll to prevent layout shifting
      document.body.classList.add('body-capture-lock');
      
      // Wait for all images to load
      const images = captureEl.querySelectorAll('img');
      console.log(`Found ${images.length} images to process`);
      
      const imageLoadPromises = Array.from(images).map((img, index) => {
        return new Promise((resolve) => {
          // Set CORS attributes
          img.crossOrigin = 'anonymous';
          img.referrerPolicy = 'no-referrer';
          
          if (img.complete && img.naturalHeight > 0) {
            console.log(`Image ${index + 1} already loaded`);
            resolve();
            return;
          }
          
          const timeout = setTimeout(() => {
            console.log(`Image ${index + 1} timeout`);
            resolve();
          }, 5000);
          
          img.onload = () => {
            clearTimeout(timeout);
            console.log(`Image ${index + 1} loaded successfully`);
            resolve();
          };
          
          img.onerror = () => {
            clearTimeout(timeout);
            console.log(`Image ${index + 1} failed to load`);
            resolve();
          };
        });
      });
      
      await Promise.all(imageLoadPromises);
      console.log('All images loaded');
      
      // Small delay to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Take screenshot with stable options
      console.log('Taking screenshot with html2canvas...');
      const canvas = await html2canvas(captureEl, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
        imageTimeout: 0,
        logging: false,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        width: captureEl.offsetWidth,
        height: captureEl.offsetHeight,
        removeContainer: true,
      });
      
      console.log('Canvas created:', canvas);
      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
      
      // Check if canvas is empty
      if (canvas.width === 0 || canvas.height === 0) {
        console.error('Canvas is empty!');
        alert('Error: Screenshot failed - canvas is empty');
        return;
      }
      
      // Convert canvas to data URL
      console.log('Converting canvas to data URL...');
      const imageDataUrl = canvas.toDataURL('image/png');
      console.log('Image data URL length:', imageDataUrl.length);
      
      if (!imageDataUrl || imageDataUrl === 'data:,') {
        console.error('Failed to create image data URL!');
        alert('Error: Failed to create image data');
        return;
      }
      
      // Prepare draft data for database
      const draftData = {
        blue_team_name: blueTeamName || 'Blue Team',
        red_team_name: redTeamName || 'Red Team',
        blue_picks: picks.blue,
        red_picks: picks.red,
        blue_bans: bans.blue,
        red_bans: bans.red,
        custom_lane_assignments: customLaneAssignments,
        image_data: imageDataUrl,
        user_id: currentUser?.id
      };
      
      // Save to database
      console.log('Saving draft to database...');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://api.coachdatastatistics.site'}/api/drafts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('Draft saved to database successfully!', result);
        setShowSaveSuccessModal(true);
      } else {
        console.error('Failed to save draft to database:', result.message);
        alert('Failed to save draft: ' + result.message);
      }
      
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('An unexpected error occurred while saving the draft.');
    } finally {
      // Remove body scroll lock
      document.body.classList.remove('body-capture-lock');
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
            handleDraftSlotClick={handleDraftSlotClick}
            handleDraftSlotEdit={handleDraftSlotEdit}
            isCompleteDraft={false}
            customLaneAssignments={customLaneAssignments}
            onLaneReassign={handleLaneReassign}
            onLaneSwap={handleLaneSwap}
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
        onUserUpdate={(updatedUser) => {
          setCurrentUser(updatedUser);
        }}
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
      
      {/* Save Success Modal */}
      {showSaveSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-[#23232a] rounded-2xl shadow-2xl p-8 min-w-[400px] max-w-[90vw] flex flex-col items-center border border-gray-600">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-6">
              <svg 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="white" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            
            {/* Success Message */}
            <h3 className="text-white text-xl font-bold mb-4 text-center">
              Draft Saved Successfully!
            </h3>
            <p className="text-gray-300 text-center mb-6 leading-relaxed">
              Your draft has been saved to history. You can view and download it from the Draft History section.
            </p>
            
            {/* Action Buttons */}
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setShowSaveSuccessModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowSaveSuccessModal(false);
                  setShowDraftHistory(true);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200"
              >
                View History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Picker Modal for Draft Slot Editing */}
      {selectedDraftSlot && (
        <div 
          className="fixed inset-0 z-[10003] flex items-center justify-center bg-black bg-opacity-80"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedDraftSlot(null);
              setDraftSlotSearch('');
            }
          }}
        >
          <div className="modal-box w-full max-w-4xl bg-[#23232a] rounded-2xl shadow-2xl p-8">
            <h3 className="text-xl font-bold text-white mb-4">
              Select Hero for {selectedDraftSlot.team === 'blue' ? 'Blue' : 'Red'} Team {selectedDraftSlot.type === 'ban' ? 'Ban' : 'Pick'} (Slot {selectedDraftSlot.index + 1})
            </h3>
            
            {/* Search Bar */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Search Hero</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search heroes..."
                  value={draftSlotSearch}
                  onChange={(e) => setDraftSlotSearch(e.target.value)}
                  className="w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {/* Filtered Hero Grid */}
            <div className="grid grid-cols-8 gap-2 mb-6 max-h-[60vh] overflow-y-auto">
              {heroList
                .filter(hero => {
                  // Filter by search term
                  if (draftSlotSearch && !hero.name.toLowerCase().includes(draftSlotSearch.toLowerCase())) {
                    return false;
                  }
                  
                  // Filter out already banned/picked heroes
                  const bannedAndPickedHeroes = getAllBannedAndPickedHeroes();
                  if (bannedAndPickedHeroes.some(n => n?.toLowerCase() === hero.name.toLowerCase())) {
                    return false;
                  }
                  
                  return true;
                })
                .map(hero => (
                  <button
                    key={hero.name}
                    type="button"
                    className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-transparent hover:border-blue-400 hover:bg-blue-900/20 text-white transition-all"
                    onClick={() => handleDraftSlotEdit(hero)}
                  >
                    <div className="w-16 h-16 rounded-full shadow-lg overflow-hidden flex items-center justify-center mb-2 bg-gradient-to-b from-blue-900 to-blue-700">
                      <img
                        src={`${process.env.REACT_APP_API_URL || 'https://api.coachdatastatistics.site'}/api/hero-image/${hero.role?.trim().toLowerCase()}/${encodeURIComponent(hero.image)}`}
                        alt={hero.name}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          console.log(`Failed to load image for ${hero.name}:`, e.target.src);
                          // Fallback to direct API if proxy fails
                          e.target.src = `https://api.coachdatastatistics.site/heroes/${hero.role?.trim().toLowerCase()}/${hero.image}`;
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-center w-20 truncate">
                      {hero.name}
                    </span>
                  </button>
                ))}
            </div>

            {/* Close Button */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSelectedDraftSlot(null);
                  setDraftSlotSearch('');
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}