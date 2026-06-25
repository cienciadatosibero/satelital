import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Trash2, Shield, Eye } from 'lucide-react';
import api from '../lib/api';
import { Eyebrow, Button, Card, Badge, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function Usuarios() {
  const { usuario: actual } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ nombre: '', usuario: '', password: '', rol: 'invitado' });
  const [creando, setCreando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar usuarios');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const crear = async (e) => {
    e.preventDefault();
    setCreando(true);
    setError(null);
    try {
      await api.post('/usuarios', form);
      setForm({ nombre: '', usuario: '', password: '', rol: 'invitado' });
      await cargar();
    } catch (e) {
      setError(e.response?.data?.message || 'Error al crear usuario');
    } finally {
      setCreando(false);
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    await api.delete(`/usuarios/${id}`);
    await cargar();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Eyebrow>administración</Eyebrow>
      <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-white">
        <Users size={22} className="text-signal" /> Usuarios
      </h1>
      <p className="mt-1 text-sm text-white/45">
        Crea cuentas y asigna rol. Los invitados solo escanean; los administradores gestionan
        todo.
      </p>

      {/* Crear usuario */}
      <Card className="mt-6 p-5">
        <form onSubmit={crear} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="Nombre" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} placeholder="Ana Pérez" />
          <Input label="Usuario" value={form.usuario} onChange={(v) => setForm({ ...form, usuario: v })} placeholder="aperez" />
          <Input label="Contraseña" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="••••••••" />
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">Rol</span>
            <select
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value })}
              className="h-11 rounded-xl border border-white/10 bg-base-900/80 px-4 text-sm text-white outline-none focus:border-signal/60"
            >
              <option value="invitado">Invitado</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          <div className="md:col-span-2">
            <Button type="submit" disabled={creando}>
              {creando ? <Spinner /> : <><UserPlus size={16} /> Crear usuario</>}
            </Button>
          </div>
        </form>
        {error && (
          <p className="mt-3 rounded-xl border border-alert/30 bg-alert/10 px-3 py-2 text-sm text-alert">
            {error}
          </p>
        )}
      </Card>

      {/* Lista */}
      <div className="mt-6 space-y-2">
        {cargando ? (
          <Spinner label="Cargando…" />
        ) : (
          usuarios.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-base-800/60 p-4"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  u.rol === 'admin' ? 'bg-signal/15 text-signal' : 'bg-amber/15 text-amber'
                }`}
              >
                {u.rol === 'admin' ? <Shield size={18} /> : <Eye size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{u.nombre}</p>
                <p className="font-mono text-xs text-white/45">@{u.usuario}</p>
              </div>
              <Badge tone={u.rol === 'admin' ? 'signal' : 'amber'}>{u.rol}</Badge>
              {!u.activo && <Badge tone="alert">inactivo</Badge>}
              {u.id !== actual.id && (
                <button
                  onClick={() => eliminar(u.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white/40 hover:bg-alert/15 hover:text-alert"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl border border-white/10 bg-base-900/80 px-4 text-sm text-white outline-none focus:border-signal/60"
      />
    </label>
  );
}
