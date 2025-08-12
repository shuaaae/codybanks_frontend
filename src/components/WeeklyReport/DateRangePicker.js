import React from 'react';
import { DateRange } from 'react-date-range';
import { format } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

export default function DateRangePicker({ 
  dateRange, 
  setDateRange, 
  showPicker, 
  setShowPicker 
}) {
  return (
    <div className="flex flex-col items-start gap-4 mb-6 w-full">
      <label className="text-gray-200 font-semibold mb-1">Select Date Range</label>
      
      {/* Modern Button Design */}
      <button
        className="relative group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
        onClick={() => setShowPicker(v => !v)}
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{format(dateRange[0].startDate, 'MMM d, yyyy')} - {format(dateRange[0].endDate, 'MMM d, yyyy')}</span>
          <svg className={`w-4 h-4 transition-transform duration-200 ${showPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Modern Modal Overlay with Smooth Animations */}
      {showPicker && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm modern-date-picker-modal-backdrop"
          onClick={() => setShowPicker(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl p-6 modern-date-picker-modal-content"
            style={{ 
              minWidth: 380,
              maxWidth: 420,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Custom Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Select Date Range</h3>
              <button
                onClick={() => setShowPicker(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Date Range Picker */}
            <div className="relative">
              <DateRange
                editableDateInputs={true}
                onChange={item => {
                  setDateRange([item.selection]);
                  setShowPicker(false);
                }}
                moveRangeOnFirstSelection={false}
                ranges={dateRange}
                maxDate={new Date()}
                className="modern-date-picker"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setDateRange([{
                    startDate: new Date(),
                    endDate: new Date(),
                    key: 'selection'
                  }]);
                  setShowPicker(false);
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                Today
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPicker(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowPicker(false)}
                  className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 