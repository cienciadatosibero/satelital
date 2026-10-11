import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Orbit, Satellite, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './landing.css';

const stars = Array.from({ length: 95 }, (_, index) => ({
  id: index,
  top: `${(index * 47.41 + 8) % 100}%`,
  left: `${(index * 73.67 + 12) % 100}%`,
  size: 1 + (index % 4 === 0 ? 1.7 : index % 9 === 0 ? 1 : 0),
  delay: `${(index % 13) * -0.73}s`,
  duration: `${2.8 + (index % 7) * 0.65}s`,
}));

function OrbitalSatellite({ satelliteRef, secondary = false }) {
  return (
    <div
      ref={satelliteRef}
      className={`landing-satellite ${secondary ? 'landing-satellite--two' : ''}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 112 70" role="presentation" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={secondary ? 'panelSecond' : 'panelFirst'} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#22c5ee" />
            <stop offset="0.6" stopColor="#075b90" />
            <stop offset="1" stopColor="#061b3d" />
          </linearGradient>
          <linearGradient id={secondary ? 'goldSecond' : 'goldFirst'} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff7c4" />
            <stop offset="0.45" stopColor="#d7ae54" />
            <stop offset="1" stopColor="#88682c" />
          </linearGradient>
        </defs>
        <path d="M42 34H27M84 34H70" stroke="#b9dae4" strokeWidth="3" />
        {[5, 70].map((x) => (
          <g key={x}>
            <rect x={x} y="15" width="36" height="38" rx="2" fill={`url(#${secondary ? 'panelSecond' : 'panelFirst'})`} stroke="#81e8ff" strokeWidth="1.8" />
            <path d={`M${x + 12} 15v38M${x + 24} 15v38M${x} 27.5h36M${x} 40.5h36`} stroke="#8ef4ff" strokeOpacity="0.58" strokeWidth="1" />
          </g>
        ))}
        <rect x="43" y="25" width="25" height="20" rx="4" fill={`url(#${secondary ? 'goldSecond' : 'goldFirst'})`} stroke="#ffe5a0" strokeWidth="1.4" />
        <path d="M55.5 25V13" stroke="#ded5a9" strokeWidth="2" />
        <circle cx="55.5" cy="11" r="4" fill="#e8faff" />
        <path d="M48 45l-5 8h27l-5-8" fill="#c2a35e" stroke="#f0e1ac" strokeWidth="1" />
        <path d="M74 24l8-7" stroke="#c4e6f0" strokeWidth="1.2" />
        <circle cx="83" cy="16" r="3" fill="#34e0a1" />
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
    if (!scene) return undefined;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) return undefined;

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
      const place = (element, angle, rxFactor, ryFactor, tilt, scaleBase) => {
        if (!element) return;
        const radiusX = width * rxFactor;
        const radiusY = height * ryFactor;
        const x = Math.cos(angle) * radiusX;
        const y = Math.sin(angle) * radiusY;
        const inFront = Math.sin(angle) > 0;
        const scale = scaleBase * (inFront ? 1.16 : 0.82);
        element.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 0) rotate(${tilt + Math.sin(angle) * 18}deg) scale(${scale})`;
        element.style.zIndex = inFront ? '8' : '2';
        element.style.opacity = inFront ? '1' : '.72';
      };
      place(firstRef.current, -0.5 + t * 0.29, 0.43, 0.235, -20, 1);
      place(secondRef.current, 2.35 - t * 0.21, 0.35, 0.295, 38, 0.75);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frameId); observer?.disconnect(); };
  }, []);

  return (
    <div ref={sceneRef} className="landing-orbital-scene" aria-label="La Tierra con dos satélites artificiales orbitando">
      <div className="landing-scene-aura" />
      <div className="landing-orbit-line landing-orbit-line--one" />
      <div className="landing-orbit-line landing-orbit-line--two" />
      <div className="landing-earth-halo" />
      <div className="landing-earth" aria-hidden="true">
        <img src="/earth-globe.webp" alt="" draggable="false" />
        <div className="landing-earth-light" />
      </div>
      <OrbitalSatellite satelliteRef={firstRef} />
      <OrbitalSatellite satelliteRef={secondRef} secondary />
      <div className="landing-orbital-hud landing-orbital-hud--top" aria-hidden="true">
        <span className="landing-hud-pulse" /> SISTEMA ORBITAL ACTIVO
      </div>
      <div className="landing-orbital-hud landing-orbital-hud--bottom" aria-hidden="true">
        <span>OBSERVACIÓN TERRESTRE</span>
        <span className="landing-hud-signal">◉</span>
      </div>
    </div>
  );
}

export default function Landing() {
  const { usuario } = useAuth();
  const rootRef = useRef(null);
  const cta = usuario ? '/scan' : '/login';
  const ctaText = usuario ? 'Ir al escáner' : 'Iniciar sesión';

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let frameId = null;
    const onMove = (event) => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const mx = (event.clientX / window.innerWidth - 0.5) * 2;
        const my = (event.clientY / window.innerHeight - 0.5) * 2;
        root.style.setProperty('--scene-x', `${(-mx * 12).toFixed(1)}px`);
        root.style.setProperty('--scene-y', `${(-my * 10).toFixed(1)}px`);
        root.style.setProperty('--earth-x', `${(mx * 7).toFixed(1)}px`);
        root.style.setProperty('--earth-y', `${(my * 6).toFixed(1)}px`);
        frameId = null;
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => { window.removeEventListener('pointermove', onMove); if (frameId !== null) cancelAnimationFrame(frameId); };
  }, []);

  return (
    <div ref={rootRef} className="orbital-home">
      <div className="landing-stars" aria-hidden="true">
        {stars.map((star) => <i key={star.id} style={{ top: star.top, left: star.left, width: star.size, height: star.size, animationDelay: star.delay, animationDuration: star.duration }} />)}
      </div>
      <div className="landing-space-nebula" aria-hidden="true" />

      <header className="landing-navbar">
        <Link to="/" className="landing-brand" aria-label="SatDataset, inicio">
          <span className="landing-brand-icon"><Satellite size={22} strokeWidth={1.7} /></span>
          <span><strong>SatDataset</strong><small>VISIÓN ORBITAL</small></span>
        </Link>
        <Link to={cta} className="landing-header-login">{ctaText}<ArrowRight size={17} /></Link>
      </header>

      <main className="landing-hero">
        <div className="landing-copy">
          <div className="landing-eyebrow"><span className="landing-status-dot" /> INTELIGENCIA GEOESPACIAL</div>
          <h1>Explora la Tierra.<span>Detecta el futuro.</span></h1>
          <p>Detección de paneles solares mediante imágenes satelitales e inteligencia artificial.</p>
          <Link to={cta} className="landing-hero-login">{ctaText}<ArrowRight size={20} /></Link>
          <div className="landing-copy-foot"><Orbit size={15} /> OBSERVA · ANALIZA · DESCUBRE</div>
        </div>
        <EarthScene />
      </main>

      <footer className="landing-footer">
        <span><Sparkles size={14} /> SATDATASET / GEO AI</span>
        <span>OBSERVANDO EL PLANETA DESDE OTRA PERSPECTIVA</span>
      </footer>
    </div>
  );
}
