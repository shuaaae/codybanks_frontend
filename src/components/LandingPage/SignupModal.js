import React from 'react';

export default function SignupModal({
  showSignupModal,
  setShowSignupModal,
  onSwitchToLogin
}) {
  if (!showSignupModal) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4"
      onClick={() => setShowSignupModal(false)}
    >
      <div 
        className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-gray-600 shadow-2xl w-[95vw] max-w-md max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-50"></div>
        
        {/* Close Button */}
        <button 
          className="absolute top-6 right-6 text-gray-400 hover:text-white text-2xl font-bold transition-colors duration-200 z-50 cursor-pointer hover:scale-110 bg-gray-800/50 rounded-full w-8 h-8 flex items-center justify-center" 
          onClick={() => setShowSignupModal(false)}
          type="button"
        >
          ✕
        </button>
        
        {/* Header Section */}
        <div className="relative z-10 text-center p-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center shadow-xl">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Join the Competition
          </h2>
          <p className="text-gray-300 text-sm">Create your account and start your esports journey</p>
        </div>
        
        {/* Signup Form */}
        <div className="relative z-10 px-8 pb-8 flex-1 overflow-y-auto">
          <form className="space-y-4">
            {/* Full Name Input */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                type="text"
                className="w-full bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-2xl py-4 px-6 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                className="w-full bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-2xl py-4 px-6 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
                placeholder="Enter your email"
                required
              />
            </div>
            
            {/* Password Input */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                className="w-full bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-2xl py-4 px-6 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
                placeholder="Create a password"
                required
              />
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                className="w-full bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-2xl py-4 px-6 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
                placeholder="Confirm your password"
                required
              />
            </div>
            
            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-400 focus:ring-2 mt-1"
                required
              />
              <label className="ml-2 text-sm text-gray-300">
                I agree to the{' '}
                <button
                  type="button"
                  className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                >
                  Terms of Service
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                >
                  Privacy Policy
                </button>
              </label>
            </div>
            
            {/* Sign Up Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] transform"
            >
              Create Account
            </button>
            
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-400">Or sign up with</span>
              </div>
            </div>
            
            {/* Google Signup Button */}
            <div className="w-full">
              <button
                type="button"
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-600 rounded-xl text-gray-300 hover:bg-gray-800/50 transition-all duration-200 hover:scale-[1.02]"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </button>
            </div>
            
            {/* Sign In Link */}
            <div className="text-center">
              <span className="text-gray-400 text-sm">Already have an account? </span>
              <button
                type="button"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200"
                onClick={onSwitchToLogin}
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 