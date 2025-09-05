/**
 * Device Management Utility
 * Handles device identification and multi-device session management
 */

class DeviceManager {
  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.deviceInfo = this.getDeviceInfo();
  }

  /**
   * Get or create a unique device ID
   */
  getOrCreateDeviceId() {
    let deviceId = localStorage.getItem('device_id');
    
    if (!deviceId) {
      // Generate a unique device ID
      deviceId = this.generateDeviceId();
      localStorage.setItem('device_id', deviceId);
    }
    
    return deviceId;
  }

  /**
   * Generate a unique device ID
   */
  generateDeviceId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    const userAgent = navigator.userAgent.substring(0, 10).replace(/\W/g, '');
    
    return `${timestamp}_${randomStr}_${userAgent}`;
  }

  /**
   * Get device information
   */
  getDeviceInfo() {
    const userAgent = navigator.userAgent;
    
    return {
      device_id: this.deviceId,
      device_name: this.getDeviceName(userAgent),
      device_type: this.getDeviceType(userAgent),
      browser_fingerprint: this.generateBrowserFingerprint(),
      user_agent: userAgent,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookie_enabled: navigator.cookieEnabled,
      online_status: navigator.onLine
    };
  }

  /**
   * Get device name from user agent
   */
  getDeviceName(userAgent) {
    if (/Windows NT/.test(userAgent)) {
      return 'Windows PC';
    } else if (/Macintosh/.test(userAgent)) {
      return 'Mac';
    } else if (/iPhone/.test(userAgent)) {
      return 'iPhone';
    } else if (/Android/.test(userAgent)) {
      return 'Android Device';
    } else if (/iPad/.test(userAgent)) {
      return 'iPad';
    } else if (/Linux/.test(userAgent)) {
      return 'Linux PC';
    }
    return 'Unknown Device';
  }

  /**
   * Get device type from user agent
   */
  getDeviceType(userAgent) {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return 'mobile';
    } else if (/Tablet|iPad/.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  /**
   * Generate browser fingerprint
   */
  generateBrowserFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Browser fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      window.screen.width + 'x' + window.screen.height,
      new Date().getTimezoneOffset(),
      navigator.platform,
      navigator.cookieEnabled,
      canvas.toDataURL()
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Get current user ID from localStorage
   */
  getCurrentUserId() {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        return user.id;
      }
    } catch (error) {
      console.error('Error getting current user ID:', error);
    }
    return null;
  }

  /**
   * Get device info for API requests
   */
  getDeviceInfoForAPI() {
    return {
      device_id: this.deviceId,
      device_name: this.deviceInfo.device_name,
      device_type: this.deviceInfo.device_type,
      browser_fingerprint: this.deviceInfo.browser_fingerprint,
      user_id: this.getCurrentUserId()
    };
  }

  /**
   * Check if device is mobile
   */
  isMobile() {
    return this.deviceInfo.device_type === 'mobile';
  }

  /**
   * Check if device is tablet
   */
  isTablet() {
    return this.deviceInfo.device_type === 'tablet';
  }

  /**
   * Check if device is desktop
   */
  isDesktop() {
    return this.deviceInfo.device_type === 'desktop';
  }

  /**
   * Get device display name
   */
  getDisplayName() {
    return `${this.deviceInfo.device_name} (${this.deviceInfo.device_type})`;
  }

  /**
   * Reset device ID (for testing or if needed)
   */
  resetDeviceId() {
    localStorage.removeItem('device_id');
    this.deviceId = this.getOrCreateDeviceId();
    this.deviceInfo = this.getDeviceInfo();
  }

  /**
   * Get session storage key for device-specific data
   */
  getSessionKey(key) {
    return `${key}_${this.deviceId}`;
  }

  /**
   * Store device-specific data in sessionStorage
   */
  setDeviceData(key, value) {
    const deviceKey = this.getSessionKey(key);
    sessionStorage.setItem(deviceKey, JSON.stringify(value));
  }

  /**
   * Get device-specific data from sessionStorage
   */
  getDeviceData(key) {
    const deviceKey = this.getSessionKey(key);
    const data = sessionStorage.getItem(deviceKey);
    try {
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error parsing device data:', error);
      return null;
    }
  }

  /**
   * Clear device-specific data
   */
  clearDeviceData(key) {
    const deviceKey = this.getSessionKey(key);
    sessionStorage.removeItem(deviceKey);
  }
}

// Create and export a singleton instance
const deviceManager = new DeviceManager();
export default deviceManager;
