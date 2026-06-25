import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, MapPin, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Eyebrow, Badge } from './ui';

export default function ReviewPanel({ detecciones, onRevisar, onCerrar, onIrA, modelo }) {
  const [indice, setIndice] = useState(0);
  const det = detecciones[indice];
  const total = detecciones.length;

  const pendientes = detecciones.filter((d) => d.revision === 'pendiente').length;
  const confirmadas = detecciones.filter((d) => d.revision === 'confirmado').length;

  const avanzar = () => setIndice((i) => Math.min(i + 1, total - 1));
  const retroceder = () => setIndice((i) => Math.max(i - 1, 0));

  const decidir = (estado) => {
    onRevisar(indice, estado);
    // avanzar automáticamente a la siguiente pendiente
    setTimeout(() => {
      const siguiente = detecciones.findIndex(
        (d, idx) => idx > indice && d.revision === 'pendiente'
      );
      if (siguiente !== -1) setIndice(siguiente);
      else avanzar();
    }, 150);
  };

  const verEnMapa = () => onIrA(det);

  return (
    <motion.div
      initial={{ x: 420, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 420, opacity: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 220 }}
      className="absolute right-4 top-4 bottom-32 z-[700] flex w-[380px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-white/10 bg-base-900 shadow-2xl"
    >
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div>
          <Eyebrow>revisión humana</Eyebrow>
          <p className="mt-0.5 text-sm font-semibold text-white">
            ¿Es {modelo?.clases ? Object.values(modelo.clases)[0] || 'el objeto' : 'el objeto'}?
          </p>
        </div>
        <button
          onClick={onCerrar}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-white/5 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      {/* Progreso */}
      <div className="flex items-center gap-2 px-4 pt-3 text-xs">
        <Badge tone="signal">{confirmadas} sí</Badge>
        <Badge tone="amber">{pendientes} sin revisar</Badge>
        <span className="ml-auto font-mono text-white/40">
          {indice + 1} / {total}
        </span>
      </div>

      {/* Tarjeta de detección */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={indice}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            {/* Recorte */}
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black">
              {det.recorte_url ? (
                <img
                  src={det.recorte_url}
                  alt={`Detección ${indice + 1}`}
                  className="h-48 w-full object-contain bg-black"
                />
              ) : (
                <div className="flex h-48 items-center justify-center text-white/30">
                  sin recorte
                </div>
              )}
              <div className="absolute left-2 top-2">
                <Badge
                  tone={
                    det.revision === 'confirmado'
                      ? 'signal'
                      : det.revision === 'descartado'
                        ? 'alert'
                        : 'amber'
                  }
                >
                  {det.revision}
                </Badge>
              </div>
            </div>

            {/* Datos */}
            <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-base-800 p-3 font-mono text-xs">
              <Linea k="clase" v={det.clase} />
              <Linea k="confianza" v={`${(det.confianza * 100).toFixed(1)}%`} />
              <Linea k="lat" v={det.lat} />
              <Linea k="lng" v={det.lng} />
            </div>

            <button
              onClick={verEnMapa}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-xs text-signal hover:bg-signal/10"
            >
              <MapPin size={14} /> Centrar en el mapa
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Decisión sí/no */}
      <div className="border-t border-white/10 p-4">
        {pendientes === 0 ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-signal/10 py-3 text-sm font-medium text-signal">
            <CheckCircle2 size={16} /> Revisión completa
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => decidir('descartado')}
              className="flex items-center justify-center gap-2 rounded-xl border border-alert/30 bg-alert/10 py-3 text-sm font-semibold text-alert transition-all hover:bg-alert/20 active:scale-95"
            >
              <X size={18} /> No
            </button>
            <button
              onClick={() => decidir('confirmado')}
              className="flex items-center justify-center gap-2 rounded-xl bg-signal py-3 text-sm font-semibold text-base-900 transition-all hover:brightness-110 hover:shadow-glow active:scale-95"
            >
              <Check size={18} /> Sí
            </button>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={retroceder}
            disabled={indice === 0}
            className="flex items-center gap-1 text-xs text-white/40 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft size={14} /> anterior
          </button>
          <button
            onClick={avanzar}
            disabled={indice === total - 1}
            className="flex items-center gap-1 text-xs text-white/40 hover:text-white disabled:opacity-30"
          >
            siguiente <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Linea({ k, v }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-white/40">{k}</span>
      <span className="text-white/90">{v}</span>
    </div>
  );
}
