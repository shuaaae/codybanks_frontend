import React from 'react';

export default function AlertModal({ isOpen, onClose, message, type = 'success' }) {
  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const icon = isSuccess ? '✅' : '⚠️';
  const title = isSuccess ? 'Success' : 'Error';
  const bgColor = isSuccess ? 'bg-green-600' : 'bg-red-600';
  const borderColor = isSuccess ? 'border-green-500' : 'border-red-500';
  const textColor = isSuccess ? 'text-green-200' : 'text-red-200';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className={`bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 border ${borderColor} animate-zoomIn`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{icon}</span>
            <h2 className={`text-xl font-bold ${textColor}`}>{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-white text-center leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-semibold text-white transition-colors ${bgColor} hover:opacity-90`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
} 