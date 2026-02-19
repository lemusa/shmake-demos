import { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronRight, Ruler, Package, Scissors } from 'lucide-react';

const STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'];
const STATUS_COLORS = {
  new: '#3b82f6',
  contacted: '#f59e0b',
  quoted: '#8b5cf6',
  won: '#22c55e',
  lost: '#9ca3af',
};

function formatLength(mm) {
  return mm >= 1000 ? `${(mm / 1000).toFixed(mm % 1000 === 0 ? 0 : 1)}m` : `${mm}mm`;
}

function LeadDetail({ lead }) {
  const spec = lead.specification || {};
  const cutList = lead.cut_list || {};

  // General mode
  const isGeneral = !!(spec.selectedProduct || spec.requiredCuts || spec.jobDetails);
  // Fencing mode
  const isFencing = !!spec.fenceSpec;
  // Walls mode
  const isWalls = !!spec.wallSpec;

  return (
    <div className="portal-lead-detail">
      {/* Contact info */}
      <div className="portal-lead-detail-grid">
        <div>
          <label>Email</label>
          <div>{lead.email}</div>
        </div>
        <div>
          <label>Phone</label>
          <div>{lead.phone || '—'}</div>
        </div>
        <div>
          <label>Source</label>
          <div>{lead.capture_point === 'pdf_export' ? 'PDF export' : 'Send to yard'}</div>
        </div>
        <div>
          <label>Mode</label>
          <div style={{ textTransform: 'capitalize' }}>{lead.mode || '—'}</div>
        </div>
      </div>

      {lead.notes && (
        <div className="portal-lead-detail-section">
          <label>Customer message</label>
          <div className="portal-lead-notes">{lead.notes}</div>
        </div>
      )}

      {/* General mode details */}
      {isGeneral && (
        <>
          {spec.selectedProduct && (
            <div className="portal-lead-detail-section">
              <label>Product</label>
              <div className="portal-lead-product-card">
                <strong>{spec.jobDetails?.productName || spec.selectedProduct.name || spec.selectedProduct.profile}</strong>
                {spec.selectedProduct.treatment && spec.selectedProduct.treatment !== 'None' && (
                  <span className="portal-badge portal-badge--treatment">{spec.selectedProduct.treatment}</span>
                )}
              </div>
            </div>
          )}
          {spec.requiredCuts && spec.requiredCuts.length > 0 && (
            <div className="portal-lead-detail-section">
              <label>Required cuts</label>
              <div className="portal-lead-cuts-table">
                <div className="portal-lead-cuts-header">
                  <span>Length</span>
                  <span>Qty</span>
                  {spec.requiredCuts[0]?.label && <span>Label</span>}
                </div>
                {spec.requiredCuts.map((cut, i) => (
                  <div key={i} className="portal-lead-cuts-row">
                    <span>{formatLength(cut.length)}</span>
                    <span>{cut.qty}</span>
                    {cut.label && <span className="portal-lead-cuts-label">{cut.label}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {cutList.result?.summary && (() => {
            const s = cutList.result.summary;
            // stockUsed is an object like {2400: 3, 3600: 2}
            const stockEntries = s.stockUsed && typeof s.stockUsed === 'object'
              ? Object.entries(s.stockUsed)
              : [];
            return (
              <div className="portal-lead-detail-section">
                <label>Cutting summary</label>
                <div className="portal-lead-summary-grid">
                  <div className="portal-lead-summary-stat">
                    <span className="portal-lead-summary-value">{s.totalPieces ?? '—'}</span>
                    <span className="portal-lead-summary-label">Stock pieces</span>
                  </div>
                  <div className="portal-lead-summary-stat">
                    <span className="portal-lead-summary-value">{s.overallEfficiency}%</span>
                    <span className="portal-lead-summary-label">Efficiency</span>
                  </div>
                  {s.totalStockCost > 0 && (
                    <div className="portal-lead-summary-stat">
                      <span className="portal-lead-summary-value">${Number(s.totalStockCost).toFixed(2)}</span>
                      <span className="portal-lead-summary-label">Est. cost</span>
                    </div>
                  )}
                </div>
                {stockEntries.length > 0 && (
                  <div className="portal-lead-stock-breakdown">
                    <label>Stock breakdown</label>
                    <div className="portal-lead-stock-list">
                      {stockEntries.map(([len, qty]) => (
                        <span key={len} className="portal-badge">{qty}× {formatLength(Number(len))}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}

      {/* Fencing mode details */}
      {isFencing && (
        <>
          <div className="portal-lead-detail-section">
            <label>Fence specification</label>
            <div className="portal-lead-summary-grid">
              {spec.fenceSpec?.sections?.map((s, i) => (
                <div key={i} className="portal-lead-summary-stat">
                  <span className="portal-lead-summary-value">{formatLength(s.length)}</span>
                  <span className="portal-lead-summary-label">Section {i + 1} · {formatLength(s.height)} high</span>
                </div>
              ))}
            </div>
          </div>
          {cutList.combinedSummary && (
            <div className="portal-lead-detail-section">
              <label>Materials summary</label>
              <div className="portal-lead-summary-grid">
                <div className="portal-lead-summary-stat">
                  <span className="portal-lead-summary-value">{cutList.combinedSummary.totalLengthM?.toFixed(1) ?? '—'}m</span>
                  <span className="portal-lead-summary-label">Total fence</span>
                </div>
                {cutList.combinedSummary.totalPosts > 0 && (
                  <div className="portal-lead-summary-stat">
                    <span className="portal-lead-summary-value">{cutList.combinedSummary.totalPosts}</span>
                    <span className="portal-lead-summary-label">Posts</span>
                  </div>
                )}
                {cutList.combinedSummary.totalPalings > 0 && (
                  <div className="portal-lead-summary-stat">
                    <span className="portal-lead-summary-value">{cutList.combinedSummary.totalPalings}</span>
                    <span className="portal-lead-summary-label">Palings</span>
                  </div>
                )}
                {cutList.combinedSummary.totalCost > 0 && (
                  <div className="portal-lead-summary-stat">
                    <span className="portal-lead-summary-value">${Number(cutList.combinedSummary.totalCost).toFixed(2)}</span>
                    <span className="portal-lead-summary-label">Est. cost</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Walls mode details */}
      {isWalls && (
        <>
          <div className="portal-lead-detail-section">
            <label>Wall specification</label>
            <div className="portal-lead-summary-grid">
              {spec.wallSpec?.walls?.map((w, i) => (
                <div key={i} className="portal-lead-summary-stat">
                  <span className="portal-lead-summary-value">{formatLength(w.length)} × {formatLength(w.height)}</span>
                  <span className="portal-lead-summary-label">
                    Wall {i + 1}
                    {w.openings?.length > 0 && ` · ${w.openings.length} opening${w.openings.length !== 1 ? 's' : ''}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {cutList.combinedSummary && (
            <div className="portal-lead-detail-section">
              <label>Materials summary</label>
              <div className="portal-lead-summary-grid">
                {cutList.combinedSummary.wallCount > 0 && (
                  <div className="portal-lead-summary-stat">
                    <span className="portal-lead-summary-value">{cutList.combinedSummary.wallCount}</span>
                    <span className="portal-lead-summary-label">Walls</span>
                  </div>
                )}
                {cutList.combinedSummary.openingCount > 0 && (
                  <div className="portal-lead-summary-stat">
                    <span className="portal-lead-summary-value">{cutList.combinedSummary.openingCount}</span>
                    <span className="portal-lead-summary-label">Openings</span>
                  </div>
                )}
                {cutList.combinedSummary.totalCost > 0 && (
                  <div className="portal-lead-summary-stat">
                    <span className="portal-lead-summary-value">${Number(cutList.combinedSummary.totalCost).toFixed(2)}</span>
                    <span className="portal-lead-summary-label">Est. cost</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Job details if present */}
      {spec.jobDetails && (spec.jobDetails.customer || spec.jobDetails.jobNumber) && (
        <div className="portal-lead-detail-section">
          <label>Job details</label>
          <div className="portal-lead-detail-grid">
            {spec.jobDetails.customer && (
              <div>
                <label>Customer</label>
                <div>{spec.jobDetails.customer}</div>
              </div>
            )}
            {spec.jobDetails.jobNumber && (
              <div>
                <label>Job number</label>
                <div>{spec.jobDetails.jobNumber}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Leads({ supabase, tenant }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLeads();
  }, [tenant.id]);

  const loadLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cut_leads')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    if (!error) setLeads(data || []);
    setLoading(false);
  };

  const updateStatus = async (leadId, newStatus) => {
    const { error } = await supabase
      .from('cut_leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (!error) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    }
  };

  const filtered = leads.filter(lead => {
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        lead.name?.toLowerCase().includes(q) ||
        lead.email?.toLowerCase().includes(q) ||
        lead.summary_text?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return <div className="portal-page-loading">Loading leads...</div>;
  }

  return (
    <div className="portal-page">
      <div className="portal-page-header">
        <h1>Leads</h1>
        <span className="portal-page-subtitle">{leads.length} total</span>
      </div>

      {/* Filters */}
      <div className="portal-filters">
        <div className="portal-search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search name, email, project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="portal-filter-pills">
          <button
            className={`portal-pill ${statusFilter === 'all' ? 'portal-pill--active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          {STATUSES.map(s => (
            <button
              key={s}
              className={`portal-pill ${statusFilter === s ? 'portal-pill--active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="portal-card">
          <div className="portal-card-empty">
            {leads.length === 0
              ? 'No leads yet. They\'ll appear here once customers submit enquiries.'
              : 'No leads match your filters.'}
          </div>
        </div>
      ) : (
        <div className="portal-table">
          <div className="portal-table-header portal-leads-grid">
            <span></span>
            <span>Date</span>
            <span>Name</span>
            <span>Contact</span>
            <span>Project</span>
            <span>Value</span>
            <span>Status</span>
          </div>
          {filtered.map(lead => {
            const isExpanded = expandedId === lead.id;
            return (
              <div key={lead.id} className="portal-table-row-wrap">
                <div
                  className="portal-table-row portal-leads-grid"
                  onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                >
                  <span className="portal-expand-icon">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                  <span className="portal-cell-date">
                    {new Date(lead.created_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="portal-cell-name">{lead.name}</span>
                  <span className="portal-cell-email">{lead.email}</span>
                  <span className="portal-cell-summary">{lead.summary_text || lead.mode || '—'}</span>
                  <span className="portal-cell-value">
                    {lead.estimated_value > 0 ? `$${Number(lead.estimated_value).toFixed(0)}` : '—'}
                  </span>
                  <span>
                    <select
                      className="portal-status-select"
                      value={lead.status}
                      onChange={(e) => { e.stopPropagation(); updateStatus(lead.id, e.target.value); }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: STATUS_COLORS[lead.status] }}
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </span>
                </div>

                {isExpanded && (
                  <LeadDetail lead={lead} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
