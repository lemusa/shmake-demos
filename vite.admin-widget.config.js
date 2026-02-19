import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// ── SHMAKE Admin Widget ──────────────────────────────────────────────
// Builds a self-contained IIFE for embedding the admin panel on shmake.nz.
// Currently only includes shmakeCut admin. When adding a new product:
//
// 1. Add a path alias below:
//      '@shmakexyz': path.resolve(__dirname, 'src/demos/xyz/src'),
//
// 2. Create an admin panel in that product's src/admin/ folder
//    following the same pattern as src/demos/cut/src/admin/AdminApp.jsx
//
// 3. Update src/admin-widget/main.jsx to import and render a product
//    selector shell that wraps each product's admin panel.
//
// The IIFE bundles everything (React, Supabase, CSS) into one file.
// ─────────────────────────────────────────────────────────────────────

// Injects extracted CSS into the IIFE JS bundle so the widget is a single file
function inlineCssPlugin() {
  return {
    name: 'inline-css-into-iife',
    enforce: 'post',
    generateBundle(_, bundle) {
      const cssFile = Object.keys(bundle).find(k => k.endsWith('.css'));
      const jsFile = Object.keys(bundle).find(k => k.endsWith('.js'));
      if (!cssFile || !jsFile) return;

      const css = bundle[cssFile].source
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$');

      bundle[jsFile].code =
        `(function(){var s=document.createElement('style');s.textContent=\`${css}\`;document.head.appendChild(s)})();\n` +
        bundle[jsFile].code;

      delete bundle[cssFile];
    },
  };
}

export default defineConfig({
  plugins: [react(), inlineCssPlugin()],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  resolve: {
    alias: {
      '@shmakecut': path.resolve(__dirname, 'src/demos/cut/src'),
    },
  },
  build: {
    outDir: 'dist-admin-widget',
    lib: {
      entry: 'src/admin-widget/main.jsx',
      name: 'ShmakeCutAdmin',
      fileName: 'shmakecut-admin',
      formats: ['iife'],
    },
    rollupOptions: {
      external: [],
      output: {
        inlineDynamicImports: true,
      },
    },
    cssCodeSplit: false,
    minify: 'esbuild',
  },
});
