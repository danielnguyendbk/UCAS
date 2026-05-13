import axios from "axios";

const TOKEN_STORAGE_KEY = "csms_access_token";
const USER_STORAGE_KEY = "csms_user";
const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/+$/, "");

const httpClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15e3,
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    if (status === 403) {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      const user = storedUser ? JSON.parse(storedUser) : null;
      const fallbackPath = user?.redirectPath ?? "/";
      if (window.location.pathname !== fallbackPath) {
        window.location.assign(fallbackPath);
      }
    }
    return Promise.reject(error);
  },
);
export { httpClient };
