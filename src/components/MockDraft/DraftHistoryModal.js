import React, { useState, useEffect } from 'react';

export default function DraftHistoryModal({ isOpen, onClose }) {
  const [savedDrafts, setSavedDrafts] = useState([]);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isImageClosing, setIsImageClosing] = useState(false);

  // Load saved drafts from localStorage
  useEffect(() => {
    if (isOpen) {
      const drafts = JSON.parse(localStorage.getItem('savedDrafts') || '[]');
      setSavedDrafts(drafts);
    }
  }, [isOpen]);

  // Handle draft selection
  const handleDraftSelect = (draft) => {
    setSelectedDraft(draft);
  };

  // Handle draft deletion
  const handleDeleteDraft = (draftId) => {
    const updatedDrafts = savedDrafts.filter(draft => draft.id !== draftId);
    setSavedDrafts(updatedDrafts);
    localStorage.setItem('savedDrafts', JSON.stringify(updatedDrafts));
    
    // Clear selected draft if it was deleted
    if (selectedDraft && selectedDraft.id === draftId) {
      setSelectedDraft(null);
    }
  };

  // Close modal
  const handleClose = () => {
    setSelectedDraft(null);
    setIsImageExpanded(false);
    setIsImageClosing(false);
    onClose();
  };

  // Handle image expand
  const handleImageExpand = () => {
    setIsImageExpanded(true);
    setIsImageClosing(false);
  };

  // Handle image close
  const handleImageClose = () => {
    setIsImageClosing(true);
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setIsImageExpanded(false);
      setIsImageClosing(false);
    }, 300); // Match animation duration
  };

  if (!isOpen) return null;

  return (
    <>
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes scaleIn {
          from { 
            transform: scale(0.8);
            opacity: 0;
          }
          to { 
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes scaleOut {
          from { 
            transform: scale(1);
            opacity: 1;
          }
          to { 
            transform: scale(0.8);
            opacity: 0;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-fadeOut {
          animation: fadeOut 0.3s ease-in;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        .animate-scaleOut {
          animation: scaleOut 0.3s ease-in;
        }
      `}</style>
      
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]">
        <div className="bg-[#23232a] rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col z-[99999]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Draft History</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="flex flex-1 gap-6 overflow-hidden">
          {/* Draft List */}
          <div className="w-1/3 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">Saved Drafts</h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {savedDrafts.length === 0 ? (
                <div className="text-gray-400 text-center py-8">
                  No saved drafts yet
                </div>
              ) : (
                savedDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedDraft?.id === draft.id
                        ? 'bg-blue-600 border-2 border-blue-400'
                        : 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
                    }`}
                    onClick={() => handleDraftSelect(draft)}
                  >
                    <div className="text-white font-semibold mb-2">
                      {draft.blueTeamName || 'Blue Team'} vs {draft.redTeamName || 'Red Team'}
                    </div>
                    <div className="text-gray-300 text-sm mb-2">
                      {new Date(draft.timestamp).toLocaleDateString()} at {new Date(draft.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-gray-400 text-xs">
                        {draft.bluePicks?.length || 0} picks, {draft.blueBans?.length || 0} bans
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDraft(draft.id);
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Draft Preview */}
          <div className="w-2/3 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">Draft Preview</h3>
            <div className="flex-1 bg-gray-800 rounded-lg p-4 overflow-auto">
              {selectedDraft ? (
                <div className="space-y-4">
                                     {/* Draft Image */}
                   {selectedDraft.imageData && (
                     <div className="mb-4 relative group">
                       <img
                         src={selectedDraft.imageData}
                         alt="Draft Preview"
                         className="max-w-full h-auto rounded-lg border border-gray-600 cursor-pointer transition-all duration-200"
                         onClick={handleImageExpand}
                       />
                       {/* Expand Icon - Only visible on hover */}
                       <div 
                         className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                         onClick={handleImageExpand}
                       >
                         <div className="bg-black bg-opacity-70 rounded-full p-4 hover:bg-opacity-80 transition-all">
                           <svg 
                             width="32" 
                             height="32" 
                             viewBox="0 0 24 24" 
                             fill="none" 
                             stroke="white" 
                             strokeWidth="2" 
                             strokeLinecap="round" 
                             strokeLinejoin="round"
                           >
                             <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                           </svg>
                         </div>
                       </div>
                     </div>
                   )}
                  
                  {/* Draft Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-white font-semibold mb-2">Blue Team ({selectedDraft.blueTeamName || 'Blue Team'})</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-400 text-sm">Picks:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedDraft.bluePicks?.map((hero, index) => (
                              <span key={index} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                                {hero?.name || 'Empty'}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Bans:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedDraft.blueBans?.map((hero, index) => (
                              <span key={index} className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                                {hero?.name || 'Empty'}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-white font-semibold mb-2">Red Team ({selectedDraft.redTeamName || 'Red Team'})</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-400 text-sm">Picks:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedDraft.redPicks?.map((hero, index) => (
                              <span key={index} className="bg-red-500 text-white px-2 py-1 rounded text-xs">
                                {hero?.name || 'Empty'}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Bans:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedDraft.redBans?.map((hero, index) => (
                              <span key={index} className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                                {hero?.name || 'Empty'}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Select a draft to view details
                </div>
              )}
            </div>
          </div>
                 </div>
       </div>
       
       {/* Expanded Image Modal */}
       {isImageExpanded && selectedDraft?.imageData && (
         <div className={`fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[999999] ${isImageClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
           <div className={`relative max-w-[80vw] max-h-[80vh] flex items-center justify-center ${isImageClosing ? 'animate-scaleOut' : 'animate-scaleIn'}`}>
             <button
               onClick={handleImageClose}
               className="absolute -top-12 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors duration-200 z-10 shadow-lg"
               title="Close expanded image"
             >
               <svg 
                 width="24" 
                 height="24" 
                 viewBox="0 0 24 24" 
                 fill="white"
               >
                 <path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.88c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
               </svg>
             </button>
             <img
               src={selectedDraft.imageData}
               alt="Draft Preview - Full Size"
               className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-gray-600"
             />
           </div>
         </div>
       )}
      </div>
    </>
   );
 }
