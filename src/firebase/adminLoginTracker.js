/**
 * COMPLETE Admin Tracker - ULTRA V2 + IST Timestamps
 * ✅ All ULTRA V2 features
 * ✅ Confidence scoring
 * ✅ Quality ratings
 * ✅ IST timestamp format
 */

import { db } from './config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Convert UTC to IST (Indian Standard Time)
 */
function getISTTimestamp() {
  const date = new Date();
  const istString = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
  
  // Format: DD/MM/YYYY HH:MM:SS IST
  return istString.replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, '$1/$2/$3 $4:$5:$6 IST');
}

function cleanObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const cleaned = {};
  for (let key in obj) {
    const value = obj[key];
    
    if (value === undefined) {
      continue;
    }
    
    if (value === null) {
      cleaned[key] = null;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      cleaned[key] = cleanObject(value);
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

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

function getGPSLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        latitude: null,
        longitude: null,
        accuracy: null,
        confidence: 0,
        error: 'Geolocation not supported'
      });
      return;
    }

    let bestPosition = null;
    let positionCount = 0;

    const mainTimeout = setTimeout(() => {
      if (bestPosition) {
        resolve(bestPosition);
      } else {
        resolve({
          latitude: null,
          longitude: null,
          accuracy: null,
          confidence: 0,
          error: 'GPS timeout'
        });
      }
    }, 8000);

    const successCallback = (position) => {
      positionCount++;
      const coords = position.coords;

      // Calculate confidence based on accuracy
      let confidence = 100;
      if (coords.accuracy > 100) confidence = 75;
      if (coords.accuracy > 500) confidence = 50;
      if (coords.accuracy > 1000) confidence = 25;
      if (coords.accuracy > 5000) confidence = 10;

      const currentPosition = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        altitude: coords.altitude,
        altitudeAccuracy: coords.altitudeAccuracy,
        heading: coords.heading,
        speed: coords.speed,
        confidence: confidence,
        timestamp: new Date().toISOString(),
        captureCount: positionCount
      };

      if (!bestPosition) {
        bestPosition = currentPosition;
        console.log(`📍 GPS Position 1: Accuracy ${coords.accuracy.toFixed(2)}m, Confidence ${confidence}%`);
      }
      else if (coords.accuracy < bestPosition.accuracy) {
        bestPosition = currentPosition;
        console.log(`📍 GPS Position ${positionCount}: Better accuracy ${coords.accuracy.toFixed(2)}m, Confidence ${confidence}%`);
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
          confidence: 0,
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
      
      // Calculate confidence
      let confidence = 50;
      if (data.city) confidence += 20;
      if (data.region) confidence += 15;
      if (data.latitude && data.longitude) confidence += 15;
      
      return {
        city: data.city || data.district || 'Unknown',
        region: data.region || data.state || 'Unknown',
        country: data.country_name || data.country || 'Unknown',
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        timezone: data.timezone || 'Unknown',
        isp: data.org || data.isp || 'Unknown',
        confidence: Math.min(confidence, 100)
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
    isp: null,
    confidence: 0
  };
}

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
 * Get tracking quality rating
 */
function getTrackingQuality(confidence) {
  if (confidence >= 90) return 'Excellent';
  if (confidence >= 70) return 'Good';
  if (confidence >= 50) return 'Fair';
  if (confidence >= 30) return 'Poor';
  return 'Very Poor';
}

/**
 * COMPLETE: ULTRA V2 + IST + Confidence
 */
export async function trackAdminLogin(user, marketData = null) {
  try {
    if (user.role !== 'market-admin') {
      console.log('Only market admin logins are tracked');
      return;
    }

    console.log('🔍 Starting admin login tracking...');
    const trackingStartTime = Date.now();
    
    const istTimestamp = getISTTimestamp();
    console.log(`⏰ IST Time: ${istTimestamp}`);

    const [ip, gpsData, browserLocation, deviceInfo] = await Promise.all([
      getPublicIP().catch(err => 'Unable to fetch'),
      getGPSLocation().catch(err => ({ latitude: null, longitude: null, accuracy: null, confidence: 0, error: err.message })),
      getBrowserLocation().catch(err => ({ city: 'Unable to fetch', region: null, country: null, confidence: 0 })),
      Promise.resolve(getDeviceInfo())
    ]);

    const trackingTime = Date.now() - trackingStartTime;

    // Calculate overall confidence
    const overallConfidence = Math.round(
      (gpsData.confidence || 0) * 0.5 + 
      (browserLocation.confidence || 0) * 0.5
    );

    const loginLog = {
      userId: user.uid,
      email: user.email,
      role: user.role,
      
      marketId: marketData?.marketId || null,
      marketName: marketData?.marketName || null,
      
      ipAddress: ip,
      
      // GPS WITH CONFIDENCE
      gps: {
        latitude: gpsData.latitude,
        longitude: gpsData.longitude,
        accuracy: gpsData.accuracy,
        confidence: gpsData.confidence || 0,
        altitude: gpsData.altitude || null,
        altitudeAccuracy: gpsData.altitudeAccuracy || null,
        heading: gpsData.heading || null,
        speed: gpsData.speed || null,
        captureCount: gpsData.captureCount || 1,
        error: gpsData.error || null,
        timestamp: gpsData.timestamp || new Date().toISOString()
      },
      
      // BROWSER LOCATION WITH CONFIDENCE
      browserLocation: {
        city: browserLocation.city,
        region: browserLocation.region,
        country: browserLocation.country,
        latitude: browserLocation.latitude,
        longitude: browserLocation.longitude,
        timezone: browserLocation.timezone,
        isp: browserLocation.isp,
        confidence: browserLocation.confidence || 0
      },
      
      device: deviceInfo,
      
      // TIMESTAMPS
      loginTimestamp: new Date().toISOString(),
      loginTimestampIST: istTimestamp,
      serverTimestamp: serverTimestamp(),
      
      // TRACKING WITH CONFIDENCE & QUALITY
      tracking: {
        confidence: overallConfidence,
        quality: getTrackingQuality(overallConfidence),
        duration: `${trackingTime}ms`,
        networkStatus: navigator.onLine ? 'online' : 'offline',
        version: 'ULTRA_v2_IST'
      },
      
      trackingStatus: 'active'
    };

    const cleanedLoginLog = cleanObject(loginLog);

    // Save to Firebase
    const logsCollection = collection(db, 'admin_login_logs');
    const docRef = await addDoc(logsCollection, cleanedLoginLog);
    
    console.log('✅ Admin login tracked successfully:', docRef.id);
    console.log(`📍 Market: ${marketData?.marketName} (${marketData?.marketId})`);
    console.log(`⏰ IST: ${istTimestamp}`);
    console.log(`🌍 Location: ${browserLocation.city}, ${browserLocation.region}`);
    console.log(`💯 Confidence: ${overallConfidence}% (${getTrackingQuality(overallConfidence)})`);
    console.log(`🖥️  Device: ${deviceInfo.browser} on ${deviceInfo.os}`);
    
    return {
      success: true,
      logId: docRef.id,
      data: cleanedLoginLog,
      trackingDuration: trackingTime,
      confidence: overallConfidence
    };

  } catch (error) {
    console.error('Error tracking admin login:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function trackAdminLogout(userId) {
  try {
    const istTimestamp = getISTTimestamp();
    
    const logoutLog = {
      userId: userId,
      eventType: 'logout',
      timestamp: new Date().toISOString(),
      timestampIST: istTimestamp,
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
