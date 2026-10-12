import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, LogOut, Satellite, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const enlaces = [
  { to: '/admin/general', label: 'General', Icon: LayoutDashboard },
  { to: '/admin/usuarios', label: 'Usuarios', Icon: Users },
];

export default function AdminLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const salir = () => { logout(); navigate('/login', { replace: true }); };
  return (
    <div className="flex min-h-screen w-full bg-base-900 text-white">
      <aside className="hidden w-[238px] shrink-0 flex-col border-r border-white/10 bg-[#080f17] lg:flex">
        <Link to="/" className="flex items-center gap-3 border-b border-white/10 px-5 py-5 hover:bg-white/[.025]">
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-signal/25 bg-signal/10 text-signal"><Satellite size={23} /></span>
          <span><strong className="block text-base leading-tight">SatDataset</strong><small className="mt-1 block font-mono text-[9px] tracking-[.18em] text-white/40">ADMINISTRACIÓN</small></span>
        </Link>
        <div className="px-3 pt-6">
          <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[.18em] text-white/35">Navegación</p>
          <nav aria-label="Administración" className="space-y-1">
            {enlaces.map(({to,label,Icon}) => <NavLink key={to} to={to} className={({isActive}) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-signal/10 text-signal ring-1 ring-signal/20' : 'text-white/55 hover:bg-white/5 hover:text-white'}`}><Icon size={19}/>{label}</NavLink>)}
          </nav>
        </div>
        <div className="mt-auto border-t border-white/10 px-4 py-5">
          <span className="mb-3 flex min-w-0 items-center gap-2 text-xs text-white/60"><ShieldCheck size={15} className="shrink-0 text-signal"/><span className="truncate">{usuario?.nombre || 'Administrador'}</span></span>
          <button type="button" onClick={salir} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"><LogOut size={16}/>Cerrar sesión</button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-white/10 bg-[#0a111b]/85 px-4 py-3 sm:px-6 lg:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-sm text-white/60 hover:text-signal"><ArrowLeft size={16} /><span className="hidden sm:inline">Portada</span></Link>
            <span className="hidden text-white/20 sm:inline">/</span><span className="text-sm font-semibold text-white/85">Panel de administración</span>
          </div>
          <div className="flex items-center gap-3"><span className="hidden max-w-40 truncate text-xs text-white/45 sm:block">{usuario?.nombre}</span><button type="button" onClick={salir} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65 hover:bg-white/10 hover:text-white"><LogOut size={15}/><span className="hidden sm:inline">Salir</span></button></div>
        </header>
        <nav aria-label="Administración móvil" className="flex gap-2 border-b border-white/10 p-3 lg:hidden">
          {enlaces.map(({to,label,Icon}) => <NavLink key={to} to={to} className={({isActive}) => `flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold ${isActive ? 'bg-signal/10 text-signal ring-1 ring-signal/20' : 'bg-white/5 text-white/55'}`}><Icon size={17}/>{label}</NavLink>)}
        </nav>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-7 lg:py-7"><Outlet /></main>
      </div>
    </div>
  );
}
