import axios from 'axios';

/**
 * Pre-configured Axios instance for DAMS API calls.
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Request interceptor — attaches JWT token from localStorage (if available).
 */
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('dams_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor — handles common error scenarios.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      // Redirect to login on 401 Unauthorized
      if (status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('dams_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
