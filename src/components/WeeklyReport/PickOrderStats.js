import React from 'react';

export default function PickOrderStats({ pickOrderStats, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col flex-1">
        <div className="bg-[#23232a] rounded-xl shadow-lg p-4 border border-gray-700 h-full">
          <div className="text-blue-300">Loading pick order statistics...</div>
        </div>
      </div>
    );
  }

  const { firstPick, secondPick } = pickOrderStats;
  const firstPickTotal = firstPick.wins + firstPick.losses;
  const secondPickTotal = secondPick.wins + secondPick.losses;

  return (
    <div className="flex flex-col flex-1">
      <div className="bg-[#23232a] rounded-xl shadow-lg p-4 border border-gray-700 h-full">
      <h3 className="text-white text-lg font-bold mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Pick Order Performance
      </h3>
      
      <div className="grid grid-cols-2 gap-2">
        {/* First Pick Stats */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-blue-300 font-semibold text-sm">1st Pick (Blue Team)</h4>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-blue-300 text-xs">Blue Side</span>
            </div>
          </div>
          
          {firstPickTotal > 0 ? (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Win Rate</span>
                <span className="text-white font-bold text-base">{firstPick.winRate}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-400">Wins: {firstPick.wins}</span>
                <span className="text-red-400">Losses: {firstPick.losses}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>Total: {firstPickTotal} matches</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">No 1st pick matches</div>
          )}
        </div>

        {/* Second Pick Stats */}
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-red-300 font-semibold text-sm">2nd Pick (Red Team)</h4>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-red-300 text-xs">Red Side</span>
            </div>
          </div>
          
          {secondPickTotal > 0 ? (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Win Rate</span>
                <span className="text-white font-bold text-base">{secondPick.winRate}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-400">Wins: {secondPick.wins}</span>
                <span className="text-red-400">Losses: {secondPick.losses}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>Total: {secondPickTotal} matches</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">No 2nd pick matches</div>
          )}
        </div>
      </div>

      {/* Summary */}
      {(firstPickTotal > 0 || secondPickTotal > 0) && (
        <div className="mt-3 p-2 bg-gray-800/50 rounded-lg">
          <div className="text-gray-300 text-sm">
            <strong>Analysis:</strong> {
              firstPickTotal > 0 && secondPickTotal > 0 ? (
                parseFloat(firstPick.winRate) > parseFloat(secondPick.winRate) ? 
                  `Team performs better as 1st pick (+${(parseFloat(firstPick.winRate) - parseFloat(secondPick.winRate)).toFixed(1)}% advantage)` :
                  `Team performs better as 2nd pick (+${(parseFloat(secondPick.winRate) - parseFloat(firstPick.winRate)).toFixed(1)}% advantage)`
              ) : firstPickTotal > 0 ? 
                "Only 1st pick data available" : 
                "Only 2nd pick data available"
            }
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
