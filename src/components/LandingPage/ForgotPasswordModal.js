import React, { useEffect, useState } from 'react';

export default function ForgotPasswordModal({
  showForgotPasswordModal,
  setShowForgotPasswordModal,
  onRequestPasswordReset
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [email, setEmail] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (showForgotPasswordModal) {
      setIsVisible(true);
      // Reset animation state and then start animation
      setIsAnimating(false);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before hiding
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [showForgotPasswordModal]);

  const handleRequestPasswordReset = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsRequesting(true);
    setError('');

    try {
      // Call the parent function to handle the password reset request
      await onRequestPasswordReset(email);
      setRequestSent(true);
    } catch (error) {
      setError(error.message || 'Failed to send password reset request');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setRequestSent(false);
    setShowForgotPasswordModal(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm p-4 transition-all duration-300 ${
        isAnimating ? 'bg-opacity-80' : 'bg-opacity-0'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-gray-600 shadow-2xl w-[95vw] max-w-md flex flex-col overflow-hidden transition-all duration-300 transform ${
          isAnimating 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-50"></div>
        
        {/* Close Button */}
        <button 
          className="absolute top-6 right-6 text-gray-400 hover:text-white text-2xl font-bold transition-colors duration-200 z-50 cursor-pointer hover:scale-110 bg-gray-800/50 rounded-full w-8 h-8 flex items-center justify-center" 
          onClick={handleClose}
          type="button"
        >
          ✕
        </button>
        
        {/* Header Section */}
        <div className="relative z-10 text-center p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-xl">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            Forgot Password?
          </h2>
          <p className="text-gray-300 text-sm mb-6">
            {requestSent 
              ? 'Password reset request sent! The admin will review your request and create a new password for you.'
              : 'Enter your email address and we\'ll send a password reset request to the admin.'
            }
          </p>
        </div>

        {!requestSent ? (
          <form onSubmit={handleRequestPasswordReset} className="relative z-10 px-8 pb-8">
            {/* Email Input */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                className="w-full bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-2xl py-4 px-6 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isRequesting}
              />
            </div>
            
            {/* Error Display */}
            {error && (
              <div className="bg-red-900/20 border border-red-600 rounded-lg p-3 mb-6">
                <div className="text-red-400 text-sm">{error}</div>
              </div>
            )}
            
            {/* Request Button */}
            <button
              type="submit"
              disabled={isRequesting}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRequesting ? 'Sending Request...' : 'Request New Password'}
            </button>
          </form>
        ) : (
          <div className="relative z-10 px-8 pb-8">
            {/* Success Message */}
            <div className="bg-green-900/20 border border-green-600 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="text-green-400 text-sm">
                  Request sent successfully! Check back later for your new password.
                </div>
              </div>
            </div>
            
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] transform"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
