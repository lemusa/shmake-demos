import { useState, useEffect } from 'react';
import { Calculator, FileDown, Mail, TrendingUp, Clock, Wifi, WifiOff } from 'lucide-react';

export default function Overview({ supabase, tenant }) {
  const [stats, setStats] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [dailyCounts, setDailyCounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tenant.id]);

  const loadData = async () => {
    setLoading(true);

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);

    // Parallel queries
    const [eventsRes, leadsRes, recentLeadsRes] = await Promise.all([
      // Events this week
      supabase
        .from('cut_analytics_events')
        .select('event_type, created_at')
        .eq('tenant_id', tenant.id)
        .gte('created_at', weekAgo.toISOString()),
      // Leads this week
      supabase
        .from('cut_leads')
        .select('id, created_at')
        .eq('tenant_id', tenant.id)
        .gte('created_at', weekAgo.toISOString()),
      // Recent leads (last 5)
      supabase
        .from('cut_leads')
        .select('id, name, email, mode, summary_text, estimated_value, status, created_at')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const events = eventsRes.data || [];
    const weekLeads = leadsRes.data || [];
    const recent = recentLeadsRes.data || [];

    const calculations = events.filter(e => e.event_type === 'calculation_completed').length;
    const pdfExports = events.filter(e => e.event_type === 'pdf_requested').length;
    const enquiries = weekLeads.length;

    // Check embed status — any session_started in last 7 days
    const sessions = events.filter(e => e.event_type === 'session_started').length;
    const embedLive = sessions > 0;

    setStats({ calculations, pdfExports, enquiries, embedLive, sessions });
    setRecentLeads(recent);

    // Daily counts for last 30 days
    const { data: monthEvents } = await supabase
      .from('cut_analytics_events')
      .select('event_type, created_at')
      .eq('tenant_id', tenant.id)
      .eq('event_type', 'calculation_completed')
      .gte('created_at', monthAgo.toISOString());

    const countsByDay = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      countsByDay[d.toISOString().split('T')[0]] = 0;
    }
    (monthEvents || []).forEach(e => {
      const day = e.created_at.split('T')[0];
      if (countsByDay[day] !== undefined) countsByDay[day]++;
    });
    setDailyCounts(Object.entries(countsByDay).map(([date, count]) => ({ date, count })));

    setLoading(false);
  };

  if (loading) {
    return <div className="portal-page-loading">Loading overview...</div>;
  }

  const maxCount = Math.max(1, ...dailyCounts.map(d => d.count));

  const STATUS_COLORS = {
    new: '#3b82f6',
    contacted: '#f59e0b',
    quoted: '#8b5cf6',
    won: '#22c55e',
    lost: '#9ca3af',
  };

  return (
    <div className="portal-page">
      <div className="portal-page-header">
        <h1>Overview</h1>
        <span className="portal-page-subtitle">This week's activity</span>
      </div>

      {/* Stat cards */}
      <div className="portal-stat-grid">
        <div className="portal-stat-card">
          <div className="portal-stat-icon"><Calculator size={20} /></div>
          <div className="portal-stat-value">{stats.calculations}</div>
          <div className="portal-stat-label">Calculations</div>
        </div>
        <div className="portal-stat-card">
          <div className="portal-stat-icon"><FileDown size={20} /></div>
          <div className="portal-stat-value">{stats.pdfExports}</div>
          <div className="portal-stat-label">PDF exports</div>
        </div>
        <div className="portal-stat-card">
          <div className="portal-stat-icon"><Mail size={20} /></div>
          <div className="portal-stat-value">{stats.enquiries}</div>
          <div className="portal-stat-label">Enquiries</div>
        </div>
        <div className="portal-stat-card">
          <div className="portal-stat-icon">
            {stats.embedLive ? <Wifi size={20} /> : <WifiOff size={20} />}
          </div>
          <div className={`portal-stat-value ${stats.embedLive ? 'portal-stat-value--live' : 'portal-stat-value--offline'}`}>
            {stats.embedLive ? 'Live' : 'Inactive'}
          </div>
          <div className="portal-stat-label">
            {stats.embedLive ? `${stats.sessions} sessions this week` : 'No sessions detected'}
          </div>
        </div>
      </div>

      {/* 30-day trend */}
      <div className="portal-card">
        <div className="portal-card-header">
          <TrendingUp size={16} />
          <span>Calculations — last 30 days</span>
        </div>
        <div className="portal-chart">
          {dailyCounts.map((d, i) => (
            <div key={d.date} className="portal-chart-bar-wrap" title={`${d.date}: ${d.count}`}>
              <div
                className="portal-chart-bar"
                style={{ height: `${Math.max(2, (d.count / maxCount) * 100)}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Recent leads */}
      <div className="portal-card">
        <div className="portal-card-header">
          <Clock size={16} />
          <span>Recent leads</span>
        </div>
        {recentLeads.length === 0 ? (
          <div className="portal-card-empty">No leads yet. They'll appear here once customers use your calculator.</div>
        ) : (
          <div className="portal-leads-list">
            {recentLeads.map(lead => (
              <div key={lead.id} className="portal-lead-row">
                <div className="portal-lead-info">
                  <span className="portal-lead-name">{lead.name}</span>
                  <span className="portal-lead-detail">
                    {lead.summary_text || lead.mode || '—'}
                    {lead.estimated_value > 0 && ` · $${Number(lead.estimated_value).toFixed(0)}`}
                  </span>
                </div>
                <div className="portal-lead-meta">
                  <span
                    className="portal-status-badge"
                    style={{ background: `${STATUS_COLORS[lead.status] || '#9ca3af'}20`, color: STATUS_COLORS[lead.status] || '#9ca3af' }}
                  >
                    {lead.status}
                  </span>
                  <span className="portal-lead-date">
                    {new Date(lead.created_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
