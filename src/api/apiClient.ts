import axios from 'axios';
import toast from 'react-hot-toast';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      error instanceof Object &&
      'response' in error &&
      (error as { response?: { status?: number } }).response?.status === 401
    ) {
      localStorage.removeItem('auth_token');
      toast.error('Phiên đăng nhập đã hết hạn. Đang chuyển hướng...', {
        duration: 2000,
      });
      // Delay redirect để toast kịp hiển thị
      setTimeout(() => {
        window.location.href = '/signin';
      }, 1500);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
