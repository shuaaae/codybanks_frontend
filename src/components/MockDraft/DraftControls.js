import React from 'react';

export default function DraftControls({
  timerActive,
  draftFinished,
  currentStep,
  draftSteps,
  isDraftStarted,
  handleStartDraft,
  handleStopDraft,
  handleSkipBan,
  handleResetDraft,
  handleSaveDraft,
  isSavingDraft,
  areAllLanesAssigned = true,
  areLaneAssignmentsValid = true,
  onShowDraftHistory,
  onShowDraftAnalysis,
  onCompleteDraft
}) {
  // Check if start button should be disabled
  const isStartDisabled = !areAllLanesAssigned || !areLaneAssignmentsValid;
  
  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      {/* Lane assignment status */}
      {!areAllLanesAssigned && (
        <div className="px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold flex items-center gap-2">
          <span className="text-xs">⚠️</span>
          Please assign all lanes for both teams
        </div>
      )}
      {areAllLanesAssigned && !areLaneAssignmentsValid && (
        <div className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold flex items-center gap-2">
          <span className="text-xs">❌</span>
          Each lane must be assigned only once per team
        </div>
      )}
      {areAllLanesAssigned && areLaneAssignmentsValid && (
        <div className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold flex items-center gap-2">
          <span className="text-xs">✅</span>
          All lanes assigned correctly
        </div>
      )}
      
      {/* Control buttons */}
      <div className="flex justify-center items-center gap-6">
        {timerActive ? (
          <button
            className="px-8 py-2 rounded-lg text-white font-semibold transition backdrop-blur-md bg-red-600 hover:bg-red-700"
            style={{ border: 'none', boxShadow: 'none' }}
            onClick={handleStopDraft}
          >
            Stop
          </button>
        ) : (
          <button
            className={`px-8 py-2 rounded-lg text-white font-semibold transition backdrop-blur-md ${
              isStartDisabled 
                ? 'bg-gray-500 cursor-not-allowed opacity-50' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
            style={{ border: 'none', boxShadow: 'none' }}
            onClick={handleStartDraft}
            disabled={isStartDisabled}
            title={isStartDisabled ? 'Complete lane assignments first' : 'Start the draft'}
          >
            Start
          </button>
        )}
        {timerActive && !draftFinished && draftSteps[currentStep]?.type === 'ban' && (
          <button
            className="px-8 py-2 rounded-lg text-white font-semibold transition backdrop-blur-md bg-gray-700 hover:bg-gray-600"
            style={{ border: 'none', boxShadow: 'none' }}
            onClick={handleSkipBan}
          >
            Skip Ban
          </button>
        )}
        <button
          onClick={handleResetDraft}
          className="px-8 py-2 rounded-lg text-white font-semibold transition backdrop-blur-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ border: 'none', boxShadow: 'none' }}
          disabled={!isDraftStarted()}
        >
          Reset Draft
        </button>
        {isDraftStarted() && (
          <button
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            className="px-8 py-2 rounded-lg text-white font-semibold transition backdrop-blur-md bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ border: 'none', boxShadow: 'none' }}
          >
            {isSavingDraft ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              'Save Draft'
            )}
          </button>
        )}
        <button
          onClick={onShowDraftHistory}
          className="px-8 py-2 rounded-lg text-white font-semibold transition backdrop-blur-md bg-purple-600 hover:bg-purple-700"
          style={{ border: 'none', boxShadow: 'none' }}
        >
          Draft History
        </button>
        {draftFinished && (
          <button
            onClick={onShowDraftAnalysis}
            className="px-8 py-2 rounded-lg text-white font-semibold transition backdrop-blur-md bg-indigo-600 hover:bg-indigo-700"
            style={{ border: 'none', boxShadow: 'none' }}
          >
            Analyze Draft
          </button>
        )}
        {draftFinished && (
          <button
            onClick={onCompleteDraft}
            className="px-8 py-2 rounded-lg text-white font-semibold transition backdrop-blur-md bg-green-600 hover:bg-green-700"
            style={{ border: 'none', boxShadow: 'none' }}
          >
            Complete Draft
          </button>
        )}
      </div>
    </div>
  );
} 