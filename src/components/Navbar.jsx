import { NavLink, useNavigate } from 'react-router-dom';
import { Satellite, Map, Layers, Users, FolderArchive, HardDrive, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function NavItem({ to, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-signal/15 text-signal'
            : 'text-white/55 hover:text-white hover:bg-white/5'
        }`
      }
    >
      <Icon size={16} />
      <span className="hidden sm:inline">{children}</span>
    </NavLink>
  );
}

export default function Navbar() {
  const { usuario, esAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const salir = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-[1100] flex h-16 items-center gap-4 border-b border-white/10 bg-base-900/85 px-4 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal/15 text-signal shadow-glow">
          <Satellite size={18} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Datasets Satelitales</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
            visión orbital
          </p>
        </div>
      </div>

      <nav className="ml-2 flex items-center gap-1">
        <NavItem to="/scan" icon={Map}>
          Escaneo
        </NavItem>
        <NavItem to="/sesiones" icon={FolderArchive}>
          Sesiones
        </NavItem>
        {esAdmin && (
          <>
            <NavItem to="/modelos" icon={Layers}>
              Modelos
            </NavItem>
            <NavItem to="/usuarios" icon={Users}>
              Usuarios
            </NavItem>
            <NavItem to="/almacenamiento" icon={HardDrive}>
              Disco
            </NavItem>
          </>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-white">{usuario?.nombre}</p>
          <p
            className={`font-mono text-[10px] uppercase tracking-wider ${
              esAdmin ? 'text-signal' : 'text-amber'
            }`}
          >
            {usuario?.rol}
          </p>
        </div>
        <button
          onClick={salir}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-alert/15 hover:text-alert"
          title="Cerrar sesión"
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
