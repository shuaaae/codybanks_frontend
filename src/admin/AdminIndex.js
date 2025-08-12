import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import mainBg from '../assets/mainbg.jpg';
import PageTitle from '../components/PageTitle';

export default function AdminIndex() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is already logged in
    const adminUser = JSON.parse(localStorage.getItem('adminUser'));
    if (adminUser && adminUser.is_admin) {
      navigate('/admin/dashboard');
    } else {
      navigate('/admin/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${mainBg}) center/cover, #181A20` }}>
      <PageTitle title="Admin" />
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
        <p className="text-white">Redirecting...</p>
      </div>
    </div>
  );
} 