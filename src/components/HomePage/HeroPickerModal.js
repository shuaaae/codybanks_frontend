import React from 'react';

function HeroImage({ src, alt }) {
  const [loaded, setLoaded] = React.useState(false);
  return (
    <img
      src={src}
      alt={alt}
      className="hero-face-crop"
      loading="lazy"
      style={{
        background: '#181A20', // subtle dark background
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
      onLoad={() => setLoaded(true)}
    />
  );
}

export default function HeroPickerModal({ 
  open, 
  onClose, 
  selected, 
  setSelected, 
  maxSelect = 1, 
  bannedHeroes = [], 
  filterType = null, 
  heroList = [], 
  heroPickerMode, 
  pickTarget, 
  picks, 
  banning, 
  heroPickerTarget, 
  currentPickSession, 
  onConfirm 
}) {
  const [selectedType, setSelectedType] = React.useState('All');
  const [showFlexPicks, setShowFlexPicks] = React.useState(false);
  const [localSelected, setLocalSelected] = React.useState(selected);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setLocalSelected(selected);
      setSearchTerm(''); // Reset search when modal opens
      setShowFlexPicks(false); // Reset flex picks state
      // For picking, default to lane type (e.g., "Fighter" for Exp Lane)
      // For banning, default to "All"
      if (heroPickerMode === 'pick' && filterType) {
        setSelectedType(filterType);
      } else {
        setSelectedType('All');
      }
    }
  }, [open, selected, heroPickerMode, filterType]);

  if (!open) return null;
  
  const toggleHero = (heroName) => {
    if (localSelected.includes(heroName)) {
      setLocalSelected(localSelected.filter(h => h !== heroName));
    } else if (localSelected.length < maxSelect) {
      setLocalSelected([...localSelected, heroName]);
    }
  };
  
  const canConfirm = localSelected.length === maxSelect;
  let filteredHeroes = heroList;
  
  // Apply role filter - prioritize user selection over filterType
  if (selectedType !== 'All') {
    // User selected a specific type, use that
    filteredHeroes = filteredHeroes.filter(hero => hero.role === selectedType);
  } else if (showFlexPicks) {
    // User clicked "All Heroes" for flex picks - show all heroes
    // Don't filter by role - show all heroes
  } else {
    // User selected "All" - show heroes based on filterType (lane type)
    // For Exp Lane: show Fighter heroes when "All" is clicked
    if (filterType) {
      filteredHeroes = filteredHeroes.filter(hero => hero.role === filterType);
    }
  }

  // Apply search filter
  if (searchTerm.trim()) {
    filteredHeroes = filteredHeroes.filter(hero => 
      hero.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Get all unavailable heroes (banned or picked)
  const allBannedHeroes = Object.values(banning).flat().filter(Boolean);
  const allPickedHeroes = [
    ...(Array.isArray(picks.blue[1]) ? picks.blue[1] : []),
    ...(Array.isArray(picks.blue[2]) ? picks.blue[2] : []),
    ...(Array.isArray(picks.red[1]) ? picks.red[1] : []),
    ...(Array.isArray(picks.red[2]) ? picks.red[2] : [])
  ].map(p => p && p.hero).filter(Boolean);
  
  const unavailableHeroes = [...allBannedHeroes, ...allPickedHeroes];
  
  // Don't filter out unavailable heroes - show them as disabled instead
  // filteredHeroes = filteredHeroes.filter(hero => !unavailableHeroes.includes(hero.name));

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-80" onClick={handleModalClick}>
      <div className="modal-box w-full max-w-5xl bg-[#23232a] rounded-2xl shadow-2xl p-8" onClick={handleModalClick}>
        <h3 className="text-xl font-bold text-white mb-2">
          Select {maxSelect} Hero{maxSelect > 1 ? 'es' : ''}
          {selectedType !== 'All' 
            ? ` (${selectedType})` 
            : showFlexPicks
              ? ` (All Heroes for ${filterType} Lane)` 
              : heroPickerMode === 'pick' && filterType
                ? ` (${filterType})` 
                : ' (All Heroes)'
          }
        </h3>
        
        {/* Hero availability summary */}
        <div className="mb-4 p-3 bg-[#181A20] rounded-lg border border-gray-600">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white">
              Available: <span className="text-green-400 font-bold">{filteredHeroes.filter(hero => !unavailableHeroes.includes(hero.name)).length}</span>
            </span>
            <span className="text-red-400">
              Banned: <span className="font-bold">{allBannedHeroes.length}</span>
            </span>
            <span className="text-green-400">
              Picked: <span className="font-bold">{allPickedHeroes.length}</span>
            </span>
          </div>
        </div>

        {/* Filter buttons - show for both banning and picking */}
        <div className="flex gap-2 mb-6 flex-wrap items-center">
          <button
            type="button"
            className={`px-4 py-1 rounded-full font-semibold border ${selectedType === 'All' && !showFlexPicks ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent text-white border-gray-600 hover:bg-blue-900/20'}`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedType('All');
              setShowFlexPicks(false);
            }}
          >
            {heroPickerMode === 'pick' && filterType ? filterType : 'All'}
          </button>
          {/* Show "All Heroes" button for flex picks when picking */}
          {heroPickerMode === 'pick' && filterType && (
            <button
              type="button"
              className={`px-4 py-1 rounded-full font-semibold border ${showFlexPicks ? 'bg-green-600 text-white border-green-600' : 'bg-transparent text-white border-gray-600 hover:bg-green-900/20'}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedType('All');
                setShowFlexPicks(true);
              }}
            >
              All Heroes
            </button>
          )}
          {/* Only show role filter buttons for banning, not for Exp Lane picking */}
          {heroPickerMode !== 'pick' && [...new Set(heroList.map(h => h.role))].map(type => (
            <button
              key={type}
              type="button"
              className={`px-4 py-1 rounded-full font-semibold border ${selectedType === type ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent text-white border-gray-600 hover:bg-blue-900/20'}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedType(type);
              }}
            >
              {type}
            </button>
          ))}
          
          {/* Search Bar */}
          <div className="relative ml-4">
            <input
              type="text"
              placeholder="Search heroes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-1 bg-[#181A20] text-white rounded-full border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent pl-8 pr-3 w-48"
            />
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-9 gap-1 mb-6 max-h-[60vh] overflow-y-auto pr-2">
          {Array.from(new Map(filteredHeroes.map(hero => [hero.name, hero])).values()).map(hero => {
            const isBanned = allBannedHeroes.includes(hero.name);
            const isPicked = allPickedHeroes.includes(hero.name);
            const isUnavailable = isBanned || isPicked;
            const isSelected = localSelected.includes(hero.name);
            
            return (
              <button
                key={hero.name}
                type="button"
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all font-semibold ${
                  isBanned 
                    ? 'border-red-600 bg-red-900/30 text-red-400 cursor-not-allowed opacity-60' 
                    : isPicked 
                      ? 'border-green-600 bg-green-900/30 text-green-400 cursor-not-allowed opacity-60'
                      : isSelected 
                        ? 'border-green-400 bg-green-900/30 text-white' 
                        : 'border-transparent hover:border-blue-400 hover:bg-blue-900/20 text-white'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isUnavailable) {
                    toggleHero(hero.name);
                  }
                }}
                disabled={isUnavailable || (localSelected.length === maxSelect && !localSelected.includes(hero.name))}
                title={isBanned ? `${hero.name} is banned` : isPicked ? `${hero.name} is picked` : hero.name}
              >
                <div
                  className={`w-16 h-16 rounded-full shadow-lg overflow-hidden flex items-center justify-center mb-2 relative ${
                    isBanned 
                      ? 'bg-red-900' 
                      : isPicked 
                        ? 'bg-green-900'
                        : 'bg-gradient-to-b from-blue-900 to-blue-700'
                  }`}
                  style={!isUnavailable ? { background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)' } : {}}
                >
                  <HeroImage
                    src={`/public/heroes/${String(hero.role).toLowerCase()}/${hero.image.replace('.png', '.webp')}`}
                    alt={hero.name}
                  />
                  {isBanned && (
                    <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center rounded-full">
                      <span className="text-red-400 font-bold text-xs">BANNED</span>
                    </div>
                  )}
                  {isPicked && (
                    <div className="absolute inset-0 bg-green-600/20 flex items-center justify-center rounded-full">
                      <span className="text-green-400 font-bold text-xs">PICKED</span>
                    </div>
                  )}
                </div>
                <span className={`text-sm font-semibold text-center w-20 truncate ${
                  isBanned ? 'text-red-400' : isPicked ? 'text-green-400' : 'text-white'
                }`}>
                  {hero.name}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex justify-end gap-4">
          <button
            type="button"
            className="btn bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
            disabled={!canConfirm}
            onClick={(e) => {
              e.stopPropagation();
              if (canConfirm) {
                setSelected(localSelected);
                // Call onConfirm for pick flow, otherwise close modal
                if (heroPickerMode === 'pick' && onConfirm) {
                  onConfirm(localSelected);
                } else {
                  onClose();
                }
              }
            }}
          >
            Confirm
          </button>
          <button
            type="button"
            className="btn bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
            onClick={(e) => { 
              e.stopPropagation();
              setLocalSelected([]); 
              onClose(); 
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 