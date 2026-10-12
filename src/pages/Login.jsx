import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Field, Eyebrow } from '../components/ui';
import { mensajeErrorLogin } from '../lib/apiConfig';

export default function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ usuario: '', password: '' });
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const cuenta = await login(form);
      if (cuenta.rol !== 'admin') {
        logout();
        setError('Este acceso es exclusivo para administradores. Usa el programa de Windows para realizar escaneos.');
        return;
      }
      navigate('/admin/general', { replace: true });
    } catch (err) {
      setError(mensajeErrorLogin(err));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="grid-bg relative flex min-h-screen items-center justify-center bg-base-900 p-5">
      <Link to="/" className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white">
        <ArrowLeft size={16} /> Volver a SatDataset
      </Link>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .35 }}
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-base-800/90 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-signal/15 text-signal shadow-glow">
            <LockKeyhole size={25} />
          </div>
          <Eyebrow>ACCESO RESTRINGIDO</Eyebrow>
          <h1 className="mt-2 text-2xl font-bold text-white">Administración SatDataset</h1>
          <p className="mt-2 text-sm text-white/50">Administra las cuentas que podrán utilizar la aplicación de Windows.</p>
        </div>
        <form onSubmit={enviar} className="flex flex-col gap-4">
          <Field label="Usuario administrador" value={form.usuario}
            onChange={(e) => setForm({ ...form, usuario: e.target.value })}
            placeholder="Ingresa tu usuario" name="usuario" autoComplete="username" required autoFocus />
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">Contraseña</span>
            <span className="relative">
              <input name="password" type={mostrarPassword ? 'text' : 'password'} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••" autoComplete="current-password" required
                className="h-11 w-full rounded-xl border border-white/10 bg-base-900/80 px-4 pr-12 text-sm text-white outline-none focus:border-signal/60" />
              <button type="button" onClick={() => setMostrarPassword((v) => !v)}
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/50 hover:text-signal">
                {mostrarPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </span>
          </label>
          {error && <p role="alert" className="rounded-xl border border-alert/30 bg-alert/10 p-3 text-sm text-alert">{error}</p>}
          <Button type="submit" disabled={cargando} className="mt-1 w-full">
            {cargando ? 'Verificando…' : 'Entrar al panel'}{!cargando && <ArrowRight size={16} />}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
