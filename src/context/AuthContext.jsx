import { createContext, useContext, useState, useCallback } from 'react';
import api, { API_BASE } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    // Evita mostrar una sesión antigua si no hay API configurada.
    if (!API_BASE || !localStorage.getItem('sat_token')) return null;
    const raw = localStorage.getItem('sat_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (credenciales) => {
    const { data } = await api.post('/auth/login', credenciales);
    if (!data?.data?.token || !data?.data?.usuario) {
      throw new Error('La URL configurada no devolvió una respuesta válida del backend. Revisa VITE_API_URL y el despliegue de la API.');
    }
    const { token, usuario } = data.data;
    localStorage.setItem('sat_token', token);
    localStorage.setItem('sat_user', JSON.stringify(usuario));
    setUsuario(usuario);
    return usuario;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sat_token');
    localStorage.removeItem('sat_user');
    setUsuario(null);
  }, []);

  const esAdmin = usuario?.rol === 'admin';

  return (
    <AuthContext.Provider value={{ usuario, esAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
