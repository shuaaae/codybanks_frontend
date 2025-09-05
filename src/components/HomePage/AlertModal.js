import React from 'react';

export default function AlertModal({ isOpen, onClose, message, type = 'success' }) {
  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const icon = isSuccess ? '✅' : '⚠️';
  const title = isSuccess ? 'Success' : 'Error';
  
  // Enhanced theme colors matching the app's dark theme
  const bgGradient = isSuccess 
    ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))'
    : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))';
  const borderColor = isSuccess ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)';
  const textColor = isSuccess ? '#86efac' : '#fca5a5';
  const buttonBg = isSuccess 
    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
    : 'linear-gradient(135deg, #ef4444, #dc2626)';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 border-2 animate-zoomIn relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          borderColor: borderColor,
          boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
        }}
      >
        {/* Background overlay */}
        <div 
          className="absolute inset-0 rounded-2xl"
          style={{ background: bgGradient }}
        />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                style={{
                  background: isSuccess 
                    ? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))'
                    : 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))',
                  border: `2px solid ${borderColor}`
                }}
              >
                <span className="text-2xl">{icon}</span>
              </div>
              <h2 
                className="text-2xl font-bold"
                style={{ color: textColor }}
              >
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-3xl font-bold transition-colors duration-200 hover:scale-110"
            >
              ×
            </button>
          </div>

          {/* Message */}
          <div className="mb-8">
            <p className="text-white text-center leading-relaxed text-lg font-medium">
              {message}
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-8 py-3 rounded-xl font-bold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{
                background: buttonBg,
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                focusRingColor: isSuccess ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 