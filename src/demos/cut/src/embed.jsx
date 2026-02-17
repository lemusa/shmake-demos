import React from 'react';
import ReactDOM from 'react-dom/client';
import CuttingOptimizer from './components/CuttingOptimizer';
import { fetchEmbedConfig, applyTheme } from './config/embedConfig';

/**
 * shmakeCut Embed Loader
 *
 * Usage on wholesaler's site:
 *   <div id="shmakecut"></div>
 *   <script src="https://app.shmakecut.co.nz/embed/shmakecut.iife.js" data-key="abc123"></script>
 *
 * Or with custom target:
 *   <div id="my-calculator"></div>
 *   <script src="..." data-key="abc123" data-target="my-calculator"></script>
 */

(async function initshmakeCut() {
  // Find the script tag to read data attributes
  const scripts = document.querySelectorAll('script[data-key]');
  const currentScript = scripts[scripts.length - 1]; // Last matching script = most recently loaded

  const embedKey = currentScript?.getAttribute('data-key') || 'demo';
  const targetId = currentScript?.getAttribute('data-target') || 'shmakecut';

  // Find or create container
  let container = document.getElementById(targetId);
  if (!container) {
    console.warn(`shmakeCut: Target element #${targetId} not found, creating one`);
    container = document.createElement('div');
    container.id = targetId;
    currentScript?.parentNode?.insertBefore(container, currentScript);
  }

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
