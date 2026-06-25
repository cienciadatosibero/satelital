import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Layers, Upload, CheckCircle2, Trash2, Cpu } from 'lucide-react';
import api from '../lib/api';
import { Eyebrow, Button, Card, Badge, Spinner } from '../components/ui';

export default function Modelos() {
  const [modelos, setModelos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', conf: 0.25 });
  const fileRef = useRef(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/modelos');
      setModelos(data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cargar modelos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const subir = async (e) => {
    e.preventDefault();
    const archivo = fileRef.current?.files?.[0];
    if (!archivo) return setError('Selecciona un archivo de peso (.pt)');
    setSubiendo(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('peso', archivo);
      fd.append('nombre', form.nombre || archivo.name);
      fd.append('descripcion', form.descripcion);
      fd.append('conf_default', form.conf);
      await api.post('/modelos', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm({ nombre: '', descripcion: '', conf: 0.25 });
      if (fileRef.current) fileRef.current.value = '';
      await cargar();
    } catch (e) {
      setError(e.response?.data?.message || 'Error al subir el peso');
    } finally {
      setSubiendo(false);
    }
  };

  const activar = async (id) => {
    setError(null);
    try {
      await api.post(`/modelos/${id}/activar`);
      await cargar();
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo activar (revisa el microservicio)');
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este modelo y su archivo?')) return;
    await api.delete(`/modelos/${id}`);
    await cargar();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Eyebrow>administración</Eyebrow>
      <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-white">
        <Layers size={22} className="text-signal" /> Modelos entrenados
      </h1>
      <p className="mt-1 text-sm text-white/45">
        Sube pesos de YOLO (.pt) y activa cuál usa el escáner. Solo uno está activo a la vez.
      </p>

      {/* Formulario de carga */}
      <Card className="mt-6 p-5">
        <form onSubmit={subir} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">
              Nombre del modelo
            </span>
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Paneles solares v1"
              className="h-11 rounded-xl border border-white/10 bg-base-900/80 px-4 text-sm text-white outline-none focus:border-signal/60"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">
              Confianza por defecto
            </span>
            <input
              type="number"
              step="0.05"
              min="0.05"
              max="0.95"
              value={form.conf}
              onChange={(e) => setForm({ ...form, conf: e.target.value })}
              className="h-11 rounded-xl border border-white/10 bg-base-900/80 px-4 font-mono text-sm text-white outline-none focus:border-signal/60"
            />
          </label>
          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">
              Descripción
            </span>
            <input
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Detecta paneles fotovoltaicos en techos"
              className="h-11 rounded-xl border border-white/10 bg-base-900/80 px-4 text-sm text-white outline-none focus:border-signal/60"
            />
          </label>

          <div className="flex items-center gap-3 md:col-span-2">
            <input
              ref={fileRef}
              type="file"
              accept=".pt,.pth,.onnx,.weights"
              className="block w-full text-sm text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-white/20"
            />
            <Button type="submit" disabled={subiendo}>
              {subiendo ? <Spinner label="Cargando…" /> : <><Upload size={16} /> Subir peso</>}
            </Button>
          </div>
        </form>
        {error && (
          <p className="mt-3 rounded-xl border border-alert/30 bg-alert/10 px-3 py-2 text-sm text-alert">
            {error}
          </p>
        )}
      </Card>

      {/* Lista de modelos */}
      <div className="mt-6 space-y-3">
        {cargando ? (
          <Spinner label="Cargando modelos…" />
        ) : modelos.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/40">
            Aún no hay modelos. Sube tu primer peso arriba.
          </p>
        ) : (
          modelos.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex items-center gap-4 rounded-2xl border p-4 ${
                m.activo
                  ? 'border-signal/40 bg-signal/5 shadow-glow'
                  : 'border-white/10 bg-base-800/60'
              }`}
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  m.activo ? 'bg-signal/20 text-signal' : 'bg-white/5 text-white/50'
                }`}
              >
                <Cpu size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-white">{m.nombre}</p>
                  {m.activo && <Badge tone="signal">activo</Badge>}
                </div>
                <p className="truncate text-xs text-white/45">
                  {m.descripcion || 'sin descripción'}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {m.clases &&
                    Object.values(m.clases).map((c) => (
                      <Badge key={c} tone="neutral">
                        {c}
                      </Badge>
                    ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!m.activo && (
                  <Button variant="ghost" onClick={() => activar(m.id)} className="h-9 px-3">
                    <CheckCircle2 size={15} /> Activar
                  </Button>
                )}
                <button
                  onClick={() => eliminar(m.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white/40 hover:bg-alert/15 hover:text-alert"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
