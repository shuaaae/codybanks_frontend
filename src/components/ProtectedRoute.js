import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Check if user is logged in with error handling
  let currentUser = null;
  try {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      currentUser = JSON.parse(userData);
    }
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    // Clear invalid data
    localStorage.removeItem('currentUser');
  }
  
  // If no user is logged in, redirect to landing page
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  // If user is admin, redirect to admin dashboard
  if (currentUser.is_admin) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  // If user is logged in and not admin, allow access
  return children;
};

export default ProtectedRoute; 