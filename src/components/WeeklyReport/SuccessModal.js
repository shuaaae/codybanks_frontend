import React from 'react';

export default function SuccessModal({ isOpen, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-gray-900 rounded-xl shadow-2xl p-0 w-full max-w-md mx-4 border border-green-500 animate-zoomIn">
        {/* Header */}
        <div className="bg-green-800 px-6 py-4 rounded-t-xl flex justify-between items-center border-b border-green-700">
          <h2 className="text-xl font-bold text-white">Success</h2>
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 bg-gray-900 rounded-b-xl">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Operation Successful</h3>
              <p className="text-gray-400 text-sm">Your action has been completed</p>
            </div>
          </div>
          
          <p className="text-gray-300 mb-6">
            {message}
          </p>

          <div className="flex justify-end">
            <div className="text-green-400 text-sm">
              This modal will close automatically...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 