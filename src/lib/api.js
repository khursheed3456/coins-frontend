import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
console.log(API_URL)
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 100000,
});

// Attach token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('coinx_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('coinx_token');
      localStorage.removeItem('coinx_user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  }
);

export default api;