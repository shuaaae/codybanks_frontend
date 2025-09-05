import React, { useState, useEffect } from 'react';

export default function DraftHistoryModal({ isOpen, onClose }) {
  const [savedDrafts, setSavedDrafts] = useState([]);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isImageClosing, setIsImageClosing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load saved drafts from database
  useEffect(() => {
    if (isOpen) {
      fetchDrafts();
    }
  }, [isOpen]);

  const fetchDrafts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current user ID from localStorage
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!currentUser.id) {
        setError('User not logged in');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://api.coachdatastatistics.site'}/api/drafts?user_id=${currentUser.id}`);
      const result = await response.json();
      
      if (result.success) {
        setSavedDrafts(result.drafts);
      } else {
        setError(result.message || 'Failed to fetch drafts');
      }
    } catch (err) {
      setError('Failed to fetch drafts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle draft selection
  const handleDraftSelect = (draft) => {
    setSelectedDraft(draft);
  };

  // Handle draft deletion
  const handleDeleteDraft = async (draftId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://api.coachdatastatistics.site'}/api/drafts/${draftId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: JSON.parse(localStorage.getItem('currentUser') || '{}').id })
      });
      
      const result = await response.json();
      
      if (result.success) {
        const updatedDrafts = savedDrafts.filter(draft => draft.id !== draftId);
        setSavedDrafts(updatedDrafts);
        
        // Clear selected draft if it was deleted
        if (selectedDraft && selectedDraft.id === draftId) {
          setSelectedDraft(null);
        }
      } else {
        alert('Failed to delete draft: ' + result.message);
      }
    } catch (err) {
      alert('Failed to delete draft: ' + err.message);
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

  // Handle download draft image
  const handleDownloadDraft = (draft) => {
    if (draft.image_url) {
      const link = document.createElement('a');
      // Use PNG extension to match the PNG data format
      link.download = `draft-${draft.blue_team_name}-vs-${draft.red_team_name}-${new Date(draft.created_at).toISOString().split('T')[0]}.png`;
      link.href = draft.image_url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('No image data available for this draft.');
    }
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
              {loading ? (
                <div className="text-gray-400 text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  Loading drafts...
                </div>
              ) : error ? (
                <div className="text-red-400 text-center py-8">
                  {error}
                  <button 
                    onClick={fetchDrafts}
                    className="block mt-2 text-blue-400 hover:text-blue-300"
                  >
                    Retry
                  </button>
                </div>
              ) : savedDrafts.length === 0 ? (
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
                      {draft.blue_team_name || 'Blue Team'} vs {draft.red_team_name || 'Red Team'}
                    </div>
                    <div className="text-gray-300 text-sm mb-2">
                      {new Date(draft.created_at).toLocaleDateString()} at {new Date(draft.created_at).toLocaleTimeString()}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-gray-400 text-xs">
                        {draft.blue_picks?.length || 0} picks, {draft.blue_bans?.length || 0} bans
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
                   {selectedDraft.image_url && (
                     <div className="mb-4 relative group">
                       <img
                         src={selectedDraft.image_url}
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
                       {/* Download Button */}
                       <button
                         onClick={() => handleDownloadDraft(selectedDraft)}
                         className="absolute top-2 right-2 bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition-colors duration-200 shadow-lg"
                         title="Download Draft Image"
                       >
                         <svg 
                           width="20" 
                           height="20" 
                           viewBox="0 0 24 24" 
                           fill="none" 
                           stroke="white" 
                           strokeWidth="2" 
                           strokeLinecap="round" 
                           strokeLinejoin="round"
                         >
                           <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                           <polyline points="7,10 12,15 17,10"/>
                           <line x1="12" y1="15" x2="12" y2="3"/>
                         </svg>
                       </button>
                     </div>
                   )}
                  
                  {/* Draft Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-white font-semibold mb-2">Blue Team ({selectedDraft.blue_team_name || 'Blue Team'})</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-400 text-sm">Picks:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedDraft.blue_picks?.map((hero, index) => (
                              <span key={index} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                                {hero?.name || 'Empty'}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Bans:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedDraft.blue_bans?.map((hero, index) => (
                              <span key={index} className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                                {hero?.name || 'Empty'}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-white font-semibold mb-2">Red Team ({selectedDraft.red_team_name || 'Red Team'})</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-400 text-sm">Picks:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedDraft.red_picks?.map((hero, index) => (
                              <span key={index} className="bg-red-500 text-white px-2 py-1 rounded text-xs">
                                {hero?.name || 'Empty'}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Bans:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedDraft.red_bans?.map((hero, index) => (
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
       {isImageExpanded && selectedDraft?.image_url && (
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
             <button
               onClick={() => handleDownloadDraft(selectedDraft)}
               className="absolute -top-12 right-16 bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition-colors duration-200 z-10 shadow-lg"
               title="Download Draft Image"
             >
               <svg 
                 width="24" 
                 height="24" 
                 viewBox="0 0 24 24" 
                 fill="none" 
                 stroke="white" 
                 strokeWidth="2" 
                 strokeLinecap="round" 
                 strokeLinejoin="round"
               >
                 <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                 <polyline points="7,10 12,15 17,10"/>
                 <line x1="12" y1="15" x2="12" y2="3"/>
               </svg>
             </button>
             <img
               src={selectedDraft.image_url}
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
