import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  build: {
    commonjsOptions: {
      include: [/natural/, /node_modules/]
    }
  },
  resolve: {
    alias: {
      natural: 'natural/lib/natural'
    }
  }
});
