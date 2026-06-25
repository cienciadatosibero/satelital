import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderArchive,
  Download,
  Trash2,
  MapPin,
  Eye,
  X,
  Check,
  CheckCircle2,
} from 'lucide-react';
import api from '../lib/api';
import { Eyebrow, Badge, Spinner, Button } from '../components/ui';

export default function Sesiones() {
  const [sesiones, setSesiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalSesion, setModalSesion] = useState(null); // sesión abierta en el modal

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/sesiones');
      setSesiones(data.data);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const descargar = async (id) => {
    const token = localStorage.getItem('sat_token');
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const resp = await fetch(`${base}/sesiones/${id}/exportar`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) {
      const j = await resp.json().catch(() => ({}));
      alert(j.message || 'No hay detecciones confirmadas para exportar');
      return;
    }
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dataset_${id}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta sesión y sus detecciones?')) return;
    await api.delete(`/sesiones/${id}`);
    await cargar();
  };

  const tonoEstado = (e) =>
    e === 'exportada' ? 'signal' : e === 'revisada' ? 'amber' : 'neutral';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Eyebrow>histórico</Eyebrow>
      <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-white">
        <FolderArchive size={22} className="text-signal" /> Sesiones de escaneo
      </h1>
      <p className="mt-1 text-sm text-white/45">
        Cada escaneo guardado queda aquí. Ábrelo para revisar las imágenes y descarga el dataset.
      </p>

      <div className="mt-6 space-y-3">
        {cargando ? (
          <Spinner label="Cargando sesiones…" />
        ) : sesiones.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/40">
            Todavía no has guardado ningún escaneo.
          </p>
        ) : (
          sesiones.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-base-800 p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/50">
                <MapPin size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">{s.nombre}</p>
                <p className="font-mono text-xs text-white/45">
                  {Number(s.bounds_north).toFixed(4)}, {Number(s.bounds_west).toFixed(4)} · zoom{' '}
                  {s.zoom}
                </p>
              </div>
              <Badge tone="neutral">{s.total_detecciones} det.</Badge>
              <Badge tone={tonoEstado(s.estado)}>{s.estado}</Badge>
              <Button variant="ghost" onClick={() => setModalSesion(s)} className="h-9 px-3">
                <Eye size={15} /> Ver
              </Button>
              <Button variant="ghost" onClick={() => descargar(s.id)} className="h-9 px-3">
                <Download size={15} /> ZIP
              </Button>
              <button
                onClick={() => eliminar(s.id)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/40 hover:bg-alert/15 hover:text-alert"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {modalSesion && (
          <ModalRevision
            sesion={modalSesion}
            onCerrar={() => {
              setModalSesion(null);
              cargar(); // refresca conteos al cerrar
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal: galería de imágenes de una sesión con coordenadas y etiquetas.
// Permite confirmar / descartar (quitar) cada detección.
// ---------------------------------------------------------------------------
function ModalRevision({ sesion, onCerrar }) {
  const [cargando, setCargando] = useState(true);
  const [dets, setDets] = useState([]);
  const [filtro, setFiltro] = useState('todas'); // todas | pendiente | confirmado | descartado

  useEffect(() => {
    let vivo = true;
    api
      .get(`/sesiones/${sesion.id}/detecciones`)
      .then(({ data }) => {
        if (vivo) setDets(data.data.detecciones || []);
      })
      .finally(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, [sesion.id]);

  const cambiar = async (id, revision) => {
    setDets((prev) => prev.map((d) => (d.id === id ? { ...d, revision } : d)));
    try {
      await api.patch(`/detecciones/${id}`, { revision });
    } catch {
      /* el cambio local ya ocurrió */
    }
  };

  const visibles = dets.filter((d) => filtro === 'todas' || d.revision === filtro);
  const cuenta = (r) => dets.filter((d) => d.revision === r).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[800] flex items-center justify-center bg-black/70 p-4"
      onClick={onCerrar}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-base-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div>
            <Eyebrow>revisión de sesión</Eyebrow>
            <p className="mt-0.5 truncate text-sm font-semibold text-white">{sesion.nombre}</p>
          </div>
          <button
            onClick={onCerrar}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/40 hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-3">
          {[
            ['todas', `Todas (${dets.length})`],
            ['pendiente', `Sin revisar (${cuenta('pendiente')})`],
            ['confirmado', `Confirmadas (${cuenta('confirmado')})`],
            ['descartado', `Quitadas (${cuenta('descartado')})`],
          ].map(([val, etq]) => (
            <button
              key={val}
              onClick={() => setFiltro(val)}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${
                filtro === val
                  ? 'bg-signal text-base-900'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {etq}
            </button>
          ))}
        </div>

        {/* Galería */}
        <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
          {cargando ? (
            <Spinner label="Cargando imágenes…" />
          ) : visibles.length === 0 ? (
            <p className="py-12 text-center text-sm text-white/40">No hay imágenes en este filtro.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {visibles.map((d) => (
                <div
                  key={d.id}
                  className={`overflow-hidden rounded-xl border bg-base-800 ${
                    d.revision === 'confirmado'
                      ? 'border-signal/50'
                      : d.revision === 'descartado'
                        ? 'border-alert/40 opacity-60'
                        : 'border-white/10'
                  }`}
                >
                  <div className="aspect-square bg-black">
                    {d.recorte_url ? (
                      <img
                        src={d.recorte_url}
                        alt={d.clase}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-white/30">
                        sin recorte
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 p-2 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{d.clase}</span>
                      <span className="text-white/50">{(d.confianza * 100).toFixed(0)}%</span>
                    </div>
                    <div className="text-white/45">
                      {Number(d.lat).toFixed(5)}, {Number(d.lng).toFixed(5)}
                    </div>
                    <div className="mt-1 flex gap-1.5">
                      <button
                        onClick={() => cambiar(d.id, 'confirmado')}
                        title="Sí es panel"
                        className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-[11px] ${
                          d.revision === 'confirmado'
                            ? 'bg-signal text-base-900'
                            : 'bg-white/5 text-signal hover:bg-signal/15'
                        }`}
                      >
                        <Check size={12} /> Sí
                      </button>
                      <button
                        onClick={() => cambiar(d.id, 'descartado')}
                        title="No es panel — quitar"
                        className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-[11px] ${
                          d.revision === 'descartado'
                            ? 'bg-alert text-white'
                            : 'bg-white/5 text-alert hover:bg-alert/15'
                        }`}
                      >
                        <X size={12} /> Quitar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="flex items-center justify-between border-t border-white/10 p-4">
          <span className="flex items-center gap-1.5 font-mono text-xs text-signal">
            <CheckCircle2 size={14} /> {cuenta('confirmado')} confirmadas · el ZIP incluye todos los cuadrantes + labels
          </span>
          <Button onClick={onCerrar} className="h-9">
            Listo
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
