import { useState, useEffect } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

const THEME_FIELDS = [
  { key: 'primary', label: 'Primary colour' },
  { key: 'primaryText', label: 'Primary text' },
  { key: 'accent', label: 'Accent colour' },
  { key: 'accentText', label: 'Accent text' },
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'text', label: 'Text' },
  { key: 'textMuted', label: 'Text muted' },
  { key: 'border', label: 'Border' },
];

export default function Embed({ supabase, tenant }) {
  const [settings, setSettings] = useState(tenant.settings || {});
  const [theme, setTheme] = useState(tenant.theme || {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const embedCode = `<div id="shmakecut" data-key="${tenant.embed_key}"></div>\n<script src="https://widget.shmake.nz/shmakecut.iife.js"></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('cut_tenants')
      .update({ settings, theme })
      .eq('id', tenant.id);

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateTheme = (key, value) => {
    setTheme(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="portal-page">
      <div className="portal-page-header">
        <h1>Embed</h1>
        <span className="portal-page-subtitle">Install the calculator on your website</span>
      </div>

      {/* Embed code */}
      <div className="portal-card">
        <div className="portal-card-header">
          <span>Embed code</span>
          <button className="portal-btn portal-btn--sm" onClick={handleCopy}>
            {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
        <pre className="portal-code-block">{embedCode}</pre>
        <div className="portal-card-footer-hint">
          Paste this into your website's HTML where you want the calculator to appear.
        </div>
      </div>

      {/* Installation guide */}
      <div className="portal-card">
        <div className="portal-card-header">
          <span>Installation</span>
        </div>
        <div className="portal-install-steps">
          <div className="portal-install-step">
            <span className="portal-step-num">1</span>
            <div>
              <strong>WordPress</strong> — Edit your page, add a Custom HTML block, paste the code.
            </div>
          </div>
          <div className="portal-install-step">
            <span className="portal-step-num">2</span>
            <div>
              <strong>Shopify</strong> — Edit the page template, add a Custom Liquid section, paste the code.
            </div>
          </div>
          <div className="portal-install-step">
            <span className="portal-step-num">3</span>
            <div>
              <strong>Squarespace</strong> — Add a Code block to your page, paste the code.
            </div>
          </div>
          <div className="portal-install-step">
            <span className="portal-step-num">4</span>
            <div>
              <strong>Other</strong> — Paste the code before the closing <code>&lt;/body&gt;</code> tag.
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="portal-card">
        <div className="portal-card-header">
          <span>Widget settings</span>
        </div>
        <div className="portal-settings-grid">
          <label className="portal-setting-row">
            <span>Show costing</span>
            <input
              type="checkbox"
              checked={settings.showCosting !== false}
              onChange={(e) => updateSetting('showCosting', e.target.checked)}
            />
          </label>
          <label className="portal-setting-row">
            <span>Lead capture (require email for PDF export)</span>
            <input
              type="checkbox"
              checked={settings.enableLeadCapture !== false}
              onChange={(e) => updateSetting('enableLeadCapture', e.target.checked)}
            />
          </label>
          <label className="portal-setting-row">
            <span>"Send to {tenant.name}" button</span>
            <input
              type="checkbox"
              checked={settings.enableSendToYard !== false}
              onChange={(e) => updateSetting('enableSendToYard', e.target.checked)}
            />
          </label>
          <label className="portal-setting-row">
            <span>Show job details fields</span>
            <input
              type="checkbox"
              checked={settings.showJobDetails !== false}
              onChange={(e) => updateSetting('showJobDetails', e.target.checked)}
            />
          </label>
          <label className="portal-setting-row">
            <span>Allow PDF export</span>
            <input
              type="checkbox"
              checked={settings.allowPdfExport !== false}
              onChange={(e) => updateSetting('allowPdfExport', e.target.checked)}
            />
          </label>

          <div className="portal-setting-divider" />

          <div className="portal-field">
            <label>Notification email</label>
            <input
              type="email"
              value={settings.notificationEmail || tenant.contact_email || ''}
              onChange={(e) => updateSetting('notificationEmail', e.target.value)}
              placeholder="Where to send lead notifications"
            />
          </div>

          <div className="portal-field">
            <label>GST mode</label>
            <select
              value={settings.gstMode || 'exclusive'}
              onChange={(e) => updateSetting('gstMode', e.target.value)}
            >
              <option value="exclusive">Exclusive (add GST)</option>
              <option value="inclusive">Inclusive (GST included)</option>
              <option value="none">No GST</option>
            </select>
          </div>
        </div>
      </div>

      {/* Theme */}
      <div className="portal-card">
        <div className="portal-card-header">
          <span>Theme colours</span>
        </div>
        <div className="portal-color-grid">
          {THEME_FIELDS.map(field => (
            <div key={field.key} className="portal-color-field">
              <label>{field.label}</label>
              <div className="portal-color-input">
                <input
                  type="color"
                  value={theme[field.key] || '#1e3a5f'}
                  onChange={(e) => updateTheme(field.key, e.target.value)}
                />
                <input
                  type="text"
                  value={theme[field.key] || ''}
                  onChange={(e) => updateTheme(field.key, e.target.value)}
                  placeholder="#1e3a5f"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="portal-save-bar">
        <button
          className="portal-btn portal-btn--primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {saved && <span className="portal-save-msg">Settings saved</span>}
      </div>
    </div>
  );
}
