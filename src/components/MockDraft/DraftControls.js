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
  isSavingDraft
}) {
  return (
    <div className="flex justify-center items-center gap-6 mt-8">
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
          className="px-8 py-2 rounded-lg text-white font-semibold transition backdrop-blur-md bg-green-600 hover:bg-green-700"
          style={{ border: 'none', boxShadow: 'none' }}
          onClick={handleStartDraft}
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
    </div>
  );
} 