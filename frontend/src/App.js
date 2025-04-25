import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import IdentificationPage from './pages/IdentificationPage';
import Login from './pages/Login';
import Navbar from './composants/Navbar';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('auth') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const isAuthenticated = localStorage.getItem('auth') === 'true'; // Définir ici

  return (
    <Router>
      <Routes>
       
        <Route path="/" element={isAuthenticated ? <AdminPage /> : <Login />} />

        
        <Route path="/login" element={<Login />} />

        
        <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
        <Route path="/identification" element={<PrivateRoute><IdentificationPage /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
