import React from 'react';
import './loadingScreen.css';

function LoadingScreen() {
  return (
    <div className="loading-container loading-screen">
      <div className="loader">
        <div className="glow-ring"></div>      
        <div className="loading-text">Cody Banks</div>
      </div>
    </div>
  );
}

export default LoadingScreen;
