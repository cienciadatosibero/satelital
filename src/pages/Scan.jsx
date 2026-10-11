import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
  Marker,
  Popup,
  Rectangle,
} from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine,
  Save,
  AlertCircle,
  Layers as LayersIcon,
  Square,
  Grid3x3,
  Clock,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

import api, { API_BASE } from '../lib/api';
import { Eyebrow, Button, Badge, Spinner } from '../components/ui';
import ReviewPanel from '../components/ReviewPanel';

// Umbral inicial equilibrado. Ajustable para priorizar cobertura o precisión.
const CONF_INICIAL = 0.20;

const iconoColor = (estado) => {
  const color =
    estado === 'confirmado' ? '#34e0a1' : estado === 'descartado' ? '#ff5d5d' : '#f5b13d';
  return L.divIcon({
    className: 'sat-marker',
    html: `<span style="display:block;width:14px;height:14px;border-radius:50%;background:${color};box-shadow:0 0 0 4px ${color}33;border:2px solid #070a0f"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

function MapaRef({ onReady }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

// Captura clics para dibujar el rectángulo: 1er clic = esquina A, 2do = esquina B
function DibujarArea({ activo, onPrimera, onSegunda, onPreview, primera }) {
  useMapEvents({
    click(e) {
      if (!activo) return;
      if (!primera) onPrimera(e.latlng);
      else onSegunda(e.latlng);
    },
    mousemove(e) {
      if (activo && primera) onPreview(e.latlng);
    },
  });
  return null;
}

// Convierte dos esquinas {lat,lng} en bounds N/S/E/W
function aBounds(a, b) {
  if (!a || !b) return null;
  return {
    north: Math.max(a.lat, b.lat),
    south: Math.min(a.lat, b.lat),
    east: Math.max(a.lng, b.lng),
    west: Math.min(a.lng, b.lng),
  };
}

export default function Scan() {
  const [modeloActivo, setModeloActivo] = useState(null);
  const [confianza, setConfianza] = useState(CONF_INICIAL);

  // Definición del área
  const [modoDibujo, setModoDibujo] = useState(false);
  const [esquinaA, setEsquinaA] = useState(null);
  const [esquinaB, setEsquinaB] = useState(null);
  const [preview, setPreview] = useState(null);

  // Inputs manuales de las 4 coordenadas
  const [norte, setNorte] = useState('17.5530000');
  const [sur, setSur] = useState('17.5500000');
  const [este, setEste] = useState('-99.4980000');
  const [oeste, setOeste] = useState('-99.5020000');

  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);
  const [detecciones, setDetecciones] = useState([]);
  const [sesionId, setSesionId] = useState(null);
  const [revisando, setRevisando] = useState(false);
  const [metricas, setMetricas] = useState(null);
  const [progreso, setProgreso] = useState(null); // {celda,total_celdas,detecciones_acumuladas}

  const mapaRef = useRef(null);

  useEffect(() => {
    api
      .get('/modelos/activo')
      .then(({ data }) => setModeloActivo(data.data))
      .catch(() => {});
  }, []);

  // Sincroniza: cuando se dibujan ambas esquinas, rellena los inputs
  useEffect(() => {
    const b = aBounds(esquinaA, esquinaB);
    if (b) {
      setNorte(b.north.toFixed(7));
      setSur(b.south.toFixed(7));
      setEste(b.east.toFixed(7));
      setOeste(b.west.toFixed(7));
    }
  }, [esquinaA, esquinaB]);

  // Bounds efectivos (lo que se enviará): inputs manuales mandan
  const boundsActivos = {
    north: parseFloat(norte),
    south: parseFloat(sur),
    east: parseFloat(este),
    west: parseFloat(oeste),
  };
  const boundsValidos =
    Object.values(boundsActivos).every((v) => Number.isFinite(v)) &&
    Math.abs(boundsActivos.north) <= 85.05112878 &&
    Math.abs(boundsActivos.south) <= 85.05112878 &&
    Math.abs(boundsActivos.east) <= 180 &&
    Math.abs(boundsActivos.west) <= 180 &&
    boundsActivos.north > boundsActivos.south &&
    boundsActivos.east > boundsActivos.west;

  // Rectángulo a dibujar en el mapa (preview mientras dibuja, o el confirmado)
  const rectVisible = (() => {
    const b = esquinaA && (esquinaB || preview) ? aBounds(esquinaA, esquinaB || preview) : null;
    if (b) return b;
    return boundsValidos ? boundsActivos : null;
  })();

  const iniciarDibujo = () => {
    setModoDibujo(true);
    setEsquinaA(null);
    setEsquinaB(null);
    setPreview(null);
  };

  const escanearArea = useCallback(async () => {
    if (!boundsValidos) {
      setError('Define un área válida (dibuja un rectángulo o escribe las 4 coordenadas).');
      return;
    }
    setProcesando(true);
    setError(null);
    setDetecciones([]);
    setSesionId(null);
    setMetricas(null);
    setProgreso({ celda: 0, total_celdas: 0, detecciones_acumuladas: 0, fase: 'detectando' });

    try {
      const token = localStorage.getItem('sat_token');
      const resp = await fetch(`${API_BASE}/detectar-area`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bounds: boundsActivos,
          lado_px: 640,
          confianza,
          guardar: true,
          nombre_sesion: `Área ${new Date().toLocaleString('es-MX')}`,
        }),
      });

      if (!resp.ok || !resp.body) {
        const j = await resp.json().catch(() => ({}));
        throw new Error(j.message || 'No se pudo iniciar el escaneo');
      }

      // Lee el stream SSE manualmente
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let resultadoFinal = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Cada evento SSE termina en doble salto de línea
        const partes = buffer.split('\n\n');
        buffer = partes.pop(); // lo incompleto queda para la próxima vuelta

        for (const bloque of partes) {
          const lineas = bloque.split('\n');
          const evento = lineas.find((l) => l.startsWith('event:'))?.slice(6).trim();
          const dataLine = lineas.find((l) => l.startsWith('data:'))?.slice(5).trim();
          if (!evento || !dataLine) continue;
          const datos = JSON.parse(dataLine);

          if (evento === 'inicio') {
            setProgreso({ celda: 0, total_celdas: datos.total_celdas, detecciones_acumuladas: 0, fase: 'detectando' });
          } else if (evento === 'progreso') {
            setProgreso({
              celda: datos.celda,
              total_celdas: datos.total_celdas,
              detecciones_acumuladas: datos.detecciones_acumuladas,
              fase: 'detectando',
            });
          } else if (evento === 'verificacion') {
            setProgreso(datos);
          } else if (evento === 'fin') {
            resultadoFinal = datos;
          } else if (evento === 'error') {
            throw new Error(datos.message);
          }
        }
      }

      if (!resultadoFinal) {
        throw new Error('La conexión terminó antes de recibir el resultado. Revisa el API y el proxy.');
      }
      if (resultadoFinal) {
        const dets = resultadoFinal.detecciones.map((d) => ({ ...d, revision: 'pendiente' }));
        setDetecciones(dets);
        setSesionId(resultadoFinal.sesion_id);
        setMetricas({ ...resultadoFinal.cuadricula, ...resultadoFinal.tiempos });
        if (dets.length) setRevisando(true);
      }
    } catch (err) {
      setError(err.message || 'No se pudo completar el escaneo del área.');
    } finally {
      setProcesando(false);
      setProgreso(null);
    }
  }, [boundsActivos, boundsValidos, confianza]);

  const revisar = async (index, estado) => {
    setDetecciones((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], revision: estado };
      return copia;
    });
    const det = detecciones[index];
    if (det?.id) {
      try {
        await api.patch(`/detecciones/${det.id}`, { revision: estado });
      } catch (e) {
        setDetecciones((prev) => prev.map((fila) =>
          fila.id === det.id ? { ...fila, revision: det.revision } : fila
        ));
        setError(e.response?.data?.message || 'No se guardó la revisión. Vuelve a intentarlo.');
      }
    }
  };

  const confirmadas = detecciones.filter((d) => d.revision === 'confirmado').length;

  const descargar = async () => {
    if (!sesionId) return;
    try {
      const token = localStorage.getItem('sat_token');
      const resp = await fetch(`${API_BASE}/sesiones/${sesionId}/exportar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}));
        throw new Error(j.message || 'Error al exportar');
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dataset_${sesionId}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  const fmtSeg = (ms) => (ms == null ? '—' : (ms / 1000).toFixed(1) + ' s');

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* MAPA */}
      <div className={`absolute inset-0 z-0 ${modoDibujo ? 'cursor-crosshair' : ''}`}>
        <MapContainer
          center={[17.5515, -99.5]}
          zoom={17}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          preferCanvas
        >
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            attribution="&copy; Google"
            maxZoom={21}
            crossOrigin="anonymous"
          />
          <MapaRef onReady={(m) => (mapaRef.current = m)} />

          <DibujarArea
            activo={modoDibujo}
            primera={esquinaA}
            onPrimera={(ll) => setEsquinaA(ll)}
            onSegunda={(ll) => {
              setEsquinaB(ll);
              setModoDibujo(false);
              setPreview(null);
            }}
            onPreview={(ll) => setPreview(ll)}
          />

          {rectVisible && (
            <Rectangle
              bounds={[
                [rectVisible.south, rectVisible.west],
                [rectVisible.north, rectVisible.east],
              ]}
              pathOptions={{ color: '#34e0a1', weight: 2, fillOpacity: 0.08 }}
            />
          )}

          {detecciones.map((d, i) =>
            d.revision !== 'descartado' ? (
              <Marker key={i} position={[d.lat, d.lng]} icon={iconoColor(d.revision)}>
                <Popup>
                  <div className="font-mono text-xs">
                    <strong>{d.clase}</strong>
                    <br />
                    conf: {(d.confianza * 100).toFixed(1)}%
                    <br />
                    {d.lat}, {d.lng}
                  </div>
                </Popup>
              </Marker>
            ) : null
          )}
        </MapContainer>
      </div>

      {/* Overlay de escaneo con barra de progreso */}
      <AnimatePresence>
        {procesando && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[500] flex items-center justify-center"
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute inset-x-0 h-1 animate-scan bg-gradient-to-r from-transparent via-signal to-transparent shadow-glow" />
            </div>
            <div className="w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-base-900/95 p-5 backdrop-blur">
              <div className="flex items-center gap-2 text-signal">
                <ScanLine size={18} className="animate-pulse" />
                <span className="font-mono text-sm font-semibold">Generando dataset…</span>
              </div>

              {progreso && progreso.total_celdas > 0 ? (
                <>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-signal shadow-glow"
                      animate={{
                        width: `${(progreso.celda / progreso.total_celdas) * 100}%`,
                      }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between font-mono text-xs text-white/60">
                    <span>
                      {progreso.fase === 'verificando' ? 'panel' : 'celda'} {progreso.celda} / {progreso.total_celdas}
                    </span>
                    <span>{Math.round((progreso.celda / progreso.total_celdas) * 100)}%</span>
                  </div>
                  <div className="mt-1 font-mono text-xs text-signal">
                    {progreso.detecciones_acumuladas} {progreso.fase === 'verificando' ? 'paneles verificados' : 'candidatos encontrados'}
                  </div>
                </>
              ) : (
                <div className="mt-4 font-mono text-xs text-white/50">
                  Calculando cuadrícula y descargando imágenes…
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Estado del modelo + ayuda dibujo */}
      <div className="absolute left-4 top-4 z-[600] flex flex-col gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-base-900/85 px-3 py-2 backdrop-blur">
          <LayersIcon size={15} className={modeloActivo ? 'text-signal' : 'text-amber'} />
          <span className="font-mono text-xs text-white/70">
            {modeloActivo ? modeloActivo.nombre : 'sin modelo activo'}
          </span>
        </div>
        {modoDibujo && (
          <div className="rounded-xl border border-signal/40 bg-base-900/85 px-3 py-2 font-mono text-xs text-signal backdrop-blur">
            {esquinaA ? 'Clic en la 2ª esquina del área' : 'Clic en la 1ª esquina del área'}
          </div>
        )}
        {metricas && (
          <div className="rounded-xl border border-white/10 bg-base-900/85 px-3 py-2 font-mono text-[11px] text-white/70 backdrop-blur">
            <div className="flex items-center gap-1.5 text-white/90">
              <Grid3x3 size={12} /> {metricas.cols}×{metricas.filas} = {metricas.total_celdas} celdas
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <Clock size={12} /> total {fmtSeg(metricas.total_ms)} · {fmtSeg(metricas.promedio_celda_ms)}/celda
            </div>
          </div>
        )}
      </div>

      {/* Panel de revisión */}
      <AnimatePresence>
        {revisando && detecciones.length > 0 && (
          <ReviewPanel
            detecciones={detecciones}
            onRevisar={revisar}
            onCerrar={() => setRevisando(false)}
            onIrA={(d) => mapaRef.current?.setView([d.lat, d.lng], mapaRef.current.getZoom())}
            modelo={modeloActivo}
          />
        )}
      </AnimatePresence>

      {/* Controles inferiores */}
      <div className="absolute inset-x-4 bottom-4 z-[600]">
        <div className="rounded-2xl border border-white/10 bg-base-900/90 p-4 backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <Eyebrow>escaneo por área</Eyebrow>
            <div className="flex items-center gap-2">
              <Badge tone="neutral">Confianza: {Math.round(confianza * 100)}%</Badge>
              {detecciones.length > 0 && (
                <>
                  <Badge tone="signal">{confirmadas} confirmados</Badge>
                  <Badge tone="neutral">{detecciones.length} detectados</Badge>
                  {!revisando && (
                    <button
                      onClick={() => setRevisando(true)}
                      className="font-mono text-xs text-signal hover:underline"
                    >
                      revisar →
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 4 coordenadas + tamaño de celda */}
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            {[
              ['Norte', norte, setNorte],
              ['Sur', sur, setSur],
              ['Este', este, setEste],
              ['Oeste', oeste, setOeste],
            ].map(([etq, val, set]) => (
              <label key={etq} className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">
                  {etq}
                </span>
                <input
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  className="h-11 rounded-xl border border-white/10 bg-base-800/80 px-3 font-mono text-sm text-white outline-none focus:border-signal/60"
                />
              </label>
            ))}
            <div className="flex flex-col justify-end gap-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">
                Zoom de escaneo
              </span>
              <div className="flex h-11 items-center rounded-xl border border-white/10 bg-base-800 px-3 font-mono text-sm text-signal">
                20 · máx detalle
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button variant={modoDibujo ? 'amber' : 'ghost'} onClick={iniciarDibujo} className="h-11">
              <Square size={16} /> {modoDibujo ? 'Dibujando…' : 'Dibujar área'}
            </Button>

            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-base-900/85 px-3 py-2 text-xs text-white/70" title="Confianza baja: más candidatos, incluidos falsos positivos. Confianza alta: resultados más estrictos.">
              <span>Confianza mínima</span>
              <select
                aria-label="Confianza mínima del modelo"
                className="rounded-md border border-white/20 bg-base-900 px-2 py-1.5 font-mono text-white outline-none focus:border-signal"
                value={confianza}
                disabled={procesando}
                onChange={(e) => setConfianza(Number(e.target.value))}
              >
                <option value={0.10}>10% · sensible</option>
                <option value={0.15}>15%</option>
                <option value={0.20}>20% · equilibrada</option>
                <option value={0.25}>25%</option>
                <option value={0.35}>35% · estricta</option>
                <option value={0.50}>50%</option>
              </select>
            </label>

            <Button onClick={escanearArea} disabled={procesando || !boundsValidos} className="h-11">
              {procesando ? <Spinner /> : <><ScanLine size={16} /> Escanear área</>}
            </Button>

            {sesionId && (
              <Button variant="amber" onClick={descargar} className="h-11">
                <Save size={16} /> Descargar ZIP
              </Button>
            )}

            {!boundsValidos && (
              <span className="font-mono text-xs text-amber">
                Define un área válida (N&gt;S, E&gt;O)
              </span>
            )}
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-alert/30 bg-alert/10 px-3 py-2 text-sm text-alert">
              <AlertCircle size={15} /> {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
