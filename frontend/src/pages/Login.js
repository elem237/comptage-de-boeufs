import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import { MdLogin } from 'react-icons/md';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('utilisateur');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (role === 'admin' && username === 'admin' && password === 'admin') {
      localStorage.setItem('role', 'admin');
      navigate('/admin/dashboard');
    } else if (role === 'utilisateur' && username === 'user' && password === 'user') {
      localStorage.setItem('role', 'utilisateur');
      navigate('/user/identification');
    } else {
      alert('Identifiants ou rôle incorrects');
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="logo-top">
          <img
            src="/logo_sodepa_hd (1).png"
            alt="Logo SODEPA"
            className="logo-image"
          />
        </div>

        <h2><MdLogin size={28} /> Connexion</h2>
        <form onSubmit={handleSubmit} className="login-form">
           <div className="form-group">
            <label>Nom d'utilisateur :</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Mot de passe :</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Rôle :</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="utilisateur">Utilisateur</option>
              <option value="admin">Super Admin</option>
            </select>
          </div>

          <button type="submit" className="login-button">
            Se connecter
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;
