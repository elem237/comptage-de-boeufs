import React, { useState, useEffect } from 'react';
import Navbar from '../composants/Navbar';
import VideoStream from '../composants/VideoStream';
import './IdentificationPage.css';

const IdentificationPage = () => {
  const [cameraIndex, setCameraIndex] = useState(0);
  const [identificationActive, setIdentificationActive] = useState(false);
  const [totalCattleCount, setTotalCattleCount] = useState(0);
  const [totalPeopleCount, setTotalPeopleCount] = useState(0);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(0);

  const handleCameraChange = (e) => {
    const index = Number(e.target.value);
    setSelectedCamera(index);
    setCameraIndex(index);
  };

  const handleStartIdentification = () => {
    fetch('http://localhost:5000/start_identification', { method: 'POST' })
      .then(res => {
        if (res.ok) {
          setIdentificationActive(true);
          alert("Identification des bœufs et des hommes en cours...");
        } else {
          alert("Impossible de démarrer l'identification");
        }
      })
      .catch(err => {
        console.error(err);
        alert("Erreur réseau lors du démarrage");
      });
  };

  const handleStopIdentification = () => {
    fetch('http://localhost:5000/stop_identification', { method: 'POST' })
      .then(res => {
        if (res.ok) {
          setIdentificationActive(false);
          alert("Identification arrêtée.");
        } else {
          alert("Impossible d'arrêter l'identification");
        }
      })
      .catch(err => {
        console.error(err);
        alert("Erreur réseau lors de l'arrêt");
      });
  };

  useEffect(() => {
    fetch('http://localhost:5000/api/cameras')
      .then(res => res.json())
      .then(data => {
        setCameras(data);
        if (data.length > 0) {
          setSelectedCamera(data[0]);
          setCameraIndex(data[0]);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("http://localhost:5000/get_temp_counts")
        .then(res => res.json())
        .then(data => {
          setTotalCattleCount(data.boeufs);
          setTotalPeopleCount(data.personnes);
        })
        .catch(console.error);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ backgroundColor: '#FFA', minHeight: '100vh', color: 'black' }}>
      <Navbar />
      <div className="content" style={{ padding: '20px 40px' }}>
        <h2><span role="img" aria-label="caméra">🎥</span> Identification des Bœufs et des Hommes</h2>

        <div className="camera-select" style={{ margin: '20px 0' }}>
          <label>Sélectionnez une caméra :</label>
          <select
            id="cameraSelect"
            value={selectedCamera}
            onChange={handleCameraChange}
            style={{ padding: '10px', fontSize: '16px', borderRadius: '5px' }}
          >
            {cameras.map((camera, index) => (
              <option key={index} value={camera}>
                Caméra détectée {camera}
              </option>
            ))}
          </select>
        </div>

        <div className="button-container" style={{ marginBottom: '20px' }}>
          {!identificationActive ? (
            <button
              style={{ backgroundColor: '#F00', color: 'black', fontWeight: 'bold', padding: '10px 20px', border: 'none', borderRadius: '6px' }}
              onClick={handleStartIdentification}
            >
              Commencer l'identification
            </button>
          ) : (
            <button
              style={{ backgroundColor: '#F00', color: 'black', fontWeight: 'bold', padding: '10px 20px', border: 'none', borderRadius: '6px' }}
              onClick={handleStopIdentification}
            >
              Arrêter l'identification
            </button>
          )}
        </div>

        <div className={`video-section ${identificationActive ? 'show' : 'hide'}`}>
          <VideoStream cameraIndex={cameraIndex} />
        </div>

        <div style={{ marginTop: '30px', fontSize: '1.2em', fontWeight: 'bold' }}>
          <p>Total Bœufs détectés : <span className="animated-count">{totalCattleCount} 🐄</span></p>
          <p>Total Personnes détectées : <span className="animated-count">{totalPeopleCount} 👤</span></p>
        </div>
      </div>
    </div>
  );
};

export default IdentificationPage;
