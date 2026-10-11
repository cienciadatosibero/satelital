import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MousePointer2, Orbit, Radar, Satellite, ScanSearch, Sparkles, Map, Database, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function FloatingStars() {
  const stars = useMemo(
    () => Array.from({ length: 80 }, (_, i) => ({
      id: i,
      size: ((i % 3) + 1),
      top: `${(i * 17) % 100}%`,
      left: `${(i * 29) % 100}%`,
      delay: `${(i % 8) * 0.4}s`,
      duration: `${4 + (i % 6)}s`,
    })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((star) => (
        <span
          key={star.id}
          className="landing-star animate-twinkle"
          style={{
            width: `${star.size}px`,
            height: `${star.size}px`,
            top: star.top,
            left: star.left,
            animationDelay: star.delay,
            animationDuration: star.duration,
          }}
        />
      ))}
    </div>
  );
}

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center">
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.35em] text-signal/80">{eyebrow}</p>
      <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-white/60 md:text-base">{description}</p>
    </div>
  );
}

export default function Landing() {
  const { usuario } = useAuth();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const moverMouse = (e) => {
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX / innerWidth - 0.5) * 2;
    const y = (e.clientY / innerHeight - 0.5) * 2;
    setMouse({ x, y });
  };

  const ctaHref = usuario ? '/scan' : '/login';
  const ctaLabel = usuario ? 'Entrar al panel' : 'Iniciar sesión';

  const cards = [
    {
      icon: Satellite,
      title: 'Tomas satelitales inmersivas',
      text: 'Una portada pensada para comunicar que el sistema trabaja con terreno real, mosaicos, barridos orbitales y observación geoespacial.',
    },
    {
      icon: ScanSearch,
      title: 'Barrido inteligente de superficies',
      text: 'El flujo prepara el terreno para crear datasets de paneles solares a partir de zonas seleccionadas y sesiones trazables.',
    },
    {
      icon: Database,
      title: 'Persistencia y trazabilidad',
      text: 'Cada sesión puede conectarse a tu backend y a TiDB Cloud, preservando usuarios, modelos, celdas y detecciones.',
    },
  ];

  const steps = [
    { icon: Map, title: 'Explora el terreno', text: 'Navega zonas urbanas con vista satelital y detecta techos con potencial solar.' },
    { icon: Radar, title: 'Lanza el análisis', text: 'Activa la detección para construir datasets útiles para entrenamiento, revisión y exportación.' },
    { icon: ShieldCheck, title: 'Revisa resultados', text: 'Administra hallazgos, usuarios, modelos activos y almacenamiento desde una sola plataforma.' },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-base-900 text-white" onMouseMove={moverMouse}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(52,224,161,0.12),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(37,99,235,0.18),transparent_25%),radial-gradient(circle_at_20%_80%,rgba(168,85,247,0.12),transparent_25%)]" />
      <FloatingStars />

      <motion.div
        className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-signal/10 blur-3xl"
        animate={{ x: mouse.x * 40, y: mouse.y * 30 }}
        transition={{ type: 'spring', stiffness: 35, damping: 20 }}
      />
      <motion.div
        className="pointer-events-none absolute right-[-8rem] top-[15%] h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl"
        animate={{ x: -mouse.x * 50, y: -mouse.y * 35 }}
        transition={{ type: 'spring', stiffness: 28, damping: 22 }}
      />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-base-900/45 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-signal/30 bg-signal/10 text-signal shadow-glow">
              <Satellite size={20} />
            </div>
            <div>
              <p className="text-sm font-bold">SatDataset</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">visión orbital</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-white/65 md:flex">
            <a href="#experiencia" className="transition hover:text-white">Experiencia</a>
            <a href="#flujo" className="transition hover:text-white">Flujo</a>
            <a href="#plataforma" className="transition hover:text-white">Plataforma</a>
          </nav>

          <Link
            to={ctaHref}
            className="inline-flex items-center gap-2 rounded-2xl border border-signal/35 bg-signal px-5 py-2.5 font-semibold text-base-900 transition hover:scale-[1.02] hover:shadow-glow"
          >
            {ctaLabel}
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <section className="relative flex min-h-screen items-center px-6 pt-24">
        <div className="mx-auto grid w-full max-w-7xl gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative z-10"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.28em] text-signal">
              <Sparkles size={14} />
              ecosistema de análisis satelital
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
              Una portada espacial para un sistema de
              <span className="bg-gradient-to-r from-signal via-cyan-300 to-white bg-clip-text text-transparent"> detección y generación de datasets satelitales</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-white/65 md:text-lg">
              Desplázate por una experiencia visual que sugiere órbitas, tomas desde el espacio, exploración del terreno y captura de superficies para construir datasets de paneles solares con una identidad moderna y envolvente.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to={ctaHref}
                className="inline-flex items-center gap-2 rounded-2xl bg-signal px-6 py-4 font-bold text-base-900 transition hover:-translate-y-0.5 hover:shadow-glow"
              >
                {ctaLabel}
                <ArrowRight size={18} />
              </Link>
              <a
                href="#experiencia"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                <MousePointer2 size={18} />
                Desliza la experiencia
              </a>
            </div>

            <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
              {['Capas orbitales', 'Animación por movimiento', 'Entrada al panel'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75 backdrop-blur">
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative mx-auto h-[520px] w-full max-w-[520px]"
            style={{ transform: `perspective(1400px) rotateY(${mouse.x * 7}deg) rotateX(${mouse.y * -7}deg)` }}
          >
            <div className="absolute inset-0 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/[0.02] shadow-2xl shadow-black/30 backdrop-blur-xl" />
            <div className="absolute inset-5 rounded-[1.65rem] border border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(52,224,161,0.14),transparent_22%),linear-gradient(180deg,rgba(6,11,19,0.5),rgba(6,11,19,0.95))]" />
              <div className="landing-grid absolute inset-0 opacity-40" />
              <motion.div className="absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-signal/25" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 18, ease: 'linear' }} />
              <motion.div className="absolute left-1/2 top-1/2 h-[82%] w-[82%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/15" animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 24, ease: 'linear' }} />
              <motion.div className="absolute left-1/2 top-1/2 h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(52,224,161,0.16),transparent_60%)]" animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }} transition={{ repeat: Infinity, duration: 4.8, ease: 'easeInOut' }} />

              <div className="absolute left-8 top-8 rounded-2xl border border-white/10 bg-base-900/60 px-4 py-3 backdrop-blur-lg">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/45">barrido orbital</p>
                <p className="mt-2 text-2xl font-black text-white">Paneles & terreno</p>
              </div>

              <div className="absolute bottom-8 left-8 right-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-base-900/60 p-4 backdrop-blur-lg">
                  <div className="mb-2 flex items-center gap-2 text-signal"><Orbit size={16} /><span className="font-mono text-[11px] uppercase tracking-[0.24em]">orbita visual</span></div>
                  <p className="text-sm text-white/70">Una primera impresión cinematográfica para que el sistema se sienta premium y técnico.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-base-900/60 p-4 backdrop-blur-lg">
                  <div className="mb-2 flex items-center gap-2 text-cyan-300"><Radar size={16} /><span className="font-mono text-[11px] uppercase tracking-[0.24em]">interacción viva</span></div>
                  <p className="text-sm text-white/70">Luces, estrellas y movimiento del mouse para simular una consola en el espacio.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.a
          href="#experiencia"
          className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-white/50"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2.1 }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.35em]">scroll</span>
          <span className="h-10 w-6 rounded-full border border-white/15">
            <span className="mx-auto mt-2 block h-2 w-2 rounded-full bg-signal" />
          </span>
        </motion.a>
      </section>

      <section id="experiencia" className="relative px-6 py-28">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="experiencia"
            title="Una portada con presencia, profundidad y narrativa satelital"
            description="No es solo una pantalla bonita: comunica que el sistema observa, analiza y organiza información geoespacial con una estética espacial y tecnológica desde el primer scroll."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.article
                  key={card.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="group rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-signal/25 hover:bg-white/[0.06]"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-signal/10 text-signal transition group-hover:shadow-glow">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/60">{card.text}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="flujo" className="relative border-y border-white/8 bg-white/[0.02] px-6 py-28">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="flujo de uso"
            title="Desde la toma satelital hasta la sesión de revisión"
            description="La experiencia pública aterriza visualmente el propósito del sistema y prepara al usuario para iniciar sesión y entrar al flujo operativo real."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative rounded-[1.75rem] border border-white/10 bg-base-800/70 p-6"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-cyan-300 ring-1 ring-white/10">
                    <Icon size={22} />
                  </div>
                  <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.35em] text-white/35">etapa 0{index + 1}</div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/60">{step.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="plataforma" className="relative px-6 py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.35em] text-signal/80">plataforma</p>
            <h2 className="text-3xl font-black tracking-tight md:text-5xl">La entrada al sistema queda visible desde el primer momento</h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/65">
              Dejé el botón de inicio de sesión visible en la cabecera y en el hero principal para que el acceso al sistema siempre esté a un clic, sin sacrificar el impacto visual de la portada.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to={ctaHref} className="inline-flex items-center gap-2 rounded-2xl bg-signal px-6 py-4 font-bold text-base-900 transition hover:shadow-glow">
                {ctaLabel}
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 font-semibold text-white/80 transition hover:bg-white/10">
                Acceso directo
              </Link>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] p-7 shadow-2xl shadow-black/30 backdrop-blur-xl"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-signal/15 text-signal shadow-glow"><Satellite size={22} /></div>
              <div>
                <h3 className="text-2xl font-black">SatDataset</h3>
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">observación y análisis</p>
              </div>
            </div>
            <div className="space-y-4 text-sm leading-7 text-white/65">
              <p>Portada inmersiva con scroll.</p>
              <p>Ambiente espacial con estrellas y parallax.</p>
              <p>Botón de inicio de sesión al inicio.</p>
              <p>Integración preparada para backend en <span className="text-signal">satelital-backend.vercel.app</span>.</p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
