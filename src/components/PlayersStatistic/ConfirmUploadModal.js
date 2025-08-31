import React from 'react';

const ConfirmUploadModal = ({ 
  isOpen, 
  pendingPhoto, 
  onConfirm, 
  onCancel,
  isUploading = false
}) => {
  if (!isOpen || !pendingPhoto) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90" style={{ pointerEvents: 'auto' }}>
      <div className="bg-[#23232a] rounded-2xl shadow-2xl p-8 min-w-[340px] max-w-[90vw] flex flex-col items-center z-[10000]">
        <div className="text-white text-lg font-bold mb-4">Are you sure you want to use this photo?</div>
        <img
          src={URL.createObjectURL(pendingPhoto.file)}
          alt="Preview"
          className="w-[180px] h-[210px] object-cover mb-4 rounded-xl"
          style={{ objectPosition: 'center' }}
        />
        <div className="flex gap-6">
          <button 
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              isUploading 
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white`} 
            onClick={onConfirm}
            disabled={isUploading}
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Uploading...
              </div>
            ) : (
              'Confirm'
            )}
          </button>
          <button 
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold" 
            onClick={onCancel}
            disabled={isUploading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmUploadModal; 
