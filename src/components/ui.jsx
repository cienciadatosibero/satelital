import { motion } from 'framer-motion';

export function Eyebrow({ children, color = 'signal' }) {
  const c = color === 'amber' ? 'text-amber' : 'text-signal';
  return (
    <span
      className={`${c} text-[11px] font-mono font-semibold uppercase tracking-[0.25em]`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-5 h-11 font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal';
  const variants = {
    primary:
      'bg-signal text-base-900 hover:shadow-glow hover:brightness-110 active:scale-[0.98]',
    ghost:
      'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20',
    danger:
      'bg-alert/15 text-alert border border-alert/30 hover:bg-alert/25',
    amber:
      'bg-amber text-base-900 hover:brightness-110 active:scale-[0.98]',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = '', animate = true }) {
  const Comp = animate ? motion.div : 'div';
  const animProps = animate
    ? {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: 'easeOut' },
      }
    : {};
  return (
    <Comp
      className={`rounded-2xl border border-white/10 bg-base-800/80 backdrop-blur ${className}`}
      {...animProps}
    >
      {children}
    </Comp>
  );
}

export function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-white/8 text-white/70 border-white/10',
    signal: 'bg-signal/15 text-signal border-signal/30',
    amber: 'bg-amber/15 text-amber border-amber/30',
    alert: 'bg-alert/15 text-alert border-alert/30',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Spinner({ label }) {
  return (
    <div className="flex items-center gap-3 text-signal">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-signal/30 border-t-signal" />
      {label && <span className="text-sm font-mono">{label}</span>}
    </div>
  );
}

export function Field({ label, ...props }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">
        {label}
      </span>
      <input
        className="h-11 rounded-xl border border-white/10 bg-base-900/80 px-4 font-mono text-sm text-white outline-none transition-colors focus:border-signal/60"
        {...props}
      />
    </label>
  );
}
