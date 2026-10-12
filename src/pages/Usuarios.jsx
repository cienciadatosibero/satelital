import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, CheckCircle2, KeyRound, LockKeyhole, LogOut,
  Pencil, Search, Shield, Trash2, UserPlus, Users, X,
} from 'lucide-react';
import api from '../lib/api';
import { Badge, Button, Card, Eyebrow, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const nuevoUsuario = { nombre: '', usuario: '', password: '', rol: 'invitado' };

function Campo({ label, value, onChange, type = 'text', placeholder, autoComplete, required = false, minLength }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete} required={required} minLength={minLength}
        className="h-11 w-full rounded-xl border border-white/10 bg-base-900/80 px-4 text-sm text-white outline-none focus:border-signal/60" />
    </label>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-base-800 p-6 shadow-2xl" role="dialog" aria-modal="true" aria-label={title}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Usuarios() {
  const { usuario: actual, logout } = useAuth();
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState(nuevoUsuario);
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(null);
  const [borrando, setBorrando] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const cargar = async () => {
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo consultar la lista de usuarios.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = useMemo(() => usuarios.filter((u) =>
    `${u.nombre} ${u.usuario} ${u.rol}`.toLowerCase().includes(busqueda.trim().toLowerCase())), [usuarios, busqueda]);

  const mensajeError = (e, fallback) => e.response?.data?.message || fallback;

  const crear = async (e) => {
    e.preventDefault();
    setError(''); setExito(''); setCreando(true);
    try {
      await api.post('/usuarios', { ...form, nombre: form.nombre.trim(), usuario: form.usuario.trim() });
      setForm(nuevoUsuario);
      setExito('Usuario creado. Ya puede iniciar sesión desde SatDataset para Windows.');
      await cargar();
    } catch (e) {
      setError(mensajeError(e, 'No se pudo crear el usuario.'));
    } finally { setCreando(false); }
  };

  const abrirEditar = (u) => {
    setError(''); setExito('');
    setEditando({ id: u.id, nombre: u.nombre, usuario: u.usuario, rol: u.rol, activo: Boolean(u.activo), password: '' });
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!editando) return;
    setProcesando(true); setError(''); setExito('');
    try {
      const propio = Number(editando.id) === Number(actual.id);
      const original = usuarios.find((u) => u.id === editando.id);
      const body = {
        nombre: editando.nombre.trim(),
        rol: propio ? 'admin' : editando.rol,
        activo: propio ? 1 : (editando.activo ? 1 : 0),
        ...(editando.password ? { password: editando.password } : {}),
      };
      if (!original) throw new Error('Cuenta no encontrada');
      await api.put(`/usuarios/${editando.id}`, body);
      setEditando(null);
      setExito('Datos del usuario actualizados.');
      await cargar();
    } catch (e) {
      setError(mensajeError(e, e.message || 'No se pudo actualizar el usuario.'));
    } finally { setProcesando(false); }
  };

  const confirmarBorrar = async () => {
    if (!borrando) return;
    setProcesando(true); setError(''); setExito('');
    try {
      await api.delete(`/usuarios/${borrando.id}`);
      setBorrando(null);
      setExito('Cuenta eliminada.');
      await cargar();
    } catch (e) {
      setError(mensajeError(e, 'No se pudo eliminar la cuenta.'));
    } finally { setProcesando(false); }
  };

  const cerrarSesion = () => { logout(); navigate('/login', { replace: true }); };
  const activos = usuarios.filter((u) => Boolean(u.activo)).length;

  return (
    <div className="min-h-screen bg-base-900 pb-12 text-white">
      <header className="border-b border-white/10 bg-base-800/60">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-signal"><ArrowLeft size={16} /> Volver a la portada</Link>
          <div className="flex items-center gap-3 text-sm text-white/50">
            <span className="hidden sm:inline">{actual?.nombre} · Administrador</span>
            <button type="button" onClick={cerrarSesion} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-white/70 hover:bg-white/10 hover:text-white"><LogOut size={15} /> Cerrar sesión</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Eyebrow>panel de administración</Eyebrow>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold sm:text-3xl"><Users className="text-signal" size={28} /> Gestión de usuarios</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/50">Crea y administra las cuentas que podrán acceder al programa SatDataset en Windows. La detección se realiza localmente.</p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[['Total de cuentas', usuarios.length], ['Cuentas activas', activos], ['Administradores', usuarios.filter((u) => u.rol === 'admin').length]].map(([label, numero]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-base-800/70 p-4">
              <span className="text-xs text-white/50">{label}</span><strong className="mt-2 block text-2xl font-bold text-signal">{numero}</strong>
            </div>
          ))}
        </div>

        {error && <div role="alert" className="mt-5 rounded-xl border border-alert/30 bg-alert/10 px-4 py-3 text-sm text-alert">{error}</div>}
        {exito && <div role="status" className="mt-5 flex items-center gap-2 rounded-xl border border-signal/25 bg-signal/10 px-4 py-3 text-sm text-signal"><CheckCircle2 size={16} /> {exito}</div>}

        <Card className="mt-6 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-semibold"><UserPlus className="text-signal" size={19} /> Crear cuenta</h2>
          <form onSubmit={crear} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Campo label="Nombre completo" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} placeholder="Nombre y apellido" required />
            <Campo label="Usuario" value={form.usuario} onChange={(v) => setForm({ ...form, usuario: v })} placeholder="usuario123" required autoComplete="off" />
            <Campo label="Contraseña (mínimo 8 caracteres)" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="Contraseña segura" required minLength={8} autoComplete="new-password" />
            <label className="flex flex-col gap-1.5"><span className="text-[11px] font-mono uppercase tracking-wider text-white/50">Permisos</span>
              <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}
                className="h-11 rounded-xl border border-white/10 bg-base-900/80 px-4 text-sm text-white outline-none focus:border-signal/60">
                <option value="invitado">Usuario del programa (Windows)</option>
                <option value="admin">Administrador (web y Windows)</option>
              </select>
            </label>
            <div className="md:col-span-2"><Button type="submit" disabled={creando}>{creando ? <Spinner label="Creando…" /> : <><UserPlus size={16} /> Crear usuario</>}</Button></div>
          </form>
        </Card>

        <div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Cuentas registradas</h2>
          <label className="relative flex w-full max-w-xs items-center sm:w-64">
            <Search size={15} className="absolute left-3 text-white/40" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar usuario" aria-label="Buscar usuario"
              className="h-10 w-full rounded-xl border border-white/10 bg-base-800 pl-9 pr-3 text-sm outline-none focus:border-signal/50" />
          </label>
        </div>
        {cargando ? <Spinner label="Cargando usuarios…" /> : (
          <div className="space-y-2">
            {filtrados.length === 0 && <p className="rounded-xl border border-white/10 p-6 text-center text-white/50">No hay usuarios que coincidan.</p>}
            {filtrados.map((u, index) => (
              <motion.article key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * .035 }}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-base-800/60 p-4 sm:gap-4">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${u.rol === 'admin' ? 'bg-signal/15 text-signal' : 'bg-white/5 text-white/60'}`}>
                  {u.rol === 'admin' ? <Shield size={20} /> : <Users size={20} />}
                </span>
                <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{u.nombre}</strong><span className="text-xs text-white/50">@{u.usuario}</span></span>
                <span className="flex flex-wrap items-center gap-2">
                  <Badge tone={u.rol === 'admin' ? 'signal' : 'neutral'}>{u.rol === 'admin' ? 'Admin' : 'Windows'}</Badge>
                  <Badge tone={u.activo ? 'signal' : 'alert'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge>
                </span>
                <span className="flex items-center gap-2">
                  <button type="button" onClick={() => abrirEditar(u)} title="Editar usuario" aria-label={`Editar ${u.usuario}`} className="rounded-lg border border-white/10 p-2.5 text-white/65 hover:bg-white/10 hover:text-white"><Pencil size={16} /></button>
                  {Number(u.id) !== Number(actual?.id) && <button type="button" onClick={() => { setError(''); setBorrando(u); }} title="Eliminar usuario" aria-label={`Eliminar ${u.usuario}`} className="rounded-lg border border-white/10 p-2.5 text-white/45 hover:bg-alert/10 hover:text-alert"><Trash2 size={16} /></button>}
                </span>
              </motion.article>
            ))}
          </div>
        )}
      </main>

      {editando && <Modal title={`Editar @${editando.usuario}`} onClose={() => { if (!procesando) { setEditando(null); setError(''); } }}>
        <form onSubmit={guardar} className="space-y-4">
          <Campo label="Nombre" value={editando.nombre} onChange={(v) => setEditando({ ...editando, nombre: v })} required />
          <Campo label="Nueva contraseña (opcional)" value={editando.password} type="password" onChange={(v) => setEditando({ ...editando, password: v })} minLength={8} placeholder="Dejar vacío para no cambiar" autoComplete="new-password" />
          {Number(editando.id) === Number(actual?.id) ? (
            <p className="rounded-lg bg-white/5 p-3 text-xs text-white/55"><LockKeyhole size={14} className="mr-1 inline" /> Tu cuenta de administrador no puede desactivarse ni perder permisos desde este panel.</p>
          ) : <>
            <label className="flex flex-col gap-1.5 text-xs text-white/60">Rol
              <select value={editando.rol} onChange={(e) => setEditando({ ...editando, rol: e.target.value })} className="h-11 rounded-xl border border-white/10 bg-base-900 px-4 text-sm text-white">
                <option value="invitado">Usuario del programa (Windows)</option><option value="admin">Administrador</option>
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-white/10 p-3 text-sm text-white/70">
              <input type="checkbox" checked={editando.activo} onChange={(e) => setEditando({ ...editando, activo: e.target.checked })} className="accent-emerald-400" /> Cuenta activa
            </label>
          </>}
          {error && <p role="alert" className="rounded-xl border border-alert/30 bg-alert/10 p-3 text-sm text-alert">{error}</p>}
          <div className="flex justify-end gap-3"><button type="button" onClick={() => { setEditando(null); setError(''); }} className="rounded-lg px-4 py-2 text-sm text-white/55">Cancelar</button><Button type="submit" disabled={procesando}><KeyRound size={16} /> Guardar cambios</Button></div>
        </form>
      </Modal>}
      {borrando && <Modal title="Eliminar cuenta" onClose={() => { if (!procesando) { setBorrando(null); setError(''); } }}>
        <p className="text-sm leading-relaxed text-white/65">¿Eliminar definitivamente a <strong className="text-white">{borrando.nombre}</strong> (@{borrando.usuario})? No podrá volver a iniciar sesión en SatDataset.</p>
        {error && <p role="alert" className="mt-3 text-sm text-alert">{error}</p>}
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => { setBorrando(null); setError(''); }} className="rounded-lg px-4 py-2 text-sm text-white/55">Cancelar</button>
          <button type="button" onClick={confirmarBorrar} disabled={procesando} className="rounded-lg bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/25">{procesando ? 'Eliminando…' : 'Eliminar cuenta'}</button>
        </div>
      </Modal>}
    </div>
  );
}
