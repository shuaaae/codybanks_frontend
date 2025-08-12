import React from 'react';
import { FaTrash } from 'react-icons/fa';

// Optimized hero image component
const OptimizedHeroImage = React.memo(({ heroName, size = 40, isBan = false, className = "", heroMap }) => {
  const [imageError, setImageError] = React.useState(false);
  const hero = heroMap.get(heroName);
  const imagePath = hero ? `/public/heroes/${hero.role?.trim().toLowerCase()}/${hero.image.replace('.png', '.webp')}` : null;
  
  if (!hero || !imagePath) {
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          borderRadius: '50%', 
          background: '#23283a', 
          border: '2px solid #23283a' 
        }} 
        className={className}
      />
    );
  }
  
  return (
    <>
      {!imageError ? (
        <img
          src={imagePath}
          alt={heroName}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            objectFit: 'cover',
            border: isBan ? '2px solid #f87171' : '2px solid #22c55e',
            background: '#181A20'
          }}
          className={`${className} hover:scale-110 hover:shadow-lg transition-transform duration-200`}
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: '#23283a',
            border: isBan ? '2px solid #f87171' : '2px solid #22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isBan ? '#f87171' : '#22c55e',
            fontSize: Math.max(8, size * 0.15),
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '2px'
          }}
          className={`${className} hover:scale-110 hover:shadow-lg transition-transform duration-200`}
        >
          {heroName}
        </div>
      )}
    </>
  );
});

// Optimized ban hero icon component
const OptimizedBanHeroIcon = React.memo(({ heroName, heroMap }) => {
  const [imageError, setImageError] = React.useState(false);
  const hero = heroMap.get(heroName);
  const imagePath = hero ? `/public/heroes/${hero.role?.trim().toLowerCase()}/${hero.image.replace('.png', '.webp')}` : null;
  
  if (!hero || !imagePath) {
    return (
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#23283a', border: '2px solid #f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
    );
  }
  
  return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: '#181A20', border: '2px solid #f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px #0002', transition: 'transform 0.15s', pointerEvents: 'auto' }} className="hover:scale-110 hover:shadow-lg">
      {!imageError ? (
        <img 
          src={imagePath} 
          alt={heroName} 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            border: 'none'
          }} 
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#23283a',
          color: '#f87171',
          fontSize: '8px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          {heroName}
        </div>
      )}
    </div>
  );
});

export default function MatchTable({ 
  matches, 
  isLoading, 
  isRefreshing, 
  errorMessage, 
  currentPage, 
  itemsPerPage, 
  hoveredMatchId, 
  setHoveredMatchId, 
  onDeleteMatch, 
  heroMap,
  setCurrentPage
}) {
  return (
    <div style={{ maxHeight: '650px', overflowY: 'auto', borderRadius: '1rem', marginBottom: 8, paddingBottom: 8, scrollbarWidth: 'thin', scrollbarColor: 'transparent transparent' }} className="hide-scrollbar-buttons">
      {(() => {
        console.log('Render debug:', { isLoading, errorMessage, matchesLength: matches?.length, matches });
        return null;
      })()}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-blue-200">Loading matches...</span>
        </div>
      ) : isRefreshing ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mr-3"></div>
          <span className="text-green-200">Updating matches...</span>
        </div>
      ) : errorMessage ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Matches</h3>
          <p className="text-red-300 text-center max-w-md mb-4">{errorMessage}</p>
          <button
            onClick={() => {
              // This will be handled by the parent component
              window.location.reload();
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Retry
          </button>
        </div>
      ) : (!matches || matches.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Matches Added</h3>
          <p className="text-gray-400 text-center max-w-md">
            No matches have been added to the system yet. Click 'Export Match' to add your first match.
          </p>
        </div>
      ) : (
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="sticky top-0 z-10" style={{ background: '#23283a' }}>
            <tr>
              <th className="py-3 px-4 text-blue-300 font-bold text-center min-w-[120px] rounded-tl-xl">DATE</th>
              <th className="py-3 px-4 text-blue-300 font-bold text-center min-w-[120px]">RESULTS</th>
              <th className="py-3 px-4 text-blue-300 font-bold text-center min-w-[120px]">TEAM</th>
              <th className="py-3 px-4 text-blue-300 font-bold text-center min-w-[220px]">Banning Phase 1</th>
              <th className="py-3 px-4 text-blue-300 font-bold text-center min-w-[220px]">Picks</th>
              <th className="py-3 px-4 text-blue-300 font-bold text-center min-w-[220px]">Banning Phase 2</th>
              <th className="py-3 px-4 text-blue-300 font-bold text-center min-w-[220px] rounded-tr-xl">Picks</th>
              <th className="py-3 px-4 text-blue-300 font-bold text-center min-w-[60px]">Delete</th>
            </tr>
          </thead>
          <tbody>
            {matches
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((match) => (
              <React.Fragment key={match.id}>
                {match.teams.map((team, idx) => (
                  <tr
                    key={team.id}
                    data-match-id={match.id}
                    className={
                      `transition-all duration-300 ease-out cursor-pointer rounded-lg ` +
                      (hoveredMatchId === match.id ? 'bg-blue-900/40 shadow-lg' : 'hover:bg-blue-900/20 hover:shadow-md')
                    }
                    onMouseEnter={(e) => {
                      // Only trigger if hovering over the table cell background (not interactive elements)
                      const target = e.target;
                      const isInteractive = target.closest('.hero-icon, .team-label, .delete-button, button, img, span');
                      
                      // Check if we're hovering over a table cell background
                      const isTableCell = target.tagName === 'TD' || target.closest('td');
                      const isBackground = !isInteractive && isTableCell;
                      
                      if (isBackground) {
                        setHoveredMatchId(match.id);
                      }
                    }}
                    onMouseLeave={(e) => {
                      // Clear when leaving the row entirely
                      const relatedTarget = e.relatedTarget;
                      const isStillInRow = relatedTarget && relatedTarget.closest && relatedTarget.closest(`[data-match-id="${match.id}"]`);
                      
                      if (!isStillInRow) {
                        setHoveredMatchId(null);
                      }
                    }}
                  >
                    {idx === 0 && (
                      <>
                        <td className="py-3 px-4 text-center align-middle" rowSpan={match.teams.length}>
                          <div className="inline-flex items-center justify-center px-4 py-2 font-bold text-sm transition-all duration-200 hover:scale-110 hover:shadow-xl" 
                               style={{ 
                                 background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                                 color: '#e2e8f0',
                                 boxShadow: '0 4px 20px rgba(15, 52, 96, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                                 border: '2px solid #1e3a8a',
                                 borderRadius: '8px',
                                 textShadow: '0 2px 4px rgba(0, 0, 0, 0.7)',
                                 fontWeight: 'bold',
                                 letterSpacing: '0.5px',
                                 position: 'relative',
                                 overflow: 'hidden'
                               }}>
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: '1px',
                              background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.6), transparent)'
                            }} />
                            {match.match_date}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center align-middle" rowSpan={match.teams.length}>
                          <span className="inline-block text-white px-4 py-1 rounded-full font-bold shadow-md" style={{ background: '#22c55e' }}>
                            {match.winner}
                          </span>
                        </td>
                      </>
                    )}
                    <td className="py-3 px-1 text-center font-bold align-middle">
                      {team.team_color === 'blue' ? (
                        <span className="team-label relative group inline-block bg-blue-500 text-white px-3 py-1 rounded font-bold cursor-pointer focus:outline-none" tabIndex={0} aria-label="1st Pick">
                          {team.team}
                          <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-max px-3 py-1 bg-black text-sm text-white rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200 z-10 whitespace-nowrap">
                            1st Pick
                          </span>
                        </span>
                      ) : (
                        <span className="team-label inline-block bg-red-500 text-white px-3 py-1 rounded font-bold">
                          {team.team}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-1 text-center align-middle min-w-[120px]">
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        {Array.isArray(team.banning_phase1)
                          ? team.banning_phase1.map(heroName => {
                              const hero = heroMap.get(heroName);
                              return hero ? (
                                <div key={heroName} className="hero-icon" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                  <OptimizedBanHeroIcon heroName={heroName} heroMap={heroMap} />
                                  <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 'bold' }}>{heroName}</span>
                                </div>
                              ) : null;
                            })
                          : null}
                      </div>
                    </td>
                    <td className="py-3 px-1 text-center align-middle min-w-[140px]">
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        {Array.isArray(team.picks1)
                          ? team.picks1.map(pickObj => {
                              const heroName = typeof pickObj === 'string' ? pickObj : pickObj.hero;
                              const hero = heroMap.get(heroName);
                              return hero ? (
                                <div key={heroName} className="hero-icon" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                  <OptimizedHeroImage heroName={heroName} size={56} heroMap={heroMap} />
                                  <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 'bold' }}>{heroName}</span>
                                </div>
                              ) : null;
                            })
                          : null}
                      </div>
                    </td>
                    <td className="py-3 px-1 text-center align-middle min-w-[140px]">
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        {Array.isArray(team.banning_phase2)
                          ? team.banning_phase2.map(heroName => {
                              const hero = heroMap.get(heroName);
                              return hero ? (
                                <div key={heroName} className="hero-icon" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                  <OptimizedBanHeroIcon heroName={heroName} heroMap={heroMap} />
                                  <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 'bold' }}>{heroName}</span>
                                </div>
                              ) : null;
                            })
                          : null}
                      </div>
                    </td>
                    <td className="py-3 px-1 text-center align-middle min-w-[140px]">
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        {Array.isArray(team.picks2)
                          ? team.picks2.map(pickObj => {
                              const heroName = typeof pickObj === 'string' ? pickObj : pickObj.hero;
                              const hero = heroMap.get(heroName);
                              return hero ? (
                                <div key={heroName} className="hero-icon" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                  <OptimizedHeroImage heroName={heroName} size={56} heroMap={heroMap} />
                                  <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 'bold' }}>{heroName}</span>
                                </div>
                              ) : null;
                            })
                          : null}
                      </div>
                    </td>
                   {/* Delete button: only show on first team row for each match */}
                   {idx === 0 && (
                     <td className="py-3 px-4 text-center align-middle" rowSpan={match.teams.length}>
                       <button
                         onClick={() => onDeleteMatch(match)}
                         className="delete-button text-red-500 hover:text-red-700 focus:outline-none"
                         title="Delete match"
                       >
                         <FaTrash size={20} />
                       </button>
                     </td>
                   )}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
      
      {/* Pagination Controls */}
      {matches.length > itemsPerPage && (
        <div className="flex justify-center items-center mt-4 gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="text-white px-3">
            Page {currentPage} of {Math.ceil(matches.length / itemsPerPage)}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(matches.length / itemsPerPage), prev + 1))}
            disabled={currentPage >= Math.ceil(matches.length / itemsPerPage)}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
} 