import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server: { port: 5173, strictPort: true }, build: { rollupOptions: { input: { main: 'index.html', preview: 'modal-preview.html' } }, chunkSizeWarningLimit: 1400 } });
