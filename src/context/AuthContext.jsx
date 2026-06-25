import { createContext, useContext, useState, useCallback } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const raw = localStorage.getItem('sat_user');
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (credenciales) => {
    const { data } = await api.post('/auth/login', credenciales);
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
