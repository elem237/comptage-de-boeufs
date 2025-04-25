import React, { useEffect, useState } from 'react';

const VideoStream = ({ cameraIndex }) => {
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    const timestamp = Date.now(); // Empêche la mise en cache du flux
    setVideoUrl(`http://localhost:5000/video_feed?cam=${cameraIndex}&t=${timestamp}`);
  }, [cameraIndex]);

  const handleError = () => {
    alert("⚠️ Échec du chargement du flux vidéo. Vérifiez que la caméra est connectée et que le backend fonctionne.");
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <img
        src={videoUrl}
        alt={`Flux de la caméra ${cameraIndex}`}
        onError={handleError}
        style={{
          width: '100%',
          maxWidth: '800px',
          border: '2px solid #F00',
          borderRadius: '8px',
        }}
      />
    </div>
  );
};

export default VideoStream;
