import React, { useState, useMemo } from 'react';

export default function ScalingChart({ 
  blueTeamPicks = [], 
  redTeamPicks = [], 
  heroList = [] 
}) {
  const [hoveredInterval, setHoveredInterval] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Define game duration intervals for MLBB standard play
  const intervals = [
    { label: '0-5', min: 0, max: 5 },
    { label: '5-10', min: 5, max: 10 },
    { label: '10-15', min: 10, max: 15 },
    { label: '15-20', min: 15, max: 20 },
    { label: '20+', min: 20, max: 30 }
  ];

  // Hero scaling data - this would ideally come from an API or database
  // For now, using mock data based on typical MOBA scaling patterns
  const getHeroScalingData = (heroName) => {
    const hero = heroList.find(h => h.name === heroName);
    if (!hero) return null;

    // Mock scaling data - in a real implementation, this would come from game data
    // Updated for MLBB standard play intervals: 0-5, 5-10, 10-15, 15-20, 20+
    const scalingPatterns = {
      // Early game champions (strong 0-5, weak late)
      'Fanny': [58, 55, 45, 40, 38],
      'Lancelot': [56, 52, 48, 44, 42],
      'Hayabusa': [55, 50, 45, 40, 38],
      'Natalia': [57, 53, 47, 42, 40],
      'Saber': [56, 52, 48, 44, 42],
      'Zilong': [54, 50, 46, 42, 40],
      
      // Mid game champions (moderate early, strong mid)
      'Gusion': [52, 55, 58, 55, 52],
      'Ling': [50, 54, 57, 54, 50],
      'Selena': [48, 52, 55, 52, 48],
      'Kagura': [49, 53, 56, 53, 49],
      'Harley': [50, 54, 57, 54, 50],
      'Eudora': [48, 52, 55, 52, 48],
      'Cyclops': [49, 53, 56, 53, 49],
      'Vale': [48, 52, 55, 52, 48],
      'Lunox': [47, 51, 54, 51, 47],
      'Pharsa': [48, 52, 55, 52, 48],
      
      // Late game champions (weak early, strong late)
      'Aldous': [42, 45, 50, 55, 58],
      'Cecilion': [40, 44, 50, 56, 60],
      'Layla': [38, 42, 48, 54, 58],
      'Miracle': [40, 44, 50, 56, 60],
      'Bruno': [39, 43, 49, 55, 59],
      'Claude': [40, 44, 50, 56, 60],
      'Granger': [41, 45, 51, 57, 61],
      'Karrie': [40, 44, 50, 56, 60],
      'Miya': [39, 43, 49, 55, 59],
      'Wanwan': [40, 44, 50, 56, 60],
      'Irithel': [39, 43, 49, 55, 59],
      'Lesley': [40, 44, 50, 56, 60],
      'Beatrix': [41, 45, 51, 57, 61],
      'Popol': [40, 44, 50, 56, 60],
      'Melissa': [39, 43, 49, 55, 59],
      
      // Fighters - mixed scaling
      'Alucard': [52, 54, 56, 54, 52],
      'Balmond': [51, 53, 55, 53, 51],
      'Freya': [50, 52, 54, 52, 50],
      'Jawhead': [49, 51, 53, 51, 49],
      'Lapu-Lapu': [50, 52, 54, 52, 50],
      'Leomord': [51, 53, 55, 53, 51],
      'Martis': [50, 52, 54, 52, 50],
      'Minsitthar': [49, 51, 53, 51, 49],
      'Roger': [50, 52, 54, 52, 50],
      'Sun': [51, 53, 55, 53, 51],
      'Terizla': [49, 51, 53, 51, 49],
      'Thamuz': [50, 52, 54, 52, 50],
      'X.Borg': [51, 53, 55, 53, 51],
      'Yu Zhong': [50, 52, 54, 52, 50],
      'Paquito': [51, 53, 55, 53, 51],
      'Aulus': [49, 51, 53, 51, 49],
      'Fredrinn': [50, 52, 54, 52, 50],
      'Arlott': [49, 51, 53, 51, 49],
      
      // Tanks - generally consistent
      'Tigreal': [50, 50, 50, 50, 50],
      'Franco': [48, 50, 52, 50, 48],
      'Akai': [49, 51, 53, 51, 49],
      'Gatotkaca': [49, 51, 53, 51, 49],
      'Hylos': [48, 50, 52, 50, 48],
      'Johnson': [49, 51, 53, 51, 49],
      'Lolita': [48, 50, 52, 50, 48],
      'Minotaur': [49, 51, 53, 51, 49],
      'Uranus': [48, 50, 52, 50, 48],
      'Belerick': [49, 51, 53, 51, 49],
      'Khufra': [48, 50, 52, 50, 48],
      'Grock': [49, 51, 53, 51, 49],
      'Atlas': [48, 50, 52, 50, 48],
      'Barats': [49, 51, 53, 51, 49],
      'Edith': [50, 52, 54, 52, 50],
      'Gloo': [49, 51, 53, 51, 49],
      
      // Supports - generally consistent with slight scaling
      'Rafaela': [49, 51, 53, 51, 49],
      'Estes': [48, 50, 52, 50, 48],
      'Nana': [49, 51, 53, 51, 49],
      'Diggie': [48, 50, 52, 50, 48],
      'Angela': [49, 51, 53, 51, 49],
      'Carmilla': [48, 50, 52, 50, 48],
      'Faramis': [49, 51, 53, 51, 49],
      'Mathilda': [48, 50, 52, 50, 48],
      'Floryn': [49, 51, 53, 51, 49],
      'Novaria': [48, 50, 52, 50, 48],
      
      // Default scaling for unknown heroes
      'default': [50, 50, 50, 50, 50]
    };

    // Try to find exact match first
    let pattern = scalingPatterns[heroName];
    
    // If not found, try to match by role
    if (!pattern) {
      const role = hero.role?.toLowerCase();
      if (role === 'assassin') pattern = [55, 52, 48, 44, 42]; // Early game (0-5 strong, 20+ weak)
      else if (role === 'marksman') pattern = [42, 45, 50, 55, 58]; // Late game (0-5 weak, 20+ strong)
      else if (role === 'mage') pattern = [48, 52, 55, 52, 48]; // Mid game (10-15 peak)
      else if (role === 'fighter') pattern = [52, 54, 56, 54, 52]; // Balanced scaling
      else if (role === 'tank' || role === 'support') pattern = [49, 51, 53, 51, 49]; // Slight scaling
      else pattern = scalingPatterns['default'];
    }

    return pattern;
  };

  // Calculate team winrates for each interval
  const teamScalingData = useMemo(() => {
    const blueScaling = intervals.map((interval, index) => {
      const heroWinrates = blueTeamPicks.map(pick => {
        const scalingData = getHeroScalingData(pick.hero?.name);
        return scalingData ? scalingData[index] : 50;
      });
      
      const totalWinrate = heroWinrates.length > 0 
        ? heroWinrates.reduce((sum, rate) => sum + rate, 0) / heroWinrates.length 
        : 50;
      
      return {
        interval: interval.label,
        winrate: totalWinrate,
        heroWinrates: blueTeamPicks.map((pick, i) => ({
          hero: pick.hero?.name || 'Unknown',
          winrate: heroWinrates[i] || 50
        }))
      };
    });

    const redScaling = intervals.map((interval, index) => {
      const heroWinrates = redTeamPicks.map(pick => {
        const scalingData = getHeroScalingData(pick.hero?.name);
        return scalingData ? scalingData[index] : 50;
      });
      
      const totalWinrate = heroWinrates.length > 0 
        ? heroWinrates.reduce((sum, rate) => sum + rate, 0) / heroWinrates.length 
        : 50;
      
      return {
        interval: interval.label,
        winrate: totalWinrate,
        heroWinrates: redTeamPicks.map((pick, i) => ({
          hero: pick.hero?.name || 'Unknown',
          winrate: heroWinrates[i] || 50
        }))
      };
    });

    return { blue: blueScaling, red: redScaling };
  }, [blueTeamPicks, redTeamPicks, intervals]);

  // Chart dimensions and scaling - wider chart with minimal padding
  const chartWidth = 500;
  const chartHeight = 220;
  const padding = { top: 10, right: 15, bottom: 20, left: 35 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Y-axis scaling (42% to 58%)
  const minY = 42;
  const maxY = 58;
  const yScale = (value) => padding.top + ((maxY - value) / (maxY - minY)) * plotHeight;

  // X-axis scaling
  const xScale = (index) => padding.left + (index / (intervals.length - 1)) * plotWidth;

  // Generate path data for lines
  const generatePath = (data) => {
    return data.map((point, index) => {
      const x = xScale(index);
      const y = yScale(point.winrate);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const bluePath = generatePath(teamScalingData.blue);
  const redPath = generatePath(teamScalingData.red);

  return (
    <div className="bg-gray-800 rounded-lg p-2" style={{ width: chartWidth + 16, margin: '0 auto' }}>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .tooltip-enter {
          animation: fadeInUp 0.2s ease-out;
        }
      `}</style>
      
      <h3 className="text-lg font-semibold text-white mb-1 text-center">
        SCALING
      </h3>
      <p className="text-gray-400 text-sm text-center mb-2">
        TEAM WINRATE NORMALIZED
      </p>
      
      <div className="relative" style={{ width: chartWidth, margin: '0 auto' }}>
        <svg width={chartWidth} height={chartHeight} className="h-auto">
          {/* Grid lines */}
          {[42, 46, 50, 54, 58].map(value => (
            <g key={value}>
              <line
                x1={padding.left}
                y1={yScale(value)}
                x2={padding.left + plotWidth}
                y2={yScale(value)}
                stroke="#374151"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={yScale(value) + 4}
                textAnchor="end"
                className="text-xs fill-gray-400"
              >
                {value}
              </text>
            </g>
          ))}

          {/* Vertical lines at each data point */}
          {intervals.map((_, index) => (
            <line
              key={`vertical-${index}`}
              x1={xScale(index)}
              y1={padding.top}
              x2={xScale(index)}
              y2={padding.top + plotHeight}
              stroke="#4B5563"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          ))}

          {/* X-axis labels */}
          {intervals.map((interval, index) => (
            <text
              key={interval.label}
              x={xScale(index)}
              y={chartHeight - 10}
              textAnchor="middle"
              className="text-xs fill-gray-400"
            >
              {interval.label}
            </text>
          ))}

          {/* Blue team line */}
          <path
            d={bluePath}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Red team line */}
          <path
            d={redPath}
            fill="none"
            stroke="#EF4444"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

           {/* Data points */}
           {teamScalingData.blue.map((point, index) => (
             <g key={`blue-${index}`}>
               <circle
                 cx={xScale(index)}
                 cy={yScale(point.winrate)}
                 r="4"
                 fill="#3B82F6"
                 className="cursor-pointer hover:r-6 transition-all"
                 onMouseEnter={(e) => {
                   const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
                   const containerRect = e.currentTarget.ownerSVGElement.parentElement.getBoundingClientRect();
                   setMousePosition({
                     x: e.clientX - containerRect.left,
                     y: e.clientY - containerRect.top
                   });
                   setHoveredInterval({ team: 'blue', index, data: point });
                 }}
                 onMouseLeave={() => setHoveredInterval(null)}
               />
             </g>
           ))}

           {teamScalingData.red.map((point, index) => (
             <g key={`red-${index}`}>
               <circle
                 cx={xScale(index)}
                 cy={yScale(point.winrate)}
                 r="4"
                 fill="#EF4444"
                 className="cursor-pointer hover:r-6 transition-all"
                 onMouseEnter={(e) => {
                   const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
                   const containerRect = e.currentTarget.ownerSVGElement.parentElement.getBoundingClientRect();
                   setMousePosition({
                     x: e.clientX - containerRect.left,
                     y: e.clientY - containerRect.top
                   });
                   setHoveredInterval({ team: 'red', index, data: point });
                 }}
                 onMouseLeave={() => setHoveredInterval(null)}
               />
             </g>
           ))}
        </svg>

         {/* Tooltip */}
         {hoveredInterval && (
           <div 
             className="absolute bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-lg z-10 pointer-events-none tooltip-enter"
             style={{
               left: mousePosition.x - 100,
               top: mousePosition.y - 80,
               minWidth: '200px'
             }}
           >
            <div className="text-white font-semibold mb-2">
              {hoveredInterval.data.interval}
            </div>
            <div className="space-y-1 text-sm">
              {hoveredInterval.data.heroWinrates.map((hero, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-300">{hero.hero}</span>
                  <span className={`font-semibold ${
                    hoveredInterval.team === 'blue' ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    {hero.winrate.toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-600 pt-1 mt-2">
                <div className="flex justify-between font-bold">
                  <span className="text-gray-300">TOTAL</span>
                  <span className={`${
                    hoveredInterval.team === 'blue' ? 'text-blue-400' : 'text-red-400'
                  }`}>
                    {hoveredInterval.data.winrate.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

       {/* Legend */}
       <div className="flex justify-center space-x-4 mt-1">
         <div className="flex items-center space-x-2">
           <div className="w-3 h-0.5 bg-blue-500"></div>
           <span className="text-blue-400 text-xs font-medium">Blue Team</span>
         </div>
         <div className="flex items-center space-x-2">
           <div className="w-3 h-0.5 bg-red-500"></div>
           <span className="text-red-400 text-xs font-medium">Red Team</span>
         </div>
       </div>
    </div>
  );
}
