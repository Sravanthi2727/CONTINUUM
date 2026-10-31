import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    watch: {
      ignored: ['**/*.tsbuildinfo', '**/*.d.ts', '**/dist/**'],
    },
    proxy: {
      '/auth': {
        target: 'https://continuum-api-rkp4.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/projects': {
        target: 'https://continuum-api-rkp4.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/runs': {
        target: 'https://continuum-api-rkp4.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/events': {
        target: 'https://continuum-api-rkp4.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/intelligence': {
        target: 'https://continuum-api-rkp4.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
