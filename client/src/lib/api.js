// src/lib/api.js
import axios from "axios";

function normalizeToken(raw) {
  if (!raw) return null;
  return raw.startsWith("Bearer ") ? raw.slice(7) : raw;
}

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://logical-excel-dive-hat.trycloudflare.com",
  timeout: 20000,
});

// Always attach the latest token (Bearer) from localStorage
api.interceptors.request.use((cfg) => {
  let token = localStorage.getItem("token");
  token = normalizeToken(token);
  if (token) cfg.headers.Authorization = `Bearer ${token}`;

  // Dev-only peek to confirm header is present
  if (import.meta.env.DEV && /^\/api\/(admin|staff|technician|customer)\b/.test(cfg.url || "")) {
    // eslint-disable-next-line no-console
    console.debug("[API ->]", cfg.method?.toUpperCase(), cfg.url, {
      authHeaderPresent: !!cfg.headers.Authorization,
      authHeaderPreview: String(cfg.headers.Authorization || "").slice(0, 24) + "...",
    });
  }
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const url = err?.config?.url;
    const method = err?.config?.method?.toUpperCase?.();
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      // eslint-disable-next-line no-console
      console.warn(`[API ${method} ${status}] ${url}`, err?.response?.data || "");
    }
    return Promise.reject(err);
  }
);

export default api;
