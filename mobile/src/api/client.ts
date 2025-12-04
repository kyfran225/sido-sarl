import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private async setupInterceptors() {
    // Request interceptor to add auth token and device ID
    this.client.interceptors.request.use(
      async (config) => {
        const accessToken = await SecureStore.getItemAsync('accessToken');
        const deviceId = await SecureStore.getItemAsync('deviceId');

        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        if (deviceId) {
          config.headers['X-Device-Id'] = deviceId;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await this.logout();
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await this.client.post('/auth/refresh', { refreshToken });
        const newAccessToken = response.data.data.accessToken;

        await SecureStore.setItemAsync('accessToken', newAccessToken);
        return newAccessToken;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async logout() {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
    // Navigate to login screen would be handled by the app
  }

  public async login(credentials: { username: string; password: string; deviceId: string }) {
    const response = await this.client.post('/auth/login', credentials);
    const { accessToken, refreshToken, user } = response.data.data;

    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    await SecureStore.setItemAsync('deviceId', credentials.deviceId);

    return { accessToken, refreshToken, user };
  }

  public async logoutUser() {
    try {
      await this.client.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
    } finally {
      await this.logout();
    }
  }

  public get instance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
