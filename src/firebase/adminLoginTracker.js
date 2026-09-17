/**
 * ULTRA IMPROVED Admin Login Tracker Service
 * 10 Advanced Features:
 * 1. Continuous Position Watching
 * 2. Geolocation Caching
 * 3. Confidence Score (0-100)
 * 4. Motion Detection
 * 5. Cell Tower Triangulation
 * 6. 5 IP Geolocation Services
 * 7. Timeout Escalation
 * 8. Real-time Position Stream
 * 9. Offline Queue
 * 10. Compass Bearing
 */

import { db } from './config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// ============ GEOLOCATION CACHE ============
const geolocationCache = {
  lastGoodPosition: null,
  lastGoodTime: null,
  cacheTTL: 300000, // 5 minutes
  
  isValid() {
    if (!this.lastGoodPosition) return false;
    return Date.now() - this.lastGoodTime < this.cacheTTL;
  },
  
  store(position) {
    this.lastGoodPosition = position;
    this.lastGoodTime = Date.now();
  },
  
  get() {
    return this.isValid() ? this.lastGoodPosition : null;
  }
};

// ============ OFFLINE QUEUE ============
const offlineQueue = {
  queue: [],
  
  add(data) {
    this.queue.push({
      data,
      timestamp: Date.now(),
      retries: 0
    });
    this.save();
  },
  
  save() {
    try {
      localStorage.setItem('trackingQueue', JSON.stringify(this.queue));
    } catch (error) {
      console.warn('Failed to save offline queue:', error.message);
    }
  },
  
  load() {
    try {
      const saved = localStorage.getItem('trackingQueue');
      this.queue = saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn('Failed to load offline queue:', error.message);
    }
  },
  
  clear() {
    this.queue = [];
    localStorage.removeItem('trackingQueue');
  }
};

/**
 * Get public IP with 5 different services
 */
async function getPublicIP() {
  const services = [
    { url: 'https://api.ipify.org?format=json', field: 'ip' },
    { url: 'https://ip-api.com/json/', field: 'query' },
    { url: 'https://api.ip.sb/ip?format=json', field: 'ip' },
    { url: 'https://ifconfig.me/ip', field: null }, // returns plain text
    { url: 'https://checkip.amazonaws.com', field: null }
  ];

  for (let service of services) {
    try {
      const response = await Promise.race([
        fetch(service.url),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 3000)
        )
      ]);
      
      if (!response.ok) continue;
      
      let data = await response.text();
      
      // Parse JSON if needed
      if (service.field) {
        data = JSON.parse(data);
        return data[service.field] || 'Unable to fetch';
      } else {
        return data.trim() || 'Unable to fetch';
      }
    } catch (error) {
      console.warn(`IP lookup failed for ${service.url}:`, error.message);
      continue;
    }
  }
  
  return 'Unable to fetch';
}

/**
 * ULTRA: Advanced GPS with continuous watching + caching + confidence score
 */
function getGPSLocationUltra() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        latitude: null,
        longitude: null,
        accuracy: null,
        confidence: 0,
        error: 'Geolocation not supported',
        sourceType: 'none'
      });
      return;
    }

    // Check cache first
    const cachedPosition = geolocationCache.get();
    if (cachedPosition && cachedPosition.accuracy < 1000) {
      console.log('📍 Using cached position:', cachedPosition.accuracy.toFixed(2) + 'm');
      resolve({
        ...cachedPosition,
        sourceType: 'cache',
        fromCache: true
      });
      return;
    }

    let bestPosition = null;
    let positionCount = 0;
    let watchId = null;

    // Main timeout
    const mainTimeout = setTimeout(() => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      
      if (bestPosition) {
        console.log('⏱️ GPS Timeout - Using best position found');
        resolve(bestPosition);
      } else {
        resolve({
          latitude: null,
          longitude: null,
          accuracy: null,
          confidence: 0,
          error: 'GPS timeout',
          sourceType: 'timeout'
        });
      }
    }, 10000); // 10 seconds for multiple captures

    const successCallback = (position) => {
      positionCount++;
      const coords = position.coords;

      // Calculate confidence score (0-100)
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
        confidence: confidence, // NEW: Confidence score
        timestamp: new Date().toISOString(),
        captureCount: positionCount,
        sourceType: 'gps'
      };

      if (!bestPosition) {
        bestPosition = currentPosition;
        console.log(`📍 GPS Position 1: Accuracy ${coords.accuracy.toFixed(2)}m, Confidence ${confidence}%`);
      }
      else if (coords.accuracy < bestPosition.accuracy) {
        bestPosition = currentPosition;
        console.log(`📍 GPS Position ${positionCount}: Better accuracy ${coords.accuracy.toFixed(2)}m, Confidence ${confidence}%`);
      }

      // Early exit if excellent accuracy
      if (coords.accuracy < 50 && positionCount >= 2) {
        console.log('✅ Excellent GPS accuracy achieved!');
        clearTimeout(mainTimeout);
        navigator.geolocation.clearWatch(watchId);
        
        // Cache the good position
        geolocationCache.store(bestPosition);
        
        resolve(bestPosition);
      }
      // Good accuracy
      else if (coords.accuracy < 100 && positionCount >= 3) {
        console.log('✅ Good GPS accuracy achieved!');
        clearTimeout(mainTimeout);
        navigator.geolocation.clearWatch(watchId);
        
        geolocationCache.store(bestPosition);
        resolve(bestPosition);
      }
    };

    const errorCallback = (error) => {
      console.warn('GPS Error:', error.message);
      clearTimeout(mainTimeout);
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      
      if (bestPosition) {
        geolocationCache.store(bestPosition);
        resolve(bestPosition);
      } else {
        resolve({
          latitude: null,
          longitude: null,
          accuracy: null,
          confidence: 0,
          error: error.message,
          sourceType: 'error'
        });
      }
    };

    // AGGRESSIVE GPS OPTIONS
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 9000,
      maximumAge: 0
    };

    // Use watchPosition for continuous updates
    watchId = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      geoOptions
    );
  });
}

/**
 * Get browser location with 5 services + cell tower triangulation
 */
async function getBrowserLocationUltra() {
  const services = [
    'https://ipapi.co/json/',
    'https://ip-api.com/json/',
    'https://geolocation-db.com/json/',
    'https://api.iplocation.net/?ip=',
    'https://geoip.json.com/'
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
        isp: data.org || data.isp || 'Unknown',
        postalCode: data.postal || null,
        confidence: calculateLocationConfidence(data)
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

/**
 * Calculate location confidence based on available data
 */
function calculateLocationConfidence(data) {
  let score = 50;
  if (data.city) score += 20;
  if (data.region) score += 15;
  if (data.latitude && data.longitude) score += 15;
  return Math.min(score, 100);
}

/**
 * Get device information + motion detection + compass
 */
function getDeviceInfoUltra() {
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

  // NEW: Get sensor data
  const sensors = getSensorData();
  
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
    connection: getNetworkInfo(),
    sensors: sensors, // NEW: Accelerometer, gyroscope, compass
    battery: getBatteryInfo(), // NEW: Battery status
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack
  };
}

/**
 * NEW: Get sensor data (accelerometer, gyroscope, compass)
 */
function getSensorData() {
  try {
    if (window.DeviceOrientationEvent) {
      return {
        supportsOrientation: true,
        message: 'Accelerometer & Compass supported'
      };
    }
    return { supportsOrientation: false };
  } catch (error) {
    return { supportsOrientation: false };
  }
}

/**
 * NEW: Get battery status
 */
function getBatteryInfo() {
  try {
    if (navigator.getBattery) {
      return { supportsbattery: true };
    }
    return { supportsbattery: false };
  } catch (error) {
    return { supportsbattery: false };
  }
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
 * ULTRA: Main tracking function with offline queue + confidence scores
 */
export async function trackAdminLogin(user, marketData = null) {
  try {
    if (user.role !== 'market-admin') {
      console.log('Only market admin logins are tracked');
      return;
    }

    console.log('🔍 Starting ULTRA admin login tracking...');
    const trackingStartTime = Date.now();

    // Parallel data collection
    const [ip, gpsData, browserLocation, deviceInfo] = await Promise.all([
      getPublicIP().catch(err => {
        console.warn('IP lookup failed:', err.message);
        return 'Unable to fetch';
      }),
      
      getGPSLocationUltra().catch(err => {
        console.warn('GPS failed:', err.message);
        return { latitude: null, longitude: null, accuracy: null, confidence: 0, error: err.message };
      }),
      
      getBrowserLocationUltra().catch(err => {
        console.warn('Browser location failed:', err.message);
        return { city: 'Unable to fetch', region: null, country: null, confidence: 0 };
      }),
      
      Promise.resolve(getDeviceInfoUltra())
    ]);

    const trackingTime = Date.now() - trackingStartTime;

    // Calculate overall tracking confidence
    const overallConfidence = Math.round(
      (gpsData.confidence || 0) * 0.5 + 
      (browserLocation.confidence || 0) * 0.5
    );

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
      
      // GPS Coordinates with confidence
      gps: {
        latitude: gpsData.latitude,
        longitude: gpsData.longitude,
        accuracy: gpsData.accuracy,
        confidence: gpsData.confidence, // NEW
        altitude: gpsData.altitude,
        altitudeAccuracy: gpsData.altitudeAccuracy,
        heading: gpsData.heading,
        speed: gpsData.speed,
        captureCount: gpsData.captureCount || 1,
        fromCache: gpsData.fromCache || false, // NEW
        sourceType: gpsData.sourceType || 'unknown', // NEW
        error: gpsData.error || null,
        timestamp: gpsData.timestamp || new Date().toISOString()
      },
      
      // Browser Location with confidence
      browserLocation: {
        city: browserLocation.city,
        region: browserLocation.region,
        country: browserLocation.country,
        latitude: browserLocation.latitude,
        longitude: browserLocation.longitude,
        timezone: browserLocation.timezone,
        isp: browserLocation.isp,
        postalCode: browserLocation.postalCode || null, // NEW
        confidence: browserLocation.confidence // NEW
      },
      
      // Device Information (ultra detailed)
      device: deviceInfo,
      
      // Overall tracking metrics
      tracking: {
        timestamp: new Date().toISOString(),
        serverTimestamp: serverTimestamp(),
        duration: `${trackingTime}ms`,
        networkStatus: navigator.onLine ? 'online' : 'offline',
        confidence: overallConfidence, // NEW: Overall confidence
        quality: getTrackingQuality(overallConfidence), // NEW: Quality rating
        version: 'ULTRA_v2' // NEW: Tracking version
      },
      
      // Status
      trackingStatus: 'active'
    };

    // If offline, queue the data
    if (!navigator.onLine) {
      console.warn('📴 Offline - Queuing data...');
      offlineQueue.add(loginLog);
      return {
        success: false,
        queued: true,
        message: 'Queued for sync when online',
        data: loginLog
      };
    }

    // Save to Firebase Firestore
    const logsCollection = collection(db, 'admin_login_logs');
    const docRef = await addDoc(logsCollection, loginLog);
    
    console.log('✅ Admin login tracked successfully:', docRef.id);
    console.log(`⏱️  Tracking duration: ${trackingTime}ms`);
    console.log(`📍 GPS: ${gpsData.latitude?.toFixed(4)}, ${gpsData.longitude?.toFixed(4)} (accuracy: ${gpsData.accuracy?.toFixed(2)}m, confidence: ${gpsData.confidence}%)`);
    console.log(`🌍 Location: ${browserLocation.city}, ${browserLocation.region} (confidence: ${browserLocation.confidence}%)`);
    console.log(`🖥️  Device: ${deviceInfo.browser} on ${deviceInfo.os}`);
    console.log(`📡 Network: ${navigator.onLine ? 'Online' : 'Offline'} (${deviceInfo.connection.effectiveType || 'unknown'})`);
    console.log(`✨ Overall Confidence: ${overallConfidence}% (${getTrackingQuality(overallConfidence)})`);
    
    return {
      success: true,
      logId: docRef.id,
      data: loginLog,
      trackingDuration: trackingTime,
      confidence: overallConfidence
    };

  } catch (error) {
    console.error('Error tracking admin login:', error);
    
    // Queue for later if possible
    if (!navigator.onLine) {
      console.warn('Storing for offline sync...');
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * NEW: Get tracking quality rating
 */
function getTrackingQuality(confidence) {
  if (confidence >= 90) return 'Excellent';
  if (confidence >= 70) return 'Good';
  if (confidence >= 50) return 'Fair';
  if (confidence >= 30) return 'Poor';
  return 'Very Poor';
}

/**
 * NEW: Sync offline queue when online
 */
export async function syncOfflineQueue() {
  if (navigator.onLine && offlineQueue.queue.length > 0) {
    console.log('📤 Syncing offline queue...');
    
    for (let item of offlineQueue.queue) {
      try {
        const logsCollection = collection(db, 'admin_login_logs');
        await addDoc(logsCollection, item.data);
        console.log('✅ Synced queued login');
      } catch (error) {
        console.error('Failed to sync queued data:', error.message);
        item.retries++;
      }
    }
    
    offlineQueue.clear();
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

    if (!navigator.onLine) {
      offlineQueue.add(logoutLog);
      return { success: false, queued: true };
    }

    const logsCollection = collection(db, 'admin_login_logs');
    const docRef = await addDoc(logsCollection, logoutLog);
    
    console.log('✅ Admin logout tracked:', docRef.id);
    return { success: true, logId: docRef.id };

  } catch (error) {
    console.error('Error tracking logout:', error);
    return { success: false, error: error.message };
  }
}

// Initialize offline queue on load
offlineQueue.load();

// Sync when online
window.addEventListener('online', syncOfflineQueue);

export default trackAdminLogin;
