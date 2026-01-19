// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API configuration
import { getApiBaseUrl } from './api-config';

// Get the current API base URL
const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      AsyncStorage.removeItem('authToken');
      AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }
};

// User API
export const userAPI = {
  getProfile: async (userId) => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  updateProfile: async (userId, data) => {
    const response = await apiClient.put(`/users/${userId}`, data);
    return response.data;
  },

  getAllUsers: async () => {
    const response = await apiClient.get('/users');
    return response.data;
  }
};

// Marketplace API
export const marketplaceAPI = {
  getUnlocks: async () => {
    const response = await apiClient.get('/marketplace/unlocks');
    return response.data;
  },

  unlockProfile: async (listingId) => {
    const response = await apiClient.post('/marketplace/unlock', { listing_id: listingId });
    return response.data;
  },

  getCommissionSettings: async () => {
    const response = await apiClient.get('/marketplace/commission-settings');
    return response.data;
  }
};

// Favorites API
export const favoritesAPI = {
  getFavorites: async () => {
    const response = await apiClient.get('/favorites');
    return response.data;
  },

  addFavorite: async (targetUserId) => {
    const response = await apiClient.post('/favorites', { target_user_id: targetUserId });
    return response.data;
  },

  removeFavorite: async (targetUserId) => {
    const response = await apiClient.delete('/favorites', {
      params: { target_user_id: targetUserId }
    });
    return response.data;
  }
};

// Agencies API
export const agenciesAPI = {
  getAll: async () => {
    const response = await apiClient.get('/agencies');
    return response.data;
  },

  getById: async (agencyId) => {
    const response = await apiClient.get(`/agencies/${agencyId}`);
    return response.data;
  }
};

// Verification Badges API
export const badgesAPI = {
  getBadgesByUsers: async (userIds) => {
    const response = await apiClient.get('/verification-badges', {
      params: { user_ids: userIds }
    });
    return response.data;
  }
};

// Wallet API
export const walletAPI = {
  getTransactions: async () => {
    const response = await apiClient.get('/wallet/transactions');
    return response.data;
  },

  getBalance: async () => {
    const response = await apiClient.get('/wallet/balance');
    return response.data;
  }
};

// Notifications API
export const notificationsAPI = {
  getNotifications: async () => {
    const response = await apiClient.get('/notifications');
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await apiClient.put(`/notifications/${notificationId}/read`);
    return response.data;
  }
};

// KYC API
export const kycAPI = {
  getStatus: async () => {
    const response = await apiClient.get('/kyc/status');
    return response.data;
  },

  getKycDocuments: async () => {
    const response = await apiClient.get('/kyc/documents');
    return response.data;
  },

  submitKycDocument: async (documentData) => {
    const response = await apiClient.post('/kyc/documents', documentData);
    return response.data;
  },
  
  // Alias for backward compatibility
  submitDocument: async (documentData) => {
    return kycAPI.submitKycDocument(documentData);
  }
};

// Admin API
export const adminAPI = {
  getKycDocuments: async () => {
    const response = await apiClient.get('/admin/kyc-documents');
    return response.data;
  },

  updateKycDocument: async (docId, action) => {
    const response = await apiClient.put(`/admin/kyc-documents/${docId}/${action}`);
    return response.data;
  },

  getAgencies: async () => {
    const response = await apiClient.get('/admin/agencies');
    return response.data;
  },

  getReports: async (days = 30) => {
    const response = await apiClient.get(`/admin/reports?days=${days}`);
    return response.data;
  },

  getFinancialData: async (days = 30) => {
    const response = await apiClient.get(`/admin/finance?days=${days}`);
    return response.data;
  },

  getContracts: async () => {
    const response = await apiClient.get('/admin/contracts');
    return response.data;
  },

  getDisputes: async () => {
    const response = await apiClient.get('/admin/disputes');
    return response.data;
  }
};

// Messages API
export const messagesAPI = {
  getMessages: async (conversationId) => {
    const response = await apiClient.get(`/messages/${conversationId}`);
    return response.data;
  },
  
  sendMessage: async (messageData) => {
    const response = await apiClient.post('/messages', messageData);
    return response.data;
  },
  
  // Alias for backward compatibility
  send: async (messageData) => {
    return messagesAPI.sendMessage(messageData);
  }
};

// Upload API
export const uploadAPI = {
  uploadFile: async (file, conversationId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversation_id', conversationId);
    
    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

// Export the base client for custom requests
export { apiClient };

// Utility function to set base URL dynamically
export const setApiBaseUrl = (url) => {
  apiClient.defaults.baseURL = url;
};