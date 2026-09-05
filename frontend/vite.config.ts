import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// En Docker dev, BACKEND_URL pointe vers le service "backend" du réseau Docker.
// En local, la variable n'est pas définie et on retombe sur localhost.
const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:4005';

export default defineConfig({
  plugins: [react()],
  test: {
    // Les tests tournent sous Node ; ce fichier fournit le minimum de globales navigateur
    // dont dépend le store, sans imposer jsdom.
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      src: "/src",
    },
  },
  build: {
    // Sortie standard Vite : frontend/dist/.
    // En dev on utilise le serveur Vite (npm run dev) : ce chemin ne sert qu'au build Docker/prod.
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 6005,
    host: true,   // nécessaire dans Docker pour écouter sur 0.0.0.0 (pas seulement 127.0.0.1)
    watch: {
      // Le filesystem de Docker/WSL ne propage pas les événements inotify correctement.
      // Le polling garantit que le HMR fonctionne : activé uniquement dans Docker dev.
      usePolling: !!process.env.DOCKER_DEV,
    },
    proxy: {
      '/api': backendUrl,
      '/media': backendUrl,
    },
  },
});
