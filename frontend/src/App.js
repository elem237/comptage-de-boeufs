import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminPage from './pages/AdminPage';
import UserPage from './pages/UserPage';
import IdentificationPage from './pages/IdentificationPage';
import TicketTab from './pages/tabs/TicketTab';
import DashboardTab from './pages/tabs/DashboardTab';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        <Route path="/admin" element={<AdminPage />}>
          <Route path="dashboard" element={<DashboardTab />} />
          <Route path="identification" element={<IdentificationPage />} />
        </Route>

        <Route path="/user" element={<UserPage />}>
          <Route path="identification" element={<IdentificationPage />} />
          <Route path="tickets" element={<TicketTab />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
