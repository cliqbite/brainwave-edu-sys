import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

// We use the Vite proxy for /api in dev, or absolute URL in prod
const API_URL = import.meta.env.VITE_API_URL || '';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach access token
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 and Token Refresh
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken, setAuth, logout } = useAuthStore.getState();
        
        if (!refreshToken) {
          logout();
          return Promise.reject(error);
        }

        // Try to refresh token
        const response = await axios.post(`${API_URL}/api/v1/auth/refresh-token`, { refreshToken });
        
        if (response.data.success) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken, user } = response.data.data;
          
          // Update store
          setAuth(user, newAccessToken, newRefreshToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, log out
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    // Return structured error
    if (error.response?.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);
