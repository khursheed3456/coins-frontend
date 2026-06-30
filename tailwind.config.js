/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // CoinX444 palette - deep space + electric cyan
        bg: {
          base: '#080c14',
          card: '#0d1423',
          elevated: '#111827',
          border: '#1e2a3a',
        },
        cyan: {
          DEFAULT: '#00e5ff',
          dim: '#00b8cc',
          glow: 'rgba(0,229,255,0.15)',
        },
        green: {
          profit: '#00e676',
        },
        red: {
          loss: '#ff1744',
        },
        text: {
          primary: '#e8f0fe',
          secondary: '#8899bb',
          muted: '#4a5568',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(0,229,255,0.2)',
        'glow-sm': '0 0 10px rgba(0,229,255,0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
