import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaCalendarAlt } from 'react-icons/fa';

export default function SearchBar({ onSearch, onClear }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all'); // 'all', 'heroes', 'date', 'teams'
  const [dateFilter, setDateFilter] = useState('');
  const lastSearchRef = useRef('');
  const isInitialMount = useRef(true);

  // Auto-search with debounce when inputs change
  useEffect(() => {
    // Skip the initial mount to prevent unnecessary search on component load
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      const searchData = {
        term: searchTerm.trim(),
        type: searchType,
        date: dateFilter
      };
      
      // Create a unique key for this search to prevent duplicate calls
      const searchKey = `${searchTerm.trim()}-${searchType}-${dateFilter}`;
      
      // Only proceed if the search has actually changed
      if (lastSearchRef.current === searchKey) {
        return;
      }
      
      lastSearchRef.current = searchKey;
      
      // If search term or date is empty, clear the search
      if (!searchTerm.trim() && !dateFilter) {
        onClear();
      } else {
        onSearch(searchData);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchType, dateFilter]); // Removed onSearch and onClear from dependencies

  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDateChange = (e) => {
    setDateFilter(e.target.value);
  };

  return (
    <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm rounded-xl border border-slate-600/50 shadow-lg h-12">
      {/* Search Type Selector */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-300 font-semibold whitespace-nowrap tracking-wide">Filter:</label>
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          className="px-3 py-1.5 bg-slate-900/80 text-white rounded-lg border border-slate-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 text-sm h-8 font-medium shadow-inner transition-all duration-200 hover:bg-slate-800/80"
        >
          <option value="all">All</option>
          <option value="heroes">Heroes</option>
          <option value="teams">Teams</option>
          <option value="date">Date</option>
        </select>
      </div>

      {/* Main Search Input */}
      {searchType !== 'date' && (
        <div className="relative flex-1 min-w-[250px]">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 transition-colors duration-200" />
          <input
            type="text"
            placeholder={
              searchType === 'heroes' 
                ? "Type hero names..." 
                : searchType === 'teams'
                ? "Type team names..."
                : "Search matches..."
            }
            value={searchTerm}
            onChange={handleSearchTermChange}
            className="w-full pl-11 pr-4 py-1.5 bg-slate-900/60 text-white rounded-lg border border-slate-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 focus:bg-slate-900/80 placeholder-slate-400 text-sm h-8 font-medium shadow-inner transition-all duration-200 hover:bg-slate-900/70"
          />
        </div>
      )}

      {/* Date Filter */}
      {(searchType === 'date' || searchType === 'all') && (
        <div className="relative">
          <FaCalendarAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 transition-colors duration-200" />
          <input
            type="date"
            value={dateFilter}
            onChange={handleDateChange}
            className="pl-11 pr-4 py-1.5 bg-slate-900/60 text-white rounded-lg border border-slate-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 focus:bg-slate-900/80 text-sm h-8 font-medium shadow-inner transition-all duration-200 hover:bg-slate-900/70 min-w-[160px]"
          />
        </div>
      )}
    </div>
  );
}
