import { useState, useEffect } from 'react';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('App is online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('App is offline');
    };

    // Check online status periodically (every 10 seconds)
    const checkOnlineStatus = async () => {
      try {
        // Try to fetch a small resource to verify actual connectivity
        // Use GET instead of HEAD to avoid service worker cache issues
        const response = await fetch('/manifest.json?t=' + Date.now(), {
          method: 'GET',
          cache: 'no-cache'
        });
        
        if (response.ok && !isOnline) {
          setIsOnline(true);
          console.log('App is online (verified)');
        }
      } catch (error) {
        if (isOnline) {
          setIsOnline(false);
          console.log('App is offline (verified)');
        }
      }
    };

    // Check immediately
    checkOnlineStatus();

    // Set up interval for periodic checks (every 10 seconds)
    const intervalId = setInterval(checkOnlineStatus, 10000);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  return isOnline;
};
