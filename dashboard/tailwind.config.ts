import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // disable all default colors — we use only CSS variables
    colors: {},
    fontFamily: {
      display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
      body: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
      mono: ['"Martian Mono"', 'ui-monospace', 'monospace'],
    },
    extend: {},
  },
  plugins: [],
}

export default config
