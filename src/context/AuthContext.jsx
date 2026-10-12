import { createContext, useContext, useState, useCallback } from 'react';
import api, { API_BASE } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    if (!API_BASE || !localStorage.getItem('sat_token')) return null;
    const raw = localStorage.getItem('sat_user');
    try {
      const saved = raw ? JSON.parse(raw) : null;
      return saved?.rol === 'admin' ? saved : null;
    } catch { return null; }
  });

  const login = useCallback(async (credenciales) => {
    // Este endpoint no entrega tokens web a usuarios normales.
    const { data } = await api.post('/auth/admin/login', credenciales);
    if (!data?.data?.token || data?.data?.usuario?.rol !== 'admin') {
      throw new Error('La API no confirmó el acceso de administrador.');
    }
    const { token, usuario: cuenta } = data.data;
    localStorage.setItem('sat_token', token);
    localStorage.setItem('sat_user', JSON.stringify(cuenta));
    setUsuario(cuenta);
    return cuenta;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sat_token');
    localStorage.removeItem('sat_user');
    setUsuario(null);
  }, []);
  return <AuthContext.Provider value={{ usuario, esAdmin: usuario?.rol === 'admin', login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
