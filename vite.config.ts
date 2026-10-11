import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.').replace(/\\/g, '/'),
      },
    },
    build: {
      assetsDir: 'assets',
      rollupOptions: {
        input: {
          main: path.resolve(import.meta.dirname, 'index.html').replace(/\\/g, '/'),
          teacher: path.resolve(import.meta.dirname, 'teacher/index.html').replace(/\\/g, '/')
        }
      }
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
