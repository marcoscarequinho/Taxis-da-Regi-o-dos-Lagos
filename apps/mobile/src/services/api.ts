import axios from "axios";
import { API_URL } from "../config";
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "./storage";

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        await clearTokens();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        await saveTokens(data.accessToken, data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await clearTokens();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);
