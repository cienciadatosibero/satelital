/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Sala de control orbital: casi negro azulado
        base: {
          900: '#070a0f',
          800: '#0b1018',
          700: '#121927',
          600: '#1a2436',
        },
        // Verde señal = detección / confirmado
        signal: {
          DEFAULT: '#34e0a1',
          dim: '#1f9c70',
        },
        // Ámbar = pendiente de revisión
        amber: {
          DEFAULT: '#f5b13d',
        },
        // Rojo = descartado / error
        alert: {
          DEFAULT: '#ff5d5d',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(52, 224, 161, 0.25)',
        'glow-amber': '0 0 24px rgba(245, 177, 61, 0.2)',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(52,224,161,0.5)' },
          '70%': { boxShadow: '0 0 0 12px rgba(52,224,161,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(52,224,161,0)' },
        },
      },
      animation: {
        scan: 'scan 2.4s linear infinite',
        pulseRing: 'pulseRing 2s ease-out infinite',
      },
    },
  },
  plugins: [],
};
