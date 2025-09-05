import React, { useEffect, useState } from 'react';

export default function LoginSuccessModal({ isOpen, onClose, userName }) {
  const [showCheck, setShowCheck] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Start animations in sequence
      const timer1 = setTimeout(() => setShowCheck(true), 300);
      const timer2 = setTimeout(() => setShowMessage(true), 800);
      
      // Auto close after 3 seconds
      const timer3 = setTimeout(() => {
        onClose();
      }, 3000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      // Reset states when modal closes
      setShowCheck(false);
      setShowMessage(false);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4">
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-gray-600 shadow-2xl w-[95vw] max-w-md flex flex-col items-center justify-center p-8 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-50"></div>
        
        {/* Circulating Animation Container */}
        <div className="relative w-32 h-32 mb-6">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-400 border-r-green-400 animate-spin"></div>
          
          {/* Inner rotating ring (opposite direction) */}
          <div className="absolute inset-2 rounded-full border-3 border-transparent border-b-emerald-400 border-l-emerald-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          
          {/* Check mark container */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center transition-all duration-500 ${showCheck ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
              {/* Check mark SVG */}
              <svg 
                className={`w-8 h-8 text-white transition-all duration-300 ${showCheck ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ transitionDelay: showCheck ? '200ms' : '0ms' }}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={3} 
                  d="M5 13l4 4L19 7"
                  className="animate-draw-check"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className={`text-center transition-all duration-500 ${showMessage ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <h2 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Login Successful!
          </h2>
          <p className="text-gray-300 text-sm">
            Welcome back, {userName || 'Coach'}!
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-1 mt-6 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full animate-progress-bar"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes draw-check {
          0% {
            stroke-dasharray: 0 24;
            stroke-dashoffset: 24;
          }
          100% {
            stroke-dasharray: 24 24;
            stroke-dashoffset: 0;
          }
        }
        
        @keyframes progress-bar {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
        
        .animate-draw-check {
          animation: draw-check 0.6s ease-in-out forwards;
        }
        
        .animate-progress-bar {
          animation: progress-bar 2.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
