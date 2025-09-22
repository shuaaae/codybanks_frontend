import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import navbarBg from '../assets/navbarbackground.jpg';
// import { FaUsers, FaTrash, FaPlus, FaSignOutAlt, FaChartBar, FaCog } from 'react-icons/fa';
import PageTitle from '../components/PageTitle';
import useSessionTimeout from '../hooks/useSessionTimeout';
import { buildApiUrl } from '../config/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [users, setUsers] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    is_admin: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordResetRequests, setPasswordResetRequests] = useState([]);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Admin session timeout: 20 minutes
  useSessionTimeout(20, 'adminUser', '/admin/login');

  const navLinks = [
    { label: 'HOME', path: '/admin/dashboard' },
  ];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('adminUser'));
    if (!user) {
      navigate('/admin/login');
      return;
    }
    
    if (!user.is_admin) {
      navigate('/admin/login');
      return;
    }
    
    setCurrentUser(user);
    loadUsers();
    loadPasswordResetRequests();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.user-dropdown')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserDropdown]);

  const loadUsers = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('adminUser'));
      const token = localStorage.getItem('adminAuthToken');
      
      const response = await fetch(buildApiUrl('/admin/users'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Failed to load users:', response.status);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadPasswordResetRequests = async () => {
    try {
      const token = localStorage.getItem('adminAuthToken');
      
      const response = await fetch(buildApiUrl('/admin/password-reset-requests'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPasswordResetRequests(data);
      } else {
        console.error('Failed to load password reset requests:', response.status);
      }
    } catch (error) {
      console.error('Error loading password reset requests:', error);
    }
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordResetModal(true);
  };

  const handleConfirmPasswordReset = async () => {
    if (!selectedUser || !newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    setIsResettingPassword(true);
    setError('');

    try {
      const token = localStorage.getItem('adminAuthToken');
      
      const response = await fetch(buildApiUrl('/admin/reset-user-password'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          new_password: newPassword
        }),
      });

      if (response.ok) {
        // Password reset successful
        setShowPasswordResetModal(false);
        setSelectedUser(null);
        setNewPassword('');
        // Reload users and password reset requests
        loadUsers();
        loadPasswordResetRequests();
        alert('Password reset successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }
    } catch (error) {
      setError(error.message || 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminAuthToken');
    navigate('/admin/login');
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(buildApiUrl('/admin/users'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        const createdUser = await response.json();
        setUsers([...users, createdUser]);
        setShowAddUserModal(false);
        setNewUser({ name: '', email: '', password: '', is_admin: false });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create user');
      }
    } catch (error) {
      setError('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(buildApiUrl(`/admin/users/${userId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
      } else {
        setError('Failed to delete user');
      }
    } catch (error) {
      setError('Failed to delete user');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${navbarBg}) center/cover, #181A20` }}>
      <PageTitle title="Admin Dashboard" />
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-orange-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            </div>
            
            <nav className="flex justify-end w-full">
              <ul className="flex gap-10 mr-8">
                {navLinks.map(link => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.path)}
                      className="text-white hover:text-gray-200 transition-colors duration-200 font-medium"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* User Avatar Dropdown */}
            <div className="relative user-dropdown">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white transition-all duration-200 hover:scale-105 shadow-lg"
              >
                {/* Square Avatar with Black and White Icon */}
                <svg className="w-6 h-6" fill="white" stroke="black" strokeWidth="1" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50">
                  <div className="px-4 py-3 border-b border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center p-0">
                        <svg className="w-6 h-6" fill="white" stroke="black" strokeWidth="1" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">
                          {currentUser?.name || 'Admin'}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {currentUser?.email || 'admin@example.com'}
                        </div>
                        <div className="text-red-400 text-xs font-semibold">
                          Administrator
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Management Section */}
          <div className="bg-gray-800 rounded-lg p-8 shadow-lg">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white px-4 py-2">User Management</h2>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-8 py-3 rounded-lg transition-all duration-200 font-medium text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Add New User
              </button>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-600 rounded-lg p-3 mb-4">
                <div className="text-red-400 text-sm">{error}</div>
              </div>
            )}

            <div className="space-y-4">
              {users.map(user => (
                <div key={user.id} className="bg-gray-700 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-white font-medium">{user.name}</h3>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.is_admin 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {user.is_admin ? 'Admin' : 'User'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-400 hover:text-red-300 transition-colors duration-200"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Password Reset Requests */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Password Reset Requests</h2>
              <button
                onClick={loadPasswordResetRequests}
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200"
              >
                Refresh
              </button>
            </div>
            
            {passwordResetRequests.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-sm">No password reset requests</div>
              </div>
            ) : (
              <div className="space-y-3">
                {passwordResetRequests.map((request) => {
                  const user = users.find(u => u.email === request.email);
                  return (
                    <div key={request.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{request.email}</div>
                        <div className="text-gray-400 text-sm">
                          Requested: {new Date(request.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {user ? (
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200"
                          >
                            Reset Password
                          </button>
                        ) : (
                          <span className="text-gray-500 text-sm">User not found</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Admin Statistics */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6">Admin Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-gray-400 text-sm">Total Users</h3>
                <p className="text-2xl font-bold text-white">{users.length}</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-gray-400 text-sm">Admin Users</h3>
                <p className="text-2xl font-bold text-red-400">
                  {users.filter(user => user.is_admin).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4">
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-gray-600 shadow-2xl w-[95vw] max-w-md flex flex-col overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-50"></div>
            
            <button 
              className="absolute top-6 right-6 text-gray-400 hover:text-white text-2xl font-bold transition-colors duration-200 z-50 cursor-pointer hover:scale-110 bg-gray-800/50 rounded-full w-8 h-8 flex items-center justify-center" 
              onClick={() => setShowAddUserModal(false)}
              type="button"
            >
              ✕
            </button>
            
            <div className="relative z-10 text-center p-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-xl">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Add New User
              </h2>
              <p className="text-gray-300 text-sm">Create a new user account</p>
            </div>
            
            <div className="relative z-10 px-8 pb-8">
              <form className="space-y-6" onSubmit={handleAddUser}>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    className="w-full bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-2xl py-4 px-6 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-200"
                    placeholder="Enter user name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-2xl py-4 px-6 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-200"
                    placeholder="Enter user email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-2xl py-4 px-6 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all duration-200"
                    placeholder="Enter user password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_admin"
                    className="w-4 h-4 text-red-600 bg-gray-800 border-gray-600 rounded focus:ring-red-400 focus:ring-2"
                    checked={newUser.is_admin}
                    onChange={(e) => setNewUser({...newUser, is_admin: e.target.checked})}
                  />
                  <label htmlFor="is_admin" className="ml-2 text-sm text-gray-300">
                    Admin privileges
                  </label>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:opacity-50 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-xl"
                >
                  {loading ? 'Creating User...' : 'Create User'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4">
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-gray-600 shadow-2xl w-[95vw] max-w-md flex flex-col overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-50"></div>
            
            <button 
              className="absolute top-6 right-6 text-gray-400 hover:text-white text-2xl font-bold transition-colors duration-200 z-50 cursor-pointer hover:scale-110 bg-gray-800/50 rounded-full w-8 h-8 flex items-center justify-center" 
              onClick={() => setShowPasswordResetModal(false)}
              type="button"
            >
              ✕
            </button>
            
            <div className="relative z-10 text-center p-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Reset Password
              </h2>
              <p className="text-gray-300 text-sm mb-6">
                Set a new password for {selectedUser?.email}
              </p>
            </div>

            <div className="relative z-10 px-8 pb-8">
              {/* New Password Input */}
              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-2xl py-4 px-6 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isResettingPassword}
                />
              </div>
              
              {/* Error Display */}
              {error && (
                <div className="bg-red-900/20 border border-red-600 rounded-lg p-3 mb-6">
                  <div className="text-red-400 text-sm">{error}</div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPasswordResetModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] transform"
                  disabled={isResettingPassword}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPasswordReset}
                  disabled={isResettingPassword || !newPassword.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResettingPassword ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 