// config/env.js
// Environment configuration for the mobile app

// Import the dynamic configuration
import { useLocalhost, useMobileDev } from '../services/api-config';

// Auto-configure based on platform
const autoConfigure = () => {
  // For web development, use localhost
  if (typeof window !== 'undefined' && window.location) {
    useLocalhost();
    return;
  }
  
  // For mobile development, use the computer's IP address
  // This ensures both web and mobile can connect
  useMobileDev(); // Default to mobile IP for universal compatibility
};

// Run auto-configuration
autoConfigure();

// Export for manual configuration if needed
export { useLocalhost, useMobileDev } from '../services/api-config';