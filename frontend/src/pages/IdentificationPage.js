import React, { useState, useEffect } from 'react';
import VideoStream from '../composants/VideoStream';
import './IdentificationPage.css';
import { MdVideocam, MdPlayArrow, MdStop } from 'react-icons/md';

const IdentificationPage = () => {
  const [identificationActive, setIdentificationActive] = useState(false);
  const [totalCattleCount, setTotalCattleCount] = useState(0);
  const [totalHumanCount, setTotalHumanCount] = useState(0);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);

  // Charger les caméras au démarrage
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const resLocal = await fetch('http://localhost:5000/api/cameras');
        const localCams = await resLocal.json();

        const resWifi = await fetch('http://localhost:5000/api/cameras/wifi');
        const wifiCams = await resWifi.json();

        const allCams = [
          ...localCams.map(index => ({
            label: `Caméra locale #${index}`,
            type: 'local',
            value: index.toString()
          })),
          ...wifiCams.map((ip, idx) => ({
            label: `Caméra Wi-Fi #${idx + 1}`,
            type: 'wifi',
            value: ip
          }))
        ];

        setAvailableCameras(allCams);
        if (allCams.length > 0) {
          setSelectedCamera(allCams[0]);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des caméras:', err);
      }
    };

    fetchCameras();
  }, []);

  // Démarrer l’identification
  const handleStartIdentification = async () => {
    if (!selectedCamera) return;

    try {
      const response = await fetch('http://localhost:5000/start_identification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camera_id: selectedCamera.value,
          camera_type: selectedCamera.type
        })
      });

      if (response.ok) {
        setIdentificationActive(true);
      } else {
        console.error("Erreur lors du démarrage de l'identification");
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
    }
  };

  // Arrêter l’identification
  const handleStopIdentification = () => {
    setIdentificationActive(false);
  };

  // Actualisation en temps réel des comptes
  useEffect(() => {
    if (!identificationActive) return;

    const interval = setInterval(() => {
      fetch('http://localhost:5000/get_temp_counts')
        .then(res => res.json())
        .then(data => {
          setTotalCattleCount(data.boeufs || 0);
          setTotalHumanCount(data.humains || 0);
        })
        .catch(console.error);
    }, 1000);

    return () => clearInterval(interval);
  }, [identificationActive]);

  return (
    <div className="identification-page">
      <div className="triangles-background">
        {[...Array(15)].map((_, i) => <div key={i} className="triangle" />)}
      </div>

      <div className="content">
        <h2 className="align-title">
          <MdVideocam size={36} className="icon" />
          Identification des Bœufs
        </h2>

        <div className="camera-select">
          <label htmlFor="camera-select">Choisir une caméra :</label>
          <select
            id="camera-select"
            value={selectedCamera ? selectedCamera.value : ''}
            onChange={e => {
              const selected = availableCameras.find(c => c.value === e.target.value);
              setSelectedCamera(selected);
            }}
          >
            {availableCameras.map((cam, index) => (
              <option key={index} value={cam.value}>
                {cam.label}
              </option>
            ))}
          </select>
        </div>

        <div className="button-container">
          {!identificationActive ? (
            <button
              className="start-btn"
              onClick={handleStartIdentification}
              disabled={!selectedCamera}
            >
              <MdPlayArrow size={20} /> Commencer l'identification
            </button>
          ) : (
            <button className="stop-btn" onClick={handleStopIdentification}>
              <MdStop size={20} /> Arrêter l'identification
            </button>
          )}
        </div>

        {identificationActive && selectedCamera && (
          <div className="video-section">
            <VideoStream
              key={`${selectedCamera.value}-${selectedCamera.type}`}
              cameraIndex={selectedCamera.value}
              isWifi={selectedCamera.type === 'wifi'}
            />
          </div>
        )}

        <div className="total-count">
          <div>Total Bœufs détectés : <span className="count">{totalCattleCount} 🐄</span></div>
          <div>Total Humains détectés : <span className="count">{totalHumanCount} 🧍‍♂️</span></div>
        </div>
      </div>
    </div>
  );
};

export default IdentificationPage;
