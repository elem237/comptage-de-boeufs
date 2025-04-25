import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; 

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === 'admin' && password === 'admin') {
      localStorage.setItem('auth', 'true');
      navigate('/admin');
    } else {
      alert('Identifiants incorrects');
    }
  };

  return (
    <div className="login-container" 
    style={{
      backgroundImage: 'url(/cattle.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}
  >
      <div className="login-box">
        <div className="welcome-text">
          <h1>Bienvenue sur SODEPA Cattle Vision 🐄</h1>
          <p>Connectez-vous pour gérer les flux vidéo et suivre vos statistiques en temps réel.</p>
        </div>
        <h2 className="login-title">Connectez-vous</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="login-button">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
