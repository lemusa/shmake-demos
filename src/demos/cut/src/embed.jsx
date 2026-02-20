import React from 'react';
import ReactDOM from 'react-dom/client';
import CuttingOptimizer from './components/CuttingOptimizer';
import { fetchEmbedConfig, applyTheme } from './config/embedConfig';

/**
 * shmakeCut Embed Loader
 *
 * Usage (data-key on the div):
 *   <div id="shmakecut" data-key="abc123"></div>
 *   <script src="https://demo.shmake.nz/shmakecut.iife.js"></script>
 *
 * Also supports data-key on the script tag (backwards compatible):
 *   <div id="shmakecut"></div>
 *   <script src="..." data-key="abc123"></script>
 *
 * Custom target:
 *   <div id="my-calculator" data-key="abc123"></div>
 *   <script src="..." data-target="my-calculator"></script>
 */

(async function initshmakeCut() {
  // Find the script tag for fallback data attributes
  const scripts = document.querySelectorAll('script[src*="shmakecut"]');
  const currentScript = scripts[scripts.length - 1];

  const targetId = currentScript?.getAttribute('data-target') || 'shmakecut';

  // Find or create container
  let container = document.getElementById(targetId);
  if (!container) {
    console.warn(`shmakeCut: Target element #${targetId} not found, creating one`);
    container = document.createElement('div');
    container.id = targetId;
    currentScript?.parentNode?.insertBefore(container, currentScript);
  }

  // Read data-key: prefer container div, fall back to script tag
  const embedKey = container.getAttribute('data-key')
    || currentScript?.getAttribute('data-key')
    || 'demo';

  // Show loading state
  container.innerHTML = '<div style="padding:40px;text-align:center;color:#9ca3af;font-family:sans-serif">Loading calculator...</div>';

  try {
    // Fetch tenant config
    const config = await fetchEmbedConfig(embedKey);

    // Clear loading state and render first, so .shmakecut element exists
    container.innerHTML = '';

    const root = ReactDOM.createRoot(container);
    root.render(
      React.createElement(CuttingOptimizer, { config })
    );

    // Apply theme on the .shmakecut element (NOT the parent container).
    // CuttingOptimizer.css defines default --tc-* vars on .shmakecut,
    // so setting them on a parent won't override — CSS custom properties
    // declared on an element beat inherited values.
    requestAnimationFrame(() => {
      const el = container.querySelector('.shmakecut');
      if (el) applyTheme(el, config.theme);
    });
  } catch (err) {
    console.error('shmakeCut: Failed to initialize', err);
    container.innerHTML = '<div style="padding:20px;text-align:center;color:#ef4444;font-family:sans-serif">Failed to load calculator. Please refresh the page.</div>';
  }
})();
