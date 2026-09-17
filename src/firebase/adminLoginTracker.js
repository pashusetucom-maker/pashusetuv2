/**
 * ULTRA IMPROVED Admin Login Tracker Service - FIXED VERSION
 * Removes undefined fields before Firebase save
 */

import { db } from './config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Clean object - remove undefined values
 */
function cleanObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const cleaned = {};
  for (let key in obj) {
    const value = obj[key];
    
    if (value === undefined) {
      // Skip undefined values
      continue;
    }
    
    if (value === null) {
      // Keep null values
      cleaned[key] = null;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Recursively clean nested objects
      cleaned[key] = cleanObject(value);
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

/**
 * Get user's public IP address (with retry)
 */
async function getPublicIP() {
  const ips = [
    'https://api.ipify.org?format=json',
    'https://api.ip.sb/ip?format=json',
    'https://ip-api.com/json/'
  ];

  for (let url of ips) {
    try {
      const response = await Promise.race([
        fetch(url),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 3000)
        )
      ]);
      
      if (!response.ok) continue;
      
      const data = await response.json();
      return data.query || data.ip || 'Unable to fetch';
    } catch (error) {
      console.warn(`IP lookup failed for ${url}:`, error.message);
      continue;
    }
  }
  
  return 'Unable to fetch';
}

/**
 * Get precise GPS location with aggressive settings
 */
function getGPSLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        latitude: null,
        longitude: null,
        accuracy: null,
        error: 'Geolocation not supported'
      });
      return;
    }

    let bestPosition = null;
    let positionCount = 0;

    // Main timeout
    const mainTimeout = setTimeout(() => {
      if (bestPosition) {
        resolve(bestPosition);
      } else {
        resolve({
          latitude: null,
          longitude: null,
          accuracy: null,
          error: 'GPS timeout'
        });
      }
    }, 8000);

    const successCallback = (position) => {
      positionCount++;
      const coords = position.coords;

      const currentPosition = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        altitude: coords.altitude,
        altitudeAccuracy: coords.altitudeAccuracy,
        heading: coords.heading,
        speed: coords.speed,
        timestamp: new Date().toISOString(),
        captureCount: positionCount
      };

      if (!bestPosition) {
        bestPosition = currentPosition;
        console.log(`📍 GPS Position 1: Accuracy ${coords.accuracy.toFixed(2)}m`);
      }
      else if (coords.accuracy < bestPosition.accuracy) {
        bestPosition = currentPosition;
        console.log(`📍 GPS Position ${positionCount}: Better accuracy ${coords.accuracy.toFixed(2)}m`);
      }

      if (coords.accuracy < 100 && positionCount >= 2) {
        clearTimeout(mainTimeout);
        resolve(bestPosition);
      }
    };

    const errorCallback = (error) => {
      console.warn('GPS Error:', error.message);
      clearTimeout(mainTimeout);
      
      if (bestPosition) {
        resolve(bestPosition);
      } else {
        resolve({
          latitude: null,
          longitude: null,
          accuracy: null,
          error: error.message
        });
      }
    };

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 7000,
      maximumAge: 0
    };

    navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      geoOptions
    );
  });
}

/**
 * Get browser location via geolocation API
 */
async function getBrowserLocation() {
  const services = [
    'https://ipapi.co/json/',
    'https://ip-api.com/json/',
    'https://geolocation-db.com/json/'
  ];

  for (let url of services) {
    try {
      const response = await Promise.race([
        fetch(url),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 3000)
        )
      ]);
      
      if (!response.ok) continue;
      
      const data = await response.json();
      
      return {
        city: data.city || data.district || 'Unknown',
        region: data.region || data.state || 'Unknown',
        country: data.country_name || data.country || 'Unknown',
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        timezone: data.timezone || 'Unknown',
        isp: data.org || data.isp || 'Unknown'
      };
    } catch (error) {
      console.warn(`Location lookup failed for ${url}:`, error.message);
      continue;
    }
  }

  return {
    city: 'Unable to fetch',
    region: null,
    country: null,
    latitude: null,
    longitude: null,
    timezone: null,
    isp: null
  };
}

/**
 * Get device information
 */
function getDeviceInfo() {
  const ua = navigator.userAgent;
  
  let browser = 'Unknown';
  let browserVersion = 'Unknown';
  
  if (ua.indexOf('Firefox') > -1) {
    browser = 'Firefox';
    browserVersion = ua.split('Firefox/')[1]?.split(' ')[0] || 'Unknown';
  } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edge') === -1) {
    browser = 'Chrome';
    browserVersion = ua.split('Chrome/')[1]?.split(' ')[0] || 'Unknown';
  } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    browser = 'Safari';
    browserVersion = ua.split('Version/')[1]?.split(' ')[0] || 'Unknown';
  } else if (ua.indexOf('Edge') > -1) {
    browser = 'Edge';
    browserVersion = ua.split('Edge/')[1]?.split(' ')[0] || 'Unknown';
  }
  
  let os = 'Unknown';
  if (ua.indexOf('Win') > -1) os = 'Windows';
  else if (ua.indexOf('Mac') > -1) os = 'MacOS';
  else if (ua.indexOf('Linux') > -1) os = 'Linux';
  else if (ua.indexOf('Android') > -1) os = 'Android';
  else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  
  return {
    userAgent: ua,
    browser: browser,
    browserVersion: browserVersion,
    os: os,
    isMobile: isMobile,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language || navigator.userLanguage,
    onLine: navigator.onLine,
    connection: getNetworkInfo()
  };
}

/**
 * Get network information
 */
function getNetworkInfo() {
  try {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return 'Unknown';
    
    return {
      type: connection.type || 'Unknown',
      effectiveType: connection.effectiveType || 'Unknown',
      downlink: connection.downlink || null,
      rtt: connection.rtt || null,
      saveData: connection.saveData || false
    };
  } catch (error) {
    return 'Unable to fetch';
  }
}

/**
 * Main function to track admin login - FIXED (removes undefined)
 */
export async function trackAdminLogin(user, marketData = null) {
  try {
    // Only track market admins, NOT super admins
    if (user.role !== 'market-admin') {
      console.log('Only market admin logins are tracked');
      return;
    }

    console.log('🔍 Starting admin login tracking...');
    const trackingStartTime = Date.now();

    // Collect all tracking data in parallel
    const [ip, gpsData, browserLocation, deviceInfo] = await Promise.all([
      getPublicIP().catch(err => {
        console.warn('IP lookup failed:', err.message);
        return 'Unable to fetch';
      }),
      
      getGPSLocation().catch(err => {
        console.warn('GPS failed:', err.message);
        return { latitude: null, longitude: null, accuracy: null, error: err.message };
      }),
      
      getBrowserLocation().catch(err => {
        console.warn('Browser location failed:', err.message);
        return { city: 'Unable to fetch', region: null, country: null };
      }),
      
      Promise.resolve(getDeviceInfo())
    ]);

    const trackingTime = Date.now() - trackingStartTime;

    // Compile login log record
    const loginLog = {
      // User Information
      userId: user.uid,
      email: user.email,
      role: user.role,
      
      // Market Information
      marketId: marketData?.marketId || null,
      marketName: marketData?.marketName || null,
      
      // IP Address
      ipAddress: ip,
      
      // GPS Coordinates
      gps: {
        latitude: gpsData.latitude,
        longitude: gpsData.longitude,
        accuracy: gpsData.accuracy,
        altitude: gpsData.altitude || null,
        altitudeAccuracy: gpsData.altitudeAccuracy || null,
        heading: gpsData.heading || null,
        speed: gpsData.speed || null,
        captureCount: gpsData.captureCount || 1,
        error: gpsData.error || null,
        timestamp: gpsData.timestamp || new Date().toISOString()
      },
      
      // Browser Location
      browserLocation: {
        city: browserLocation.city,
        region: browserLocation.region,
        country: browserLocation.country,
        latitude: browserLocation.latitude,
        longitude: browserLocation.longitude,
        timezone: browserLocation.timezone,
        isp: browserLocation.isp
      },
      
      // Device Information
      device: deviceInfo,
      
      // Timestamp
      loginTimestamp: new Date().toISOString(),
      serverTimestamp: serverTimestamp(),
      
      // Performance metrics
      trackingDuration: `${trackingTime}ms`,
      networkStatus: navigator.onLine ? 'online' : 'offline',
      
      // Status
      trackingStatus: 'active'
    };

    // IMPORTANT: Clean object before saving (remove undefined)
    const cleanedLoginLog = cleanObject(loginLog);

    // Save to Firebase Firestore
    const logsCollection = collection(db, 'admin_login_logs');
    const docRef = await addDoc(logsCollection, cleanedLoginLog);
    
    console.log('✅ Admin login tracked successfully:', docRef.id);
    console.log(`⏱️  Tracking duration: ${trackingTime}ms`);
    console.log(`📍 GPS: ${gpsData.latitude?.toFixed(4)}, ${gpsData.longitude?.toFixed(4)}`);
    console.log(`🌍 Location: ${browserLocation.city}, ${browserLocation.region}`);
    console.log(`🖥️  Device: ${deviceInfo.browser} on ${deviceInfo.os}`);
    
    return {
      success: true,
      logId: docRef.id,
      data: cleanedLoginLog,
      trackingDuration: trackingTime
    };

  } catch (error) {
    console.error('Error tracking admin login:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Track logout event
 */
export async function trackAdminLogout(userId) {
  try {
    const logoutLog = {
      userId: userId,
      eventType: 'logout',
      timestamp: new Date().toISOString(),
      serverTimestamp: serverTimestamp()
    };

    const logsCollection = collection(db, 'admin_login_logs');
    const docRef = await addDoc(logsCollection, logoutLog);
    
    console.log('✅ Admin logout tracked:', docRef.id);
    return {
      success: true,
      logId: docRef.id
    };

  } catch (error) {
    console.error('Error tracking logout:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default trackAdminLogin;
