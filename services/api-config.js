// services/api-config.js
// Utility for configuring API endpoints at runtime

let currentApiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://surrogateanddonorconnect.com'; // Default to production domain
let currentApiBasePath = process.env.EXPO_PUBLIC_API_PATH || '/api';

export const getApiBaseUrl = () => {
  return `${currentApiUrl}${currentApiBasePath}`;
};

export const setApiConfig = (apiUrl, apiBasePath = '/api') => {
  if (apiUrl) currentApiUrl = apiUrl;
  if (apiBasePath) currentApiBasePath = apiBasePath;
  console.log(`API configuration updated to: ${getApiBaseUrl()}`);
};

// Predefined configurations
export const CONFIGURATIONS = {
  PRODUCTION: {
    url: 'https://surrogateanddonorconnect.com', // Production HTTPS endpoint
    basePath: '/api'
  },
  LOCALHOST: {
    url: 'http://72.62.4.119:5000', // Remote server IP
    basePath: '/api'
  },
  MOBILE_DEV: {
    url: 'http://72.62.4.119:5000', // Localhost server endpoint
    basePath: '/api'
  }
};

export const useLocalhost = () => {
  setApiConfig(CONFIGURATIONS.LOCALHOST.url, CONFIGURATIONS.LOCALHOST.basePath);
};

export const useProduction = () => {
  setApiConfig(CONFIGURATIONS.PRODUCTION.url, CONFIGURATIONS.PRODUCTION.basePath);
};

export const useMobileDev = () => {
  setApiConfig(CONFIGURATIONS.MOBILE_DEV.url, CONFIGURATIONS.MOBILE_DEV.basePath);
};