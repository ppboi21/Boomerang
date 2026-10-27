import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In development the frontend talks to the API through this proxy, so no
// VITE_API_URL is needed locally. Port 5180 avoids clashing with other projects.
const API = 'http://localhost:5050';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5180,
    strictPort: true,
    // The project lives in OneDrive, where file-change events are sometimes
    // missed; polling makes sure every save shows up in the browser.
    watch: { usePolling: true, interval: 300 },
    proxy: {
      '/api': API,
      '/uploads': API,
      '/socket.io': { target: API, ws: true },
    },
  },
  preview: { port: 5181, strictPort: true },
  // three.js is big but lazy-loaded only on the sign-in screens.
  build: { chunkSizeWarningLimit: 1000 },
});
