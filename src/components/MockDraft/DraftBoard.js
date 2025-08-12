import React from 'react';
import bgImg from '../../assets/bg.jpg';
import DraftSlots from './DraftSlots';
import TeamNameInputs from './TeamNameInputs';
import DraftTimer from './DraftTimer';
import HeroGrid from './HeroGrid';

export default function DraftBoard({
  currentStep,
  draftSteps,
  draftFinished,
  timer,
  blueTeamName,
  setBlueTeamName,
  redTeamName,
  setRedTeamName,
  bans,
  picks,
  heroList,
  heroLoading,
  selectedType,
  setSelectedType,
  searchTerm,
  setSearchTerm,
  handleHeroSelect,
  isActiveSlot,
  handleHeroRemove,
  handleDraftSlotClick,
  handleDraftSlotEdit,
  isCompleteDraft = false
}) {
  return (
    <div className="draft-screenshot-area">
      <div className="draft-container flex flex-col items-center justify-center">
        <div
          className="relative w-[1200px] h-[650px] rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl"
          style={{
            backgroundImage: `url(${bgImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            marginTop: 40,
          }}
        >
          {/* Structured Top Ban Slots */}
          <div className="absolute left-0 right-0 top-0 flex flex-row justify-center items-start w-full pt-8 z-10">
            <div className="container flex flex-row justify-between items-start w-full" style={{ width: '100%' }}>
              {/* Blue team name input */}
              <div className="flex flex-col items-start pl-2" style={{ position: 'relative' }}>
                {!isCompleteDraft && (
                  <TeamNameInputs
                    blueTeamName={blueTeamName}
                    setBlueTeamName={setBlueTeamName}
                    redTeamName={redTeamName}
                    setRedTeamName={setRedTeamName}
                  />
                )}
                <div id="left-container" className="box flex flex-row gap-2" style={{ marginTop: 0 }}>
                  <DraftSlots 
                    type="ban" 
                    team="blue" 
                    heroes={bans.blue} 
                    size="w-12 h-12" 
                    isActiveSlot={isActiveSlot}
                    handleHeroRemove={handleHeroRemove}
                    handleDraftSlotClick={handleDraftSlotClick}
                    handleDraftSlotEdit={handleDraftSlotEdit}
                    isCompleteDraft={isCompleteDraft}
                  />
                </div>
              </div>
              <div className="middle-content flex-1 flex flex-col items-center justify-center" style={{ minWidth: 220 }}>
                {!isCompleteDraft && (
                  <DraftTimer
                    currentStep={currentStep}
                    draftFinished={draftFinished}
                    draftSteps={draftSteps}
                    timer={timer}
                  />
                )}
              </div>
              {/* Red team name input */}
              <div className="flex flex-col items-end pr-2" style={{ position: 'relative' }}>
                {!isCompleteDraft && (
                  <input
                    id="red-team-name"
                    type="text"
                    value={redTeamName}
                    onChange={e => setRedTeamName(e.target.value)}
                    placeholder="Team Red"
                    className="px-3 py-1 rounded bg-red-700 text-white font-bold text-lg text-right mb-2 pr-2 w-32 focus:outline-none focus:ring-2 focus:ring-red-400"
                    maxLength={20}
                    style={{ zIndex: 2, position: 'relative' }}
                  />
                )}
                <div id="right-container" className="box flex flex-row gap-2" style={{ marginTop: 0 }}>
                  <DraftSlots 
                    type="ban" 
                    team="red" 
                    heroes={bans.red} 
                    size="w-12 h-12" 
                    isActiveSlot={isActiveSlot}
                    handleHeroRemove={handleHeroRemove}
                    handleDraftSlotClick={handleDraftSlotClick}
                    handleDraftSlotEdit={handleDraftSlotEdit}
                    isCompleteDraft={isCompleteDraft}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Blue side pick slots (left) */}
          <div className="absolute left-0 flex flex-col gap-y-3" style={{ top: '140px' }}>
            <DraftSlots 
              type="pick" 
              team="blue" 
              heroes={picks.blue} 
              size="w-16 h-16" 
              isActiveSlot={isActiveSlot}
              handleHeroRemove={handleHeroRemove}
              handleDraftSlotClick={handleDraftSlotClick}
              handleDraftSlotEdit={handleDraftSlotEdit}
              isCompleteDraft={isCompleteDraft}
            />
          </div>
          {/* Red side pick slots (right) */}
          <div className="absolute right-0 flex flex-col gap-y-3" style={{ top: '140px' }}>
            <DraftSlots 
              type="pick" 
              team="red" 
              heroes={picks.red} 
              size="w-16 h-16" 
              isActiveSlot={isActiveSlot}
              handleHeroRemove={handleHeroRemove}
              handleDraftSlotClick={handleDraftSlotClick}
              handleDraftSlotEdit={handleDraftSlotEdit}
              isCompleteDraft={isCompleteDraft}
            />
          </div>
          {/* Inner Panel */}
          <div className="relative w-[900px] h-[480px] rounded-2xl bg-gradient-to-br from-[#181A20cc] via-[#23232acc] to-[#181A20cc] flex flex-col items-center justify-start pt-8 z-20 mt-16 overflow-y-auto" style={{ marginTop: '7rem' }}>
            <HeroGrid
              heroList={heroList}
              heroLoading={heroLoading}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              handleHeroSelect={handleHeroSelect}
              currentStep={currentStep}
              draftSteps={draftSteps}
              bans={bans}
              picks={picks}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 