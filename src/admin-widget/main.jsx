import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from '@shmakecut/admin/AdminApp';

/**
 * SHMAKE Admin Widget (IIFE embed)
 *
 * Usage on shmake.nz:
 *   <div id="shmakecut-admin"></div>
 *   <script src="https://admin-widget.shmake.nz/shmakecut-admin.iife.js"></script>
 *
 * Currently mounts shmakeCut AdminApp only. When adding more products:
 *
 * 1. Import each product's admin panel here:
 *      import XyzAdmin from '@shmakexyz/admin/AdminApp';
 *
 * 2. Replace the direct AdminApp render with a wrapper component
 *    that provides product tabs/sidebar, e.g.:
 *      <AdminShell products={[
 *        { key: 'shmakecut', label: 'shmakeCut', component: AdminApp },
 *        { key: 'shmakexyz', label: 'shmakeXyz', component: XyzAdmin },
 *      ]} />
 *
 * 3. AdminShell handles shared auth (one Supabase session) and
 *    product switching. Each product panel gets the supabase client
 *    and user as props.
 *
 * 4. Add the path alias in vite.admin-widget.config.js.
 */

(function initShmakeCutAdmin() {
  const targetId = 'shmakecut-admin';

  let container = document.getElementById(targetId);
  if (!container) {
    console.warn(`shmakeCut Admin: #${targetId} not found, creating one`);
    container = document.createElement('div');
    container.id = targetId;
    document.body.appendChild(container);
  }

  // Embed overrides: hide the widget's own topbar (parent page has nav),
  // and fill the container instead of 100vh
  const style = document.createElement('style');
  style.textContent = `
    #${targetId} .admin-app,
    #${targetId} .admin-login,
    #${targetId} .admin-error-page {
      min-height: 600px;
    }
    #${targetId} .admin-topbar {
      display: none;
    }
    #${targetId} .admin-login {
      padding-top: 40px;
    }
  `;
  document.head.appendChild(style);

  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(AdminApp));
})();
