import React from 'react';

export default function TimerToggle({ timerEnabled, setTimerEnabled, isDraftStarted }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-800 text-white">
      <span className="text-sm font-medium">Timer:</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => !isDraftStarted && setTimerEnabled(!timerEnabled)}
          disabled={isDraftStarted}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            isDraftStarted 
              ? 'bg-gray-500 cursor-not-allowed opacity-50' 
              : timerEnabled 
                ? 'bg-green-600' 
                : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              timerEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-sm font-medium transition-colors ${
          timerEnabled ? 'text-white' : 'text-gray-400'
        }`}>
          Set-Time
        </span>
      </div>
    </div>
  );
}
