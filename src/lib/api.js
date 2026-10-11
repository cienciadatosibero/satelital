import axios from 'axios';
import { resolverBaseApi } from './apiConfig';

// En producción NO suponemos que Vercel aloja Express en este mismo dominio.
// Es obligatorio configurar VITE_API_URL con el dominio público del backend.
export const API_BASE = resolverBaseApi(import.meta.env.VITE_API_URL, import.meta.env.DEV);

const api = axios.create({
  baseURL: API_BASE || '/api',
  timeout: 180000,
});

api.interceptors.request.use((config) => {
  if (!API_BASE) {
    const error = new Error('No se ha configurado VITE_API_URL para la API.');
    error.code = 'API_NOT_CONFIGURED';
    return Promise.reject(error);
  }
  const token = localStorage.getItem('sat_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sat_token');
      localStorage.removeItem('sat_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
