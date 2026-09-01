import type { Config } from 'tailwindcss';

/**
 * Digital Geekz brand tokens.
 * Do not swap these for generic template colours — this tool is shown to clients.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#121212', // near-black page background
          soft: '#1A1A1A',    // cards
          line: '#2A2A2A',    // borders
          muted: '#8A8A8A',   // secondary text
        },
        gold: {
          DEFAULT: '#E8BE5C', // accent
          soft: '#F3E3B3',    // secondary pastel
          dim: '#3A2F14',     // accent-tinted fill
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '1rem' },
    },
  },
  plugins: [],
};
export default config;
