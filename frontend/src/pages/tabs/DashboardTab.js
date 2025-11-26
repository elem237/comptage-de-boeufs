import React, { useEffect, useState } from 'react';
import {
  MdDashboard, MdOutlineVisibility, MdAccessTime, MdVideocam, MdSensors, MdBarChart, MdWifi,
  MdWarning,
  MdFilterListAlt,} from 'react-icons/md';
import './DashboardTab.css';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { io } from 'socket.io-client';

  ChartJS.register(ArcElement, Tooltip, Legend);

  const socket = io('http://localhost:5000');

  const MOCK_STATS = { total_boeufs: 157 };
  const MOCK_CAMERAS_LOCALES = [0, 1];
  const MOCK_WIFI_CAMERAS = ['S2S-Drone'];
  const MOCK_RECENT = [
  { camera: "Caméra locale #0", total: 58 },
  { camera: "S2S-Drone", total: 99 },
  ];
  const MOCK_ALERTS = [
  { camera: "Caméra locale #0", count: 3, time: "14:23" },
  { camera: "S2S-Drone", count: 5, time: "13:10" },
  ];

  const DashboardTab = () => {
    const [stats, setStats] = useState(null);
    const [localCameras, setLocalCameras] = useState([]);
    const [wifiCameras, setWifiCameras] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [filterDate, setFilterDate] = useState('');
    const [filterCamera, setFilterCamera] = useState('');
    const [recentDetections, setRecentDetections] = useState([]);

    const fetchStats = () => {
    fetch("http://localhost:5000/api/boeufs/stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => setStats(MOCK_STATS));

    fetch("http://localhost:5000/api/cameras")
      .then(res => res.json())
      .then(data => setLocalCameras(data))
      .catch(() => setLocalCameras(MOCK_CAMERAS_LOCALES));

    fetch("http://localhost:5000/api/cameras/externes")
      .then(res => res.json())
      .then(data => setWifiCameras(data.cameras || MOCK_WIFI_CAMERAS))
      .catch(() => setWifiCameras(MOCK_WIFI_CAMERAS));
  };

  const handleFilter = async () => {
    try {
      const params = new URLSearchParams();
      if (filterDate) params.append('date', filterDate);
      if (filterCamera) params.append('camera', filterCamera);

      const res = await fetch(`http://localhost:5000/api/boeufs/filtrer?${params.toString()}`);
      const data = await res.json();
      setFilteredData(data);
    } catch {
      setFilteredData([
        { camera: "Caméra locale #1", count: 6, date: "2025-07-06" },
        { camera: "S2S-Drone", count: 9, date: "2025-07-07" },
      ]);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    socket.on('nouvelle_detection', (data) => {
      setAlerts(prev => [data, ...prev.slice(0, 4)]);
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/boeufs/recentes")
      .then(res => res.json())
      .then(data => setRecentDetections(data))
      .catch(() => setRecentDetections(MOCK_RECENT));
  }, []);

  const donutData = {
    labels: recentDetections.map(d => d.camera),
    datasets: [
      {
        label: 'Détections récentes',
        data: recentDetections.map(d => d.total),
        backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff'],
        borderColor: ['#fff'],
        borderWidth: 1,
      },
    ],
  };
  const connectToWifiCamera = async (ssid) => {
  await fetch(`http://localhost:5000/api/cameras/wifi/connecter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ssid, password: "password123" }) // 🔐 met ton mot de passe réel
  });
  fetchStats(); 
  }

  const renderCameraStatus = (cams, type) => (
    cams.map((cam, idx) => (
      <div key={idx} className="camera-status">
        <span className="status-dot green"></span>
        <span>{type} {idx + 1}: {cam}</span>
        {type === "Wi-Fi" && (
          <button onClick={() => connectToWifiCamera(cam)}>🔌 Connecter</button>
        )}
      </div>
    ))
  );

  return (
    <div className="dashboard">
      <h1 className="align-title"><MdDashboard size={36} className="icon" /> Tableau de bord</h1>

      <div className="grid">
        <div className="card blue">
          <MdVideocam size={28} />
          <div>
            <h3>{localCameras.length}</h3>
            <p>Caméras locales</p>
          </div>
        </div>
        <div className="card purple">
          <MdWifi size={28} />
          <div>
            <h3>{wifiCameras.length}</h3>
            <p>Caméras externes (Wi-Fi)</p>
          </div>
        </div>
        <div className="card green">
          <MdOutlineVisibility size={28} />
          <div>
            <h3>{stats?.total_boeufs || 0}</h3>
            <p>Détections totales</p>
          </div>
        </div>
        <div className="card grey">
          <MdAccessTime size={28} />
          <div>
            <h3>{alerts.length > 0 ? alerts[0].time : 'N/A'}</h3>
            <p>Dernière détection</p>
          </div>
        </div>
      </div>

      <div className="section">
        <h3><MdBarChart className="icon" /> Détections Récentes</h3>
        <div style={{ maxWidth: '300px', margin: 'auto' }}>
          {recentDetections.length > 0 ? (
            <Doughnut data={donutData} />
          ) : (
            <p>Aucune détection récente.</p>
          )}
        </div>
      </div>

      <div className="section alerts-section">
        <h3><MdWarning className="icon" /> Alertes récentes</h3>
        {(alerts.length > 0 ? alerts : MOCK_ALERTS).map((a, i) => (
          <div key={i} className="alert-item">
            📷 Caméra {a.camera} - {a.count} bœufs détectés à {a.time || 'N/A'}
          </div>
        ))}
      </div>

      <div className="section filter-section">
        <h3><MdFilterListAlt className="icon" /> Filtrer les détections</h3>
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        <input type="text" placeholder="Nom de caméra" value={filterCamera} onChange={(e) => setFilterCamera(e.target.value)} />
        <button onClick={handleFilter}>Filtrer</button>
        <ul>
          {filteredData.map((d, i) => (
            <li key={i}>📷 {d.camera} – {d.count} bœufs le {d.date}</li>
          ))}
        </ul>
      </div>

      <div className="section">
        <h3><MdSensors /> Caméras Actives</h3>
        <div className="camera-list">
          {renderCameraStatus(localCameras, "Locale")}
          {renderCameraStatus(wifiCameras, "Wi-Fi")}
        </div>
      </div>
    </div>
  );
};
export default DashboardTab;   