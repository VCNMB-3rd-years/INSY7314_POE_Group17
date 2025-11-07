import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('🔧 API Base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    console.log('📨 Making request to:', config.baseURL + config.url);
    console.log('📨 Request data:', config.data);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response received:', response);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error);
    console.error('❌ Response error data:', error.response?.data);
    console.error('❌ Response status:', error.response?.status);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
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

// Admin APIs 
export const adminAPI = {
  getEmployees: () => api.get('/admin/employees'),
  createEmployee: (data) => api.post('/admin/employee', data),
  deleteEmployee: (id) => api.delete(`/admin/employee/${id}`),
  getStats: () => api.get('/admin/stats')
};

export default api;

// References:
//DigitalOcean. (2022). How To Use Axios with React. [online] Available at: https://www.digitalocean.com/community/tutorials/react-axios-react [Accessed 3 Nov. 2025].
//GeeksforGeeks. (2023). Axios Interceptors in ReactJS. [online] Available at: https://www.geeksforgeeks.org/axios-interceptors-in-reactjs/ [Accessed 3 Nov. 2025].
//freeCodeCamp. (2025). How to Fetch API Data in React Using Axios. [online] Available at: https://www.freecodecamp.org/news/how-to-fetch-api-data-in-react-using-axios [Accessed 4 Nov. 2025]