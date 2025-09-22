import React from 'react';

export default function DraftTimer({ currentStep, draftFinished, draftSteps, timer, areAllLanesAssigned, areLaneAssignmentsValid, timerEnabled = false }) {
  return (
    <>
      <div className="middle-text text-2xl font-bold text-white">
        {currentStep === -1 ? 
          (areAllLanesAssigned && areLaneAssignmentsValid ? 'Ready to Start' : 'Please assign all lanes for both teams first') :
         draftFinished ? 'Draft Finished' : 
         draftSteps[currentStep]?.type === 'ban' ? 
           `${draftSteps[currentStep]?.team === 'blue' ? 'Blue' : 'Red'} Team Ban` : 
         draftSteps[currentStep]?.type === 'pick' ? 
           `${draftSteps[currentStep]?.team === 'blue' ? 'Blue' : 'Red'} Team Pick` : 
         'Ready'}
      </div>
      {currentStep >= 0 && !draftFinished && timerEnabled && (
        <div id="timer" className="text-lg text-white">{timer}</div>
      )}
    </>
  );
} 