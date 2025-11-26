import React, { useEffect, useState } from 'react';
import './CamerasTab.css';
import {
  MdWifi,
  MdSensors,
  MdSignalWifiStatusbarConnectedNoInternet,
  MdWifiTethering,
  MdLink,
  MdWarningAmber,
} from 'react-icons/md';

const MOCK_LOCAL_CAMERAS = [0, 1];
const MOCK_WIFI_NETWORKS = ['Caméra-Ext-01', 'Caméra-Ext-02'];
const MOCK_CONNECTED_WIFI = ['Caméra-Ext-02'];

const CamerasTab = () => {
  const [localCameras, setLocalCameras] = useState([]);
  const [wifiNetworks, setWifiNetworks] = useState([]);
  const [connectedWifi, setConnectedWifi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mockUsed, setMockUsed] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    setMockUsed(false);

    try {
      const [localRes, wifiRes, connectedRes] = await Promise.all([
        fetch('http://localhost:5000/api/cameras'),
        fetch('http://localhost:5000/api/cameras/wifi/detecter'),
        fetch('http://localhost:5000/api/cameras/wifi'),
      ]);

      const localData = await localRes.json();
      const wifiData = await wifiRes.json();
      const connected = await connectedRes.json();

      setLocalCameras(localData || []);
      setWifiNetworks(wifiData?.reseaux_detectes || []);
      setConnectedWifi(connected || []);
    } catch (err) {
      console.error('Erreur de récupération des données :', err);

      // 🔁 Utilisation des données fictives
      setLocalCameras(MOCK_LOCAL_CAMERAS);
      setWifiNetworks(MOCK_WIFI_NETWORKS);
      setConnectedWifi(MOCK_CONNECTED_WIFI);
      setMockUsed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleConnectToSSID = async (ssid) => {
    try {
      const res = await fetch('http://localhost:5000/api/cameras/wifi/connecter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssid }),
      });

      if (res.ok) {
        alert(`Connexion lancée à ${ssid}`);
        fetchAllData();
      } else {
        const data = await res.json();
        alert(`Erreur de connexion : ${data.error}`);
      }
    } catch (err) {
      console.error('Erreur lors de la connexion Wi-Fi :', err);
      alert('Erreur de connexion réseau.');
    }
  };

  if (loading) {
    return <div className="loading">Chargement des caméras et réseaux...</div>;
  }

  return (
    <div className="camera-tab-container">
      <h2 className="align-title">
        <MdSensors size={40} className="icon" /> Gestion des Caméras
      </h2>

      {mockUsed && (
        <div className="mock-warning">
          <MdWarningAmber size={20} color="orange" />
          Données fictives affichées (connexion backend indisponible).
        </div>
      )}

      {/* Caméras locales */}
      <section className="camera-section">
        <h3><MdWifiTethering /> Caméras locales détectées automatiquement</h3>
        {localCameras.length > 0 ? (
          <ul className="camera-list">
            {localCameras.map((cam, index) => (
              <li key={`local-${index}`}>
                Caméra locale #{index + 1} (index : {cam})
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-msg">Aucune caméra locale détectée.</p>
        )}
      </section>

      {/* Réseaux Wi-Fi détectés */}
      <section className="camera-section">
        <h3><MdWifi /> Réseaux Wi-Fi détectés (caméras Wi-Fi)</h3>
        {wifiNetworks.length > 0 ? (
          <ul className="camera-list">
            {wifiNetworks.map((ssid, index) => (
              <li key={`wifi-${index}`}>
                {ssid}
                <button
                  className="connect-btn"
                  onClick={() => handleConnectToSSID(ssid)}
                  disabled={connectedWifi.includes(ssid)}
                >
                  <MdLink size={18} /> {connectedWifi.includes(ssid) ? 'Connecté' : 'Connecter'}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-msg">Aucun réseau Wi-Fi détecté.</p>
        )}
      </section>

      {/* Réseaux connectés */}
      <section className="camera-section">
        <h3><MdSignalWifiStatusbarConnectedNoInternet /> Caméras Wi-Fi actives</h3>
        {connectedWifi.length > 0 ? (
          <ul className="camera-list">
            {connectedWifi.map((ssid, index) => (
              <li key={`connected-${index}`}>
                {ssid} (actif)
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-msg">Aucune caméra Wi-Fi connectée.</p>
        )}
      </section>
    </div>
  );
};

export default CamerasTab;
