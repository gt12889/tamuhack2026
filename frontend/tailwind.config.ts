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
        // American Airlines brand colors
        'aa-blue': '#0078D2',
        'aa-red': '#C8102E',
        'aa-dark': '#1A1A1A',
        'aa-light': '#F5F5F5',
      },
      fontSize: {
        // Large text for elderly accessibility
        'display': ['3rem', { lineHeight: '1.2' }],
        'heading': ['2rem', { lineHeight: '1.3' }],
        'body-lg': ['1.5rem', { lineHeight: '1.6' }],
        'body': ['1.25rem', { lineHeight: '1.6' }],
      },
      spacing: {
        // Large touch targets
        'touch': '60px',
      },
    },
  },
  plugins: [],
};

export default config;
