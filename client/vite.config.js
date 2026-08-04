import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const srcPath = fileURLToPath(new URL('./src', import.meta.url));
const stylesPath = fileURLToPath(new URL('./src/styles', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': srcPath,
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [stylesPath],
        // Output-free mixins and breakpoints, available in every stylesheet.
        additionalData: '@use "core" as *;\n',
      },
    },
  },
  server: {
    port: 5173,
    // Proxying keeps the browser same-origin in development, so the httpOnly
    // refresh cookie is sent without any CORS or SameSite special-casing.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
