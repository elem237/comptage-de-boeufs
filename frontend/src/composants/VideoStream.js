import React, { useEffect, useState } from 'react';
import './VideoStream.css';
import { MdError, MdAutorenew, MdVideocam } from 'react-icons/md';

const VideoStream = ({ cameraIndex, type }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    if (!cameraIndex) return;

    const timestamp = Date.now();
    const url = type === 'wifi'
      ? `http://localhost:5000/video_feed_wifi?ip=${encodeURIComponent(cameraIndex)}&t=${timestamp}`
      : `http://localhost:5000/video_feed?cam=${cameraIndex}&t=${timestamp}`;


    setVideoUrl(url);
    setHasError(false);
    setIsLoading(true);
  }, [cameraIndex, type, reloadTrigger]);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleRetry = () => {
    setReloadTrigger(prev => prev + 1);
  };

  return (
    <div className="video-frame-container">
      {isLoading && !hasError && (
        <div className="loader">
          <div className="spinner" />
          <p>
            <MdVideocam size={20} className="icon" /> Connexion au flux vidéo...
          </p>
        </div>
      )}

      {!hasError && (
        <img
          src={videoUrl}
          alt={`Flux caméra ${type === 'wifi' ? 'Wi-Fi' : `locale #${cameraIndex}`}`}
          onError={handleError}
          onLoad={handleLoad}
          style={{
            width: '100%',
            maxWidth: '800px',
            border: '2px solid #2196f3',
            borderRadius: '8px',
            display: isLoading ? 'none' : 'block'
          }}
        />
      )}

      {hasError && (
        <div className="error-message">
          <p><MdError size={24} color="red" /> Échec du chargement du flux vidéo.</p>
          <p>Vérifiez que la caméra est connectée et que le backend fonctionne.</p>
          <button className="retry-button" onClick={handleRetry}>
            <MdAutorenew size={18} /> Réessayer
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoStream;
