import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img src="/favicon.ico" alt="Logo" className="favicon-animated" />
        <h1>SODEPA CATTLE VISION</h1>
      </div>
      <ul className="navbar-links">
        <li>
          <Link
            to="/admin"
            className={`nav-button ${location.pathname === '/admin' ? 'active' : ''}`}
          >
            Accueil
          </Link>
        </li>
        <li>
          <Link
            to="/identification"
            className={`nav-button ${location.pathname === '/identification' ? 'active' : ''}`}
          >
            Identification
          </Link>
        </li>
        <li>
          <Link
            to="/login"
            className={`nav-button ${location.pathname === '/login' ? 'active' : ''}`}
            onClick={() => localStorage.removeItem('auth')}
          >
            Déconnexion
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
