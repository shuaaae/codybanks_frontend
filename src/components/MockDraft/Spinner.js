import React from 'react';

export default function Spinner() {
  return (
    <div className="w-16 h-16 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-400 rounded-full animate-spin"></div>
    </div>
  );
} 