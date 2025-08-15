import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({ jsxImportSource: 'react' })],
  resolve: {
    alias: {
      '@rainbow-me/rainbowkit/styles.css': '/src/styles/rk-empty.css',
    },
  },
  server: {
    host: true,
    port: 5300,
    strictPort: false,
    hmr: { overlay: true },
  },
  preview: {
    host: true,
    port: 5301,
    strictPort: false,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});


