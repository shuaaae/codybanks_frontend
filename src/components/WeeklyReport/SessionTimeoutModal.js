import React from 'react';

export default function SessionTimeoutModal({ isOpen, onClose, timeoutMinutes }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-gray-900 rounded-xl shadow-2xl p-0 w-full max-w-md mx-4 border border-gray-700 animate-slideIn">
        {/* Header */}
        <div className="bg-red-800 px-6 py-4 rounded-t-xl flex justify-between items-center border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Session Expired</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-gray-900 rounded-b-xl">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Session Timeout</h3>
              <p className="text-gray-400 text-sm">Your session has expired due to inactivity</p>
            </div>
          </div>
          
          <p className="text-gray-300 mb-6">
            Your session expired due to {timeoutMinutes} minutes of inactivity. 
            Please log in again to continue using the application.
          </p>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-2 rounded-lg transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 