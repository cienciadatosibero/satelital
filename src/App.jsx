import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Scan from './pages/Scan';
import Sesiones from './pages/Sesiones';
import Modelos from './pages/Modelos';
import Usuarios from './pages/Usuarios';
import Almacenamiento from './pages/Almacenamiento';

// Requiere sesión iniciada
function RutaPrivada() {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen bg-base-900">
      <Navbar />
      <Outlet />
    </div>
  );
}

// Requiere rol admin
function RutaAdmin() {
  const { esAdmin } = useAuth();
  if (!esAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<RutaPrivada />}>
            <Route path="/" element={<Scan />} />
            <Route path="/sesiones" element={<Sesiones />} />

            <Route element={<RutaAdmin />}>
              <Route path="/modelos" element={<Modelos />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/almacenamiento" element={<Almacenamiento />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
