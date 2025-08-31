import React from 'react';

const ErrorModal = ({ show, message, onClose, title = "Error", showCleanupOption = false, onCleanup }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90" style={{ pointerEvents: 'auto' }}>
      <div className="bg-[#23232a] rounded-2xl shadow-2xl p-8 min-w-[400px] max-w-[90vw] flex flex-col items-center z-[10000] border border-red-500/20">
        {/* Error Icon */}
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        {/* Title */}
        <div className="text-white text-xl font-bold mb-2 text-center">{title}</div>
        
        {/* Message */}
        <div className="text-gray-300 text-lg mb-6 text-center max-w-md leading-relaxed">
          {message}
        </div>
        
                 {/* Action Buttons */}
         <div className="flex gap-3">
           {showCleanupOption && (
             <button
               onClick={onCleanup}
               className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
             >
               Clear All Sessions
             </button>
           )}
           <button
             onClick={onClose}
             className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
           >
             OK
           </button>
         </div>
      </div>
    </div>
  );
};

export default ErrorModal;
