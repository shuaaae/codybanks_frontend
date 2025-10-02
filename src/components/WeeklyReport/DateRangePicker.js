import React, { useState, useEffect } from 'react';
import { DateRange } from 'react-date-range';
import { format, isSameDay, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

export default function DateRangePicker({ 
  dateRange, 
  setDateRange, 
  showPicker, 
  setShowPicker,
  selectedDates = [],
  setSelectedDates = () => {}
}) {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Don't automatically initialize selectedDates from dateRange
  // This prevents the issue where reopening the modal shows all dates in the range as selected

  // Helper function to generate calendar days
  const generateCalendarDays = (month) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const startDay = getDay(start);
    
    const days = [];
    
    // Add previous month's trailing days
    for (let i = startDay - 1; i >= 0; i--) {
      days.push(subDays(start, i + 1));
    }
    
    // Add current month's days
    const currentMonthDays = eachDayOfInterval({ start, end });
    days.push(...currentMonthDays);
    
    // Add next month's leading days to fill the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push(addDays(end, i));
    }
    
    return days;
  };

  // Handle date selection in multi-select mode
  const handleDateClick = (date, event) => {
    if (!isMultiSelectMode) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const isCtrlPressed = event.ctrlKey || event.metaKey;
    
    if (isCtrlPressed) {
      // Toggle individual date selection (including current date)
      setSelectedDates(prev => {
        const isSelected = prev.some(d => isSameDay(d, date));
        if (isSelected) {
          return prev.filter(d => !isSameDay(d, date));
        } else {
          return [...prev, date].sort((a, b) => a - b);
        }
      });
    }
  };

  // Apply multi-selected dates to dateRange
  const applyMultiSelection = () => {
    if (selectedDates.length === 0) return;
    
    const sortedDates = [...selectedDates].sort((a, b) => a - b);
    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];
    
    setDateRange([{
      startDate,
      endDate,
      key: 'selection'
    }]);
    setShowPicker(false);
  };

  // Format display text for multi-selected dates
  const formatDateRangeDisplay = () => {
    if (isMultiSelectMode && selectedDates.length > 0) {
      if (selectedDates.length === 1) {
        return format(selectedDates[0], 'MMM d, yyyy');
      } else if (selectedDates.length === 2) {
        return `${format(selectedDates[0], 'MMM d')} - ${format(selectedDates[1], 'MMM d, yyyy')}`;
      } else {
        return `${selectedDates.length} dates selected`;
      }
    }
    return `${format(dateRange[0].startDate, 'MMM d, yyyy')} - ${format(dateRange[0].endDate, 'MMM d, yyyy')}`;
  };

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
          <span>{formatDateRangeDisplay()}</span>
          <svg className={`w-4 h-4 transition-transform duration-200 ${showPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Modern Modal Overlay with Smooth Animations */}
      {showPicker && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm modern-date-picker-modal-backdrop"
          onClick={() => {
            setShowPicker(false);
            setIsMultiSelectMode(false);
            setSelectedDates([]);
          }}
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
                onClick={() => {
                  setShowPicker(false);
                  setIsMultiSelectMode(false);
                  setSelectedDates([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Multi-Select Toggle Button */}
            <div className="mb-4">
              <button
                onClick={() => {
                  setIsMultiSelectMode(!isMultiSelectMode);
                  if (!isMultiSelectMode) {
                    // Initialize with empty selected dates when switching to multi-select
                    setSelectedDates([]);
                  } else {
                    // Clear selected dates when switching away from multi-select mode
                    setSelectedDates([]);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isMultiSelectMode 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isMultiSelectMode ? '✓ Multi-Select Mode' : 'Multi-Select Mode'}
              </button>
              {isMultiSelectMode && (
                <p className="text-xs text-gray-500 mt-1">
                  Hold Ctrl/Cmd and click dates to select multiple non-sequential dates
                </p>
              )}
            </div>

            {/* Date Range Picker */}
            <div className="relative">
              {isMultiSelectMode ? (
                <div className="custom-calendar">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setCurrentMonth(prev => subDays(startOfMonth(prev), 1))}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {format(currentMonth, 'MMMM yyyy')}
                    </h4>
                    <button
                      onClick={() => setCurrentMonth(prev => addDays(endOfMonth(prev), 1))}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendarDays(currentMonth).map((date, index) => {
                      const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                      const isToday = isSameDay(date, new Date());
                      const isSelected = selectedDates.some(d => isSameDay(d, date));
                      const isPast = date <= new Date(); // Include current date as selectable
                      
                      return (
                        <button
                          key={index}
                          onClick={(e) => handleDateClick(date, e)}
                          className={`
                            h-8 w-8 text-sm rounded-lg transition-all duration-200
                            ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'}
                            ${isToday ? 'bg-blue-100 text-blue-600 font-semibold' : ''}
                            ${isSelected ? 'bg-blue-500 text-white font-semibold hover:bg-blue-600' : ''}
                            ${!isPast && isCurrentMonth ? 'opacity-50 cursor-not-allowed' : ''}
                            ${isPast && isCurrentMonth ? 'hover:bg-gray-100' : ''}
                          `}
                          disabled={!isPast && isCurrentMonth}
                        >
                          {format(date, 'd')}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Dates Summary */}
                  {selectedDates.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-blue-800 font-medium">
                          {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
                        </p>
                        <button
                          onClick={() => setSelectedDates([])}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100 px-2 py-1 rounded transition-colors duration-200"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedDates.slice(0, 5).map((date, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {format(date, 'MMM d')}
                          </span>
                        ))}
                        {selectedDates.length > 5 && (
                          <span className="text-xs text-blue-600">
                            +{selectedDates.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
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
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  if (isMultiSelectMode) {
                    // In multi-select mode, add today to selected dates
                    const today = new Date();
                    setSelectedDates(prev => {
                      const isSelected = prev.some(d => isSameDay(d, today));
                      if (isSelected) {
                        return prev.filter(d => !isSameDay(d, today));
                      } else {
                        return [...prev, today].sort((a, b) => a - b);
                      }
                    });
                  } else {
                    setDateRange([{
                      startDate: new Date(),
                      endDate: new Date(),
                      key: 'selection'
                    }]);
                    setShowPicker(false);
                  }
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                Today
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowPicker(false);
                    setIsMultiSelectMode(false);
                    setSelectedDates([]);
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (isMultiSelectMode) {
                      applyMultiSelection();
                    } else {
                      setShowPicker(false);
                    }
                  }}
                  disabled={isMultiSelectMode && selectedDates.length === 0}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors duration-200 ${
                    isMultiSelectMode && selectedDates.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
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