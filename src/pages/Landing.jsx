import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine, ArrowRight, Check, ChevronDown, Cpu, Download,
  ExternalLink, Laptop, Orbit, Satellite, Settings2, ShieldCheck, Sparkles,
} from 'lucide-react';
import './landing.css';

// Publica el .exe como Asset de una GitHub Release de este repositorio.
// Si quieres alojarlo en otro repositorio, define VITE_GITHUB_RELEASES_REPO=usuario/repositorio.
const configuredRepo = import.meta.env.VITE_GITHUB_RELEASES_REPO || 'cienciadatosibero/satelital';
const releasesRepo = /^[\w.-]+\/[\w.-]+$/.test(configuredRepo)
  ? configuredRepo
  : 'cienciadatosibero/satelital';
const releasesPage = `https://github.com/${releasesRepo}/releases`;
const latestReleaseApi = `https://api.github.com/repos/${releasesRepo}/releases/latest`;

const stars = Array.from({ length: 80 }, (_, index) => ({
  id: index,
  top: `${(index * 47.41 + 8) % 100}%`,
  left: `${(index * 73.67 + 12) % 100}%`,
  size: 1 + (index % 4 === 0 ? 1.5 : 0),
  delay: `${(index % 13) * -0.73}s`,
  duration: `${2.8 + (index % 7) * 0.65}s`,
}));

function useInstallerRelease() {
  const [state, setState] = useState({ url: releasesPage, version: null, ready: false });

  useEffect(() => {
    const abort = new AbortController();
    fetch(latestReleaseApi, {
      signal: abort.signal,
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((response) => {
        if (!response.ok) throw new Error('La versión aún no está publicada');
        return response.json();
      })
      .then((release) => {
        // Descarga directa del instalador, sin suponer un nombre fijo del archivo.
        const asset = release.assets?.find((item) =>
          /(?:setup|installer|instalador|satdataset).*\.exe$/i.test(item.name))
          || release.assets?.find((item) => /\.exe$/i.test(item.name));
        if (asset?.browser_download_url) {
          setState({ url: asset.browser_download_url, version: release.tag_name || null, ready: true });
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          // Sin Release publicada (o sin acceso a GitHub API): enlace estable a Releases.
          setState({ url: releasesPage, version: null, ready: false });
        }
      });
    return () => abort.abort();
  }, []);

  return state;
}

// Dos pequeños satélites con "cara", deliberadamente verdes.
function GreenSatellite({ satelliteRef, secondary = false }) {
  const id = secondary ? 'greenB' : 'greenA';
  return (
    <div ref={satelliteRef} className={`landing-satellite ${secondary ? 'landing-satellite--two' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 112 74" role="presentation" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${id}-panels`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#81ffd2" />
            <stop offset="0.5" stopColor="#20b886" />
            <stop offset="1" stopColor="#0a4d43" />
          </linearGradient>
          <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d2ffb8" />
            <stop offset="0.55" stopColor="#54e7a1" />
            <stop offset="1" stopColor="#118b75" />
          </linearGradient>
        </defs>
        <path d="M43 36H37M75 36H69" stroke="#a8ffce" strokeWidth="3" />
        {[3, 74].map((x) => (
          <g key={x}>
            <rect x={x} y="17" width="35" height="38" rx="3" fill={`url(#${id}-panels)`} stroke="#a9ffda" strokeWidth="1.8" />
            <path d={`M${x + 11.66} 17v38M${x + 23.3} 17v38M${x} 29.5h35M${x} 42.5h35`} stroke="#dafff0" strokeOpacity="0.58" strokeWidth="1" />
          </g>
        ))}
        <rect x="40" y="21" width="32" height="30" rx="9" fill={`url(#${id}-body)`} stroke="#e3ffdc" strokeWidth="1.4" />
        <path d="M56 21V11" stroke="#c9ffe0" strokeWidth="2.2" />
        <circle cx="56" cy="9" r="4.5" fill="#3af1b8" stroke="#dbfff0" strokeWidth="1" />
        <circle cx="50.2" cy="33" r="2.5" fill="#09382d" />
        <circle cx="62" cy="33" r="2.5" fill="#09382d" />
        <path d="M51 40q5.1 5 10 0" fill="none" stroke="#07513b" strokeWidth="2" strokeLinecap="round" />
        <path d="M49 51l-6 7h26l-6-7" fill="#57df9c" stroke="#9cf8c7" strokeWidth="1" />
      </svg>
    </div>
  );
}

function EarthScene() {
  const sceneRef = useRef(null);
  const firstRef = useRef(null);
  const secondRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let frameId;
    let width = scene.clientWidth;
    let height = scene.clientHeight;
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => { width = scene.clientWidth; height = scene.clientHeight; })
      : null;
    observer?.observe(scene);

    const start = performance.now();
    const animate = (now) => {
      const t = (now - start) / 1000;
      const position = (element, angle, rx, ry, tilt, baseScale) => {
        if (!element) return;
        const x = Math.cos(angle) * width * rx;
        const y = Math.sin(angle) * height * ry;
        const near = Math.sin(angle) > 0;
        element.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 0) rotate(${tilt + Math.sin(angle) * 15}deg) scale(${baseScale * (near ? 1.12 : .80)})`;
        element.style.zIndex = near ? '8' : '2';
        element.style.opacity = near ? '1' : '.68';
      };
      position(firstRef.current, -.5 + t * .29, .43, .24, -20, 1);
      position(secondRef.current, 2.35 - t * .22, .35, .30, 36, .82);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frameId); observer?.disconnect(); };
  }, []);

  return (
    <div ref={sceneRef} className="landing-orbital-scene" aria-label="Tierra vista desde el espacio, con dos satélites verdes orbitando">
      <div className="landing-scene-aura" />
      <div className="landing-orbit-line landing-orbit-line--one" />
      <div className="landing-orbit-line landing-orbit-line--two" />
      <div className="landing-earth-halo" />
      <div className="landing-earth" aria-hidden="true">
        <img src="/earth-globe.webp" alt="" draggable="false" />
        <div className="landing-earth-light" />
      </div>
      <GreenSatellite satelliteRef={firstRef} />
      <GreenSatellite satelliteRef={secondRef} secondary />
      <div className="landing-orbital-hud landing-orbital-hud--top" aria-hidden="true">
        <span className="landing-hud-pulse" /> EXPLORACIÓN GEOESPACIAL
      </div>
      <div className="landing-orbital-hud landing-orbital-hud--bottom" aria-hidden="true">
        <span>INTELIGENCIA ARTIFICIAL</span><span className="landing-hud-signal">◉</span>
      </div>
    </div>
  );
}

const manual = [
  { index: '01', title: 'Descarga', text: 'Haz clic en Descargar. Obtén el instalador .exe desde GitHub.', icon: Download },
  { index: '02', title: 'Instala', text: 'Ejecuta el .exe en Windows y sigue los pasos del asistente.', icon: Laptop },
  { index: '03', title: 'Configura', text: 'Abre SatDataset, selecciona tu modelo .pt y prepara el análisis.', icon: Settings2 },
];

export default function Landing() {
  const rootRef = useRef(null);
  const { url: downloadUrl, version, ready } = useInstallerRelease();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let frame = null;
    const onMove = (event) => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const mx = (event.clientX / window.innerWidth - .5) * 2;
        const my = (event.clientY / window.innerHeight - .5) * 2;
        root.style.setProperty('--scene-x', `${(-mx * 12).toFixed(1)}px`);
        root.style.setProperty('--scene-y', `${(-my * 9).toFixed(1)}px`);
        root.style.setProperty('--earth-x', `${(mx * 7).toFixed(1)}px`);
        root.style.setProperty('--earth-y', `${(my * 6).toFixed(1)}px`);
        frame = null;
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="orbital-home" ref={rootRef}>
      <div className="landing-stars" aria-hidden="true">
        {stars.map((star) => <i key={star.id} style={{ top: star.top, left: star.left, width: star.size, height: star.size, animationDelay: star.delay, animationDuration: star.duration }} />)}
      </div>
      <div className="landing-space-nebula" aria-hidden="true" />

      <header className="landing-navbar">
        <a href="/" className="landing-brand" aria-label="SatDataset, inicio">
          <span className="landing-brand-icon"><Satellite size={22} strokeWidth={1.7} /></span>
          <span><strong>SatDataset</strong><small>VISIÓN ORBITAL</small></span>
        </a>
        <div className="landing-header-actions">
          <span className="landing-windows-pill"><Laptop size={15} /> Windows 10 / 11</span>
          <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="landing-header-login">
            <Download size={16} /> Descargar
          </a>
        </div>
      </header>

      <main className="landing-hero">
        <div className="landing-copy">
          <div className="landing-eyebrow"><span className="landing-status-dot" /> SATDATASET PARA WINDOWS</div>
          <h1>Detección mediante imágenes satelitales e <span>inteligencia artificial.</span></h1>
          <p>Explora, analiza y genera tus propios resultados con modelos de inteligencia artificial, directamente en tu computadora.</p>
          <div className="landing-buttons">
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="landing-hero-login">
              <ArrowDownToLine size={21} /> Descargar para Windows <ArrowRight size={18} />
            </a>
            <a href="#manual" className="landing-manual-link">Cómo instalar <ChevronDown size={16} /></a>
          </div>
          <div className="landing-release-note">
            <ShieldCheck size={15} /> {ready ? `Versión ${version || 'disponible'} · instalador oficial` : 'El instalador aparecerá al publicarlo en GitHub Releases'}
          </div>
        </div>
        <EarthScene />
      </main>

      <section className="landing-install-section" id="manual" aria-labelledby="manual-title">
        <div className="landing-install-heading">
          <span><Sparkles size={15} /> GUÍA DE INSTALACIÓN</span>
          <strong id="manual-title">Tres pasos para comenzar</strong>
        </div>
        <div className="landing-install-steps">
          {manual.map(({ index, title, text, icon: Icon }) => (
            <article className="landing-install-card" key={index}>
              <div className="landing-install-icon"><Icon size={19} /></div>
              <div className="landing-install-info"><span>{index} / {title}</span><p>{text}</p></div>
              <Check className="landing-install-check" size={15} />
            </article>
          ))}
        </div>
        <a href={releasesPage} target="_blank" rel="noopener noreferrer" className="landing-github-link">
          Ver todas las versiones en GitHub <ExternalLink size={14} />
        </a>
      </section>

      <footer className="landing-footer">
        <span><Orbit size={14} /> SATDATASET / GEO AI</span>
        <span><Cpu size={14} /> PROCESAMIENTO LOCAL EN WINDOWS</span>
      </footer>
    </div>
  );
}
