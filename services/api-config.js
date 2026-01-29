// services/api-config.js
// Utility for configuring API endpoints at runtime

let currentApiUrl = 'https://surrogateanddonorconnect.com'; // Production HTTPS endpoint
let currentApiBasePath = '/api';

export const getApiBaseUrl = () => {
  return `${currentApiUrl}${currentApiBasePath}`;
};

export const setApiConfig = (apiUrl, apiBasePath = '/api') => {
  currentApiUrl = apiUrl;
  currentApiBasePath = apiBasePath;
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
    url: 'https://surrogateanddonorconnect.com', // Production HTTPS endpoint
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