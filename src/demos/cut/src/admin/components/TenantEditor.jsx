import { useState, useEffect } from 'react';
import {
  ArrowLeft, Save, Plus, X, Trash2, Copy, Check,
  Palette, Package, Layers, Settings, Code, Eye,
  GripVertical, ChevronDown, ChevronUp, Users, KeyRound,
} from 'lucide-react';

// ============================================
// MAIN TENANT EDITOR
// ============================================

export default function TenantEditor({ supabase, tenantId, onBack, isNew }) {
  const [tenant, setTenant] = useState(null);
  const [products, setProducts] = useState([]);
  const [presets, setPresets] = useState([]);
  const [portalUsers, setPortalUsers] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [saveMessage, setSaveMessage] = useState('');
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  // Default new tenant
  const defaultTenant = {
    name: '',
    slug: '',
    contact_name: '',
    contact_email: '',
    phone: '',
    website: '',
    logo_url: '',
    status: 'trial',
    subscription_plan: 'basic',
    theme: {
      primary: '#1e3a5f',
      primaryLight: '#2a5a8f',
      accent: '#d97706',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      neutral800: '#262626',
      background: '#ffffff',
      surface: '#f9fafb',
      surfaceAlt: '#f3f4f6',
      border: '#e5e7eb',
      textPrimary: '#111827',
      textSecondary: '#6b7280',
      textMuted: '#9ca3af',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      borderRadius: '8px',
      borderRadiusSm: '6px',
    },
    settings: {
      showCosting: true,
      showJobDetails: false,
      allowPdfExport: true,
      enableLeadCapture: true,
      enableSendToYard: true,
      disclaimer: 'This calculator provides estimates only. Always verify quantities with a qualified builder or supplier before purchasing.',
    },
  };

  useEffect(() => {
    if (isNew) {
      setTenant(defaultTenant);
      setLoading(false);
    } else {
      loadTenant();
    }
  }, [tenantId]);

  const loadTenant = async () => {
    setLoading(true);

    // Load tenant
    const { data: t } = await supabase
      .from('cut_tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (t) setTenant(t);

    // Load products
    const { data: prods } = await supabase
      .from('cut_products')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true });

    setProducts(prods || []);

    // Load presets
    const { data: pres } = await supabase
      .from('cut_presets')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true });

    setPresets(pres || []);

    // Load portal users
    const { data: users } = await supabase
      .from('cut_portal_users')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true });

    setPortalUsers(users || []);
    setLoading(false);
  };

  // ============================================
  // SAVE TENANT
  // ============================================

  const saveTenant = async () => {
    setSaving(true);
    setSaveMessage('');

    try {
      if (isNew) {
        // Auto-generate slug from name
        const slug = tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const { data, error } = await supabase
          .from('cut_tenants')
          .insert({ ...tenant, slug })
          .select()
          .single();

        if (error) throw error;

        // Seed default products
        const seedProducts = [
          { tenant_id: data.id, name: '', species: 'Radiata Pine', treatment: 'H3.2', profile: '90 × 45', category: 'framing', lengths: [2400, 3000, 3600, 4200, 4800, 6000], price_per_meter: 4.50, sort_order: 1 },
          { tenant_id: data.id, name: '', species: 'Radiata Pine', treatment: 'H3.2', profile: '140 × 45', category: 'framing', lengths: [2400, 3000, 3600, 4200, 4800, 6000], price_per_meter: 6.80, sort_order: 2 },
          { tenant_id: data.id, name: '', species: 'Radiata Pine', treatment: 'H3.2', profile: '190 × 45', category: 'framing', lengths: [3000, 3600, 4200, 4800, 6000], price_per_meter: 9.20, sort_order: 3 },
          { tenant_id: data.id, name: '', species: 'Kwila', treatment: 'None', profile: '140 × 19 (Decking)', category: 'decking', lengths: [1800, 2400, 3000, 3600, 4200], price_per_meter: 18.50, sort_order: 4 },
          { tenant_id: data.id, name: '', species: 'Radiata Pine', treatment: 'H3.1', profile: '200 × 25 (Fence)', category: 'fencing', lengths: [1200, 1500, 1800, 2400, 3000, 3600], price_per_meter: 5.20, sort_order: 5 },
        ];

        const { data: prods } = await supabase
          .from('cut_products')
          .insert(seedProducts)
          .select();

        // Seed default presets with product IDs
        if (prods && prods.length >= 5) {
          const seedPresets = [
            { tenant_id: data.id, name: 'Framing', slug: 'framing', product_ids: [prods[0].id, prods[1].id, prods[2].id], default_product_id: prods[0].id, settings: { endTrim: 0, minOffcut: 200, kerf: 3 }, sort_order: 1 },
            { tenant_id: data.id, name: 'Decking', slug: 'decking', product_ids: [prods[3].id], default_product_id: prods[3].id, settings: { endTrim: 0, minOffcut: 300, kerf: 3 }, sort_order: 2 },
            { tenant_id: data.id, name: 'Fencing', slug: 'fencing', product_ids: [prods[4].id], default_product_id: prods[4].id, settings: { endTrim: 0, minOffcut: 150, kerf: 3 }, sort_order: 3 },
            { tenant_id: data.id, name: 'Custom', slug: 'custom', product_ids: [], settings: { endTrim: 0, minOffcut: 100, kerf: 3 }, sort_order: 99 },
          ];

          await supabase.from('cut_presets').insert(seedPresets);
        }

        setSaveMessage('Tenant created with demo catalogue');
        // Redirect to edit mode
        setTimeout(() => onBack(), 1000);
      } else {
        const { error } = await supabase
          .from('cut_tenants')
          .update({
            name: tenant.name,
            contact_name: tenant.contact_name,
            contact_email: tenant.contact_email,
            phone: tenant.phone,
            website: tenant.website,
            logo_url: tenant.logo_url,
            theme: tenant.theme,
            settings: tenant.settings,
            status: tenant.status,
            subscription_plan: tenant.subscription_plan,
          })
          .eq('id', tenantId);

        if (error) throw error;
        setSaveMessage('Saved');
      }
    } catch (err) {
      setSaveMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // ============================================
  // PRODUCT CRUD
  // ============================================

  const addProduct = async () => {
    const { data, error } = await supabase
      .from('cut_products')
      .insert({
        tenant_id: tenantId,
        name: '',
        species: 'Radiata Pine',
        treatment: 'H3.2',
        profile: '90 × 45',
        category: 'framing',
        lengths: [2400, 3000, 3600, 4800, 6000],
        price_per_meter: 0,
        sort_order: products.length,
      })
      .select()
      .single();

    if (!error && data) setProducts([...products, data]);
  };

  const updateProduct = async (productId, updates) => {
    setProducts(products.map(p => p.id === productId ? { ...p, ...updates } : p));
  };

  const saveProduct = async (product) => {
    const { error } = await supabase
      .from('cut_products')
      .update({
        name: product.name,
        species: product.species,
        treatment: product.treatment,
        profile: product.profile,
        category: product.category,
        lengths: product.lengths,
        price_per_meter: product.price_per_meter,
        default_kerf: product.default_kerf,
        default_end_trim: product.default_end_trim,
        default_min_offcut: product.default_min_offcut,
        is_active: product.is_active,
        sort_order: product.sort_order,
        image_url: product.image_url || null,
      })
      .eq('id', product.id);

    if (!error) setSaveMessage('Product saved');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const deleteProduct = async (productId) => {
    const { error } = await supabase
      .from('cut_products')
      .delete()
      .eq('id', productId);

    if (!error) setProducts(products.filter(p => p.id !== productId));
  };

  // ============================================
  // PRESET CRUD
  // ============================================

  const addPreset = async () => {
    const slug = `preset-${Date.now()}`;
    const { data, error } = await supabase
      .from('cut_presets')
      .insert({
        tenant_id: tenantId,
        name: 'New Preset',
        slug,
        product_ids: [],
        settings: { endTrim: 0, minOffcut: 200, kerf: 3 },
        sort_order: presets.length,
      })
      .select()
      .single();

    if (!error && data) setPresets([...presets, data]);
  };

  const savePreset = async (preset) => {
    const { error } = await supabase
      .from('cut_presets')
      .update({
        name: preset.name,
        slug: preset.slug,
        product_ids: preset.product_ids,
        default_product_id: preset.default_product_id,
        settings: preset.settings,
        is_active: preset.is_active,
        sort_order: preset.sort_order,
      })
      .eq('id', preset.id);

    if (!error) setSaveMessage('Preset saved');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const deletePreset = async (presetId) => {
    const { error } = await supabase
      .from('cut_presets')
      .delete()
      .eq('id', presetId);

    if (!error) setPresets(presets.filter(p => p.id !== presetId));
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) return <div className="admin-loading">Loading...</div>;
  if (!tenant) return <div className="admin-error">Tenant not found</div>;

  const tabs = [
    { id: 'details', label: 'Details', icon: Settings },
    ...(!isNew ? [
      { id: 'products', label: 'Products', icon: Package },
      { id: 'presets', label: 'Presets', icon: Layers },
      { id: 'users', label: 'Users', icon: Users },
      { id: 'theme', label: 'Theme', icon: Palette },
      { id: 'embed', label: 'Embed Code', icon: Code },
    ] : []),
  ];

  return (
    <div className="admin-editor">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-left">
          <button onClick={onBack} className="admin-btn admin-btn--icon">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2>{isNew ? 'New Tenant' : tenant.name}</h2>
            {!isNew && <p className="admin-subtitle">{tenant.slug} · {tenant.status}</p>}
          </div>
        </div>
        <div className="admin-page-header-right">
          {saveMessage && (
            <span className={`admin-save-msg ${saveMessage.startsWith('Error') ? 'admin-save-msg--error' : ''}`}>
              {saveMessage}
            </span>
          )}
          <button onClick={saveTenant} className="admin-btn admin-btn--primary" disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'admin-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="admin-tab-content">
        {activeTab === 'details' && (
          <DetailsTab tenant={tenant} setTenant={setTenant} isNew={isNew} />
        )}
        {activeTab === 'products' && (
          <ProductsTab
            products={products}
            onUpdate={updateProduct}
            onSave={saveProduct}
            onAdd={addProduct}
            onDelete={deleteProduct}
            supabase={supabase}
          />
        )}
        {activeTab === 'presets' && (
          <PresetsTab
            presets={presets}
            products={products}
            onSave={savePreset}
            onAdd={addPreset}
            onDelete={deletePreset}
            setPresets={setPresets}
          />
        )}
        {activeTab === 'users' && (
          <UsersTab
            supabase={supabase}
            tenantId={tenantId}
            portalUsers={portalUsers}
            setPortalUsers={setPortalUsers}
          />
        )}
        {activeTab === 'theme' && (
          <ThemeTab tenant={tenant} setTenant={setTenant} />
        )}
        {activeTab === 'embed' && (
          <EmbedTab tenant={tenant} copiedEmbed={copiedEmbed} setCopiedEmbed={setCopiedEmbed} />
        )}
      </div>
    </div>
  );
}

// ============================================
// DETAILS TAB
// ============================================

function DetailsTab({ tenant, setTenant, isNew }) {
  const update = (field, value) => setTenant({ ...tenant, [field]: value });
  const updateSettings = (field, value) =>
    setTenant({ ...tenant, settings: { ...tenant.settings, [field]: value } });

  return (
    <div className="admin-form">
      <div className="admin-form-section">
        <h3>Company Information</h3>
        <div className="admin-form-grid">
          <div className="admin-field">
            <label>Company Name *</label>
            <input value={tenant.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. PlaceMakers" />
          </div>
          <div className="admin-field">
            <label>Website</label>
            <input value={tenant.website || ''} onChange={(e) => update('website', e.target.value)} placeholder="https://..." />
          </div>
          <div className="admin-field">
            <label>Contact Name</label>
            <input value={tenant.contact_name || ''} onChange={(e) => update('contact_name', e.target.value)} />
          </div>
          <div className="admin-field">
            <label>Contact Email</label>
            <input type="email" value={tenant.contact_email || ''} onChange={(e) => update('contact_email', e.target.value)} />
          </div>
          <div className="admin-field">
            <label>Phone</label>
            <input type="tel" value={tenant.phone || ''} onChange={(e) => update('phone', e.target.value)} placeholder="e.g. 09 123 4567" />
          </div>
          <div className="admin-field">
            <label>Logo URL</label>
            <input value={tenant.logo_url || ''} onChange={(e) => update('logo_url', e.target.value)} placeholder="https://..." />
          </div>
        </div>
      </div>

      {!isNew && (
        <div className="admin-form-section">
          <h3>Subscription</h3>
          <div className="admin-form-grid">
            <div className="admin-field">
              <label>Status</label>
              <select value={tenant.status} onChange={(e) => update('status', e.target.value)}>
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="admin-field">
              <label>Plan</label>
              <select value={tenant.subscription_plan} onChange={(e) => update('subscription_plan', e.target.value)}>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="admin-form-section">
        <h3>Embed Settings</h3>
        <div className="admin-form-grid">
          <div className="admin-field admin-field--checkbox">
            <label>
              <input
                type="checkbox"
                checked={tenant.settings?.showCosting ?? true}
                onChange={(e) => updateSettings('showCosting', e.target.checked)}
              />
              Show costing ($/m rate, cost per cut)
            </label>
          </div>
          <div className="admin-field admin-field--checkbox">
            <label>
              <input
                type="checkbox"
                checked={tenant.settings?.showJobDetails ?? false}
                onChange={(e) => updateSettings('showJobDetails', e.target.checked)}
              />
              Show job details fields (job #, product, customer)
            </label>
          </div>
          <div className="admin-field admin-field--checkbox">
            <label>
              <input
                type="checkbox"
                checked={tenant.settings?.allowPdfExport ?? true}
                onChange={(e) => updateSettings('allowPdfExport', e.target.checked)}
              />
              Allow PDF export
            </label>
          </div>
          <div className="admin-field admin-field--checkbox">
            <label>
              <input
                type="checkbox"
                checked={tenant.settings?.enableLeadCapture ?? true}
                onChange={(e) => updateSettings('enableLeadCapture', e.target.checked)}
              />
              Require name &amp; email before PDF download
            </label>
          </div>
          <div className="admin-field admin-field--checkbox">
            <label>
              <input
                type="checkbox"
                checked={tenant.settings?.enableSendToYard ?? true}
                onChange={(e) => updateSettings('enableSendToYard', e.target.checked)}
              />
              Show "Send to Yard" enquiry button
            </label>
          </div>
          <div className="admin-field">
            <label>Base Price GST Treatment</label>
            <select
              value={tenant.settings?.gstMode ?? 'excl'}
              onChange={(e) => updateSettings('gstMode', e.target.value)}
            >
              <option value="excl">Prices are GST Exclusive</option>
              <option value="incl">Prices are GST Inclusive</option>
            </select>
          </div>
          <div className="admin-field">
            <label>GST Rate</label>
            <input
              type="number"
              step="0.01"
              value={tenant.settings?.gstRate ?? 0.15}
              onChange={(e) => updateSettings('gstRate', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="admin-field admin-field--full">
            <label>Disclaimer Text</label>
            <textarea
              value={tenant.settings?.disclaimer || ''}
              onChange={(e) => updateSettings('disclaimer', e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PRODUCTS TAB
// ============================================

function ProductsTab({ products, onUpdate, onSave, onAdd, onDelete, supabase }) {
  const [expanded, setExpanded] = useState(null);

  const categories = ['framing', 'decking', 'fencing', 'cladding', 'custom'];

  return (
    <div>
      <div className="admin-section-header">
        <p className="admin-subtitle">{products.length} product{products.length !== 1 ? 's' : ''} in catalogue</p>
        <button onClick={onAdd} className="admin-btn admin-btn--primary admin-btn--sm">
          <Plus size={14} />
          Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="admin-empty">
          <p>No products yet. Add your first product to the catalogue.</p>
        </div>
      ) : (
        <div className="admin-product-list">
          {products.map((product) => (
            <div key={product.id} className={`admin-product-card ${!product.is_active ? 'admin-product-card--inactive' : ''}`}>
              <div className="admin-product-header" onClick={() => setExpanded(expanded === product.id ? null : product.id)}>
                <div className="admin-product-summary">
                  <strong>{product.species} {product.treatment !== 'None' ? product.treatment : ''} {product.profile}</strong>
                  <span className="admin-text-muted">
                    {product.lengths?.length || 0} lengths · ${product.price_per_meter}/m · {product.category}
                  </span>
                </div>
                <div className="admin-product-actions">
                  {!product.is_active && <span className="admin-badge admin-badge--muted">Inactive</span>}
                  {expanded === product.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {expanded === product.id && (
                <div className="admin-product-detail">
                  <div className="admin-form-grid">
                    <div className="admin-field">
                      <label>Species</label>
                      <input
                        value={product.species}
                        onChange={(e) => onUpdate(product.id, { species: e.target.value })}
                      />
                    </div>
                    <div className="admin-field">
                      <label>Treatment</label>
                      <input
                        value={product.treatment}
                        onChange={(e) => onUpdate(product.id, { treatment: e.target.value })}
                        placeholder="e.g. H3.2, None"
                      />
                    </div>
                    <div className="admin-field">
                      <label>Profile</label>
                      <input
                        value={product.profile}
                        onChange={(e) => onUpdate(product.id, { profile: e.target.value })}
                        placeholder="e.g. 90 × 45"
                      />
                    </div>
                    <div className="admin-field">
                      <label>Category</label>
                      <select
                        value={product.category}
                        onChange={(e) => onUpdate(product.id, { category: e.target.value })}
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="admin-field">
                      <label>Price per meter ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={product.price_per_meter}
                        onChange={(e) => onUpdate(product.id, { price_per_meter: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="admin-field admin-field--checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={product.is_active}
                          onChange={(e) => onUpdate(product.id, { is_active: e.target.checked })}
                        />
                        Active
                      </label>
                    </div>
                  </div>

                  <div className="admin-field admin-field--full">
                    <label>Available Lengths (mm, comma-separated)</label>
                    <input
                      value={(product.lengths || []).join(', ')}
                      onChange={(e) => {
                        const lengths = e.target.value
                          .split(/[,\s]+/)
                          .map(v => parseInt(v))
                          .filter(v => !isNaN(v) && v > 0);
                        onUpdate(product.id, { lengths });
                      }}
                      placeholder="2400, 3000, 3600, 4800, 6000"
                    />
                  </div>

                  <div className="admin-field admin-field--full">
                    <label>Product Image</label>
                    <div className="admin-image-upload">
                      {product.image_url && (
                        <img src={product.image_url} alt="" className="admin-image-preview" />
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !supabase) return;
                          const ext = file.name.split('.').pop();
                          const filePath = `${product.tenant_id}/${product.id}-${Date.now()}.${ext}`;
                          const { error } = await supabase.storage
                            .from('product-images')
                            .upload(filePath, file, { upsert: true });
                          if (error) {
                            console.error('Upload failed:', error);
                            return;
                          }
                          const { data: { publicUrl } } = supabase.storage
                            .from('product-images')
                            .getPublicUrl(filePath);
                          onUpdate(product.id, { image_url: publicUrl });
                        }}
                      />
                      {product.image_url && (
                        <button
                          type="button"
                          className="admin-btn admin-btn--sm"
                          onClick={() => onUpdate(product.id, { image_url: null })}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="admin-form-grid" style={{ marginTop: '8px' }}>
                    <div className="admin-field">
                      <label>Default Kerf (mm)</label>
                      <input
                        type="number"
                        value={product.default_kerf || 3}
                        onChange={(e) => onUpdate(product.id, { default_kerf: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="admin-field">
                      <label>Default End Trim (mm)</label>
                      <input
                        type="number"
                        value={product.default_end_trim || 0}
                        onChange={(e) => onUpdate(product.id, { default_end_trim: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="admin-field">
                      <label>Default Min Offcut (mm)</label>
                      <input
                        type="number"
                        value={product.default_min_offcut || 200}
                        onChange={(e) => onUpdate(product.id, { default_min_offcut: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="admin-product-footer">
                    <button onClick={() => onSave(product)} className="admin-btn admin-btn--primary admin-btn--sm">
                      <Save size={14} />
                      Save Product
                    </button>
                    <button
                      onClick={() => { if (confirm('Delete this product?')) onDelete(product.id); }}
                      className="admin-btn admin-btn--danger admin-btn--sm"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// PRESETS TAB
// ============================================

function PresetsTab({ presets, products, onSave, onAdd, onDelete, setPresets }) {
  const [expanded, setExpanded] = useState(null);

  const updatePreset = (presetId, updates) => {
    setPresets(presets.map(p => p.id === presetId ? { ...p, ...updates } : p));
  };

  const updatePresetSettings = (presetId, field, value) => {
    setPresets(presets.map(p =>
      p.id === presetId
        ? { ...p, settings: { ...p.settings, [field]: value } }
        : p
    ));
  };

  const toggleProductInPreset = (presetId, productId) => {
    const preset = presets.find(p => p.id === presetId);
    const ids = preset.product_ids || [];
    const updated = ids.includes(productId)
      ? ids.filter(id => id !== productId)
      : [...ids, productId];
    updatePreset(presetId, { product_ids: updated });
  };

  return (
    <div>
      <div className="admin-section-header">
        <p className="admin-subtitle">{presets.length} preset{presets.length !== 1 ? 's' : ''} configured</p>
        <button onClick={onAdd} className="admin-btn admin-btn--primary admin-btn--sm">
          <Plus size={14} />
          Add Preset
        </button>
      </div>

      {presets.map((preset) => (
        <div key={preset.id} className="admin-product-card">
          <div className="admin-product-header" onClick={() => setExpanded(expanded === preset.id ? null : preset.id)}>
            <div className="admin-product-summary">
              <strong>{preset.name}</strong>
              <span className="admin-text-muted">
                {(preset.product_ids || []).length} products · slug: {preset.slug}
              </span>
            </div>
            {expanded === preset.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>

          {expanded === preset.id && (
            <div className="admin-product-detail">
              <div className="admin-form-grid">
                <div className="admin-field">
                  <label>Name</label>
                  <input
                    value={preset.name}
                    onChange={(e) => updatePreset(preset.id, { name: e.target.value })}
                  />
                </div>
                <div className="admin-field">
                  <label>Slug</label>
                  <input
                    value={preset.slug}
                    onChange={(e) => updatePreset(preset.id, { slug: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-field admin-field--full" style={{ marginTop: '12px' }}>
                <label>Products in this preset</label>
                <div className="admin-checkbox-list">
                  {products.map(p => (
                    <label key={p.id} className="admin-checkbox-item">
                      <input
                        type="checkbox"
                        checked={(preset.product_ids || []).includes(p.id)}
                        onChange={() => toggleProductInPreset(preset.id, p.id)}
                      />
                      {p.species} {p.treatment !== 'None' ? p.treatment : ''} {p.profile}
                    </label>
                  ))}
                </div>
              </div>

              <div className="admin-field" style={{ marginTop: '8px' }}>
                <label>Default Product</label>
                <select
                  value={preset.default_product_id || ''}
                  onChange={(e) => updatePreset(preset.id, { default_product_id: e.target.value || null })}
                >
                  <option value="">None</option>
                  {products
                    .filter(p => (preset.product_ids || []).includes(p.id))
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.species} {p.profile}
                      </option>
                    ))}
                </select>
              </div>

              <div className="admin-form-grid" style={{ marginTop: '12px' }}>
                <div className="admin-field">
                  <label>Kerf (mm)</label>
                  <input
                    type="number"
                    value={preset.settings?.kerf ?? 3}
                    onChange={(e) => updatePresetSettings(preset.id, 'kerf', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="admin-field">
                  <label>Min Offcut (mm)</label>
                  <input
                    type="number"
                    value={preset.settings?.minOffcut ?? 200}
                    onChange={(e) => updatePresetSettings(preset.id, 'minOffcut', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="admin-field">
                  <label>End Trim (mm)</label>
                  <input
                    type="number"
                    value={preset.settings?.endTrim ?? 0}
                    onChange={(e) => updatePresetSettings(preset.id, 'endTrim', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="admin-product-footer">
                <button onClick={() => onSave(preset)} className="admin-btn admin-btn--primary admin-btn--sm">
                  <Save size={14} />
                  Save Preset
                </button>
                <button
                  onClick={() => { if (confirm('Delete this preset?')) onDelete(preset.id); }}
                  className="admin-btn admin-btn--danger admin-btn--sm"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// USERS TAB
// ============================================

function UsersTab({ supabase, tenantId, portalUsers, setPortalUsers }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: '', name: '', password: '', role: 'admin' });
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [resetUserId, setResetUserId] = useState(null);
  const [resetPassword, setResetPassword] = useState('');

  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const createUser = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    if (formData.password.length < 6) {
      showMsg('Error: Password must be at least 6 characters');
      return;
    }

    setCreating(true);
    setMessage('');

    const { data, error } = await supabase.rpc('create_portal_user', {
      p_tenant_id: tenantId,
      p_email: formData.email,
      p_password: formData.password,
      p_name: formData.name || null,
      p_role: formData.role,
    });

    if (error) {
      showMsg(`Error: ${error.message}`);
      setCreating(false);
      return;
    }

    // Refresh the list
    const { data: users } = await supabase
      .from('cut_portal_users')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true });

    setPortalUsers(users || []);
    setFormData({ email: '', name: '', password: '', role: 'admin' });
    setShowForm(false);
    setCreating(false);
    showMsg('User created — they can now log in at portal.shmake.nz');
  };

  const deleteUser = async (userId) => {
    if (!confirm('Delete this portal user? They will lose access to the portal.')) return;

    const { error } = await supabase.rpc('delete_portal_user', {
      p_portal_user_id: userId,
    });

    if (error) {
      showMsg(`Error: ${error.message}`);
      return;
    }

    setPortalUsers(portalUsers.filter(u => u.id !== userId));
    showMsg('User deleted');
  };

  const handleResetPassword = async (userId) => {
    if (!resetPassword || resetPassword.length < 6) {
      showMsg('Error: Password must be at least 6 characters');
      return;
    }

    const { error } = await supabase.rpc('reset_portal_user_password', {
      p_portal_user_id: userId,
      p_new_password: resetPassword,
    });

    if (error) {
      showMsg(`Error: ${error.message}`);
      return;
    }

    setResetUserId(null);
    setResetPassword('');
    showMsg('Password reset');
  };

  return (
    <div>
      <div className="admin-section-header">
        <div>
          <p className="admin-subtitle">
            {portalUsers.length} portal user{portalUsers.length !== 1 ? 's' : ''}
          </p>
          {message && (
            <span className={`admin-save-msg ${message.startsWith('Error') ? 'admin-save-msg--error' : ''}`} style={{ marginLeft: 0, display: 'block', marginTop: 4 }}>
              {message}
            </span>
          )}
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="admin-btn admin-btn--primary admin-btn--sm">
            <Plus size={14} />
            Add User
          </button>
        )}
      </div>

      {/* Add user form */}
      {showForm && (
        <div className="admin-form-section" style={{ marginBottom: 16 }}>
          <h3>New Portal User</h3>
          <form onSubmit={createUser}>
            <div className="admin-form-grid">
              <div className="admin-field">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@company.co.nz"
                  required
                />
              </div>
              <div className="admin-field">
                <label>Name</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="admin-field">
                <label>Password *</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
              </div>
              <div className="admin-field">
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="admin">Admin (full access)</option>
                  <option value="viewer">Viewer (read-only)</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" className="admin-btn admin-btn--primary admin-btn--sm" disabled={creating}>
                <Plus size={14} />
                {creating ? 'Creating...' : 'Create User'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="admin-btn admin-btn--sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User list */}
      {portalUsers.length === 0 && !showForm ? (
        <div className="admin-empty">
          <p>No portal users yet. Add a user to give them access to the tenant portal.</p>
        </div>
      ) : (
        <div className="admin-users-list">
          {portalUsers.map((user) => (
            <div key={user.id} className="admin-user-row">
              <div className="admin-user-info">
                <strong>{user.email}</strong>
                <span className="admin-text-muted">
                  {user.name || 'No name'} · {user.role} · {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="admin-user-actions">
                {/* Reset password */}
                {resetUserId === user.id ? (
                  <div className="admin-user-reset">
                    <input
                      type="text"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="New password"
                      style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 4, width: 140 }}
                    />
                    <button
                      onClick={() => handleResetPassword(user.id)}
                      className="admin-btn admin-btn--primary admin-btn--sm"
                    >
                      Set
                    </button>
                    <button
                      onClick={() => { setResetUserId(null); setResetPassword(''); }}
                      className="admin-btn admin-btn--sm"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setResetUserId(user.id)}
                    className="admin-btn admin-btn--sm"
                    title="Reset password"
                  >
                    <KeyRound size={13} />
                  </button>
                )}

                {/* Delete */}
                <button
                  onClick={() => deleteUser(user.id)}
                  className="admin-btn admin-btn--danger admin-btn--sm"
                  title="Delete user"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// THEME TAB
// ============================================

const DEFAULT_THEME = {
  primary: '#1e3a5f',
  primaryLight: '#2a5a8f',
  accent: '#d97706',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  neutral800: '#262626',
  background: '#ffffff',
  surface: '#f9fafb',
  surfaceAlt: '#f3f4f6',
  border: '#e5e7eb',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  borderRadius: '8px',
  borderRadiusSm: '6px',
};

function ThemeTab({ tenant, setTenant }) {
  const theme = tenant.theme || {};

  const updateTheme = (key, value) => {
    setTenant({ ...tenant, theme: { ...theme, [key]: value } });
  };

  const resetTheme = () => {
    if (confirm('Reset all theme settings to defaults?')) {
      setTenant({ ...tenant, theme: { ...DEFAULT_THEME } });
    }
  };

  const colorFields = [
    { key: 'primary', label: 'Primary' },
    { key: 'primaryLight', label: 'Primary Light' },
    { key: 'accent', label: 'Accent' },
    { key: 'success', label: 'Success (cuts)' },
    { key: 'warning', label: 'Warning (offcuts)' },
    { key: 'error', label: 'Error (scrap)' },
    { key: 'background', label: 'Background' },
    { key: 'surface', label: 'Surface' },
    { key: 'border', label: 'Border' },
    { key: 'textPrimary', label: 'Text Primary' },
    { key: 'textSecondary', label: 'Text Secondary' },
    { key: 'textMuted', label: 'Text Muted' },
  ];

  return (
    <div className="admin-form">
      <div className="admin-form-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h3>Brand Colours</h3>
          <button onClick={resetTheme} className="admin-btn admin-btn--sm" title="Reset all theme values to defaults">
            Reset to Defaults
          </button>
        </div>
        <p className="admin-subtitle" style={{ marginBottom: '12px' }}>
          These colours control the look of the embedded calculator on the wholesaler's site.
        </p>
        <div className="admin-color-grid">
          {colorFields.map(({ key, label }) => (
            <div key={key} className="admin-color-field">
              <label>{label}</label>
              <div className="admin-color-input">
                <input
                  type="color"
                  value={theme[key] || '#000000'}
                  onChange={(e) => updateTheme(key, e.target.value)}
                />
                <input
                  type="text"
                  value={theme[key] || ''}
                  onChange={(e) => updateTheme(key, e.target.value)}
                  placeholder="#000000"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-form-section">
        <h3>Typography & Spacing</h3>
        <div className="admin-form-grid">
          <div className="admin-field admin-field--full">
            <label>Font Family</label>
            <input
              value={theme.fontFamily || ''}
              onChange={(e) => updateTheme('fontFamily', e.target.value)}
              placeholder='-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            />
          </div>
          <div className="admin-field">
            <label>Border Radius</label>
            <input
              value={theme.borderRadius || '8px'}
              onChange={(e) => updateTheme('borderRadius', e.target.value)}
            />
          </div>
          <div className="admin-field">
            <label>Border Radius (Small)</label>
            <input
              value={theme.borderRadiusSm || '6px'}
              onChange={(e) => updateTheme('borderRadiusSm', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Live preview swatch */}
      <div className="admin-form-section">
        <h3>Preview</h3>
        <div
          className="admin-theme-preview"
          style={{
            background: theme.background,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.borderRadius,
            padding: '16px',
            fontFamily: theme.fontFamily,
          }}
        >
          <div style={{ color: theme.textPrimary, fontWeight: 600, marginBottom: 4 }}>Calculator Preview</div>
          <div style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 12 }}>This shows how the theme colours look together</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ padding: '6px 14px', background: theme.primary, color: '#fff', borderRadius: theme.borderRadiusSm, fontSize: 13 }}>Calculate</div>
            <div style={{ padding: '6px 14px', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: theme.borderRadiusSm, fontSize: 13, color: theme.textSecondary }}>Export PDF</div>
          </div>
          <div style={{ display: 'flex', gap: 6, height: 24, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ flex: 4, background: theme.success }} />
            <div style={{ flex: 0.2, background: theme.neutral800 || '#262626' }} />
            <div style={{ flex: 3, background: theme.success }} />
            <div style={{ flex: 1, background: theme.warning }} />
            <div style={{ flex: 0.5, background: theme.error, opacity: 0.7 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EMBED TAB
// ============================================

function EmbedTab({ tenant, copiedEmbed, setCopiedEmbed }) {
  const embedCode = `<!-- shmakeCut Cutting Calculator -->
<div id="shmakecut"></div>
<script src="https://app.shmakecut.co.nz/embed/shmakecut.iife.js" data-key="${tenant.embed_key}"></script>`;

  const copyCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  return (
    <div className="admin-form">
      <div className="admin-form-section">
        <h3>Embed Code</h3>
        <p className="admin-subtitle" style={{ marginBottom: '12px' }}>
          Copy this code and paste it into the wholesaler's website where they want the calculator to appear.
        </p>

        <div className="admin-embed-code-block">
          <div className="admin-embed-code-header">
            <span>HTML</span>
            <button onClick={copyCode} className="admin-btn admin-btn--sm">
              {copiedEmbed ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
          <pre className="admin-embed-pre">{embedCode}</pre>
        </div>
      </div>

      <div className="admin-form-section">
        <h3>Embed Key</h3>
        <div className="admin-embed-key-display">
          <code>{tenant.embed_key}</code>
        </div>
        <p className="admin-subtitle" style={{ marginTop: 8 }}>
          This key identifies the tenant. Keep it confidential — anyone with this key can embed the calculator with this tenant's branding.
        </p>
      </div>

      <div className="admin-form-section">
        <h3>Testing</h3>
        <p className="admin-subtitle">
          To preview the embed locally, open the demo page at:
        </p>
        <code className="admin-embed-key-display" style={{ marginTop: 8, display: 'block' }}>
          {window.location.origin}/cut?embed_key={tenant.embed_key}
        </code>
      </div>
    </div>
  );
}
