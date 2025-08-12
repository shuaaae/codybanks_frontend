import React, { useState } from 'react';
import defaultPlayer from '../../assets/default.png';
import expBg from '../../assets/expbg.jpg';
import midBg from '../../assets/midbg.jpg';
import roamBg from '../../assets/roambg.jpg';
import goldBg from '../../assets/goldbg.jpg';
import jungleBg from '../../assets/junglebg.jpg';

const PlayerCard = ({ lane, player, hero, highlight, onClick, getPlayerPhoto }) => {
  const [isHovered, setIsHovered] = useState(false);
  const playerPhoto = getPlayerPhoto ? getPlayerPhoto(player.name) : (player.photo ? player.photo : defaultPlayer);
  
  // Define role-specific colors and gradients
  const getRoleColors = (laneKey) => {
    const roleColors = {
      exp: {
        primary: 'rgba(220, 38, 127, 0.8)', // Pink
        secondary: 'rgba(147, 51, 234, 0.6)', // Purple
        accent: '#ec4899',
        glow: 'rgba(220, 38, 127, 0.3)'
      },
      mid: {
        primary: 'rgba(59, 130, 246, 0.8)', // Blue
        secondary: 'rgba(16, 185, 129, 0.6)', // Emerald
        accent: '#3b82f6',
        glow: 'rgba(59, 130, 246, 0.3)'
      },
      jungler: {
        primary: 'rgba(16, 185, 129, 0.8)', // Emerald
        secondary: 'rgba(34, 197, 94, 0.6)', // Green
        accent: '#10b981',
        glow: 'rgba(16, 185, 129, 0.3)'
      },
      gold: {
        primary: 'rgba(245, 158, 11, 0.8)', // Amber
        secondary: 'rgba(251, 191, 36, 0.6)', // Yellow
        accent: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.3)'
      },
      roam: {
        primary: 'rgba(147, 51, 234, 0.8)', // Purple
        secondary: 'rgba(168, 85, 247, 0.6)', // Violet
        accent: '#9333ea',
        glow: 'rgba(147, 51, 234, 0.3)'
      },
      sub: {
        primary: 'rgba(107, 114, 128, 0.8)', // Gray
        secondary: 'rgba(156, 163, 175, 0.6)', // Light Gray
        accent: '#6b7280',
        glow: 'rgba(107, 114, 128, 0.3)'
      }
    };
    return roleColors[laneKey] || roleColors.sub;
  };

  const colors = getRoleColors(lane.key);
  
  return (
    <button
      type="button"
      className="group relative flex items-center transition-all duration-500 overflow-hidden cursor-pointer focus:outline-none transform hover:scale-[1.03] hover:-translate-y-2"
      style={{ 
        width: '100%',
        maxWidth: '580px',
        height: '180px',
        borderRadius: '20px',
        border: 'none',
        background: 'transparent'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Glassmorphism Card Background */}
      <div 
        className="absolute inset-0 transition-all duration-500"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(255, 255, 255, 0.1) 0%, 
              rgba(255, 255, 255, 0.05) 50%, 
              rgba(255, 255, 255, 0.02) 100%
            )
          `,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `2px solid ${isHovered ? colors.primary : 'rgba(255, 255, 255, 0.1)'}`,
          borderRadius: '20px',
          boxShadow: isHovered 
            ? `
                0 20px 60px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `
            : `
                0 8px 32px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `
        }}
      />

      {/* Role-specific Background Pattern */}
      {(lane.key === 'exp' || lane.key === 'mid' || lane.key === 'roam' || lane.key === 'gold' || lane.key === 'jungler') && (
        <div 
          className="absolute inset-0 opacity-30 transition-all duration-500"
          style={{
            background: `
              linear-gradient(135deg, 
                ${colors.primary} 0%, 
                ${colors.secondary} 100%
              ),
              url(${
                lane.key === 'exp' ? expBg :
                lane.key === 'mid' ? midBg :
                lane.key === 'roam' ? roamBg :
                lane.key === 'gold' ? goldBg :
                jungleBg
              }) center/cover
            `,
            backgroundBlendMode: 'overlay',
            borderRadius: '20px',
            filter: isHovered ? 'brightness(1.2) saturate(1.3)' : 'brightness(0.8)'
          }}
        />
      )}

      {/* Animated Glow Ring */}
      {isHovered && (
        <div 
          className="absolute inset-0 animate-pulse"
          style={{
            background: `
              conic-gradient(
                from 0deg,
                ${colors.primary},
                ${colors.secondary},
                ${colors.primary}
              )
            `,
            borderRadius: '20px',
            padding: '2px',
            zIndex: -1
          }}
        >
          <div 
            className="w-full h-full rounded-[18px]"
            style={{
              background: 'rgba(0, 0, 0, 0.8)'
            }}
          />
        </div>
      )}

      {/* Player Image Container */}
      <div className="relative flex-shrink-0 z-20 ml-4" style={{ width: 160, height: 160 }}>
        <div className="relative w-full h-full">

          
          <img
            src={playerPhoto}
            alt="Player"
            className="relative w-full h-full object-cover rounded-2xl transition-all duration-500 transform group-hover:scale-105"
            style={{ 
              objectPosition: 'center',
              border: `2px solid ${isHovered ? colors.accent : 'rgba(255, 255, 255, 0.2)'}`,
              boxShadow: isHovered 
                ? `0 10px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                : '0 4px 15px rgba(0, 0, 0, 0.3)'
            }}
            onError={(e) => {
              console.error(`Failed to load image: ${playerPhoto}`);
              e.target.src = defaultPlayer;
            }}
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex items-center justify-between px-6 z-30">
        {/* Player Name */}
        <div className="flex flex-col justify-center">
          {/* Name Background */}
          <div 
            className="relative px-4 py-2 rounded-xl mb-2 transition-all duration-300"
            style={{
              background: isHovered 
                ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                : 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%)',
              border: `2px solid ${isHovered ? colors.accent : 'rgba(255, 255, 255, 0.2)'}`,
              boxShadow: isHovered 
                ? `0 8px 25px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                : '0 4px 15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
          >
            <div 
              className="text-xl font-black tracking-wide transition-all duration-300 transform group-hover:scale-105 text-center"
              style={{
                color: 'white',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
                filter: 'none'
              }}
            >
              {player.name}
            </div>
          </div>
          
          {/* Role Label */}
          <div 
            className="text-xs font-bold tracking-widest uppercase text-center px-3 py-1 rounded-full transition-all duration-300"
            style={{
              background: isHovered 
                ? `linear-gradient(90deg, ${colors.accent}20 0%, ${colors.accent}40 100%)`
                : 'linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.2) 100%)',
              color: isHovered ? colors.accent : 'rgba(255, 255, 255, 0.8)',
              border: `1px solid ${isHovered ? colors.accent + '60' : 'rgba(255, 255, 255, 0.2)'}`,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'
            }}
          >
            {lane.label}
          </div>
        </div>

        {/* Lane Icon */}
        <div className="relative">
          <div 
            className="relative w-20 h-20 rounded-xl flex items-center justify-center transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-3"
            style={{
              background: isHovered 
                ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                : 'rgba(255, 255, 255, 0.1)',
              border: `2px solid ${isHovered ? colors.accent : 'rgba(255, 255, 255, 0.2)'}`,
              boxShadow: isHovered 
                ? `0 10px 25px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
                : '0 4px 15px rgba(0, 0, 0, 0.2)'
            }}
          >
            <img 
              src={lane.icon} 
              alt={lane.label} 
              className="w-12 h-12 object-contain transition-all duration-300 group-hover:drop-shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Floating Particles */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          <div 
            className="absolute w-2 h-2 rounded-full opacity-60 animate-ping" 
            style={{ 
              top: '20%', 
              left: '30%', 
              background: colors.accent,
              animationDelay: '0s', 
              animationDuration: '2s' 
            }}
          />
          <div 
            className="absolute w-1 h-1 rounded-full opacity-40 animate-ping" 
            style={{ 
              top: '70%', 
              right: '25%', 
              background: colors.accent,
              animationDelay: '1s', 
              animationDuration: '3s' 
            }}
          />
        </div>
      )}
    </button>
  );
};

export default PlayerCard; 