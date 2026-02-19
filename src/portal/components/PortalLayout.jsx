import { useState } from 'react';
import { LayoutDashboard, Users, Package, Code, LogOut, ChevronDown } from 'lucide-react';
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

      <div className="portal-body">
        {/* Sidebar */}
        <nav className="portal-sidebar">
          <div className="portal-sidebar-section">
            <div className="portal-sidebar-section-label">shmakeCut</div>
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`portal-nav-item ${activePage === item.id ? 'portal-nav-item--active' : ''}`}
                  onClick={() => { setActivePage(item.id); setMobileNavOpen(false); }}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile nav toggle */}
        <button
          className="portal-mobile-nav-toggle"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
        >
          <span className="portal-mobile-nav-current">
            {NAV_ITEMS.find(n => n.id === activePage)?.label}
          </span>
          <ChevronDown size={14} />
        </button>

        {/* Mobile nav dropdown */}
        {mobileNavOpen && (
          <div className="portal-mobile-nav">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`portal-nav-item ${activePage === item.id ? 'portal-nav-item--active' : ''}`}
                  onClick={() => { setActivePage(item.id); setMobileNavOpen(false); }}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        <main className="portal-content">
          <PageComponent supabase={supabase} tenant={tenant} portalUser={portalUser} />
        </main>
      </div>
    </div>
  );
}
