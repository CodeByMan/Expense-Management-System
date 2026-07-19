import axios from "axios";
import i18n from "@/i18n";
import { appConfig } from "@/config";
import { getStoredAccessToken, setStoredAccessToken } from "./authToken";

const api = axios.create({
  baseURL: appConfig.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const accessToken = getStoredAccessToken();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  config.headers["Accept-Language"] = i18n.language ?? "en";
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = typeof error.config?.url === "string" ? error.config.url : "";
    const isRefreshRequest = requestUrl.includes("/Accounts/refreshToken");
    if (error.response?.status === 401 && !isRefreshRequest) {
      setStoredAccessToken(null);
      if (window.location.pathname !== "/login") window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);

export default api;
