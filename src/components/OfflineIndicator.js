import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import '../styles/OfflineIndicator.css';

const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="offline-indicator">
      <div className="offline-content">
        <span className="offline-icon">📡</span>
        <span className="offline-text">You are offline</span>
      </div>
    </div>
  );
};

export default OfflineIndicator;
