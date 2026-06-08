import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// En Docker dev, BACKEND_URL pointe vers le service "backend" du réseau Docker.
// En local, la variable n'est pas définie et on retombe sur localhost.
const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:4005';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      src: "/src",
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../backend/static'),
    emptyOutDir: true,
  },
  server: {
    port: 6005,
    host: true,   // nécessaire dans Docker pour écouter sur 0.0.0.0 (pas seulement 127.0.0.1)
    watch: {
      // Le filesystem de Docker/WSL ne propage pas les événements inotify correctement.
      // Le polling garantit que le HMR fonctionne — activé uniquement dans Docker dev.
      usePolling: !!process.env.DOCKER_DEV,
    },
    proxy: {
      '/api': backendUrl,
      '/media': backendUrl,
    },
  },
});
