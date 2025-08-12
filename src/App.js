import './App.css';
import React, { useState, useEffect } from 'react';
import LoadingScreen from './screens/loadingScreen';
import HomePage from './screens/HomePage';
import LandingPage from './screens/LandingPage';
import MockDraft from './screens/MockDraft';
import PlayersStatistic from './screens/PlayersStatistic';
import WeeklyReport from './screens/WeeklyReport';
import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';
import AdminIndex from './admin/AdminIndex';
import ProtectedRoute from './components/ProtectedRoute';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Global variable to track header navigation
let isHeaderNavigation = false;

// Global hero cache
let heroCache = {
  data: null,
  timestamp: null,
  isLoading: false
};

// Global matches cache
let matchesCache = {
  data: null,
  timestamp: null,
  isLoading: false,
  teamId: null
};

// Global function to set header navigation flag
export const setHeaderNavigation = (value) => {
  isHeaderNavigation = value;
  console.log('Header navigation set to:', value);
};

// Global function to get hero data with caching
export const getHeroData = async () => {
  // If we have cached data and it's less than 5 minutes old, return it
  if (heroCache.data && heroCache.timestamp && (Date.now() - heroCache.timestamp) < 5 * 60 * 1000) {
    console.log('Returning cached hero data');
    return heroCache.data;
  }

  // If already loading, wait for the current request
  if (heroCache.isLoading) {
    console.log('Hero data already loading, waiting...');
    return new Promise((resolve) => {
      const checkCache = () => {
        if (!heroCache.isLoading && heroCache.data) {
          resolve(heroCache.data);
        } else {
          setTimeout(checkCache, 100);
        }
      };
      checkCache();
    });
  }

  // Start loading
  heroCache.isLoading = true;
  console.log('Fetching hero data from API...');

  try {
    const response = await fetch('/public/api/heroes');
    const data = await response.json();
    
    // Cache the data
    heroCache.data = data;
    heroCache.timestamp = Date.now();
    heroCache.isLoading = false;
    
    console.log('Hero data cached successfully');
    return data;
  } catch (error) {
    console.error('Error fetching hero data:', error);
    heroCache.isLoading = false;
    throw error;
  }
};

// Global function to get matches data with caching
export const getMatchesData = async (teamId = null) => {
  // If we have cached data for this team and it's less than 2 minutes old, return it
  if (matchesCache.data && matchesCache.timestamp && matchesCache.teamId === teamId && (Date.now() - matchesCache.timestamp) < 2 * 60 * 1000) {
    console.log('Returning cached matches data for team:', teamId);
    return matchesCache.data;
  }

  // If already loading, wait for the current request
  if (matchesCache.isLoading) {
    console.log('Matches data already loading, waiting...');
    return new Promise((resolve) => {
      const checkCache = () => {
        if (!matchesCache.isLoading && matchesCache.data) {
          resolve(matchesCache.data);
        } else {
          setTimeout(checkCache, 100);
        }
      };
      checkCache();
    });
  }

  // Start loading
  matchesCache.isLoading = true;
  console.log('Fetching matches data from API for team:', teamId);

  try {
    const url = teamId ? `/public/api/matches?team_id=${teamId}` : '/public/api/matches';
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the data
    matchesCache.data = data;
    matchesCache.timestamp = Date.now();
    matchesCache.teamId = teamId;
    matchesCache.isLoading = false;
    
    console.log('Matches data cached successfully');
    return data;
  } catch (error) {
    console.error('Error fetching matches data:', error);
    matchesCache.isLoading = false;
    throw error;
  }
};

// Function to clear hero cache (for debugging or manual refresh)
export const clearHeroCache = () => {
  heroCache.data = null;
  heroCache.timestamp = null;
  heroCache.isLoading = false;
  console.log('Hero cache cleared');
};

// Function to clear matches cache (for debugging or manual refresh)
export const clearMatchesCache = () => {
  matchesCache.data = null;
  matchesCache.timestamp = null;
  matchesCache.isLoading = false;
  matchesCache.teamId = null;
  console.log('Matches cache cleared');
};

// Wrapper component to handle loading states
function PageWrapper({ children, setLoading }) {
  const location = useLocation();

  useEffect(() => {
    // Skip loading screen if navigation is from header
    if (isHeaderNavigation) {
      console.log('Skipping loading screen for header navigation');
      return;
    }

    console.log('Showing loading screen for navigation');
    // Immediately show loading screen and disable scrolling
    document.body.classList.add('loading');
    setLoading(true);
    
    // Add a small delay to ensure loading screen appears before content
    const timer = setTimeout(() => {
      setLoading(false);
      // Remove loading class after loading is complete
      document.body.classList.remove('loading');
    }, 600); // Reduced to 600ms for faster transitions
    
    return () => {
      clearTimeout(timer);
      document.body.classList.remove('loading');
    };
  }, [location, setLoading]);

  return children;
}

function AppRoutes({ setLoading }) {
  return (
    <PageWrapper setLoading={setLoading}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={<AdminIndex />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/mock-draft" element={
          <ProtectedRoute>
            <MockDraft />
          </ProtectedRoute>
        } />
        <Route path="/players-statistic" element={
          <ProtectedRoute>
            <PlayersStatistic />
          </ProtectedRoute>
        } />
        <Route path="/weekly-report" element={
          <ProtectedRoute>
            <WeeklyReport />
          </ProtectedRoute>
        } />
      </Routes>
    </PageWrapper>
  );
}

function App() {
  const [loading, setLoading] = useState(true);

  // Add loading class to body on initial load
  useEffect(() => {
    document.body.classList.add('loading');
    const timer = setTimeout(() => {
      setLoading(false);
      document.body.classList.remove('loading');
    }, 600);
    return () => {
      clearTimeout(timer);
      document.body.classList.remove('loading');
    };
  }, []);

  return (
    <Router>
      {loading && <LoadingScreen />}
      <AppRoutes setLoading={setLoading} />
    </Router>
  );
}

export default App;
