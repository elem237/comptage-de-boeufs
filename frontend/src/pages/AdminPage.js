import React, { useEffect, useState } from 'react';
import Navbar from '../composants/Navbar';
import DashboardTab from './tabs/DashboardTab';
import CamerasTab from './tabs/CamerasTab';
import StatsTab from './tabs/StatsTab';
import TicketTab from './tabs/TicketTab';

import {
  MdDashboard,
  MdBarChart,
  MdVideocam
} from 'react-icons/md';

import { RiTicket2Line } from 'react-icons/ri'; 


import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './AdminPage.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chartData, setChartData] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'stats') {
      fetch("http://localhost:5000/api/boeufs/hebdomadaire")
        .then(res => res.json())
        .then(data => {
          const labels = Object.keys(data);
          const values = Object.values(data);
          setChartData({
            labels,
            datasets: [{
              label: 'Bœufs détectés',
              data: values,
              backgroundColor: '#BEFF99',
              borderColor: '#35AAFA',
              borderWidth: 2,
            }],
          });
        });

      fetch("http://localhost:5000/api/boeufs/stats")
        .then(res => res.json())
        .then(data => setStats(data));
    }
  }, [activeTab]);

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab />;
      case 'cameras': return <CamerasTab />;
      case 'stats': return <StatsTab chartData={chartData} stats={stats} />;
      case 'ticket': return <TicketTab />;
      default: return null;
    }
  };

  return (
    <div className="admin-layout">
      <Navbar />
      <div className="admin-content">
        <aside className="sidebar">
          <ul>
            <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
              <MdDashboard className="icon" /> Tableau de bord
            </li>
            <li className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}>
              <MdBarChart className="icon" /> Statistiques
            </li>
            <li className={activeTab === 'cameras' ? 'active' : ''} onClick={() => setActiveTab('cameras')}>
              <MdVideocam className="icon" /> Caméras
            </li>
            <li className={activeTab === 'ticket' ? 'active' : ''} onClick={() => setActiveTab('ticket')}>
              <RiTicket2Line className="icon" /> Bon d'Abattage
            </li>
          </ul>
        </aside>
        <main className="main-view">
          {renderTab()}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
