import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './lib/api';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminLayout from './pages/AdminLayout';
import AdminGeneral from './pages/AdminGeneral';
import Usuarios from './pages/Usuarios';

// Validar el administrador con TiDB a través del backend, no con localStorage.
function SoloAdministradores() {
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
      .then(({data}) => {
        if (!vivo) return;
        if (data?.data?.rol === 'admin' && Boolean(data.data.activo)) setEstado('autorizado');
        else { logout(); setEstado('sin-acceso'); }
      })
      .catch(() => { if (vivo) setEstado('sin-acceso'); });
    return () => { vivo = false; };
  }, [usuario, logout]);
  if (!usuario || usuario.rol !== 'admin' || estado === 'sin-acceso') return <Navigate to="/login" replace />;
  if (estado !== 'autorizado') return <div className="flex min-h-screen items-center justify-center bg-base-900 text-white/60">Verificando acceso de administrador…</div>;
  return <Outlet />;
}

export default function App() {
  return <AuthProvider><BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route element={<SoloAdministradores />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="general" replace />} />
          <Route path="general" element={<AdminGeneral />} />
          <Route path="usuarios" element={<Usuarios />} />
        </Route>
      </Route>
      <Route path="/usuarios" element={<Navigate to="/admin/usuarios" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter></AuthProvider>;
}
