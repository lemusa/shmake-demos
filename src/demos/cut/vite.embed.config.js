import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    outDir: 'dist/embed',
    lib: {
      entry: 'src/embed.jsx',
      name: 'ShmakeCut',
      fileName: 'shmakecut',
      formats: ['iife'],
    },
    rollupOptions: {
      // Bundle everything - the embed is fully self-contained
      external: [],
      output: {
        // Single file output
        inlineDynamicImports: true,
      },
    },
    cssCodeSplit: false,
    minify: 'esbuild',
  },
});
