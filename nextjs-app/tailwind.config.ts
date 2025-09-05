import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class', // Mengaktifkan mode gelap berbasis class
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          base: '#17153B', // base background dark
          surface: '#0f0e2c', // surface elements (cards, inputs)
          hover: '#1a1850', // hover/active surface
          border: '#23215a', // subtle border
          'border-strong': '#2b2966', // stronger border
        },
      },
    },
  },
  plugins: [],
};
export default config;
