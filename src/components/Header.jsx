import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import mobaImg from '../assets/moba1.png';
import { setHeaderNavigation } from '../App';

const Header = ({ 
  currentUser, 
  onLogout, 
  onShowProfile, 
  navLinks = [
    { label: 'DATA DRAFT', path: '/home' },
    { label: 'MOCK DRAFT', path: '/mock-draft' },
    { label: 'PLAYERS STATISTIC', path: '/players-statistic' },
    { label: 'WEEKLY REPORT', path: '/weekly-report' },
  ]
}) => {
  const navigate = useNavigate();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

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
      className="w-full fixed top-0 left-0 z-50 flex items-center justify-between px-12"
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
      
      {/* Nav Links */}
      <nav className="flex justify-end w-full">
        <ul className="flex gap-10 mr-8">
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
      </nav>
      
      {/* User Avatar and Dropdown */}
      <div className="relative user-dropdown">
        <button
          onClick={() => setShowUserDropdown(!showUserDropdown)}
          className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white transition-all duration-200 hover:scale-105 shadow-lg"
        >
          {/* Square Avatar with Black and White Icon */}
          <svg className="w-6 h-6" fill="white" stroke="black" strokeWidth="1" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showUserDropdown && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50">
            {/* User Info Section */}
            <div className="px-4 py-3 border-b border-gray-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-0">
                  <svg className="w-6 h-6" fill="white" stroke="black" strokeWidth="1" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-white font-medium text-sm">
                    {currentUser?.name || 'User'}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {currentUser?.email || 'user@example.com'}
                  </div>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
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