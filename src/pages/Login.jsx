import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Satellite, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Field, Eyebrow } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ usuario: '', password: '' });
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="grid-bg flex min-h-screen items-center justify-center p-4">
      {/* Línea de escaneo ambiental */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-40">
        <div className="absolute inset-x-0 h-px animate-scan bg-gradient-to-r from-transparent via-signal/60 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-base-800/90 p-8 backdrop-blur-xl"
      >
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-signal/15 text-signal shadow-glow">
            <Satellite size={26} />
          </div>
          <Eyebrow>acceso al sistema</Eyebrow>
          <h1 className="mt-2 text-2xl font-bold text-white">
            Generador de Datasets Satelitales
          </h1>
          <p className="mt-1 text-sm text-white/45">
            Identifícate para escanear terreno y construir datasets.
          </p>
        </div>

        <form onSubmit={enviar} className="flex flex-col gap-4">
          <Field
            label="Usuario"
            value={form.usuario}
            onChange={(e) => setForm({ ...form, usuario: e.target.value })}
            placeholder="admin"
            autoFocus
          />
          <Field
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-alert/30 bg-alert/10 px-3 py-2 text-sm text-alert"
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" disabled={cargando} className="mt-1 w-full">
            {cargando ? 'Verificando…' : 'Entrar'}
            {!cargando && <ArrowRight size={16} />}
          </Button>
        </form>

      </motion.div>
    </div>
  );
}
