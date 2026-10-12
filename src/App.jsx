import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './lib/api';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Usuarios from './pages/Usuarios';

// Comprobación REAL en la API antes de mostrar la administración.
// No confiar únicamente en el rol guardado en el navegador.
function SoloAdministradores({ children }) {
  const { usuario, logout } = useAuth();
  const [estado, setEstado] = useState('comprobando');

  useEffect(() => {
    let vivo = true;
    if (!usuario || usuario.rol !== 'admin') {
      setEstado('sin-acceso');
      return () => { vivo = false; };
    }
    setEstado('comprobando');
    api.get('/auth/perfil')
      .then(({ data }) => {
        if (!vivo) return;
        const cuenta = data?.data;
        if (cuenta?.rol === 'admin' && Boolean(cuenta.activo)) {
          setEstado('autorizado');
        } else {
          logout();
          setEstado('sin-acceso');
        }
      })
      .catch(() => {
        if (vivo) setEstado('sin-acceso');
      });
    return () => { vivo = false; };
  }, [usuario, logout]);

  if (estado === 'sin-acceso' || !usuario || usuario.rol !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  if (estado !== 'autorizado') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-900 text-white/60">
        Verificando acceso de administrador…
      </div>
    );
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Navigate to="/admin/usuarios" replace />} />
          <Route path="/admin/usuarios" element={<SoloAdministradores><Usuarios /></SoloAdministradores>} />
          <Route path="/usuarios" element={<Navigate to="/admin/usuarios" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
