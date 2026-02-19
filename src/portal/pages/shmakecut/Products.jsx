import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

const CATEGORIES = ['framing', 'posts', 'palings', 'rails', 'decking', 'battens', 'capping'];

const EMPTY_PRODUCT = {
  name: '',
  species: 'Radiata Pine',
  treatment: 'H3.2',
  grade: '',
  profile: '',
  category: 'framing',
  lengths: [2400, 3000, 3600, 4800, 6000],
  price_per_meter: 0,
  image_url: '',
  is_active: true,
  sort_order: 0,
};

export default function Products({ supabase, tenant }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editing, setEditing] = useState(null); // null | product object (with or without id)
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadProducts();
  }, [tenant.id]);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cut_products')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('category')
      .order('sort_order')
      .order('name');

    if (!error) setProducts(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);

    const payload = {
      tenant_id: tenant.id,
      name: editing.name,
      species: editing.species,
      treatment: editing.treatment,
      grade: editing.grade || null,
      profile: editing.profile,
      category: editing.category,
      lengths: editing.lengths,
      price_per_meter: Number(editing.price_per_meter) || 0,
      image_url: editing.image_url || null,
      is_active: editing.is_active,
      sort_order: editing.sort_order || 0,
    };

    let error;
    if (editing.id) {
      // Update
      ({ error } = await supabase
        .from('cut_products')
        .update(payload)
        .eq('id', editing.id));
    } else {
      // Insert
      ({ error } = await supabase
        .from('cut_products')
        .insert(payload));
    }

    setSaving(false);
    if (!error) {
      setEditing(null);
      loadProducts();
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('cut_products')
      .delete()
      .eq('id', id);

    if (!error) {
      setDeleteConfirm(null);
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const toggleActive = async (product) => {
    const newActive = !product.is_active;
    const { error } = await supabase
      .from('cut_products')
      .update({ is_active: newActive })
      .eq('id', product.id);

    if (!error) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: newActive } : p));
    }
  };

  const filtered = categoryFilter === 'all'
    ? products
    : products.filter(p => p.category === categoryFilter);

  if (loading) {
    return <div className="portal-page-loading">Loading products...</div>;
  }

  return (
    <div className="portal-page">
      <div className="portal-page-header">
        <div>
          <h1>Products</h1>
          <span className="portal-page-subtitle">{products.length} products in your catalogue</span>
        </div>
        <button
          className="portal-btn portal-btn--primary"
          onClick={() => setEditing({ ...EMPTY_PRODUCT })}
        >
          <Plus size={14} /> Add product
        </button>
      </div>

      {/* Category filter */}
      <div className="portal-filter-pills">
        <button
          className={`portal-pill ${categoryFilter === 'all' ? 'portal-pill--active' : ''}`}
          onClick={() => setCategoryFilter('all')}
        >
          All ({products.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = products.filter(p => p.category === cat).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              className={`portal-pill ${categoryFilter === cat ? 'portal-pill--active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Product list */}
      {filtered.length === 0 ? (
        <div className="portal-card">
          <div className="portal-card-empty">No products yet. Add your first product to get started.</div>
        </div>
      ) : (
        <div className="portal-product-list">
          {filtered.map(product => (
            <div key={product.id} className={`portal-product-row ${!product.is_active ? 'portal-product-row--inactive' : ''}`}>
              <div className="portal-product-thumb">
                {product.image_url ? (
                  <img src={product.image_url} alt="" />
                ) : (
                  <div className="portal-product-thumb-placeholder" />
                )}
              </div>
              <div className="portal-product-info">
                <div className="portal-product-name">{product.name}</div>
                <div className="portal-product-meta">
                  <span className="portal-badge portal-badge--dim">{product.profile}</span>
                  {product.treatment && product.treatment !== 'None' && (
                    <span className="portal-badge portal-badge--treatment">{product.treatment}</span>
                  )}
                  {product.grade && product.grade !== '—' && (
                    <span className="portal-badge portal-badge--grade">{product.grade}</span>
                  )}
                  <span className="portal-product-category">{product.category}</span>
                </div>
              </div>
              <div className="portal-product-price">
                {product.price_per_meter > 0 ? `$${Number(product.price_per_meter).toFixed(2)}/m` : '—'}
              </div>
              <div className="portal-product-lengths">
                {Array.isArray(product.lengths) ? product.lengths.map(l => `${l / 1000}m`).join(', ') : '—'}
              </div>
              <div className="portal-product-actions">
                <label className="portal-toggle" title={product.is_active ? 'Active' : 'Inactive'}>
                  <input
                    type="checkbox"
                    checked={product.is_active}
                    onChange={() => toggleActive(product)}
                  />
                  <span className="portal-toggle-slider" />
                </label>
                <button className="portal-btn portal-btn--icon" onClick={() => setEditing({ ...product })} title="Edit">
                  <Pencil size={14} />
                </button>
                <button className="portal-btn portal-btn--icon portal-btn--danger-icon" onClick={() => setDeleteConfirm(product.id)} title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="portal-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="portal-modal portal-modal--sm" onClick={(e) => e.stopPropagation()}>
            <h3>Delete product?</h3>
            <p>This will permanently remove this product from your catalogue.</p>
            <div className="portal-modal-actions">
              <button className="portal-btn" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="portal-btn portal-btn--danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add modal */}
      {editing && (
        <div className="portal-modal-overlay" onClick={() => setEditing(null)}>
          <div className="portal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="portal-modal-header">
              <h3>{editing.id ? 'Edit Product' : 'Add Product'}</h3>
              <button className="portal-btn portal-btn--icon" onClick={() => setEditing(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="portal-modal-body">
              <div className="portal-form-grid">
                <div className="portal-field">
                  <label>Name</label>
                  <input
                    value={editing.name}
                    onChange={(e) => setEditing(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Radiata Pine H3.2 90×45"
                  />
                </div>
                <div className="portal-field">
                  <label>Profile (dimensions)</label>
                  <input
                    value={editing.profile}
                    onChange={(e) => setEditing(prev => ({ ...prev, profile: e.target.value }))}
                    placeholder="e.g. 90 × 45"
                  />
                </div>
                <div className="portal-field">
                  <label>Category</label>
                  <select
                    value={editing.category}
                    onChange={(e) => setEditing(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="portal-field">
                  <label>Species</label>
                  <input
                    value={editing.species}
                    onChange={(e) => setEditing(prev => ({ ...prev, species: e.target.value }))}
                    placeholder="e.g. Radiata Pine"
                  />
                </div>
                <div className="portal-field">
                  <label>Treatment</label>
                  <input
                    value={editing.treatment}
                    onChange={(e) => setEditing(prev => ({ ...prev, treatment: e.target.value }))}
                    placeholder="e.g. H3.2, None"
                  />
                </div>
                <div className="portal-field">
                  <label>Grade</label>
                  <input
                    value={editing.grade || ''}
                    onChange={(e) => setEditing(prev => ({ ...prev, grade: e.target.value }))}
                    placeholder="e.g. MSG8, LVL11"
                  />
                </div>
                <div className="portal-field">
                  <label>Price per metre ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editing.price_per_meter}
                    onChange={(e) => setEditing(prev => ({ ...prev, price_per_meter: e.target.value }))}
                  />
                </div>
                <div className="portal-field">
                  <label>Sort order</label>
                  <input
                    type="number"
                    value={editing.sort_order || 0}
                    onChange={(e) => setEditing(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="portal-field portal-field--full">
                  <label>Stock lengths (mm, comma-separated)</label>
                  <input
                    value={(Array.isArray(editing.lengths) ? editing.lengths : []).join(', ')}
                    onChange={(e) => {
                      const lengths = e.target.value
                        .split(',')
                        .map(s => parseInt(s.trim()))
                        .filter(n => !isNaN(n) && n > 0);
                      setEditing(prev => ({ ...prev, lengths }));
                    }}
                    placeholder="e.g. 2400, 3000, 3600, 4800, 6000"
                  />
                </div>
                <div className="portal-field portal-field--full">
                  <label>Image URL</label>
                  <input
                    value={editing.image_url || ''}
                    onChange={(e) => setEditing(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="/images/profiles/profile-framing-90x45.svg"
                  />
                </div>
              </div>
            </div>
            <div className="portal-modal-footer">
              <button className="portal-btn" onClick={() => setEditing(null)}>Cancel</button>
              <button
                className="portal-btn portal-btn--primary"
                onClick={handleSave}
                disabled={saving || !editing.name || !editing.profile}
              >
                {saving ? 'Saving...' : editing.id ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
