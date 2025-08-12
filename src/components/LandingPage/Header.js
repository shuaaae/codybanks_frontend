import React from 'react';
import mobaImg from '../../assets/moba1.png';

export default function Header({ isLoggedIn, onLogout, onLoginClick, onAboutClick }) {
  return (
    <header
      style={{
        width: '100%',
        height: 80,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 50,
        boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
      }}>
        <img
          src={mobaImg}
          alt="Logo"
          style={{
            height: 128,
            width: 128,
            objectFit: 'contain',
            borderRadius: 8,
          }}
        />
      </div>

      {/* Navigation Links */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: 32,
      }}>
        <button
          style={{
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'color 0.3s ease',
          }}
          onMouseEnter={(e) => e.target.style.color = '#FFD600'}
          onMouseLeave={(e) => e.target.style.color = '#fff'}
          onClick={onAboutClick}
        >
          About Us
        </button>
        {isLoggedIn ? (
          <>
            <span style={{
              color: '#10b981',
              fontSize: 14,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Welcome, {JSON.parse(localStorage.getItem('currentUser'))?.name || 'User'}
            </span>
            <button
              style={{
                color: '#ef4444',
                fontSize: 16,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.3s ease',
              }}
              onMouseEnter={(e) => e.target.style.color = '#dc2626'}
              onMouseLeave={(e) => e.target.style.color = '#ef4444'}
              onClick={onLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <button
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={(e) => e.target.style.color = '#FFD600'}
            onMouseLeave={(e) => e.target.style.color = '#fff'}
            onClick={onLoginClick}
          >
            Login
          </button>
        )}
      </nav>
    </header>
  );
} 