import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import mobaImg from '../assets/moba1.png';
import { setHeaderNavigation } from '../App';
import userService from '../utils/userService';

const Header = ({
  currentUser,
  onLogout,
  onShowProfile,
  currentMode,
  navLinks = [
    { label: 'DATA DRAFT', path: '/home' },
    { label: 'MOCK DRAFT', path: '/mock-draft' },
    { label: 'PLAYERS STATISTIC', path: '/players-statistic' },
    { label: 'WEEKLY REPORT', path: '/weekly-report' },
  ]
}) => {
  // Debug: Log the currentUser data structure
  console.log('Header currentUser:', currentUser);
  
  // Ensure currentUser is a valid object
  const safeUser = currentUser && typeof currentUser === 'object' ? currentUser : null;
  
  // State for user photo URL
  const [userPhotoUrl, setUserPhotoUrl] = useState(null);
  
  // Fetch user photo from database when component mounts or user changes
  useEffect(() => {
    const fetchUserPhoto = async () => {
      if (safeUser && safeUser.id) {
        try {
          const result = await userService.getCurrentUserWithPhoto();
          if (result.success && result.user.photo) {
            const photoUrl = userService.getUserPhotoUrl(result.user);
            setUserPhotoUrl(photoUrl);
          }
        } catch (error) {
          console.error('Error fetching user photo:', error);
          // Fallback to localStorage photo if available
          if (safeUser.photo) {
            setUserPhotoUrl(safeUser.photo);
          }
        }
      }
    };

    fetchUserPhoto();
  }, [safeUser]);
  
  const navigate = useNavigate();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showBurgerModal, setShowBurgerModal] = useState(false);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.user-dropdown')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  const handleProfileClick = () => {
    setShowUserDropdown(false);
    if (onShowProfile) {
      onShowProfile();
    }
  };



  const handleBackToHome = () => {
    setShowUserDropdown(false);
    navigate('/');
  };

  const handleLogoutClick = () => {
    setShowUserDropdown(false);
    if (onLogout) {
      onLogout();
    }
  };

  const handleHeaderNavigation = (path) => {
    console.log('Header navigation triggered:', path);
    setHeaderNavigation(true);
    navigate(path);
    // Reset the flag after navigation
    setTimeout(() => {
      setHeaderNavigation(false);
    }, 100);
  };

  return (
    <header
      className="w-full fixed top-0 left-0 z-50 flex items-center px-12"
      style={{
        height: 80,
        background: 'transparent',
        boxShadow: 'none',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-4 select-none cursor-pointer" onClick={() => handleHeaderNavigation('/home')}>
        <img
          src={mobaImg}
          alt="Logo"
          className="h-32 w-32 object-contain"
          style={{ borderRadius: 28, background: 'transparent', boxShadow: 'none' }}
        />
      </div>

      {/* Title - Show on all pages when currentMode is available */}
      {currentMode && (
        <div className="flex-1 flex justify-center">
          <div className="text-center">
            <h1 className="text-xl font-bold text-blue-200 leading-tight">
              Cody Banks Draft and Statistics System
            </h1>
            <span className="text-base text-gray-300">
              <strong>{currentMode === 'scrim' ? 'SCRIM MODE' : 'TOURNAMENT MODE'}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Nav Links */}
      <nav className="flex items-center">
        <ul className="gap-10 hidden md:flex mr-8">
          {navLinks.map(link => (
            <li key={link.label}>
              <button
                className={`uppercase font-extrabold tracking-widest text-base transition-all px-2 py-1 ` +
                  (window.location.pathname === link.path
                    ? 'text-[#FFD600] border-b-2 border-[#FFD600]'
                    : 'text-white hover:text-[#FFD600] hover:border-b-2 hover:border-[#FFD600]')}
                style={{ background: 'none', border: 'none', outline: 'none' }}
                onClick={() => handleHeaderNavigation(link.path)}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Hero Tier List Button */}
        <button
          onClick={() => handleHeaderNavigation('/tier-list')}
          className="hidden md:flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 mr-4"
        >
          <span className="text-lg">🏆</span>
          <span className="text-sm">TIER LIST</span>
        </button>

        <div onClick={() => setShowBurgerModal(true)} className="md:hidden cursor-pointer ">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </div>
      </nav>


      <div className={`" ${showBurgerModal ? 'left-[200px]' : 'left-[500px]'} transition-all  flex  duration-300 bg-[#2458c979] md:hidden backdrop-blur-md w-full h-screen absolute top-0 z-50 "`}>
        <div className="flex flex-col">
        <div onClick={() => setShowBurgerModal(false)} className="text-white text-2xl font-bold pr-10 pt-8">Exit</div>

        <div>
          {navLinks.map(link => (
            <div key={link.label}>
              <button
                className={`uppercase font-extrabold tracking-widest text-base transition-all px-2 py-1 ` +
                  (window.location.pathname === link.path
                    ? 'text-[#FFD600] border-b-2 border-[#FFD600]'
                    : 'text-white hover:text-[#FFD600] hover:border-b-2 hover:border-[#FFD600]')}
                style={{ background: 'none', border: 'none', outline: 'none' }}
                onClick={() => handleHeaderNavigation(link.path)}
              >
                {link.label}
              </button>
            </div>
          ))}
        </div>

        </div>
      </div>

      {/* User Avatar and Dropdown */}
      <div className="relative user-dropdown" style={{ zIndex: 1000 }}>
        <button
          onClick={() => setShowUserDropdown(!showUserDropdown)}
          className="w-10 h-10 hidden md:flex rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white transition-all duration-200 hover:scale-105 shadow-lg overflow-hidden"
        >
          {/* User Photo or Default Icon */}
          {userPhotoUrl ? (
            <img 
              src={userPhotoUrl} 
              alt="Profile" 
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
          ) : null}
          <svg 
            className={`w-6 h-6 ${userPhotoUrl ? 'hidden' : 'block'}`} 
            fill="white" 
            stroke="black" 
            strokeWidth="1" 
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showUserDropdown && (
          <div className="absolute hidden md:block right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50" style={{ minWidth: '200px', zIndex: 1001 }}>
            {/* User Info Section */}
            <div className="px-4 py-3 border-b border-gray-600">
              <div>
                <div className="text-white font-medium text-sm">
                  {safeUser?.name || safeUser?.username || (safeUser?.email && safeUser.email.includes('@') ? safeUser.email.split('@')[0] : 'User')}
                </div>
                <div className="text-gray-400 text-xs">
                  {safeUser?.email || safeUser?.username || 'user@example.com'}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={handleProfileClick}
                className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-gray-700 transition-colors text-sm"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  Profile
                </div>
              </button>

              

              <button
                onClick={handleBackToHome}
                className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-gray-700 transition-colors text-sm"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Back to Home Page
                </div>
              </button>

              {/* Divider */}
              <div className="border-t border-gray-600 my-1"></div>

              {/* Logout Button */}
              <button
                onClick={handleLogoutClick}
                className="w-full px-4 py-2 text-left text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors text-sm"
              >
                <div className="flex items-center gap-2">
                  <FaSignOutAlt className="w-4 h-4" />
                  Logout
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

    </header>
  );
};

export default Header; 