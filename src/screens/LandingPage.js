import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import mainBg from '../assets/mainbg.jpg';
import aboutBg from '../assets/aboutbg.jpg';
import PageTitle from '../components/PageTitle';
import { safelyActivateTeam } from '../utils/teamUtils';
import {
  Header,
  HeroSection,
  AddTeamModal,
  TeamPickerModal,
  LoginModal,
  SignupModal,
  DeleteConfirmModal,
  ErrorModal
} from '../components/LandingPage';

export default function LandingPage() {
  const navigate = useNavigate();
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showTeamPickerModal, setShowTeamPickerModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  const [teams, setTeams] = useState([]);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamNameError, setTeamNameError] = useState("");
  const [isValidatingName, setIsValidatingName] = useState(false);
  const [teamLogo, setTeamLogo] = useState(null);
  const [teamLogoFile, setTeamLogoFile] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [activeTeam, setActiveTeam] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOpeningTeam, setIsOpeningTeam] = useState(false);
  const [openingTeamName, setOpeningTeamName] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorTitle, setErrorTitle] = useState("Error");
  const [showCleanupOption, setShowCleanupOption] = useState(false);
  const laneRoles = [
    { key: 'exp', label: 'Exp Lane' },
    { key: 'mid', label: 'Mid Lane' },
    { key: 'jungler', label: 'Jungler' },
    { key: 'gold', label: 'Gold Lane' },
    { key: 'roam', label: 'Roam' },
  ];
  const [players, setPlayers] = useState([
    { role: "exp", name: "" },
    { role: "mid", name: "" },
    { role: "jungler", name: "" },
    { role: "gold", name: "" },
    { role: "roam", name: "" },
  ]);

  const defaultRoles = ["exp", "mid", "jungler", "gold", "roam"];

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setTeamLogo(URL.createObjectURL(file));
      setTeamLogoFile(file);
    }
  };

  const handlePlayerChange = (idx, value) => {
    setPlayers(players.map((p, i) => i === idx ? { ...p, name: value } : p));
  };

  // Handle team name change with validation
  const handleTeamNameChange = async (e) => {
    const newName = e.target.value;
    setTeamName(newName);
    setTeamNameError(""); // Clear error when user starts typing
    
    // Only check if name is not empty and has at least 2 characters
    if (newName.trim().length >= 2) {
      setIsValidatingName(true);
      // Add a small delay to avoid too many API calls
      setTimeout(async () => {
        if (newName === teamName) { // Only check if name hasn't changed
          const nameCheck = await checkTeamNameExists(newName);
          if (nameCheck.exists) {
            setTeamNameError(nameCheck.message);
          }
          setIsValidatingName(false);
        }
      }, 500);
    } else {
      setIsValidatingName(false);
    }
  };

  // Normalize role values to ensure consistency
  const normalizeRole = (role) => {
    if (!role) return role;
    
    const normalizedRole = role.toLowerCase().trim();
    
    // Map various role formats to standard ones
    const roleMap = {
      // Standard roles
      'exp': 'exp',
      'mid': 'mid',
      'jungler': 'jungler',
      'gold': 'gold',
      'roam': 'roam',
      'sub': 'substitute',
      'substitute': 'substitute',
      
      // Common variations
      'explane': 'exp',
      'explaner': 'exp',
      'top': 'exp',
      'top_laner': 'exp',
      'toplaner': 'exp',
      
      'midlane': 'mid',
      'mid_laner': 'mid',
      'midlaner': 'mid',
      'middle': 'mid',
      
      'jungle': 'jungler',
      'jungler': 'jungler',
      
      'adc': 'gold',
      'marksman': 'gold',
      'gold_lane': 'gold',
      'goldlane': 'gold',
      'carry': 'gold',
      
      'support': 'roam',
      'roamer': 'roam',
      'roam_lane': 'roam',
      'roamlane': 'roam',
      
      'backup': 'substitute',
      'reserve': 'substitute',
      'sub': 'substitute'
    };
    
    return roleMap[normalizedRole] || normalizedRole;
  };

  const handleAddPlayer = () => {
    // Add a new player with a default role (first available role that's not taken)
    const usedRoles = players.map(p => p.role).filter(role => role.trim() !== '');
    const availableRoles = defaultRoles.filter(role => !usedRoles.includes(role));
    const defaultRole = availableRoles.length > 0 ? availableRoles[0] : 'sub';
    
    setPlayers([...players, { role: defaultRole, name: "" }]);
  };

  const handleRoleChange = (idx, value) => {
    // Don't allow empty roles
    if (!value.trim()) return;
    
    // Normalize the role value
    const normalizedRole = normalizeRole(value);
    
    setPlayers(players.map((p, i) => i === idx ? { ...p, role: normalizedRole } : p));
  };

  const handleRemovePlayer = (idx) => {
    setPlayers(players.filter((_, i) => i !== idx));
  };

  const handleLogout = () => {
    // Clear active team when logging out
    fetch('/api/teams/set-active', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ team_id: null }),
    }).catch(error => {
      console.error('Error clearing active team on logout:', error);
    });
    
    localStorage.removeItem('currentUser');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminAuthToken');
    setIsLoggedIn(false);
    setActiveTeam(null);
    localStorage.removeItem('latestTeam');
    
    // Trigger cross-tab synchronization for clearing active team
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'latestTeam',
      newValue: null,
      oldValue: null
    }));
  };

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
    setShowPassword(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      console.log('Attempting login with:', { email: loginEmail });
              const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Login-Type': 'user'
        },
        body: JSON.stringify({ 
          email: loginEmail, 
          password: loginPassword 
        })
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        console.log('Response not ok, status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        // Show user-friendly error message
        if (response.status === 401) {
          throw new Error('Invalid Credentials');
        } else {
          throw new Error('Login failed. Please try again.');
        }
      }

      const data = await response.json();
      console.log('Logged in user:', data.user);
      
      // Store user info in localStorage
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      
      // Clear any existing admin session to prevent conflicts
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminAuthToken');
      
      // Update login state
      setIsLoggedIn(true);
      
      // Close modal and clear form
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
      
      console.log('Login successful, staying on landing page');
      
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error.message);
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setLoginError('');
      }, 3000);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Check if user is logged in
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        JSON.parse(currentUser);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('currentUser');
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  // Update login state when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const currentUser = localStorage.getItem('currentUser');
      setIsLoggedIn(!!currentUser);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Cross-tab synchronization for active team
  useEffect(() => {
    const handleActiveTeamChange = () => {
      const latestTeam = localStorage.getItem('latestTeam');
      if (latestTeam) {
        try {
          const teamData = JSON.parse(latestTeam);
          setActiveTeam(teamData);
        } catch (error) {
          console.error('Error parsing latestTeam from localStorage:', error);
        }
      } else {
        setActiveTeam(null);
      }
    };

    // Listen for changes in other tabs
    window.addEventListener('storage', handleActiveTeamChange);
    
    // Also check localStorage periodically for changes within the same tab
    const interval = setInterval(handleActiveTeamChange, 1000);
    
    return () => {
      window.removeEventListener('storage', handleActiveTeamChange);
      clearInterval(interval);
    };
  }, []);

  // Test API connection (only log errors)
  useEffect(() => {
    const testApiConnection = async () => {
      try {
        const response = await fetch('/api/test');
        if (!response.ok) {
          console.error('API connection failed:', response.status);
        }
      } catch (error) {
        console.error('API connection error:', error);
      }
    };

    testApiConnection();
  }, []);

  // Load active team and fetch teams from API
  useEffect(() => {
    const loadActiveTeam = async () => {
      try {
        const response = await fetch('/api/teams/active');
        if (response.ok) {
          const activeTeamData = await response.json();
          setActiveTeam(activeTeamData);
        } else if (response.status === 404) {
          // 404 is expected when no active team exists
          console.log('No active team found (expected)');
          localStorage.removeItem('latestTeam');
          setActiveTeam(null);
        } else {
          console.log('Unexpected error loading active team:', response.status);
          localStorage.removeItem('latestTeam');
          setActiveTeam(null);
        }
      } catch (error) {
        console.error('Network error loading active team:', error);
        localStorage.removeItem('latestTeam');
        setActiveTeam(null);
      }
    };

    const fetchTeams = async () => {
      setLoadingTeams(true);
      try {
        const response = await fetch('/api/teams');
        if (response.ok) {
          const teamsData = await response.json();
          setTeams(teamsData);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setLoadingTeams(false);
      }
    };

    loadActiveTeam();
        fetchTeams();
  }, []);

  // Clear active team when entering LandingPage (user is no longer in a team)
  useEffect(() => {
    // Clear active team when user returns to landing page
    fetch('/api/teams/set-active', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ team_id: null }),
    }).catch(error => {
      console.error('Error clearing active team:', error);
    });
    
    // Also clear local state and trigger cross-tab synchronization
    setActiveTeam(null);
    localStorage.removeItem('latestTeam');
    
    // Trigger cross-tab synchronization for clearing active team
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'latestTeam',
      newValue: null,
      oldValue: null
    }));
  }, []);
  
  // const handleContinueWithCurrentTeam = () => {} // removed (unused)

  const handleSwitchOrAddTeam = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    
    if (teams.length === 0) {
      setShowAddTeamModal(true);
    } else {
      setShowTeamPickerModal(true);
    }
  };

  const handleSelectTeam = async (teamId) => {
    console.log('handleSelectTeam called with teamId:', teamId);
    
    // Prevent multiple clicks
    if (isOpeningTeam) return;
    
    try {
      const selectedTeam = teams.find(team => team.id === teamId);
      console.log('Selected team:', selectedTeam);
      
      // Set loading state
      setIsOpeningTeam(true);
      setOpeningTeamName(selectedTeam.name);
      
      // First check if team is available
      const availabilityResponse = await fetch('/api/teams/check-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ team_id: teamId }),
      });
      
      if (!availabilityResponse.ok) {
        const availabilityData = await availabilityResponse.json();
        throw new Error(availabilityData.message || 'Team is not available');
      }
      
      const availabilityData = await availabilityResponse.json();
      if (!availabilityData.available) {
        throw new Error(availabilityData.message || 'Team is not available');
      }
      
      const teamData = {
        teamName: selectedTeam.name,
        players: selectedTeam.players_data || [],
        id: selectedTeam.id
      };
      
      console.log('Team data to store:', teamData);
      
      // Store team data in localStorage
      localStorage.setItem('latestTeam', JSON.stringify(teamData));
      setActiveTeam(teamData);
      
      // Trigger cross-tab synchronization
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'latestTeam',
        newValue: JSON.stringify(teamData),
        oldValue: null
      }));
      
      console.log('About to activate team using safelyActivateTeam...');
      
      // Use the safelyActivateTeam function to handle session conflicts automatically
      console.log('Calling safelyActivateTeam for team ID:', teamId);
      
      try {
        const activationSuccess = await safelyActivateTeam(teamId);
        console.log('safelyActivateTeam result:', activationSuccess);

        if (activationSuccess) {
          console.log('Team activated successfully, closing modal and navigating...');
          setShowTeamPickerModal(false);
          console.log('About to navigate to /home with state:', { 
            selectedTeam: selectedTeam.name,
            activeTeamData: teamData 
          });
          navigate('/home', { 
            state: { 
              selectedTeam: selectedTeam.name,
              activeTeamData: teamData 
            } 
          });
          console.log('Navigation called');
        } else {
          console.error('Team activation failed');
          throw new Error('Failed to activate team. Please try again.');
        }
      } catch (activationError) {
        console.error('Error during team activation:', activationError);
        throw new Error(`Team activation error: ${activationError.message}`);
      }
    } catch (error) {
      console.error('Error in handleSelectTeam:', error);
      
             // Show error message to user
      if (error.message.includes('Team is currently being used by another user') || 
          error.message.includes('Team is currently active by another session')) {
        showError(`Cannot open team: ${error.message}`, "Team Unavailable", true);
      } else if (error.message.includes('Failed to activate team')) {
        showError(`Team activation failed. Please try again or refresh the page.`, "Activation Error");
      } else {
        showError(`Error opening team: ${error.message}`, "Error Opening Team");
      }
      
      // Reset loading state on error
      setIsOpeningTeam(false);
      setOpeningTeamName("");
    }
  };

  // Function to check if team name exists
  const checkTeamNameExists = async (name) => {
    if (!name || name.trim() === '') {
      return { exists: false, message: 'Team name cannot be empty' };
    }

    try {
      const response = await fetch('/api/teams/check-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      } else {
        console.error('Error checking team name:', response.status);
        return { exists: false, message: 'Error checking team name' };
      }
    } catch (error) {
      console.error('Network error checking team name:', error);
      return { exists: false, message: 'Network error checking team name' };
    }
  };

  const handleConfirm = async () => {
    if (isCreatingTeam) return; // Prevent spam clicking
    
    // Clear any previous errors
    setTeamNameError("");
    
    // Validate that all players have names and roles
    const invalidPlayers = players.filter(player => !player.name.trim() || !player.role.trim());
    if (invalidPlayers.length > 0) {
      setTeamNameError("All players must have both a name and a role assigned.");
      return;
    }
    
    // Check if team name exists before proceeding
    const nameCheck = await checkTeamNameExists(teamName);
    if (nameCheck.exists) {
      setTeamNameError(nameCheck.message);
      return;
    }
    
    setIsCreatingTeam(true);
    try {
      let logoPath = null;
      
      if (teamLogoFile) {
        console.log('Uploading logo file:', teamLogoFile.name);
        const formData = new FormData();
        formData.append('logo', teamLogoFile);
        
        const uploadResponse = await fetch('/api/teams/upload-logo', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          logoPath = uploadResult.logo_path;
          console.log('Logo uploaded successfully:', logoPath);
        } else {
          console.error('Failed to upload logo:', await uploadResponse.text());
        }
      } else {
        console.log('No logo file to upload');
      }
      
              // Normalize all player roles before sending to backend
      const normalizedPlayers = players.map(player => ({
        ...player,
        role: normalizeRole(player.role)
      }));
      
      console.log('Normalized players data:', normalizedPlayers);
      
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: teamName,
          players: normalizedPlayers,
          logo_path: logoPath
        }),
      });

      if (response.ok) {
        const newTeam = await response.json();
        
        const prevTeam = localStorage.getItem('latestTeam');
        if (prevTeam) {
          const history = JSON.parse(localStorage.getItem('teamsHistory')) || [];
          history.push(JSON.parse(prevTeam));
          localStorage.setItem('teamsHistory', JSON.stringify(history));
        }
        
        try {
          // Use safelyActivateTeam for the new team
          const activationSuccess = await safelyActivateTeam(newTeam.id);
          
          if (activationSuccess) {
            console.log('New team activated successfully:', newTeam.name);
          } else {
            console.warn('New team activation had issues, but proceeding');
          }
        } catch (error) {
          console.error('Error activating new team:', error);
          // Continue anyway since the team was created successfully
        }
        
        const teamData = {
          teamName,
          players: normalizedPlayers,
          id: newTeam.id
        };
        localStorage.setItem('latestTeam', JSON.stringify(teamData));
        
        // Trigger cross-tab synchronization
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'latestTeam',
          newValue: JSON.stringify(teamData),
          oldValue: null
        }));
        
        localStorage.removeItem('latestMatch');
        sessionStorage.clear();
        
        navigate('/home', { 
          state: { 
            selectedTeam: teamName,
            activeTeamData: teamData,
            isNewTeam: true
          } 
        });
        
        setShowAddTeamModal(false);
        setTeamLogo(null);
        setTeamLogoFile(null);
        setTeamName("");
        setTeamNameError("");
        setIsValidatingName(false);
        setPlayers([
          { role: "exp", name: "" },
          { role: "mid", name: "" },
          { role: "jungler", name: "" },
          { role: "gold", name: "" },
          { role: "roam", name: "" },
        ]);
      }
    } catch (error) {
      console.error('Error creating team:', error);
    } finally {
      setIsCreatingTeam(false);
    }
  };

  // Delete team functions
  const handleDeleteTeam = (team) => {
    setTeamToDelete(team);
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!teamToDelete) return;
    
    setIsDeletingTeam(true);
    try {
              const response = await fetch(`/api/teams/${teamToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Remove the team from the local state
        setTeams(teams.filter(team => team.id !== teamToDelete.id));
        
        // If this was the active team, clear it
        if (activeTeam && activeTeam.id === teamToDelete.id) {
          setActiveTeam(null);
          localStorage.removeItem('latestTeam');
          
          // Trigger cross-tab synchronization for clearing active team
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'latestTeam',
            newValue: null,
            oldValue: null
          }));
        }
        
        // Close the modal
        setShowDeleteConfirmModal(false);
        setTeamToDelete(null);
      } else {
        console.error('Failed to delete team:', await response.text());
      }
    } catch (error) {
      console.error('Error deleting team:', error);
    } finally {
      setIsDeletingTeam(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setTeamToDelete(null);
  };

  const showError = (message, title = "Error", showCleanupOption = false) => {
    setErrorMessage(message);
    setErrorTitle(title);
    setShowCleanupOption(showCleanupOption);
    setShowErrorModal(true);
  };

  const hideError = () => {
    setShowErrorModal(false);
    setErrorMessage("");
    setErrorTitle("Error");
  };

  // Force cleanup all active sessions (useful when teams get stuck)
  const forceCleanupSessions = async () => {
    try {
      const response = await fetch('/api/teams/force-cleanup-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Sessions cleaned up:', result);
        // Refresh teams list after cleanup
        window.location.reload();
      }
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
    }
  };

  const handleAddTeam = () => {
                if (!isLoggedIn) {
                  setShowLoginModal(true);
                } else {
                  setShowAddTeamModal(true);
                }
  };

  const handleSwitchToLogin = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };

    const onAddNewTeam = () => {
                       setShowTeamPickerModal(false);
                       setShowAddTeamModal(true);
   };

  // Handle closing the add team modal
  const handleCloseAddTeamModal = () => {
    setShowAddTeamModal(false);
    setTeamNameError("");
    setIsValidatingName(false);
    setTeamLogo(null);
    setTeamLogoFile(null);
    setTeamName("");
    setPlayers([
      { role: "exp", name: "" },
      { role: "mid", name: "" },
      { role: "jungler", name: "" },
      { role: "gold", name: "" },
      { role: "roam", name: "" },
    ]);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#181A20' }}>
      <PageTitle title="" />
      
      <Header 
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        onLoginClick={() => setShowLoginModal(true)}
        onAboutClick={() => {
          const el = document.getElementById('about-content');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />

      {/* Section 1: Hero full screen */}
      <section style={{
        minHeight: '100vh',
        background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${mainBg}) center/cover`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <HeroSection 
          isLoggedIn={isLoggedIn}
          hoveredBtn={hoveredBtn}
          setHoveredBtn={setHoveredBtn}
          onSwitchOrAddTeam={handleSwitchOrAddTeam}
          onAddTeam={handleAddTeam}
        />
      </section>

      {/* Section 2: About split (image left, content right) */}
      <section id="about-content" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', background: '#0f1117' }}>
        <div style={{ width: 'min(1280px, 95vw)', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28, alignItems: 'stretch' }}>
          {/* Left: animated image */}
          <div style={{ position: 'relative', minHeight: '64vh', borderRadius: 18, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${aboutBg})`, backgroundSize: 'cover', backgroundPosition: 'center', transform: 'translateX(-18px) scale(1.1)', opacity: 0, animation: 'aboutSlideIn 900ms ease forwards' }} />
            {/* vignette + highlight */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 100% at 0% 50%, rgba(59,130,246,0.15), transparent 55%), radial-gradient(100% 80% at 100% 50%, rgba(250,204,21,0.12), transparent 50%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.45), rgba(0,0,0,0.7))' }} />
          </div>
          <style>{`@keyframes aboutSlideIn { to{ transform:translateX(0) scale(1); opacity:1 } }`}</style>

          {/* Right: content card */}
          <div style={{ background: 'linear-gradient(180deg, rgba(23,23,35,0.92), rgba(23,23,35,0.78))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, boxShadow: '0 16px 52px rgba(0,0,0,0.55)', padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ display: 'inline-block', width: 8, height: 28, borderRadius: 6, background: 'linear-gradient(180deg, #3b82f6, #22c55e)' }} />
              <h2 style={{ color: '#fff', fontSize: 40, fontWeight: 800, letterSpacing: 0.5, margin: 0 }}>About Us</h2>
            </div>
            <p style={{ color: '#cbd5e1', lineHeight: 1.85, fontSize: 16 }}>
              We are a competitive esports analytics crew focused on turning raw gameplay into actionable insights. Our platform streamlines drafting,
              scrim reviews, and weekly performance tracking so coaches and players can focus on winning. With data-driven breakdowns, heat maps, and
              trend analyses, we help teams spot weaknesses fast and scale strengths even faster.
            </p>
            <p style={{ color: '#cbd5e1', lineHeight: 1.85, fontSize: 16, marginTop: 10 }}>
              Whether you're perfecting your early rotations, maximizing objectives, or expanding hero pools, our tooling is built for the grind.
              From mock drafts to 1v1 coaching logs, we make improvement visible.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
              <a href="https://www.facebook.com/mnski.Lenardkit" target="_blank" rel="noreferrer" aria-label="Coach on Facebook" style={{ width: 44, height: 44, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(59,130,246,0.05))', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.35)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.3l-.4 3h-1.9v7A10 10 0 0 0 22 12z"/></svg>
              </a>
              <a href="https://www.instagram.com/mlbb.codybanks/?hl=zh-cn" target="_blank" rel="noreferrer" aria-label="Coach on Instagram" style={{ width: 44, height: 44, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(236,72,153,0.05))', color: '#f9a8d4', border: '1px solid rgba(236,72,153,0.35)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm10 2c1.7 0 3 1.3 3 3v10c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3V7c0-1.7 1.3-3 3-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm6-1a1 1 0 100 2 1 1 0 000-2zm-6 3a3 3 0 110 6 3 3 0 010-6z"/></svg>
              </a>
              <a href="tel:09089039576" aria-label="Call Coach" style={{ width: 44, height: 44, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(250,204,21,0.25), rgba(250,204,21,0.05))', color: '#fde68a', border: '1px solid rgba(250,204,21,0.35)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
              </a>
            </div>
            {/* subtle divider glow */}
            <div style={{ height: 1, width: '100%', marginTop: 20, background: 'linear-gradient(90deg, rgba(59,130,246,0), rgba(59,130,246,0.45), rgba(59,130,246,0))' }} />
          </div>
        </div>
        {/* Responsive stack */}
        <style>{`
          @media (max-width: 1024px) {
            #about-content > div { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>

      {/* Footer - Programmer Credits */}
      <footer style={{ background: '#0a0b0f', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '16px', fontSize: 12, color: '#6b7280' }}>
          <span>Cody Banks Draft and Statistics is not affiliated with any third-party game, gamer, or gaming company. All trademarks displayed on the site are owned by third-parties and are used on Cody Banks Draft and Statistics for informational purposes only.</span>
        </div>
        <div style={{ maxWidth: 1200, margin: '16px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', fontSize: 12, color: '#6b7280' }}>
          <span>© 2025, Joshua Godalle. All rights reserved</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <img 
                src="https://flagcdn.com/w20/ph.png" 
                alt="Philippines flag" 
                style={{ width: 16, height: 'auto', borderRadius: '2px', marginRight: '4px' }} 
              /> 
              Developed in Philippines
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <a href="https://www.facebook.com/juswae.godalle" target="_blank" rel="noreferrer" aria-label="Facebook" style={{ color: '#6b7280', transition: 'color 0.2s' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/jshvaaaaa?igsh=enBvamFhMjhzbWJ5&utm_source=qr" target="_blank" rel="noreferrer" aria-label="Instagram" style={{ color: '#6b7280', transition: 'color 0.2s' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://github.com/shuaaae" target="_blank" rel="noreferrer" aria-label="GitHub" style={{ color: '#6b7280', transition: 'color 0.2s' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      <AddTeamModal
        showAddTeamModal={showAddTeamModal}
        setShowAddTeamModal={setShowAddTeamModal}
        onClose={handleCloseAddTeamModal}
        teamLogo={teamLogo}
        teamName={teamName}
        setTeamName={setTeamName}
        teamNameError={teamNameError}
        isValidatingName={isValidatingName}
        players={players}
        laneRoles={laneRoles}
        defaultRoles={defaultRoles}
        handleLogoChange={handleLogoChange}
        handlePlayerChange={handlePlayerChange}
        handleTeamNameChange={handleTeamNameChange}
        handleAddPlayer={handleAddPlayer}
        handleRoleChange={handleRoleChange}
        handleRemovePlayer={handleRemovePlayer}
        handleConfirm={handleConfirm}
        isCreatingTeam={isCreatingTeam}
      />

      <TeamPickerModal
        showTeamPickerModal={showTeamPickerModal}
        setShowTeamPickerModal={setShowTeamPickerModal}
        loadingTeams={loadingTeams}
        teams={teams}
        activeTeam={activeTeam}
        handleSelectTeam={handleSelectTeam}
        handleDeleteTeam={handleDeleteTeam}
        onAddNewTeam={onAddNewTeam}
        isOpeningTeam={isOpeningTeam}
      />

      <LoginModal
        showLoginModal={showLoginModal}
        handleCloseLoginModal={handleCloseLoginModal}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        loginError={loginError}
        isLoggingIn={isLoggingIn}
        showPassword={showPassword}
        togglePasswordVisibility={togglePasswordVisibility}
        handleLogin={handleLogin}
      />

      <SignupModal
        showSignupModal={showSignupModal}
        setShowSignupModal={setShowSignupModal}
        onSwitchToLogin={handleSwitchToLogin}
      />

      <DeleteConfirmModal
        showDeleteConfirmModal={showDeleteConfirmModal}
        teamToDelete={teamToDelete}
        isDeletingTeam={isDeletingTeam}
        handleConfirmDelete={handleConfirmDelete}
        handleCancelDelete={handleCancelDelete}
      />

      {/* Team Opening Loading Modal */}
      {isOpeningTeam && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90" style={{ pointerEvents: 'auto' }}>
          <div className="bg-[#23232a] rounded-2xl shadow-2xl p-8 min-w-[340px] max-w-[90vw] flex flex-col items-center z-[10000]">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mb-6"></div>
            <div className="text-white text-xl font-bold mb-2">Opening Team</div>
            <div className="text-gray-300 text-lg mb-4">{openingTeamName}</div>
            <div className="text-gray-400 text-sm text-center">Please wait while we prepare your team...</div>
          </div>
        </div>
      )}

             {/* Error Modal */}
       <ErrorModal
         show={showErrorModal}
         message={errorMessage}
         title={errorTitle}
         onClose={hideError}
         showCleanupOption={showCleanupOption}
         onCleanup={forceCleanupSessions}
       />

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          header {
            padding: 0 24px !important;
          }
          
          h1 {
            font-size: 2rem !important;
            padding: 0 16px !important;
          }
          
          p {
            font-size: 1rem !important;
            padding: 0 16px !important;
          }
          
          main {
            padding: 80px 24px 24px !important;
          }
          
          .button-container {
            flex-direction: column !important;
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
} 