import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  base: './',  // Use relative paths for better file:// protocol support
  server: {
    host: '127.0.0.1',    // Use IP address instead of localhost
    port: 5173,           // Default Vite port
    strictPort: false,    // Allow port fallback
    open: true,           // Auto-open browser
    cors: true,           // Enable CORS
  },
});
