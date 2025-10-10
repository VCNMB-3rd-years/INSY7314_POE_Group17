import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('🔧 API Base URL:', API_BASE_URL);

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // CRITICAL: Send cookies with every request
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('📨 Making request to:', config.baseURL + config.url);
    console.log('📨 Request data:', config.data);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response received:', response.data);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error);
    console.error('❌ Response error data:', error.response?.data);
    console.error('❌ Response status:', error.response?.status);
    
    // Handle session expiration
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      
      if (errorCode === 'SESSION_TIMEOUT' || errorCode === 'NOT_AUTHENTICATED') {
        console.log('🔒 Session expired, redirecting to login');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => {
    console.log('🔐 authAPI.register called with:', data);
    return api.post('/auth/register', data);
  },
  login: (data) => {
    console.log('🔐 authAPI.login called with:', data);
    return api.post('/auth/login', data);
  },
  logout: () => {
    console.log('🔐 authAPI.logout called');
    return api.post('/auth/logout');
  },
  checkSession: () => {
    console.log('🔐 authAPI.checkSession called');
    return api.get('/auth/session');
  },
  registerEmployee: (data) => {
    console.log('🔐 authAPI.registerEmployee called with:', data);
    return api.post('/auth/register-employee', data);
  }
};

// Customer APIs
export const customerAPI = {
  getTransactions: () => api.get('/customer/transactions'),
  createPayment: (data) => api.post('/customer/pay', data),
  updateTransaction: (id, data) => api.put(`/customer/transaction/${id}`, data),
  deleteTransaction: (id) => api.delete(`/customer/transaction/${id}`)
};

// Employee APIs
export const employeeAPI = {
  getTransactions: (params) => api.get('/employee/transactions', { params }),
  verifyTransaction: (id, data) => api.put(`/employee/verify/${id}`, data),
  getStats: () => api.get('/employee/stats')
};

export default api;