import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html',
        sw: './public/sw.js'
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    headers: {
      'Service-Worker-Allowed': '/'
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});