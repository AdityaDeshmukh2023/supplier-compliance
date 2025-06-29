import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging and auth
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.detail || error.response.data?.message || 'Server error occurred';
      throw new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error - unable to connect to server');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

// Supplier API methods
export const supplierAPI = {
  // Get all suppliers
  getSuppliers: async (skip = 0, limit = 100) => {
    const response = await api.get(`/suppliers?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Get supplier by ID
  getSupplier: async (id) => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },

  // Create new supplier
  createSupplier: async (supplierData) => {
    const response = await api.post('/suppliers', supplierData);
    return response.data;
  },

  // Update supplier
  updateSupplier: async (id, supplierData) => {
    const response = await api.put(`/suppliers/${id}`, supplierData);
    return response.data;
  },

  // Delete supplier
  deleteSupplier: async (id) => {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
  },

  // Check weather impact on delivery
  checkWeatherImpact: async (weatherData) => {
    const response = await api.post('/suppliers/check-weather-impact', weatherData);
    return response.data;
  },
};

// Compliance API methods
export const complianceAPI = {
  // Check compliance for a supplier
  checkCompliance: async (complianceData) => {
    const response = await api.post('/suppliers/check-compliance', complianceData);
    return response.data;
  },

  // Get compliance records for a supplier
  getComplianceRecords: async (supplierId, skip = 0, limit = 100, metric = null) => {
    let url = `/suppliers/${supplierId}/compliance-records?skip=${skip}&limit=${limit}`;
    if (metric) {
      url += `&metric=${metric}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  // Create single compliance record
  createComplianceRecord: async (supplierId, recordData) => {
    const response = await api.post(`/suppliers/${supplierId}/compliance-record`, recordData);
    return response.data;
  },
};

// Insights API methods
export const insightsAPI = {
  // Get AI-generated insights
  getInsights: async (supplierId = null, timePeriodDays = 90) => {
    let url = `/suppliers/insights?time_period_days=${timePeriodDays}`;
    if (supplierId) {
      url += `&supplier_id=${supplierId}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  // Get compliance summary
  getComplianceSummary: async () => {
    const response = await api.get('/suppliers/compliance-summary');
    return response.data;
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
