import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true, // Listen on all addresses, including LAN and public addresses
    port: 5173,
    strictPort: false,
    allowedHosts: ['.ngrok-free.app', '.ngrok.io', '.ngrok.app'], // Allow all ngrok domains
    hmr: {
      clientPort: 443, // Use HTTPS port for HMR when using ngrok
    },
  },
});
