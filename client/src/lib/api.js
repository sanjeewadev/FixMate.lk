// src/lib/api.js
import axios from "axios";

/**
 * Use the same base as your Services fetch:
 * Services.jsx calls "http://localhost:7001/api/services"
 * so default to that unless VITE_API_BASE is provided.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:7001",
});

// Automatically attach JWT if present
api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export default api;