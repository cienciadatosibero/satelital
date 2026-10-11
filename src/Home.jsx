import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import html2canvas from 'html2canvas';
import 'leaflet/dist/leaflet.css';
import { API_BASE } from './lib/api';

// 1. Componente que mueve el mapa cuando escribes las coordenadas manualmente
function RecentrarMapa({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!isNaN(latNum) && !isNaN(lngNum)) {
      map.setView([latNum, lngNum], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
}

// 2. Componente que actualiza los inputs cuando haces clic en cualquier parte del mapa
function CapturarClicsMapa({ setLatitud, setLongitud }) {
  useMapEvents({
    click(e) {
      setLatitud(e.latlng.lat.toFixed(7));
      setLongitud(e.latlng.lng.toFixed(7));
    },
  });
  return null;
}

function Home() {
  // Coordenadas iniciales (Chilpancingo, Gro.)
  const [latitud, setLatitud] = useState('17.5515000');
  const [longitud, setLongitud] = useState('-99.5000000');
  
  // Referencia para tomarle la "foto" al mapa
  const mapaRef = useRef(null);

  // Estados de la IA Visual
  const [capturaProcesando, setCapturaProcesando] = useState(false);
  const [imagenOriginal, setImagenOriginal] = useState(null);
  const [imagenAnalizada, setImagenAnalizada] = useState(null);
  const [errorIA, setErrorIA] = useState(null);

  // Función principal: Captura, Envía y Recibe
  const capturarYAnalizarPantalla = async () => {
    if (!mapaRef.current) return;
    
    setCapturaProcesando(true);
    setErrorIA(null);
    setImagenAnalizada(null);

    try {
      // 1. Capturar los píxeles del div que contiene el mapa
      const canvas = await html2canvas(mapaRef.current, {
        useCORS: true, // Vital para leer imágenes de servidores externos como Google
        allowTaint: false,
        backgroundColor: '#0f172a' // Color de fondo por si acaso
      });
      
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      setImagenOriginal(base64Image); // Mostrar preview de lo enviado

      // 2. Enviar la imagen a Node.js
      const respuesta = await fetch(`${API_BASE}/yolo/analizar-imagen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imagen_base64: base64Image,
          confianza: 0.25
        })
      });
      
      const data = await respuesta.json();
      
      if (!respuesta.ok || data.ok === false) {
        throw new Error(data.error || 'Error procesando la imagen en el servidor');
      }

      // 3. Recibir y mostrar la imagen procesada por YOLO
      setImagenAnalizada(data.imagen_resultado_base64);
      
    } catch (error) {
      console.error("Error al capturar/analizar:", error);
      setErrorIA(error.message);
    } finally {
      setCapturaProcesando(false);
    }
  };

  return (
    <section className="relative w-full h-[calc(100vh-108px)] bg-slate-950 overflow-hidden flex">
      
      {/* CAPA 1: EL MAPA (Con la URL de Google Maps) */}
      <div ref={mapaRef} className="absolute inset-0 z-0 cursor-crosshair">
        <MapContainer 
          center={[17.5515000, -99.5000000]} 
          zoom={17} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          preferCanvas={true} // Mejora el rendimiento para capturas
        >
          {/* CAMBIO: Servidor satelital de Google Maps (mt1.google.com) */}
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            attribution='&copy; Google Maps'
            maxZoom={21} // Permite mucho más zoom que Esri
            crossOrigin="anonymous" // Crítico para html2canvas
          />
          
          <RecentrarMapa lat={latitud} lng={longitud} />
          <CapturarClicsMapa setLatitud={setLatitud} setLongitud={setLongitud} />
        </MapContainer>
      </div>

      {/* CAPA 2: PANEL DERECHO (Resultados Visuales) */}
      <div className="absolute right-4 top-4 w-[400px] flex flex-col gap-3 z-[1000] bottom-32 pointer-events-none">
        <div className="rounded-3xl bg-slate-950/90 border border-white/10 shadow-2xl shadow-black/40 p-5 backdrop-blur flex flex-col h-full pointer-events-auto overflow-hidden">
          
          <div className="flex items-center gap-3 mb-4 shrink-0">
            <div className={`w-3 h-3 rounded-full ${capturaProcesando ? 'bg-yellow-400 animate-pulse' : errorIA ? 'bg-red-500' : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'}`} />
            <h3 className="text-white font-black text-sm uppercase tracking-wider">
              VISIÓN ARTIFICIAL
            </h3>
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            
            {errorIA && (
               <p className="text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-xs font-semibold">
                 {errorIA}
               </p>
            )}

            {!imagenOriginal && !capturaProcesando && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center">
                <span className="text-4xl mb-2">📸</span>
                <p className="text-xs font-bold">Encuadra los techos en el mapa y haz clic en "Analizar Pantalla"</p>
              </div>
            )}

            {imagenOriginal && (
              <div className="flex flex-col gap-2">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">1. Imagen capturada</span>
                <img src={imagenOriginal} alt="Captura original" className="w-full rounded-xl border border-white/10 opacity-70" />
              </div>
            )}

            {capturaProcesando && (
              <div className="flex items-center justify-center py-8">
                <p className="text-sky-400 text-xs font-bold animate-pulse">Analizando píxeles con PyTorch...</p>
              </div>
            )}

            {imagenAnalizada && !capturaProcesando && (
              <div className="flex flex-col gap-2 mt-2 border-t border-white/10 pt-4">
                <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">2. Resultado YOLO (Paneles)</span>
                <img src={imagenAnalizada} alt="Analizada por YOLO" className="w-full rounded-xl border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]" />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* CAPA 3: PANEL INFERIOR (Controles) */}
      <div className="absolute left-4 right-4 bottom-4 z-[1000]">
        <div className="rounded-3xl bg-slate-950/95 border border-white/10 shadow-2xl shadow-black/40 p-4 backdrop-blur">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div className="flex flex-col gap-2">
              <label className="text-slate-400 text-xs font-black">Latitud</label>
              <input 
                value={latitud} 
                onChange={(e) => setLatitud(e.target.value)} 
                className="h-12 rounded-2xl bg-white/10 border border-white/10 px-4 text-white font-black outline-none focus:border-sky-400" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-slate-400 text-xs font-black">Longitud</label>
              <input 
                value={longitud} 
                onChange={(e) => setLongitud(e.target.value)} 
                className="h-12 rounded-2xl bg-white/10 border border-white/10 px-4 text-white font-black outline-none focus:border-sky-400" 
              />
            </div>
            
            <button 
              onClick={capturarYAnalizarPantalla} 
              disabled={capturaProcesando} 
              className={`h-12 px-8 rounded-2xl font-black transition shadow-lg ${
                capturaProcesando 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {capturaProcesando ? 'Procesando...' : '📸 Analizar Pantalla'}
            </button>
          </div>
        </div>
      </div>

    </section>
  );
}

export default Home;
