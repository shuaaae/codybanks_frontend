import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import mainBg from '../assets/mainbg.jpg';
import PageTitle from '../components/PageTitle';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    // Check if admin is already logged in
    const adminUser = JSON.parse(localStorage.getItem('adminUser'));
    if (adminUser && adminUser.is_admin) {
      // Small delay to show redirect message
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1000);
      return;
    }
    setIsRedirecting(false);
  }, [navigate]);

  // Show loading screen if redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${mainBg}) center/cover, #181A20` }}>
        <PageTitle title="Admin Login" />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Admin already logged in...</p>
          <p className="text-gray-400 text-sm mt-2">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/public/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Login-Type': 'admin'
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store admin data in separate localStorage key
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      localStorage.setItem('adminAuthToken', data.token);
      
      // Clear any existing user session to prevent conflicts
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
      
      // Redirect to admin dashboard
      navigate('/admin/dashboard');

    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleCloseModal = () => {
    setEmail('');
    setPassword('');
    setError('');
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${mainBg}) center/cover, #181A20` }}>
      <PageTitle title="Admin Login" />
      <div className="w-full max-w-md mx-auto px-4">
        {/* Admin Login Card */}
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-gray-600 shadow-2xl overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-50"></div>
          
          {/* Header Section */}
          <div className="relative z-10 text-center p-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-xl">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Admin Access
            </h1>
            <p className="text-gray-300 text-sm">Enter your administrator credentials</p>
          </div>
          
          {/* Login Form */}
          <div className="relative z-10 px-8 pb-8">
            <form className="space-y-6" onSubmit={handleLogin}>
              {/* Email Input */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-2xl py-4 px-6 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-200"
                  placeholder="Enter admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              {/* Password Input */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-2xl py-4 px-6 pr-12 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-200"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Error Display */}
              {error && (
                <div className="bg-red-900/20 border border-red-600 rounded-lg p-3">
                  <div className="text-red-400 text-sm">{error}</div>
                </div>
              )}
              
              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:opacity-50 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-xl"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-xs">
            © 2025 Josua Godalle Admin Panel. Secure access only.
          </p>
        </div>
      </div>
    </div>
  );
} 