import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ── shmakeCut Embed Widget ─────────────────────────────────────────
// Builds a self-contained IIFE that third-party sites load via:
//
//   <div id="shmakecut" data-key="TENANT_EMBED_KEY"></div>
//   <script src="https://demo.shmake.nz/shmakecut.iife.js"></script>
//
// The bundle includes React, Supabase, CSS — everything in one file.
// ────────────────────────────────────────────────────────────────────

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
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Append to existing main build output
    lib: {
      entry: 'src/demos/cut/src/embed.jsx',
      name: 'ShmakeCut',
      fileName: 'shmakecut',
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
