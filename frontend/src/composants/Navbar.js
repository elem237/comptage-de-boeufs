import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('role');
    navigate('/login');
  };

  if (!role) return null;

  const isAdmin = role === 'admin';
  const basePath = isAdmin ? '/admin' : '/user';

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-logo" onClick={() => navigate(basePath + '/dashboard')}>
        <img src="/logo_sodepa_hd (1).png" alt="Logo" className="navbar-logo-img animate-logo" />
        <span className="navbar-title">SODEPA CATTLE VISION</span>
      </div>

      <ul className="navbar-links">
        <li className={location.pathname.includes('identification') ? 'active' : ''}>
          <Link to={`${basePath}/identification`}>Identification</Link>
        </li>

        {role === 'utilisateur' && (
          <li className={location.pathname.includes('tickets') ? 'active' : ''}>
            <Link to="/user/tickets">Tickets</Link>
          </li>
        )}

        {isAdmin && (
          <li className={location.pathname === '/admin' || location.pathname.includes('dashboard') ? 'active' : ''}>
            <Link to="/admin/dashboard">Admin</Link>
          </li>
        )}

        <li>
          <button onClick={handleLogout} className="logout-button">Déconnexion</button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
