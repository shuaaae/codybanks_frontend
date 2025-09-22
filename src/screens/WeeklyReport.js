import React, { useState, useEffect } from 'react';
import navbarBg from '../assets/navbarbackground.jpg';
import { useNavigate } from 'react-router-dom';
import { addDays, format, startOfWeek } from 'date-fns';
import PageTitle from '../components/PageTitle';
import Header from '../components/Header';
import useSessionTimeout from '../hooks/useSessionTimeout';
import { buildApiUrl } from '../config/api';
import userService from '../utils/userService';
import {
  DateRangePicker,
  ProgressionChart,
  NotesEditor,
  SavedNotesList,
  SessionTimeoutModal,
  FullNoteModal,
  SuccessModal,
  ProfileModal,
  ObjectiveStatsModal
} from '../components/WeeklyReport';

function getProgressionScore(win, lose) {
  const total = win + lose;
  if (total === 0) return null;
  const winRate = win / total;
  if (winRate >= 0.9) return 5;
  if (winRate >= 0.7) return 4;
  if (winRate >= 0.5) return 3;
  if (winRate >= 0.2) return 2;
  return 1;
}

// Helper function to get default date range
function getDefaultDateRange() {
  return [
    {
      startDate: addDays(new Date(), -6),
      endDate: new Date(),
      key: 'selection',
    },
  ];
}

// Helper function to load date range from localStorage
function loadDateRangeFromStorage() {
  try {
    const savedDateRange = localStorage.getItem('weeklyReportDateRange');
    if (savedDateRange) {
      const parsed = JSON.parse(savedDateRange);
      // Convert string dates back to Date objects
      return parsed.map(range => ({
        ...range,
        startDate: new Date(range.startDate),
        endDate: new Date(range.endDate)
      }));
    }
  } catch (error) {
    console.error('Error loading date range from localStorage:', error);
  }
  return getDefaultDateRange();
}

// Helper function to save date range to localStorage
function saveDateRangeToStorage(dateRange) {
  try {
    localStorage.setItem('weeklyReportDateRange', JSON.stringify(dateRange));
  } catch (error) {
    console.error('Error saving date range to localStorage:', error);
  }
}

export default function WeeklyReport() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState(loadDateRangeFromStorage);
  const [showPicker, setShowPicker] = useState(false);
  const [progressionData, setProgressionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [savedNotes, setSavedNotes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSessionTimeoutModal, setShowSessionTimeoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showFullNoteModal, setShowFullNoteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest');
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [objectiveType, setObjectiveType] = useState('turtle');
  const [objectiveRows, setObjectiveRows] = useState([]);
  const [objectiveAnalysis, setObjectiveAnalysis] = useState({ days: 0, totalRespawns: 0, totalTakes: 0, percentage: 0 });
  const [objectiveHistory, setObjectiveHistory] = useState({}); // { weekKey: { turtleRows, lordRows } }
  const [objectiveWeeks, setObjectiveWeeks] = useState([]);
  const [selectedObjectiveWeek, setSelectedObjectiveWeek] = useState('');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [matchMode, setMatchMode] = useState(() => {
    const savedMode = localStorage.getItem('selectedMatchMode');
    return savedMode || 'scrim';
  });

  // User session timeout: 30 minutes
  useSessionTimeout(30, 'currentUser', '/', (timeoutMinutes) => {
    setShowSessionTimeoutModal(true);
  });

  // Automatically set team as active when entering WeeklyReport
  useEffect(() => {
    const activateTeam = async () => {
      const latestTeam = localStorage.getItem('latestTeam');
      if (latestTeam) {
        try {
          const teamData = JSON.parse(latestTeam);
          console.log('Activating team:', teamData);
          
          // Set this team as active when entering the page
          const response = await fetch(buildApiUrl('/teams/set-active'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ team_id: teamData.id }),
          });
          
          if (response.ok) {
            console.log('Team activated successfully');
          } else {
            console.error('Failed to activate team:', response.status);
          }
        } catch (error) {
          console.error('Error setting team as active:', error);
        }
      } else {
        console.warn('No team found in localStorage');
      }
    };
    
    activateTeam();
  }, []);

  // Clear active team when leaving WeeklyReport
  useEffect(() => {
    return () => {
      // Clear active team when component unmounts (user leaves the page)
      fetch(buildApiUrl('/teams/set-active'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ team_id: null }),
      }).catch(error => {
        console.error('Error clearing active team:', error);
      });
    };
  }, []);

  // Handle scroll for header visibility
  useEffect(() => {
    let lastScroll = 0;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScroll || currentScrollY <= 5) {
        // Scrolling up or at very top - show header
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScroll && currentScrollY > 5) {
        // Hide immediately when scrolling down past 5px
        setIsHeaderVisible(false);
      }
      
      lastScroll = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Empty dependency array to avoid re-creating

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

  // Save date range to localStorage whenever it changes
  useEffect(() => {
    saveDateRangeToStorage(dateRange);
  }, [dateRange]);

  // Listen for localStorage changes to sync matchMode
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'selectedMatchMode' && e.newValue) {
        setMatchMode(e.newValue);
      }
    };

    const handleFocus = () => {
      const savedMode = localStorage.getItem('selectedMatchMode');
      if (savedMode && savedMode !== matchMode) {
        setMatchMode(savedMode);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [matchMode]);

  const handleLogout = () => {
    // Clear active team when logging out
    fetch(buildApiUrl('/teams/set-active'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ team_id: null }),
    }).catch(error => {
      console.error('Error clearing active team on logout:', error);
    });

    localStorage.removeItem('currentUser');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminAuthToken');
    navigate('/');
  };

  // Load notes from database on mount
  useEffect(() => {
    loadNotesFromDatabase();
  }, []);

  // Fetch data immediately when component mounts (if date range is available)
  useEffect(() => {
    if (dateRange && dateRange[0] && dateRange[0].startDate && dateRange[0].endDate) {
      const startDate = format(dateRange[0].startDate, 'yyyy-MM-dd');
      const endDate = format(dateRange[0].endDate, 'yyyy-MM-dd');
      
      if (startDate && endDate) {
        setLoading(true);
        
        console.log('Initial data fetch on mount for date range:', startDate, 'to', endDate);
        
        // Get team_id from localStorage
        const latestTeam = JSON.parse(localStorage.getItem('latestTeam') || '{}');
        const teamId = latestTeam.id;
        console.log('Using team_id for initial API call:', teamId);
        
        const apiUrl = teamId ? 
          buildApiUrl(`/matches?match_type=${matchMode}&team_id=${teamId}`) : 
          buildApiUrl(`/matches?match_type=${matchMode}`);
        
        console.log('Initial API URL:', apiUrl);
        
        fetch(apiUrl, {
          credentials: 'include'
        })
          .then(res => res.json())
          .then(data => {
            console.log('Initial matches data:', data);
            
            // Since backend now filters by team ID automatically, we only need to filter by date
            const filtered = data.filter(match => {
              const d = new Date(match.match_date);
              return d >= new Date(startDate) && d <= new Date(endDate);
            });
            
            console.log('Initial date filtered matches:', filtered);
            
            // Get current team name for display purposes
            const currentTeam = getCurrentTeam();
            console.log('Current team:', currentTeam);
            
            const dayMap = {};
            for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
              const key = d.toISOString().slice(0, 10);
              dayMap[key] = { win: 0, lose: 0 };
            }
            
            filtered.forEach(match => {
              const key = new Date(match.match_date).toISOString().slice(0, 10);
              if (!(key in dayMap)) return;
              
              // Since backend filters by team ID, all matches returned are for the current team
              // We can determine win/loss by checking if the current team is the winner
              if (currentTeam && currentTeam.trim() !== '') {
                const team = match.teams.find(t => t.team === currentTeam);
                if (team) {
                  if (team.team === match.winner) dayMap[key].win++;
                  else dayMap[key].lose++;
                }
              } else {
                // Fallback: if no team name, just count as a match
                dayMap[key].win++;
              }
            });
            
            console.log('Initial day map:', dayMap);
            
            const days = Object.keys(dayMap).sort();
            const progression = days.map(day => {
              const { win, lose } = dayMap[day];
              return {
                day,
                score: getProgressionScore(win, lose),
                win,
                lose
              };
            });
            
            console.log('Initial progression data:', progression);
            setProgressionData(progression);
            
            // Precompute objective rows for turtle and lord
            const toRows = (arr, type) => arr
              .sort((a,b)=> new Date(a.match_date)-new Date(b.match_date))
              .map(m => {
                const d = new Date(m.match_date);
                const key = d.toISOString().slice(0, 10);
                if (key >= startDate && key <= endDate) {
                  return {
                    date: key,
                    turtle: m.turtle_taken,
                    lord: m.lord_taken,
                    winner: m.winner,
                    teams: m.teams
                  };
                }
                return null;
              }).filter(Boolean);
            
                         setObjectiveRows(toRows(filtered, 'turtle'));
            
            // Update objective history
            const weekKey = `${startDate}_${endDate}`;
            setObjectiveHistory(prev => ({
              ...prev,
              [weekKey]: {
                turtleRows: toRows(filtered, 'turtle'),
                lordRows: toRows(filtered, 'lord')
              }
            }));
            
            setObjectiveWeeks(prev => {
              if (!prev.includes(weekKey)) {
                return [...prev, weekKey];
              }
              return prev;
            });
            
            setSelectedObjectiveWeek(weekKey);
            
            setLoading(false);
          })
          .catch(error => {
            console.error('Error fetching initial data:', error);
            setLoading(false);
          });
      }
    }
  }, [dateRange, matchMode]);

  // Function to load notes from database
  const loadNotesFromDatabase = async () => {
    try {
      const response = await fetch(buildApiUrl('/notes'), {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSavedNotes(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  // Function to save a new note
  const handleSaveNote = async () => {
    if (!noteTitle.trim() || !notes.trim()) {
      alert('Please enter both a title and notes content.');
      return;
    }

    try {
      const response = await fetch(buildApiUrl('/notes'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: noteTitle.trim(),
          content: notes.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await loadNotesFromDatabase();
        setNoteTitle('');
        setNotes('');
        
        setSuccessMessage('Note saved successfully!');
        setShowSuccessModal(true);
        
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 2000);
      } else {
        alert(data.message || 'Failed to save note.');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    }
  };

  // Function to delete a saved note
  const handleDeleteNote = async (noteId) => {
    try {
      const response = await fetch(buildApiUrl(`/notes/${noteId}`), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await loadNotesFromDatabase();
        
        setSuccessMessage('Note deleted successfully!');
        setShowSuccessModal(true);
        
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 2000);
      } else {
        alert(data.message || 'Failed to delete note.');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note. Please try again.');
    }
  };

  // Function to view full note
  const handleViewFullNote = (note) => {
    setSelectedNote(note);
    setShowFullNoteModal(true);
  };

  // Function to format date in MM/DD/YY format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
  };

  // Function to sort notes by date
  const getSortedNotes = () => {
    return [...savedNotes].sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };

  // Helper to get current team strictly from localStorage active team
  function getCurrentTeam() {
    try {
      const latestTeam = JSON.parse(localStorage.getItem('latestTeam'));
      console.log('Latest team from localStorage:', latestTeam);
      if (latestTeam && latestTeam.teamName) {
        console.log('Returning team name:', latestTeam.teamName);
        return latestTeam.teamName;
      } else {
        console.warn('No teamName found in latestTeam:', latestTeam);
      }
    } catch (error) {
      console.warn('Error parsing latestTeam from localStorage:', error);
    }
    console.warn('No active team found, returning null');
    return null; // no active team
  }

  const startDate = format(dateRange[0].startDate, 'yyyy-MM-dd');
  const endDate = format(dateRange[0].endDate, 'yyyy-MM-dd');

  useEffect(() => {
    if (!startDate || !endDate) return;
    setLoading(true);
    
    console.log('Fetching matches for date range:', startDate, 'to', endDate);
    
    // Get team_id from localStorage
    const latestTeam = JSON.parse(localStorage.getItem('latestTeam') || '{}');
    const teamId = latestTeam.id;
    console.log('Using team_id for API call:', teamId);
    
    const apiUrl = teamId ? 
      buildApiUrl(`/matches?match_type=${matchMode}&team_id=${teamId}`) : 
      buildApiUrl(`/matches?match_type=${matchMode}`);
    
    console.log('API URL:', apiUrl);
    
    fetch(apiUrl, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        console.log('All matches data:', data);
        
        // Since backend now filters by team ID automatically, we only need to filter by date
        const filtered = data.filter(match => {
          const d = new Date(match.match_date);
          return d >= new Date(startDate) && d <= new Date(endDate);
        });
        
        console.log('Date filtered matches:', filtered);
        
        // Get current team name for display purposes
        const currentTeam = getCurrentTeam();
        console.log('Current team:', currentTeam);
        
        const dayMap = {};
        for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().slice(0, 10);
          dayMap[key] = { win: 0, lose: 0 };
        }
        
        filtered.forEach(match => {
          const key = new Date(match.match_date).toISOString().slice(0, 10);
          if (!(key in dayMap)) return;
          
          console.log('Processing match:', {
            match_id: match.id,
            match_date: match.match_date,
            winner: match.winner,
            teams: match.teams,
            currentTeam
          });
          
          // Since backend filters by team ID, all matches returned are for the current team
          // We can determine win/loss by checking if the current team is the winner
          if (currentTeam && currentTeam.trim() !== '') {
            const team = match.teams.find(t => t.team === currentTeam);
            console.log('Found team in match:', team);
            if (team) {
              if (team.team === match.winner) {
                dayMap[key].win++;
                console.log(`Win recorded for ${key}`);
              } else {
                dayMap[key].lose++;
                console.log(`Loss recorded for ${key}`);
              }
            } else {
              // Try case-insensitive matching as fallback
              const teamCaseInsensitive = match.teams.find(t => 
                t.team && t.team.toLowerCase() === currentTeam.toLowerCase()
              );
              if (teamCaseInsensitive) {
                console.log('Found team with case-insensitive matching:', teamCaseInsensitive);
                if (teamCaseInsensitive.team === match.winner) {
                  dayMap[key].win++;
                  console.log(`Win recorded for ${key} (case-insensitive match)`);
                } else {
                  dayMap[key].lose++;
                  console.log(`Loss recorded for ${key} (case-insensitive match)`);
                }
              } else {
                console.warn(`No team found for current team "${currentTeam}" in match ${match.id}. Available teams:`, match.teams.map(t => t.team));
                // Since backend filters by team_id, assume this is our team's match
                // Check if any team in this match is the winner (this is a fallback)
                const ourTeam = match.teams.find(t => t.team === match.winner);
                if (ourTeam) {
                  dayMap[key].win++;
                  console.log(`Fallback win recorded for ${key} (winner team)`);
                } else {
                  dayMap[key].lose++;
                  console.log(`Fallback loss recorded for ${key} (not winner team)`);
                }
              }
            }
          } else {
            // Fallback: if no team name, just count as a match
            dayMap[key].win++;
            console.log(`Fallback win recorded for ${key}`);
          }
        });
        
        console.log('Day map:', dayMap);
        
        const days = Object.keys(dayMap).sort();
        const progression = days.map(day => {
          const { win, lose } = dayMap[day];
          return {
            day,
            score: getProgressionScore(win, lose),
            win,
            lose
          };
        });
        
        console.log('Progression data:', progression);
        setProgressionData(progression);
        // Precompute objective rows for turtle and lord
        const toRows = (arr, type) => arr
          .sort((a,b)=> new Date(a.match_date)-new Date(b.match_date))
          .map(m => {
            const total = (type === 'turtle' ? (m.turtle_taken || '0-0') : (m.lord_taken || '0-0'));
            const [blueStr, redStr] = String(total).split('-');
            const blue = parseInt(blueStr || '0', 10);
            const red = parseInt(redStr || '0', 10);
            // Determine which side is "our" based on active team and match teams
            let our = blue;
            let opp = red;
            if (currentTeam && m.teams && Array.isArray(m.teams)) {
              const ourTeamEntry = m.teams.find(t => t.team === currentTeam);
              if (ourTeamEntry) {
                if (ourTeamEntry.team_color === 'red') {
                  our = red;
                  opp = blue;
                } else {
                  // blue side
                  our = blue;
                  opp = red;
                }
              }
            }
            return { date: new Date(m.match_date).toISOString().slice(0,10), our, opp, label: `${blue}-${red}` };
          });
        const turtleRows = toRows(filtered, 'turtle');
        // Store last computed in state for modal use
        setObjectiveRows(turtleRows);
        // Compute analysis helper
        const makeAnalysis = (rows) => {
        const days = new Set(rows.map(r => r.date)).size;
        const totalTakes = rows.reduce((sum, r) => sum + r.our, 0);
        const totalRespawns = rows.reduce((sum, r) => sum + r.our + r.opp, 0);
        const percentage = totalRespawns === 0 ? 0 : (totalTakes / totalRespawns) * 100;
        return { days, totalRespawns, totalTakes, percentage };
        };
        setObjectiveAnalysis(makeAnalysis(turtleRows));
        // Build weekly history from all matches (not just filtered) using ISO week starting Monday
        const groupByWeek = (arr) => {
          const groups = {};
          arr.forEach(m => {
            const wkStart = startOfWeek(new Date(m.match_date), { weekStartsOn: 1 });
            const key = format(wkStart, 'yyyy-MM-dd');
            if (!groups[key]) groups[key] = [];
            groups[key].push(m);
          });
          return groups;
        };
        const weeklyGroups = groupByWeek(filtered);
        const history = {};
        Object.keys(weeklyGroups).forEach(weekKey => {
          const wkArr = weeklyGroups[weekKey];
          const wkTurtle = toRows(wkArr, 'turtle');
          const wkLord = toRows(wkArr, 'lord');
          history[weekKey] = {
            turtleRows: wkTurtle,
            lordRows: wkLord,
            turtleAnalysis: makeAnalysis(wkTurtle),
            lordAnalysis: makeAnalysis(wkLord)
          };
        });
        const weekKeys = Object.keys(history).sort();
        setObjectiveHistory(history);
        setObjectiveWeeks(weekKeys);
        setSelectedObjectiveWeek(weekKeys[weekKeys.length - 1] || '');
        // Expose a function on window for opening with correct type
        window.__openObjectiveStats = (type) => {
          const latestKey = weekKeys[weekKeys.length - 1];
          const bundle = history[latestKey] || { turtleRows: [], lordRows: [], turtleAnalysis: {days:0,totalRespawns:0,totalTakes:0,percentage:0}, lordAnalysis: {days:0,totalRespawns:0,totalTakes:0,percentage:0} };
          const rows = type === 'lord' ? bundle.lordRows : bundle.turtleRows;
          const analysis = type === 'lord' ? bundle.lordAnalysis : bundle.turtleAnalysis;
          setSelectedObjectiveWeek(latestKey);
          setObjectiveRows(rows);
          setObjectiveAnalysis(analysis);
          setObjectiveType(type);
          setShowObjectiveModal(true);
        };
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching matches:', error);
        setLoading(false);
      });
  }, [startDate, endDate, matchMode]);

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${navbarBg}) center/cover, #181A20` }}>
      <PageTitle title="Weekly Report" />
      
      {/* Fixed Header with Solid Background */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 bg-gray-900 ${
          isHeaderVisible 
            ? 'translate-y-0 opacity-100' 
            : '-translate-y-full opacity-0'
        }`}
        style={{ 
          background: '#1a1a1a',
          borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
        }}
      >
        <Header 
          currentUser={currentUser}
          onLogout={handleLogout}
          onShowProfile={() => setShowProfileModal(true)}
        />
      </div>

      {/* Main Content - Fixed padding so content goes under header */}
      <div className="pt-20 pb-8 min-h-screen">
        <div className="w-full flex flex-col items-start pl-8 pr-8">
          <div className="w-full flex flex-row items-start gap-4">
            {/* Chart container */}
            <div className="bg-[#23232a] rounded-xl shadow-lg p-8 flex-1 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3 gap-3">
                <DateRangePicker 
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  showPicker={showPicker}
                  setShowPicker={setShowPicker}
                />
                <div className="flex items-center gap-2">
                  <button
                    className={`px-3 py-2 rounded text-white text-sm transition-colors ${
                      isDrawingMode 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-orange-600 hover:bg-orange-700'
                    }`}
                    onClick={() => setIsDrawingMode(!isDrawingMode)}
                  >
                    {isDrawingMode ? 'Exit Drawing' : 'Coach Feedback'}
                  </button>
                  <button
                    className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    onClick={() => window.__openObjectiveStats && window.__openObjectiveStats('turtle')}
                  >
                    Turtle Statistics
                  </button>
                  <button
                    className="px-3 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm"
                    onClick={() => window.__openObjectiveStats && window.__openObjectiveStats('lord')}
                  >
                    Lord Statistics
                  </button>
                </div>
              </div>
              <ProgressionChart 
                progressionData={progressionData}
                loading={loading}
                dateRange={dateRange}
                isDrawingMode={isDrawingMode}
              />
            </div>
            
            {/* Notes field */}
            <NotesEditor 
              noteTitle={noteTitle}
              setNoteTitle={setNoteTitle}
              notes={notes}
              setNotes={setNotes}
              onSaveNote={handleSaveNote}
            />
          </div>
          
          {/* Saved Notes Display */}
          <div className="w-full mt-6">
            <SavedNotesList 
              savedNotes={savedNotes}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              onDeleteNote={handleDeleteNote}
              onViewFullNote={handleViewFullNote}
              formatDate={formatDate}
              getSortedNotes={getSortedNotes}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={currentUser}
        onUserUpdate={(updatedUser) => {
          setCurrentUser(updatedUser);
        }}
      />

      <SessionTimeoutModal
        isOpen={showSessionTimeoutModal}
        onClose={() => setShowSessionTimeoutModal(false)}
        timeoutMinutes={30}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        message={successMessage}
      />

      <FullNoteModal
        isOpen={showFullNoteModal}
        onClose={() => setShowFullNoteModal(false)}
        note={selectedNote}
      />

      <ObjectiveStatsModal
        isOpen={showObjectiveModal}
        onClose={() => setShowObjectiveModal(false)}
        type={objectiveType}
        rows={objectiveRows}
        analysis={objectiveAnalysis}
        weeks={objectiveWeeks}
        selectedWeek={selectedObjectiveWeek}
        onSelectWeek={(weekKey, type) => {
          setSelectedObjectiveWeek(weekKey);
          const bundle = objectiveHistory[weekKey];
          if (!bundle) return;
          const rows = type === 'lord' ? bundle.lordRows : bundle.turtleRows;
          const analysis = type === 'lord' ? bundle.lordAnalysis : bundle.turtleAnalysis;
          setObjectiveRows(rows);
          setObjectiveAnalysis(analysis);
          setObjectiveType(type);
        }}
      />
    </div>
  );
}
