import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Redirect all dev server requests to portal.html (instead of default index.html)
function portalSpaFallback() {
  return {
    name: 'portal-spa-fallback',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        // Skip asset/module requests — only rewrite HTML page requests
        if (!url.includes('.') && !url.startsWith('/@') && !url.startsWith('/node_modules/')) {
          req.url = '/portal.html';
        }
        next();
      });
    },
  };
}

// Rename portal.html → index.html in the build output so Vercel's rewrite works
function renamePortalToIndex() {
  return {
    name: 'rename-portal-to-index',
    enforce: 'post',
    generateBundle(_, bundle) {
      if (bundle['portal.html']) {
        bundle['portal.html'].fileName = 'index.html';
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), portalSpaFallback(), renamePortalToIndex()],
  resolve: {
    alias: {
      '@shmakecut': path.resolve(__dirname, 'src/demos/cut/src'),
    },
  },
  build: {
    outDir: 'dist-portal',
    rollupOptions: {
      input: path.resolve(__dirname, 'portal.html'),
    },
  },
});
