import React from 'react';
import { FaTimes, FaUpload, FaEye, FaTrophy, FaCrosshairs } from 'react-icons/fa';

const PlayerModal = ({ 
  modalInfo, 
  onClose, 
  getPlayerPhoto, 
  heroStats, 
  heroH2HStats, 
  isLoadingStats, 
  onFileSelect, 
  uploadingPlayer, 
  onViewPerformance 
}) => {
  if (!modalInfo) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn"
      style={{
        background: `
          radial-gradient(ellipse at center, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.95) 100%),
          linear-gradient(45deg, rgba(147, 51, 234, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)
        `,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}
      onClick={onClose}
    >
      <div 
        className="relative flex flex-col animate-slideIn max-h-[90vh] overflow-hidden"
        style={{ 
          width: '95vw',
          maxWidth: '900px',
          background: `
            linear-gradient(135deg, 
              rgba(255, 255, 255, 0.1) 0%, 
              rgba(255, 255, 255, 0.05) 50%, 
              rgba(255, 255, 255, 0.02) 100%
            )
          `,
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: '2px solid rgba(147, 51, 234, 0.3)',
          borderRadius: '24px',
          boxShadow: `
            0 25px 80px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Border Glow */}
        <div 
          className="absolute inset-0 rounded-3xl opacity-60"
          style={{
            background: `
              conic-gradient(
                from 0deg,
                rgba(147, 51, 234, 0.4) 0deg,
                rgba(59, 130, 246, 0.4) 120deg,
                rgba(16, 185, 129, 0.4) 240deg,
                rgba(147, 51, 234, 0.4) 360deg
              )
            `,
            padding: '2px',
            zIndex: -1,
            animation: 'borderRotate 6s linear infinite'
          }}
        >
          <div 
            className="w-full h-full rounded-[22px]"
            style={{
              background: 'rgba(0, 0, 0, 0.8)'
            }}
          />
        </div>

        {/* Close Button */}
        <button 
          className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:rotate-90"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.8) 0%, rgba(220, 38, 127, 0.8) 100%)',
            border: '2px solid rgba(239, 68, 68, 0.5)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
          }}
          onClick={onClose}
        >
          <FaTimes className="w-4 h-4 text-white" />
        </button>
        
        {/* Header Section */}
        <div className="relative p-8 border-b border-white/10">
          {/* Player Profile Header */}
          <div className="flex items-center justify-center space-x-6">
            {/* Player Image with Enhanced Effects */}
            <div className="relative group">
              <div 
                className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"
                style={{ filter: 'blur(8px)', transform: 'scale(1.1)' }}
              />
              <img
                src={getPlayerPhoto(modalInfo.player.name, modalInfo.player.role)}
                alt="Player"
                className="relative w-20 h-20 object-cover rounded-full cursor-pointer transition-all duration-300 transform group-hover:scale-110 border-4 border-white/20 group-hover:border-purple-400/60"
                onClick={() => onFileSelect && onFileSelect()}
                title="Click to upload new photo"
                style={{ 
                  opacity: uploadingPlayer === modalInfo.player.name ? 0.5 : 1, 
                  objectPosition: 'center',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                }}
              />
              {/* Upload Indicator */}
              <div 
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(34, 197, 94, 0.8) 100%)',
                  border: '2px solid rgba(16, 185, 129, 0.5)',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
                }}
              >
                <FaUpload className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Player Info */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center gap-4 mb-3">
                <div 
                  className="text-3xl font-black tracking-wide"
                  style={{
                    background: 'linear-gradient(135deg, rgba(147, 51, 234, 1) 0%, rgba(59, 130, 246, 1) 50%, rgba(16, 185, 129, 1) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
                  }}
                >
                  {modalInfo.player.name}
                </div>
                
                {/* Enhanced Lane Icon */}
                <div className="relative">
                  <div 
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400/30 to-blue-400/30 animate-pulse"
                    style={{ filter: 'blur(6px)', transform: 'scale(1.2)' }}
                  />
                  <div 
                    className="relative w-16 h-16 rounded-xl flex items-center justify-center border-2 border-white/20"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <img 
                      src={modalInfo.lane.icon} 
                      alt={modalInfo.lane.label} 
                      className="w-10 h-10 object-contain drop-shadow-lg" 
                    />
                  </div>
                </div>
              </div>
              
              {/* Role Label */}
              <div 
                className="text-sm font-bold tracking-widest uppercase px-4 py-1 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, rgba(147, 51, 234, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)',
                  border: '1px solid rgba(147, 51, 234, 0.5)',
                  color: 'rgba(147, 51, 234, 1)'
                }}
              >
                {modalInfo.lane.label}
              </div>
              
              {/* Upload Status */}
              {uploadingPlayer === modalInfo.player.name && (
                <div className="flex items-center space-x-2 mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-400 border-t-transparent"></div>
                  <div className="text-emerald-400 text-sm font-medium">Uploading...</div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Hero Stats Table */}
          <div className="w-full">
            <div className="flex items-center space-x-3 mb-4">
              <FaTrophy className="w-5 h-5 text-yellow-400" />
              <div 
                className="text-lg font-black tracking-wide uppercase"
                style={{
                  background: 'linear-gradient(90deg, rgba(245, 158, 11, 1) 0%, rgba(251, 191, 36, 1) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                HERO SUCCESS RATE (Scrim)
              </div>
            </div>
            
            {isLoadingStats ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-cyan-400 border-r-purple-400"></div>
                  <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-4 border-transparent border-b-blue-400 border-l-emerald-400" style={{ animationDirection: 'reverse' }}></div>
                </div>
                <div className="mt-4 text-cyan-400 font-medium">Loading statistics...</div>
              </div>
            ) : heroStats.length > 0 ? (
              <div 
                className="rounded-xl overflow-hidden border border-white/10"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'linear-gradient(90deg, rgba(147, 51, 234, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)' }}>
                        <th className="text-left px-4 py-3 font-bold text-white border-b border-white/10">Hero</th>
                        <th className="text-center px-4 py-3 font-bold text-emerald-400 border-b border-white/10">WIN</th>
                        <th className="text-center px-4 py-3 font-bold text-red-400 border-b border-white/10">LOSE</th>
                        <th className="text-center px-4 py-3 font-bold text-blue-300 border-b border-white/10">TOTAL</th>
                        <th className="text-center px-4 py-3 font-bold text-yellow-400 border-b border-white/10">SUCCESS RATE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {heroStats.map((row, idx) => (
                        <tr 
                          key={row.hero + idx}
                          className="hover:bg-white/5 transition-colors duration-200 border-b border-white/5"
                        >
                          <td className="px-4 py-3 text-white font-semibold">{row.hero}</td>
                          <td className="px-4 py-3 text-emerald-400 text-center font-bold">{row.win}</td>
                          <td className="px-4 py-3 text-red-400 text-center font-bold">{row.lose}</td>
                          <td className="px-4 py-3 text-blue-300 text-center font-bold">{row.total}</td>
                          <td className="px-4 py-3 text-center">
                            <div 
                              className="font-bold px-3 py-1 rounded-full text-sm"
                              style={{
                                background: row.winrate >= 70 
                                  ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.3) 0%, rgba(34, 197, 94, 0.3) 100%)'
                                  : row.winrate >= 50 
                                  ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.3) 0%, rgba(251, 191, 36, 0.3) 100%)'
                                  : 'linear-gradient(90deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 127, 0.3) 100%)',
                                color: row.winrate >= 70 ? '#10b981' : row.winrate >= 50 ? '#f59e0b' : '#ef4444',
                                border: `1px solid ${row.winrate >= 70 ? 'rgba(16, 185, 129, 0.5)' : row.winrate >= 50 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
                              }}
                            >
                              {row.winrate}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div 
                className="text-center py-8 rounded-xl border border-white/10"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div className="text-gray-400 font-medium">No hero statistics available</div>
              </div>
            )}
          </div>
          
          {/* H2H Stats Table */}
          <div className="w-full">
            <div className="flex items-center space-x-3 mb-4">
              <FaCrosshairs className="w-5 h-5 text-red-400" />
              <div 
                className="text-lg font-black tracking-wide uppercase"
                style={{
                  background: 'linear-gradient(90deg, rgba(239, 68, 68, 1) 0%, rgba(220, 38, 127, 1) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                HEAD-TO-HEAD STATISTICS
              </div>
            </div>
            
            {isLoadingStats ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-red-400 border-r-pink-400"></div>
                  <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-4 border-transparent border-b-purple-400 border-l-blue-400" style={{ animationDirection: 'reverse' }}></div>
                </div>
                <div className="mt-4 text-red-400 font-medium">Loading H2H data...</div>
              </div>
            ) : heroH2HStats.length > 0 ? (
              <div 
                className="rounded-xl overflow-hidden border border-white/10"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 127, 0.2) 100%)' }}>
                        <th className="text-left px-4 py-3 font-bold text-white border-b border-white/10">Hero Used</th>
                        <th className="text-left px-4 py-3 font-bold text-blue-300 border-b border-white/10">Enemy Hero</th>
                        <th className="text-center px-4 py-3 font-bold text-emerald-400 border-b border-white/10">WIN</th>
                        <th className="text-center px-4 py-3 font-bold text-red-400 border-b border-white/10">LOSE</th>
                        <th className="text-center px-4 py-3 font-bold text-blue-300 border-b border-white/10">TOTAL</th>
                        <th className="text-center px-4 py-3 font-bold text-yellow-400 border-b border-white/10">SUCCESS RATE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {heroH2HStats.map((row, idx) => (
                        <tr 
                          key={row.player_hero + row.enemy_hero + idx}
                          className="hover:bg-white/5 transition-colors duration-200 border-b border-white/5"
                        >
                          <td className="px-4 py-3 text-white font-semibold">{row.player_hero}</td>
                          <td className="px-4 py-3 text-blue-300 font-semibold">{row.enemy_hero}</td>
                          <td className="px-4 py-3 text-emerald-400 text-center font-bold">{row.win}</td>
                          <td className="px-4 py-3 text-red-400 text-center font-bold">{row.lose}</td>
                          <td className="px-4 py-3 text-blue-300 text-center font-bold">{row.total}</td>
                          <td className="px-4 py-3 text-center">
                            <div 
                              className="font-bold px-3 py-1 rounded-full text-sm"
                              style={{
                                background: row.winrate >= 70 
                                  ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.3) 0%, rgba(34, 197, 94, 0.3) 100%)'
                                  : row.winrate >= 50 
                                  ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.3) 0%, rgba(251, 191, 36, 0.3) 100%)'
                                  : 'linear-gradient(90deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 127, 0.3) 100%)',
                                color: row.winrate >= 70 ? '#10b981' : row.winrate >= 50 ? '#f59e0b' : '#ef4444',
                                border: `1px solid ${row.winrate >= 70 ? 'rgba(16, 185, 129, 0.5)' : row.winrate >= 50 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
                              }}
                            >
                              {row.winrate}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div 
                className="text-center py-8 rounded-xl border border-white/10"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div className="text-gray-400 font-medium">No H2H statistics available</div>
              </div>
            )}
          </div>
          
          {/* Additional Info */}
          {heroStats.length === 0 && heroH2HStats.length === 0 && !isLoadingStats && (
            <div 
              className="text-center py-6 rounded-xl border border-white/10"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div className="text-gray-300 font-medium">Player statistics will appear here once available</div>
            </div>
          )}
        </div>
        
        {/* Footer Section */}
        <div className="p-6 border-t border-white/10">
          <div className="flex justify-center">
            <button
              onClick={onViewPerformance}
              className="group relative px-8 py-4 font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
              style={{
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.8) 0%, rgba(59, 130, 246, 0.8) 50%, rgba(16, 185, 129, 0.8) 100%)',
                border: '2px solid rgba(147, 51, 234, 0.5)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                color: 'white'
              }}
            >
              <div className="flex items-center space-x-3">
                <FaEye className="w-5 h-5" />
                <span>View Performance Details</span>
              </div>
              
              {/* Button Glow Effect */}
              <div 
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.4) 0%, rgba(59, 130, 246, 0.4) 50%, rgba(16, 185, 129, 0.4) 100%)',
                  filter: 'blur(8px)',
                  zIndex: -1
                }}
              />
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes borderRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default PlayerModal; 