import React from 'react';
import bgImg from '../../assets/bg.jpg';
import HeroRoleTabs from './HeroRoleTabs';
import SearchBar from './SearchBar';
import Spinner from './Spinner';
import { buildApiUrl } from '../../config/api';

export default function HeroGrid({
  heroList,
  heroLoading,
  selectedType,
  setSelectedType,
  searchTerm,
  setSearchTerm,
  handleHeroSelect,
  currentStep,
  draftSteps,
  bans,
  picks,
  areAllLanesAssigned = true,
  areLaneAssignmentsValid = true
}) {
  // Dynamically get unique roles from heroList, trimmed and filtered
  const uniqueRoles = Array.from(new Set(heroList.map(h => h.role?.trim()))).filter(Boolean);
  const roleButtons = ['All', ...uniqueRoles];

  // Robust filtering: trim and lowercase both sides
  const filteredHeroes = selectedType === 'All'
    ? heroList
    : heroList.filter(hero =>
        hero.role?.trim().toLowerCase() === selectedType.trim().toLowerCase()
      );

  // Remove duplicates by hero name
  const uniqueFilteredHeroes = Array.from(new Map(filteredHeroes.map(hero => [hero.name, hero])).values());

  // Track banned and picked heroes for availability
  const bannedHeroNames = [...bans.blue, ...bans.red].filter(Boolean).map(hero => hero.name);
  const pickedHeroNames = [...picks.blue, ...picks.red].filter(Boolean).map(hero => hero.name);
  const unavailableHeroNames = [...bannedHeroNames, ...pickedHeroNames];

  return (
    <>
      {/* Hero Role Tabs */}
      <div className="flex w-full justify-center space-x-2 mb-4 flex-wrap items-center">
        <HeroRoleTabs
          roleButtons={roleButtons}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
        />
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </div>
      {/* Hero selection grid */}
      <div
        className="flex-1 w-full grid [grid-template-columns:repeat(auto-fit,minmax(5rem,1fr))] gap-x-2 gap-y-2 overflow-y-auto"
        style={{
          gridAutoRows: '6.5rem',
          backgroundImage: `url(${bgImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {heroLoading ? (
          // Loading state
          <div className="col-span-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Spinner />
              <span className="text-white text-sm">Loading heroes...</span>
            </div>
          </div>
        ) : (
          // Hero grid
          uniqueFilteredHeroes
            .filter(hero => hero.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(hero => {
            // Only allow click if current step is ban/pick and hero is not already banned/picked
            const step = draftSteps[currentStep];
            const isBanned = bannedHeroNames.includes(hero.name);
            const isPicked = pickedHeroNames.includes(hero.name);
            const isDisabled = unavailableHeroNames.includes(hero.name);
            const lanesNotAssigned = !areAllLanesAssigned || !areLaneAssignmentsValid;
            const isSelectable =
              currentStep !== -1 &&
              step &&
              !lanesNotAssigned &&
              ((step.type === 'ban' && !isDisabled) ||
               (step.type === 'pick' && !isDisabled));
            return (
              <button
                key={hero.name}
                type="button"
                disabled={!isSelectable}
                onClick={() => isSelectable && handleHeroSelect(hero)}
                className="flex flex-col items-center w-full max-w-[5rem] focus:outline-none group"
                style={isSelectable ? { cursor: 'pointer' } : { cursor: 'not-allowed', opacity: 0.5 }}
              >
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-b from-gray-700 to-gray-800 flex items-center justify-center relative">
                  <img
                    src={`${process.env.REACT_APP_API_URL || 'https://api.coachdatastatistics.site'}/api/hero-image/${hero.role?.trim().toLowerCase()}/${encodeURIComponent(hero.image)}`}
                    alt={hero.name}
                    className="w-full h-full object-cover transition-all duration-200 group-hover:scale-105 group-active:scale-95"
                    draggable={false}
                    loading="eager"
                    decoding="async"
                    onLoad={(e) => {
                      e.target.style.opacity = '1';
                    }}
                    onError={(e) => {
                      console.log(`Failed to load image for ${hero.name}:`, e.target.src);
                      e.target.style.display = 'none';
                      // Show fallback icon
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                    style={{ opacity: '0', transition: 'opacity 0.2s ease-in-out' }}
                  />
                  {/* Fallback icon for failed images */}
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold" style={{ display: 'none' }}>
                    ?
                  </div>
                </div>
                <span className="text-xs text-white mt-1 text-center truncate w-full">{hero.name}</span>
              </button>
            );
          })
        )}
      </div>
    </>
  );
} 