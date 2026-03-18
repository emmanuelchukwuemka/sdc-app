// config/env.js
// Environment configuration for the mobile app

// Import the dynamic configuration
import { useLocalhost, useMobileDev, useProduction, getApiBaseUrl } from '../services/api-config';

// Auto-configure based on platform
const autoConfigure = () => {
  // Check if an environment variable is already providing the URL
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log(`Using API URL from environment: ${getApiBaseUrl()}`);
    return;
  }

  // For web development, use localhost
  if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
    useLocalhost();
    return;
  }

  // For mobile builds, default to production if no env var is set
  if (__DEV__) {
    // In development, we use the remote server IP for testing
    useMobileDev();
    console.log(`Development mode: using API URL ${getApiBaseUrl()}`);
  } else {
    // In production builds (like APK), we use the HTTPS domain
    useProduction();
    console.log(`Production mode: using API URL ${getApiBaseUrl()}`);
  }
};

// Run auto-configuration
autoConfigure();

// Export for manual configuration if needed
export { useLocalhost, useMobileDev } from '../services/api-config';