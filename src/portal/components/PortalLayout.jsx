import { useState } from 'react';
import { LayoutDashboard, Users, Package, Code, LogOut, Menu, X } from 'lucide-react';
import Overview from '../pages/shmakecut/Overview';
import Leads from '../pages/shmakecut/Leads';
import Products from '../pages/shmakecut/Products';
import Embed from '../pages/shmakecut/Embed';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'embed', label: 'Embed', icon: Code },
];

const PAGE_MAP = {
  overview: Overview,
  leads: Leads,
  products: Products,
  embed: Embed,
};

export default function PortalLayout({ supabase, user, portalUser, tenant, onLogout }) {
  const [activePage, setActivePage] = useState('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const PageComponent = PAGE_MAP[activePage];

  return (
    <div className="portal-app">
      {/* Top bar */}
      <header className="portal-topbar">
        <div className="portal-topbar-left">
          <button
            className="portal-mobile-burger"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <img src="https://www.shmake.nz/assets/shmake-logo-light.png" alt="SHMAKE" className="portal-topbar-logo" />
          <span className="portal-topbar-tenant">{tenant.name}</span>
        </div>
        <div className="portal-topbar-right">
          <span className="portal-topbar-email">{portalUser.name || user.email}</span>
          <button onClick={onLogout} className="portal-btn portal-btn--icon" title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="portal-drawer-backdrop" onClick={() => setMobileNavOpen(false)} />
      )}
      <nav className={`portal-drawer ${mobileNavOpen ? 'portal-drawer--open' : ''}`}>
        <div className="portal-drawer-header">
          <img src="https://www.shmake.nz/assets/shmake-logo-light.png" alt="SHMAKE" className="portal-drawer-logo" />
          <button
            className="portal-drawer-close"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <div className="portal-drawer-tenant">{tenant.name}</div>
        <div className="portal-drawer-nav">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`portal-drawer-item ${activePage === item.id ? 'portal-drawer-item--active' : ''}`}
                onClick={() => { setActivePage(item.id); setMobileNavOpen(false); }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="portal-drawer-footer">
          <span className="portal-drawer-user">{portalUser.name || user.email}</span>
          <button onClick={onLogout} className="portal-drawer-logout">
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </nav>

      <div className="portal-body">
        {/* Sidebar (desktop) */}
        <nav className="portal-sidebar">
          <div className="portal-sidebar-section">
            <div className="portal-sidebar-section-label">shmakeCut</div>
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`portal-nav-item ${activePage === item.id ? 'portal-nav-item--active' : ''}`}
                  onClick={() => setActivePage(item.id)}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <main className="portal-content">
          <PageComponent supabase={supabase} tenant={tenant} portalUser={portalUser} />
        </main>
      </div>
    </div>
  );
}
