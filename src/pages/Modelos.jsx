import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Upload, CheckCircle2, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { Eyebrow, Button, Card, Badge, Spinner } from '../components/ui';

function enviarPesoTemporal({ url, token, archivo, onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 180000;
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) onProgress(Math.round(ev.loaded * 100 / ev.total));
    };
    xhr.onload = () => {
      let body;
      try { body = JSON.parse(xhr.responseText); } catch { body = {}; }
      if (xhr.status >= 200 && xhr.status < 300 && body.ok && body.temp_model_id) resolve(body);
      else reject(new Error(body.detail || body.message || `Error al cargar modelo (HTTP ${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('No se pudo conectar al servicio Python. Revisa Render y su configuración CORS.'));
    xhr.ontimeout = () => reject(new Error('La carga del modelo superó el tiempo de espera.'));
    const form = new FormData();
    form.append('peso', archivo);
    xhr.send(form);
  });
}

export default function Modelos() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [modelos, setModelos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState('');
  const [nombre, setNombre] = useState('');

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/modelos');
      setModelos(data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudieron consultar los modelos registrados');
    } finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const subir = async (e) => {
    e.preventDefault();
    const archivo = fileRef.current?.files?.[0];
    if (!archivo) return setError('Selecciona un archivo YOLO .pt');
    if (!archivo.name.toLowerCase().endsWith('.pt')) return setError('Solo se admiten pesos YOLO .pt');
    if (archivo.size > 200 * 1024 * 1024) return setError('El modelo supera los 200 MB');
    setSubiendo(true); setProgreso(0); setError('');
    try {
      // La API envía un permiso temporal. Los bytes del modelo NUNCA pasan por Vercel.
      const { data } = await api.post('/modelos/temporal/ticket');
      const ticket = data.data;
      const res = await enviarPesoTemporal({ url: ticket.upload_url, token: ticket.token, archivo, onProgress: setProgreso });
      sessionStorage.setItem('sat_temp_model', JSON.stringify({
        id: res.temp_model_id,
        nombre: (nombre || archivo.name).trim(),
        clases: res.classes,
        expira: Date.now() + res.expires_in * 1000,
      }));
      navigate('/scan');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'No se pudo cargar el modelo');
    } finally { setSubiendo(false); }
  };

  const activar = async (id) => {
    setError('');
    try {
      await api.post(`/modelos/${id}/activar`);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo activar el modelo registrado');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Eyebrow>administración</Eyebrow>
      <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-white">
        <Layers size={22} className="text-signal" /> Modelos YOLO
      </h1>
      <p className="mt-1 text-sm text-white/50">Carga un modelo de confianza, úsalo en un escaneo y se eliminará automáticamente. No se guarda en TiDB ni en R2.</p>

      <Card className="mt-6 p-5">
        <form onSubmit={subir} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-white/50">Nombre opcional</span>
            <input className="h-11 rounded-xl border border-white/10 bg-base-900/80 px-4 text-white outline-none focus:border-signal/60"
              value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Modelo para este escaneo" />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <input ref={fileRef} type="file" accept=".pt" disabled={subiendo}
              className="min-w-0 flex-1 text-sm text-white/70 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white" />
            <Button type="submit" disabled={subiendo}>
              {subiendo ? <Spinner label={`Cargando ${progreso}%`} /> : <><Upload size={16} /> Cargar y escanear</>}
            </Button>
          </div>
          {subiendo && <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-signal transition-all" style={{ width: `${progreso}%` }} /></div>}
          {error && <p className="rounded-xl border border-alert/30 bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>}
          <p className="text-xs text-white/45">El archivo se elimina del disco de Python al cargarlo. El modelo en memoria se libera después del primer escaneo o por caducidad. Sube solo archivos .pt confiables.</p>
        </form>
      </Card>

      <h2 className="mt-8 mb-3 text-sm font-semibold text-white/80">Modelos registrados anteriormente</h2>
      <div className="space-y-3">
        {cargando ? <Spinner label="Cargando modelos…" /> : modelos.length === 0 ?
          <p className="py-6 text-center text-sm text-white/40">No hay modelos permanentes. Puedes usar uno temporal arriba.</p> :
          modelos.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`flex items-center gap-3 rounded-2xl border p-4 ${m.activo ? 'border-signal/40 bg-signal/5' : 'border-white/10 bg-base-800/60'}`}>
              <Cpu className={m.activo ? 'text-signal' : 'text-white/45'} size={20} />
              <div className="min-w-0 flex-1"><p className="truncate font-semibold">{m.nombre} {m.activo && <Badge tone="signal">activo</Badge>}</p>
                <p className="text-xs text-white/40">{m.descripcion || 'Modelo registrado'}</p></div>
              {!m.activo && <Button variant="ghost" onClick={() => activar(m.id)}><CheckCircle2 size={15} /> Activar</Button>}
            </motion.div>
          ))}
      </div>
    </div>
  );
}
