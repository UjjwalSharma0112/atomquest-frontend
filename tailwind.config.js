/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0a0a0f',
          surface: '#12121a',
          elevated: '#1a1a26',
          border: '#1e1e2e',
        },
        primary: {
          DEFAULT: '#6366f1',
          hover: '#818cf8',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        text: {
          primary: '#f1f5f9',
          muted: '#64748b',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
