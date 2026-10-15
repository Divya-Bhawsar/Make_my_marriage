import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          crimson: '#881337',
          gold: '#b45309',
          amber: '#d97706',
          emerald: '#065f46',
          ivory: '#fefce8',
          sand: '#fef3c7',
        },
      },
    },
  },
  plugins: [],
};

export default config;
