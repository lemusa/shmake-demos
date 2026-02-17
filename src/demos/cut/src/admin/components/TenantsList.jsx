import { useState, useEffect } from 'react';
import { Plus, ExternalLink, Copy, Check, BarChart3 } from 'lucide-react';

export default function TenantsList({ supabase, onSelect, onCreate }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cut_tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setTenants(data || []);
    setLoading(false);
  };

  const copyEmbedCode = (tenant) => {
    const code = `<div id="shmakecut"></div>\n<script src="https://app.shmakecut.co.nz/embed/shmakecut.iife.js" data-key="${tenant.embed_key}"></script>`;
    navigator.clipboard.writeText(code);
    setCopiedKey(tenant.id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const statusColors = {
    trial: '#f59e0b',
    active: '#22c55e',
    suspended: '#ef4444',
    cancelled: '#9ca3af',
  };

  if (loading) {
    return <div className="admin-loading">Loading tenants...</div>;
  }

  return (
    <div className="admin-tenants">
      <div className="admin-page-header">
        <div>
          <h2>Tenants</h2>
          <p className="admin-subtitle">{tenants.length} wholesaler{tenants.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onCreate} className="admin-btn admin-btn--primary">
          <Plus size={16} />
          Add Tenant
        </button>
      </div>

      {tenants.length === 0 ? (
        <div className="admin-empty">
          <p>No tenants yet. Add your first wholesaler to get started.</p>
          <button onClick={onCreate} className="admin-btn admin-btn--primary">
            <Plus size={16} />
            Add Tenant
          </button>
        </div>
      ) : (
        <div className="admin-table">
          <div className="admin-table-header">
            <span>Name</span>
            <span>Status</span>
            <span>Products</span>
            <span>Embed Key</span>
            <span></span>
          </div>
          {tenants.map((tenant) => (
            <div key={tenant.id} className="admin-table-row" onClick={() => onSelect(tenant.id)}>
              <div className="admin-tenant-name">
                <strong>{tenant.name}</strong>
                {tenant.website && (
                  <a
                    href={tenant.website}
                    target="_blank"
                    rel="noopener"
                    onClick={(e) => e.stopPropagation()}
                    className="admin-link"
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <div>
                <span
                  className="admin-status-badge"
                  style={{ background: statusColors[tenant.status] + '20', color: statusColors[tenant.status] }}
                >
                  {tenant.status}
                </span>
              </div>
              <div className="admin-text-muted">–</div>
              <div>
                <code className="admin-embed-key">{tenant.embed_key.substring(0, 12)}...</code>
                <button
                  className="admin-btn admin-btn--icon"
                  onClick={(e) => { e.stopPropagation(); copyEmbedCode(tenant); }}
                  title="Copy embed code"
                >
                  {copiedKey === tenant.id ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <div>
                <button className="admin-btn admin-btn--sm" onClick={() => onSelect(tenant.id)}>
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
