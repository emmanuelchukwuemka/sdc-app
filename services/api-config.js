// services/api-config.js
// Utility for configuring API endpoints at runtime

let currentApiUrl = 'http://10.195.159.131:5000'; // Your computer's IP address for mobile
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
  LOCALHOST: {
    url: 'http://10.195.159.131:5000', // Use mobile IP for both web and mobile
    basePath: '/api'
  },
  MOBILE_DEV: {
    url: 'http://10.195.159.131:5000', // Your computer's IP
    basePath: '/api'
  }
};

export const useLocalhost = () => {
  setApiConfig(CONFIGURATIONS.LOCALHOST.url, CONFIGURATIONS.LOCALHOST.basePath);
};

export const useMobileDev = () => {
  setApiConfig(CONFIGURATIONS.MOBILE_DEV.url, CONFIGURATIONS.MOBILE_DEV.basePath);
};