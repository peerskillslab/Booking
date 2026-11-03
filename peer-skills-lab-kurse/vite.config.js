import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries into separate chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          // recharts wird nur in der Admin-Statistik gebraucht und landet dort
          // im eigenen, nachgeladenen Paket. framer-motion nutzt jede Seite.
          'vendor-motion': ['framer-motion'],
        },
      },
    },
    chunkSizeWarningLimit: 200,
  },
});
