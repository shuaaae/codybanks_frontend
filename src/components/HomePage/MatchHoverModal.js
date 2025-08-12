import React from 'react';
import hoverBg from '../../assets/hoverbg.jpg';

// Optimized hero image component
const OptimizedHeroImage = React.memo(({ heroName, size = 40, isBan = false, className = "", heroMap }) => {
  const [imageError, setImageError] = React.useState(false);
  const hero = heroMap.get(heroName);
  const imagePath = hero ? `/public/heroes/${hero.role?.trim().toLowerCase()}/${hero.image.replace('.png', '.webp')}` : null;
  
  if (!hero || !imagePath) {
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          borderRadius: '50%', 
          background: '#23283a', 
          border: '2px solid #23283a' 
        }} 
        className={className}
      />
    );
  }
  
  return (
    <>
      {!imageError ? (
        <img
          src={imagePath}
          alt={heroName}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            border: isBan ? '2px solid #f87171' : '2px solid #22c55e',
            background: '#181A20'
          }}
          className={`${className} hover:scale-110 hover:shadow-lg transition-transform duration-200`}
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: '#23283a',
            border: isBan ? '2px solid #f87171' : '2px solid #22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isBan ? '#f87171' : '#22c55e',
            fontSize: Math.max(8, size * 0.15),
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '2px'
          }}
          className={`${className} hover:scale-110 hover:shadow-lg transition-transform duration-200`}
        >
          {heroName}
        </div>
      )}
    </>
  );
});

// Optimized ban hero icon component
const OptimizedBanHeroIcon = React.memo(({ heroName, heroMap }) => {
  const [imageError, setImageError] = React.useState(false);
  
  // Handle null/undefined heroName
  if (!heroName) {
    return (
      <div style={{ 
        width: 40, 
        height: 40, 
        borderRadius: '50%', 
        background: '#23283a', 
        border: '2px solid #f87171', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        opacity: 0.5
      }} />
    );
  }
  
  const hero = heroMap.get(heroName);
  const imagePath = hero ? `/public/heroes/${hero.role?.trim().toLowerCase()}/${hero.image.replace('.png', '.webp')}` : null;
  
  if (!hero || !imagePath) {
    return (
      <div style={{ 
        width: 40, 
        height: 40, 
        borderRadius: '50%', 
        background: '#23283a', 
        border: '2px solid #f87171', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#f87171',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {heroName}
      </div>
    );
  }
  
  return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: '#181A20', border: '2px solid #f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px #0002', transition: 'transform 0.15s', pointerEvents: 'auto' }} className="hover:scale-110 hover:shadow-lg">
      {!imageError ? (
        <img 
          src={imagePath} 
          alt={heroName} 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            border: 'none'
          }} 
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#23283a',
          color: '#f87171',
          fontSize: '8px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          {heroName}
        </div>
      )}
    </div>
  );
});

export default function MatchHoverModal({ match, heroMap, isVisible }) {
  if (!isVisible || !match) return null;

  // Center the hovered details
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const modalHeight = 520; // Approximate modal height
  const modalWidth = 800; // Modal width

  // Calculate center position
  let top = (viewportHeight - modalHeight) / 2 + window.scrollY;
  let left = (viewportWidth - modalWidth) / 2 + window.scrollX;

  // Ensure modal stays within viewport bounds
  if (top < window.scrollY + 16) {
    top = window.scrollY + 16;
  }
  if (top + modalHeight > viewportHeight + window.scrollY) {
    top = viewportHeight + window.scrollY - modalHeight - 16;
  }
  if (left < window.scrollX + 16) {
    left = window.scrollX + 16;
  }
  if (left + modalWidth > viewportWidth + window.scrollX) {
    left = viewportWidth + window.scrollX - modalWidth - 16;
  }

  // Prepare team data
  const blueTeam = match.teams.find(t => t.team_color === 'blue');
  const redTeam = match.teams.find(t => t.team_color === 'red');

  // Combine bans (max 5)
  const getBans = (team) => {
    const bans = [...(team.banning_phase1 || []), ...(team.banning_phase2 || [])];
    while (bans.length < 5) bans.push(null);
    return bans.slice(0, 5);
  };

  // Combine picks (vertical)
  const getPicks = (team) => {
    return [...(team.picks1 || []), ...(team.picks2 || [])];
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: left,
        top: top,
        zIndex: 9999,
        background: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${hoverBg}) center/cover`,
        color: 'white',
        borderRadius: 12,
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.25)',
        padding: 24,
        minWidth: 800,
        pointerEvents: 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        maxHeight: '90vh',
        overflowY: 'auto',
        opacity: 0,
        animation: 'slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      }}
    >
      {/* Visual Draft View */}
      <div style={{
        display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: 800, height: 400, marginBottom: 24,
        borderRadius: 16,
        padding: '24px',
        position: 'relative',
        overflow: 'visible',
      }}>
        
        {/* Team 1 (Blue) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: 120, zIndex: 1, position: 'absolute', left: 0, maxWidth: '150px' }}>
          <div style={{ 
            fontWeight: 'bold', 
            color: '#60a5fa', 
            marginBottom: 8, 
            fontSize: 18,
            textAlign: 'left',
            wordWrap: 'break-word',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%'
          }}>{blueTeam?.team || 'Team 1'}</div>
          {/* Bans for Blue Team */}
          <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 12, marginLeft: 0, justifyContent: 'flex-start', gap: 8 }}>
            {getBans(blueTeam).map((heroName, idx) => {
              return (
                <div key={idx} style={{ margin: 0 }}>
                  <OptimizedBanHeroIcon heroName={heroName} heroMap={heroMap} />
                </div>
              );
            })}
          </div>
          {/* Picks vertical */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {getPicks(blueTeam).map((pickObj, idx) => {
              const heroName = typeof pickObj === 'string' ? pickObj : pickObj.hero;
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <OptimizedHeroImage heroName={heroName} size={56} heroMap={heroMap} />
                  <span style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 'bold' }}>{heroName}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Statistics */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          padding: '24px',
          background: 'rgba(0,0,0,0.7)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(15px)',
          position: 'absolute',
          top: '65%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2,
          width: '500px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            width: '100%',
          }}>
            {/* Turtle Taken */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '12px',
              background: 'linear-gradient(135deg, rgba(255,193,7,0.15), rgba(255,193,7,0.05))',
              borderRadius: '10px',
              border: '1px solid rgba(255,193,7,0.2)',
              boxShadow: '0 4px 12px rgba(255,193,7,0.1)',
              position: 'relative',
            }}>
              <div style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 'bold', marginBottom: '8px' }}>Turtle</div>
              <div style={{ fontSize: '16px', color: 'white', fontWeight: 'bold', textAlign: 'center', width: '100%' }}>{match.turtle_taken ?? 'N/A'}</div>
            </div>

            {/* Lord Taken */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '12px',
              background: 'linear-gradient(135deg, rgba(147,51,234,0.15), rgba(147,51,234,0.05))',
              borderRadius: '10px',
              border: '1px solid rgba(147,51,234,0.2)',
              boxShadow: '0 4px 12px rgba(147,51,234,0.1)',
              position: 'relative',
            }}>
              <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 'bold', marginBottom: '8px' }}>Lord</div>
              <div style={{ fontSize: '16px', color: 'white', fontWeight: 'bold', textAlign: 'center', width: '100%' }}>{match.lord_taken ?? 'N/A'}</div>
            </div>
          </div>

          {/* Playstyle and Notes */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: '16px',
            width: '100%',
          }}>
            {match.playstyle && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '12px',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))',
                borderRadius: '10px',
                border: '1px solid rgba(59,130,246,0.2)',
                boxShadow: '0 4px 12px rgba(59,130,246,0.1)',
                position: 'relative',
              }}>
                <div style={{ fontSize: '10px', color: '#93c5fd', fontWeight: 'bold', marginBottom: '8px' }}>Playstyle</div>
                <div style={{ fontSize: '14px', color: 'white', fontWeight: 'semibold', textAlign: 'center', width: '100%' }}>{match.playstyle}</div>
              </div>
            )}

            {match.notes && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
                borderRadius: '12px',
                border: '1px solid rgba(34,197,94,0.2)',
                boxShadow: '0 4px 12px rgba(34,197,94,0.1)',
                position: 'relative',
              }}>
                <div style={{ fontSize: '10px', color: '#86efac', fontWeight: 'bold', marginBottom: '8px' }}>Notes</div>
                <div style={{ fontSize: '16px', color: 'white', fontWeight: 'semibold', textAlign: 'center', width: '100%' }}>{match.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* Team 2 (Red) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: 120, zIndex: 1, position: 'absolute', right: 0, maxWidth: '150px' }}>
          <div style={{ 
            fontWeight: 'bold', 
            color: '#f87171', 
            marginBottom: 8, 
            fontSize: 18,
            textAlign: 'right',
            wordWrap: 'break-word',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%'
          }}>{redTeam?.team || 'Team 2'}</div>
          {/* Bans for Red Team */}
          <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 12, marginRight: 0, justifyContent: 'flex-end', gap: 8 }}>
            {getBans(redTeam).map((heroName, idx) => {
              return (
                <div key={idx} style={{ margin: 0 }}>
                  <OptimizedBanHeroIcon heroName={heroName} heroMap={heroMap} />
                </div>
              );
            })}
          </div>
          {/* Picks vertical */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {getPicks(redTeam).map((pickObj, idx) => {
              const heroName = typeof pickObj === 'string' ? pickObj : pickObj.hero;
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '12px', color: '#f87171', fontWeight: 'bold', minWidth: '60px', textAlign: 'right' }}>{heroName}</span>
                  <OptimizedHeroImage heroName={heroName} size={56} heroMap={heroMap} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 