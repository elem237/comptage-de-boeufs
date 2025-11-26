import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../composants/Navbar';
import './UserPage.css';

const UserPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'utilisateur') {
      navigate('/login'); // redirection forcée si non utilisateur
    }
  }, [navigate]);

  return (
    <div className="user-page">
      <Navbar />
      <div className="user-content">
        <Outlet />
      </div>
    </div>
  );
};

export default UserPage;
