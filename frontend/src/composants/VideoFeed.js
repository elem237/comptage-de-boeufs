import React from 'react';

const VideoFeed = () => {
  return (
    <div>
      <h2>Vidéo en temps réel</h2>
      <img src="http://localhost:5000/video_feed?cam=0" alt="Flux vidéo" width="640" height="480" />
    </div>
  );
};

export default VideoFeed;
