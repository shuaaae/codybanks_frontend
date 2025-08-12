import React from 'react';
import { FaUsers, FaChartLine, FaTrophy, FaStar } from 'react-icons/fa';

const TeamDisplayCard = ({ teamName }) => {
  return (
    <div className="relative group mb-4 w-full max-w-4xl mx-auto">
      {/* Main Glassmorphism Card */}
      <div 
        className="relative flex items-center justify-center px-8 py-6 cursor-pointer transition-all duration-500 transform hover:scale-[1.02] hover:shadow-2xl"
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
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `
        }}
      >
        {/* Animated Border Glow */}
        <div 
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500"
          style={{
            background: `
              linear-gradient(90deg, 
                transparent, 
                rgba(147, 51, 234, 0.4) 50%, 
                transparent
              )
            `,
            filter: 'blur(2px)',
            animation: 'borderGlow 3s ease-in-out infinite'
          }}
        ></div>

        <div className="relative flex items-center justify-center space-x-8 z-10">
          {/* Enhanced Gaming Team Icon */}
          <div className="relative">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(147, 51, 234, 0.8) 0%, 
                    rgba(59, 130, 246, 0.8) 50%, 
                    rgba(16, 185, 129, 0.8) 100%
                  )
                `,
                boxShadow: `
                  0 10px 30px rgba(0, 0, 0, 0.3),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2)
                `
              }}
            >
              <FaUsers className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
            {/* Floating accent icons */}
            <FaTrophy className="absolute -top-2 -right-2 w-4 h-4 text-yellow-400 opacity-80 animate-bounce" style={{ animationDelay: '0.5s' }} />
          </div>
          
          {/* Team Info with Enhanced Typography */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center space-x-2 mb-2">
              <FaStar className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span 
                className="text-sm font-bold tracking-widest uppercase"
                style={{
                  background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: 'none'
                }}
              >
                CURRENT TEAM
              </span>
              <FaStar className="w-4 h-4 text-cyan-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
            <span 
              className="font-black text-4xl tracking-wide transform transition-all duration-300 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 1) 0%, rgba(59, 130, 246, 1) 50%, rgba(16, 185, 129, 1) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
                textShadow: 'none'
              }}
            >
              {teamName}
            </span>
          </div>
          
          {/* Enhanced Gaming Stats Icon */}
          <div className="relative">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3"
              style={{
                background: `
                  linear-gradient(135deg, 
                    rgba(16, 185, 129, 0.2) 0%, 
                    rgba(59, 130, 246, 0.2) 100%
                  )
                `,
                border: '1px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
              }}
            >
              <FaChartLine className="w-6 h-6 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-200" />
            </div>
          </div>
        </div>

        {/* Subtle Inner Glow */}
        <div 
          className="absolute inset-0 rounded-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at center, 
                rgba(147, 51, 234, 0.1) 0%, 
                transparent 70%
              )
            `
          }}
        ></div>
      </div>
      
      {/* Floating Particles Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
        <div className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-60 animate-ping" 
             style={{ top: '20%', left: '15%', animationDelay: '0s', animationDuration: '2s' }}></div>
        <div className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-40 animate-ping" 
             style={{ top: '70%', right: '20%', animationDelay: '1s', animationDuration: '3s' }}></div>
      </div>

      <style jsx>{`
        @keyframes borderGlow {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default TeamDisplayCard; 