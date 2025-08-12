import React from 'react';
import bgImg from '../../assets/bg.jpg';
import HeroRoleTabs from './HeroRoleTabs';
import SearchBar from './SearchBar';
import Spinner from './Spinner';

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
  picks
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
            const isSelectable =
              currentStep !== -1 &&
              step &&
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
                <img
                  src={`/public/heroes/${hero.role?.trim().toLowerCase()}/${hero.image}`}
                  alt={hero.name}
                  className="w-16 h-16 rounded-full object-cover transition-transform group-hover:scale-105 group-active:scale-95"
                  draggable={false}
                />
                <span className="text-xs text-white mt-1 text-center truncate w-full">{hero.name}</span>
              </button>
            );
          })
        )}
      </div>
    </>
  );
} 