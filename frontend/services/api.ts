/**
 * services/api.ts
 *
 * Axios client for OpsHub API.
 * - Base URL from NEXT_PUBLIC_API_URL
 * - Automatically attaches JWT access token from localStorage
 * - 401 interceptor triggers silent token refresh
 * - All requests go to /api/v1/
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

let BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://opshub-backend.onrender.com/api/v1";
if (BASE_URL && !BASE_URL.includes("/api/v1")) {
  BASE_URL = `${BASE_URL.replace(/\/$/, "")}/api/v1`;
}

console.log("[Axios Init] Configured BASE_URL:", BASE_URL);

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// ─── Request interceptor: attach access token ────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: handle 401 with silent refresh ────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const isLoginOrRefreshRequest =
      originalRequest.url &&
      (originalRequest.url.includes("auth/token") || originalRequest.url.includes("token/refresh"));

    if (error.response?.status === 401 && !originalRequest._retry && !isLoginOrRefreshRequest) {
      if (isRefreshing) {
        // Queue request until token refresh completes
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refresh");
        if (!refreshToken) throw new Error("No refresh token in localStorage");

        console.log("[Axios Interceptor] Token expired. Attempting silent refresh...");
        const { data } = await axios.post<any>(`${BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        // Backend response format might be response.data.data.access or response.data.access
        const newAccessToken: string = data?.data?.access || data?.access;
        if (!newAccessToken) {
          throw new Error("No access token found in token refresh response payload");
        }

        localStorage.setItem("access", newAccessToken);
        console.log("[Axios Interceptor] Silent refresh succeeded. Resuming queued requests...");

        // Drain the queue
        refreshQueue.forEach((cb) => cb(newAccessToken));
        refreshQueue = [];

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshErr) {
        console.error("[Axios Interceptor] Silent refresh failed, clearing tokens:", refreshErr);
        // Refresh failed — clear session and redirect to login
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
