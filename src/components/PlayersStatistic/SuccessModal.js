import React from 'react';

const SuccessModal = ({ 
  isOpen, 
  message, 
  onClose,
  onRefresh
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10010] flex items-center justify-center bg-black bg-opacity-90" style={{ pointerEvents: 'auto' }}>
      <div className="bg-[#23232a] rounded-2xl shadow-2xl p-8 min-w-[400px] max-w-[90vw] flex flex-col items-center z-[10011] border border-purple-500/30">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/30">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        {/* Success Message */}
        <div className="text-white text-xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-purple-400 bg-clip-text text-transparent">
          Success!
        </div>
        
        <div className="text-white text-lg mb-8 text-center">
          {message}
        </div>
        
        {/* Close Button */}
        <button 
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg shadow-purple-500/30"
          onClick={() => {
            if (onRefresh) {
              onRefresh();
            }
            onClose();
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
