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

// Global cache for matches data - enhanced to support multiple team/mode combinations
const matchesCache = {
  data: {}, // Store data for multiple combinations: { 'teamId_modeType': { data, timestamp } }
  isLoading: {}, // Track loading state for each combination
  lastAccess: {} // Track last access time for each combination
};

// Global cache for hero data
const heroCache = {
  data: null,
  timestamp: null,
  isLoading: false
};

// Global function to set header navigation flag
export const setHeaderNavigation = (value) => {
  isHeaderNavigation = value;
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
    const response = await fetch('/api/heroes');
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

// Global function to get matches data with enhanced caching
export const getMatchesData = async (teamId = null, matchType = 'scrim') => {
  const cacheKey = `${teamId || 'no-team'}_${matchType}`;
  
  // If we have cached data for this combination and it's less than 2 minutes old, return it
  if (matchesCache.data[cacheKey] && matchesCache.data[cacheKey].timestamp && 
      (Date.now() - matchesCache.data[cacheKey].timestamp) < 2 * 60 * 1000) {
    console.log('Returning cached matches data for:', cacheKey);
    matchesCache.lastAccess[cacheKey] = Date.now();
    return matchesCache.data[cacheKey].data;
  }

  // If already loading this combination, wait for the current request
  if (matchesCache.isLoading[cacheKey]) {
    console.log('Matches data already loading for:', cacheKey, 'waiting...');
    return new Promise((resolve) => {
      const checkCache = () => {
        if (!matchesCache.isLoading[cacheKey] && matchesCache.data[cacheKey]) {
          resolve(matchesCache.data[cacheKey].data);
        } else {
          setTimeout(checkCache, 100);
        }
      };
      checkCache();
    });
  }

  // Start loading
  matchesCache.isLoading[cacheKey] = true;
  console.log('Fetching matches data from API for:', cacheKey);

  try {
    const url = teamId ? `/api/matches?team_id=${teamId}&match_type=${matchType}` : `/api/matches?match_type=${matchType}`;
    
    // Prepare headers with team ID for backend compatibility
    const headers = {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br'
    };
    
    // Add team ID header if available
    if (teamId) {
      headers['X-Active-Team-ID'] = teamId;
    }
    
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the data for this specific combination
    matchesCache.data[cacheKey] = {
      data: data,
      timestamp: Date.now()
    };
    matchesCache.lastAccess[cacheKey] = Date.now();
    matchesCache.isLoading[cacheKey] = false;
    
    console.log('Matches data cached successfully for:', cacheKey);
    return data;
  } catch (error) {
    console.error('Error fetching matches data for:', cacheKey, error);
    matchesCache.isLoading[cacheKey] = false;
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
  matchesCache.data = {};
  matchesCache.isLoading = {};
  matchesCache.lastAccess = {};
  console.log('Matches cache cleared');
};

// Function to clear specific combination from cache
export const clearMatchesCacheForCombination = (teamId = null, matchType = 'scrim') => {
  const cacheKey = `${teamId || 'no-team'}_${matchType}`;
  if (matchesCache.data[cacheKey]) {
    delete matchesCache.data[cacheKey];
    delete matchesCache.isLoading[cacheKey];
    delete matchesCache.lastAccess[cacheKey];
    console.log('Cleared cache for:', cacheKey);
  }
};

// Function to get cache status for debugging
export const getMatchesCacheStatus = () => {
  return {
    cachedCombinations: Object.keys(matchesCache.data),
    loadingCombinations: Object.keys(matchesCache.isLoading).filter(key => matchesCache.isLoading[key]),
    lastAccess: matchesCache.lastAccess
  };
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
