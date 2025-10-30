import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

// збереження токенів
let access = localStorage.getItem("access") || null;
let refresh = localStorage.getItem("refresh") || null;

export function setTokens({ access: a, refresh: r }) {
  access = a; refresh = r;
  localStorage.setItem("access", a);
  localStorage.setItem("refresh", r);
}

export function clearTokens() {
  access = null; refresh = null;
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

api.interceptors.request.use((config) => {
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// авто-рефреш
let isRefreshing = false;
let queue = [];

function processQueue(error, token = null) {
  queue.forEach(p => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // якщо не 401 або вже пробували рефреш — віддати помилку
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // якщо нема refresh — логаут
    if (!refresh) {
      clearTokens();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((newAccess) => {
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post("/api/token/refresh/", { refresh });
      setTokens({ access: data.access, refresh });
      processQueue(null, data.access);
      originalRequest.headers.Authorization = `Bearer ${data.access}`;
      return api(originalRequest);
    } catch (e) {
      clearTokens();
      processQueue(e, null);
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
export { API_BASE };
export default api;
