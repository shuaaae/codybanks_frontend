import React from 'react';

export default function HeroSection({ 
  isLoggedIn, 
  hoveredBtn, 
  setHoveredBtn, 
  onSwitchOrAddTeam, 
  onAddTeam 
}) {
  return (
    <main style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 80,
      paddingLeft: 48,
      paddingRight: 48,
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: 800,
        width: '100%',
      }}>
        {/* Hero Headline */}
        <h1 style={{
          color: '#fff',
          fontSize: '3.5rem',
          fontWeight: 800,
          marginBottom: 24,
          letterSpacing: 1,
          lineHeight: 1.2,
          textShadow: '0 4px 24px rgba(0,0,0,0.8)',
          textTransform: 'uppercase',
        }}>
          Create Your Team Now and Plan Your Strategy
        </h1>
        
        {/* Subtext */}
        <p style={{
          color: '#f3f4f6',
          fontSize: '1.25rem',
          marginBottom: 48,
          fontWeight: 500,
          textShadow: '0 2px 12px rgba(0,0,0,0.8)',
          maxWidth: 600,
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.6,
        }}>
          The ultimate draft and statistics platform for esports teams.<br />
          Track, analyze, and strategize your matches with a game-inspired experience.
        </p>
        
        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: 24,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <button
            style={{
              background: hoveredBtn === 'switchteam' ? 'transparent' : 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
              color: hoveredBtn === 'switchteam' ? '#3b82f6' : '#fff',
              fontWeight: 800,
              fontSize: '1.125rem',
              padding: '16px 32px',
              borderRadius: 12,
              border: `2px solid ${hoveredBtn === 'switchteam' ? '#3b82f6' : 'transparent'}`,
              boxShadow: '0 4px 24px rgba(59, 130, 246, 0.3)',
              cursor: 'pointer',
              letterSpacing: 1,
              textTransform: 'uppercase',
              transition: 'all 0.25s ease',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
              minWidth: 200,
            }}
            onClick={onSwitchOrAddTeam}
            onMouseEnter={() => setHoveredBtn('switchteam')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            {isLoggedIn ? 'Switch Team' : 'Login to Switch Team'}
          </button>

          <button
            style={{
              background: hoveredBtn === 'addteam' ? 'transparent' : 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
              color: hoveredBtn === 'addteam' ? '#10b981' : '#fff',
              fontWeight: 800,
              fontSize: '1.125rem',
              padding: '16px 32px',
              borderRadius: 12,
              border: `2px solid ${hoveredBtn === 'addteam' ? '#10b981' : 'transparent'}`,
              boxShadow: '0 4px 24px rgba(16, 185, 129, 0.3)',
              cursor: 'pointer',
              letterSpacing: 1,
              textTransform: 'uppercase',
              transition: 'all 0.25s ease',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
              minWidth: 200,
            }}
            onClick={onAddTeam}
            onMouseEnter={() => setHoveredBtn('addteam')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            {isLoggedIn ? 'Add New Team' : 'Login to Add Team'}
          </button>
        </div>
      </div>
    </main>
  );
} 