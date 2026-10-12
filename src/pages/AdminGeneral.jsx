import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, LayoutDashboard, Monitor, ShieldCheck, UserRoundX, Users } from 'lucide-react';
import api from '../lib/api';
import { Spinner } from '../components/ui';

export default function AdminGeneral() {
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let vivo = true;
    api.get('/usuarios').then(({data}) => { if (vivo) setCuentas(Array.isArray(data?.data) ? data.data : []); })
      .catch((e) => { if (vivo) setError(e.response?.data?.message || 'No se pudieron consultar las cuentas.'); })
      .finally(() => { if (vivo) setCargando(false); });
    return () => { vivo = false; };
  }, []);
  const activos = cuentas.filter((u) => Boolean(u.activo)).length;
  const admins = cuentas.filter((u) => u.rol === 'admin').length;
  const metrics = [
    { label: 'Usuarios registrados', value: cuentas.length, Icon: Users },
    { label: 'Cuentas activas', value: activos, Icon: CheckCircle2 },
    { label: 'Administradores', value: admins, Icon: ShieldCheck },
    { label: 'Cuentas inactivas', value: cuentas.length - activos, Icon: UserRoundX },
  ];
  return (
    <div className="w-full">
      <div className="mb-6"><p className="font-mono text-[11px] uppercase tracking-[.2em] text-signal">Vista general</p><h1 className="mt-2 flex items-center gap-3 text-2xl font-bold sm:text-3xl"><LayoutDashboard size={26} className="text-signal"/>General</h1><p className="mt-2 text-sm text-white/50">Control de accesos para SatDataset en Windows. El análisis de imágenes se realiza en cada computadora.</p></div>
      {error && <p role="alert" className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">{error}</p>}
      {cargando ? <Spinner label="Consultando cuentas…"/> : <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{metrics.map(({label,value,Icon}) => <div key={label} className="rounded-2xl border border-white/10 bg-base-800/70 p-5"><div className="mb-4 flex items-center justify-between gap-2 text-signal"><Icon size={20}/></div><strong className="block text-3xl font-bold tabular-nums">{value}</strong><span className="mt-2 block text-xs text-white/50">{label}</span></div>)}</div>}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-base-800/70 p-5 sm:p-6"><Users size={23} className="text-signal"/><h2 className="mt-3 text-lg font-bold">Administrar usuarios</h2><p className="mt-2 text-sm leading-relaxed text-white/50">Crea cuentas para Windows, modifica permisos, restablece contraseñas y desactiva accesos.</p><Link to="/admin/usuarios" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-signal px-4 py-2.5 text-sm font-bold text-base-900 hover:brightness-110">Ir a usuarios <ArrowRight size={17}/></Link></div>
        <div className="rounded-2xl border border-white/10 bg-base-800/70 p-5 sm:p-6"><Monitor size={23} className="text-signal"/><h2 className="mt-3 text-lg font-bold">SatDataset para Windows</h2><p className="mt-2 text-sm leading-relaxed text-white/50">El programa usa CPU o GPU del equipo. Este panel únicamente administra las credenciales de acceso.</p><Link to="/" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-signal hover:underline">Ver página de descarga <ArrowRight size={16}/></Link></div>
      </div>
    </div>
  );
}
