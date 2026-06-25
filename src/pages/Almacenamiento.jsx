import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HardDrive, Database, Image, Layers, RefreshCw, Trash2, Sparkles } from 'lucide-react';
import api from '../lib/api';
import { Eyebrow, Spinner, Button, Badge } from '../components/ui';

function fmtBytes(b) {
  if (!b) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
}

export default function Almacenamiento() {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [optimizando, setOptimizando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/almacenamiento');
      setData(data.data);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const borrarSesion = async (id) => {
    if (!confirm(`¿Eliminar la sesión ${id} y todas sus imágenes del disco?`)) return;
    await api.delete(`/sesiones/${id}`);
    await cargar();
  };

  const optimizar = async () => {
    setOptimizando(true);
    try {
      await api.post('/almacenamiento/optimizar');
      await cargar();
      alert('Base de datos optimizada. Espacio liberado.');
    } catch {
      alert('No se pudo optimizar la base de datos.');
    } finally {
      setOptimizando(false);
    }
  };

  if (cargando || !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Spinner label="Midiendo almacenamiento…" />
      </div>
    );
  }

  const pct = data.porcentaje;
  const tonoBarra = pct > 90 ? 'bg-alert' : pct > 70 ? 'bg-amber' : 'bg-signal';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <Eyebrow>administración</Eyebrow>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-white">
            <HardDrive size={22} className="text-signal" /> Almacenamiento
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={optimizar} disabled={optimizando} className="h-9 px-3">
            {optimizando ? <Spinner /> : <><Sparkles size={15} /> Optimizar BD</>}
          </Button>
          <Button variant="ghost" onClick={cargar} className="h-9 px-3">
            <RefreshCw size={15} /> Actualizar
          </Button>
        </div>
      </div>

      {/* Barra de uso total */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 rounded-2xl border border-white/10 bg-base-800 p-5"
      >
        <div className="flex items-end justify-between">
          <span className="font-mono text-sm text-white/60">Uso total</span>
          <span className="font-mono text-sm text-white">
            {fmtBytes(data.total_usado_bytes)} / {fmtBytes(data.limite_bytes)}
          </span>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className={`h-full rounded-full ${tonoBarra}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="mt-2 text-right font-mono text-xs text-white/50">
          {pct.toFixed(1)}% usado
        </div>
        {pct > 90 && (
          <p className="mt-2 font-mono text-xs text-alert">
            Espacio casi lleno. Elimina sesiones para liberar disco.
          </p>
        )}
      </motion.div>

      {/* Desglose por origen */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Tarjeta
          icon={Image}
          titulo="Recortes (disco)"
          valor={fmtBytes(data.disco.recortes_bytes)}
        />
        <Tarjeta icon={Layers} titulo="Pesos de modelos" valor={fmtBytes(data.disco.pesos_bytes)} />
        <Tarjeta icon={Database} titulo="Base de datos" valor={fmtBytes(data.base_datos.total_bytes)} />
      </div>

      {/* Recortes por sesión */}
      <div className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Image size={16} className="text-signal" /> Imágenes por sesión
        </h2>
        {data.disco.por_sesion.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/40">
            No hay recortes guardados en disco.
          </p>
        ) : (
          <div className="space-y-2">
            {data.disco.por_sesion.map((s) => (
              <div
                key={s.sesion_id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-base-800 p-3"
              >
                <Badge tone="neutral">sesión {s.sesion_id}</Badge>
                <span className="font-mono text-xs text-white/50">{s.archivos} imágenes</span>
                <span className="ml-auto font-mono text-sm text-white">{fmtBytes(s.bytes)}</span>
                <button
                  onClick={() => borrarSesion(s.sesion_id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-alert/15 hover:text-alert"
                  title="Eliminar sesión y sus imágenes"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tablas de la base de datos */}
      <div className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Database size={16} className="text-signal" /> Tablas de la base de datos
        </h2>
        <div className="space-y-2">
          {data.base_datos.tablas.map((t) => (
            <div
              key={t.tabla}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-base-800 p-3"
            >
              <span className="font-mono text-sm text-white">{t.tabla}</span>
              <span className="font-mono text-xs text-white/45">~{t.filas} filas</span>
              <span className="ml-auto font-mono text-sm text-white/80">{fmtBytes(t.bytes)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Tarjeta({ icon: Icon, titulo, valor }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-base-800 p-4">
      <div className="flex items-center gap-2 text-white/50">
        <Icon size={15} />
        <span className="font-mono text-xs uppercase tracking-wider">{titulo}</span>
      </div>
      <p className="mt-2 text-xl font-bold text-white">{valor}</p>
    </div>
  );
}
