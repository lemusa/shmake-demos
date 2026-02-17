import { useState } from 'react';
import { Download, Send, X, ChevronDown } from 'lucide-react';

export default function LeadCaptureModal({ tenantName, enableSendToYard, onSubmit, onClose }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [showSendToYard, setShowSendToYard] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const validEmail = email.trim() && email.includes('@');
  const canDownload = validEmail;
  const canSend = validEmail && name.trim();

  const handleSubmit = async (action) => {
    if (action === 'pdf' && !canDownload) return;
    if (action === 'send_to_yard' && !canSend) return;
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        action,
        email: email.trim(),
        name: name.trim() || null,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      });
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !submitting) {
      e.preventDefault();
      if (showSendToYard && canSend) {
        handleSubmit('send_to_yard');
      } else if (canDownload) {
        handleSubmit('pdf');
      }
    }
  };

  return (
    <div className="tc-modal-overlay" onClick={onClose}>
      <div className="tc-modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="tc-modal-header">
          <h2>Download Your Cutting Plan</h2>
          <button onClick={onClose} className="tc-btn tc-btn--icon"><X size={16} /></button>
        </div>
        <div className="tc-modal-body">
          <p className="tc-lead-subtitle">
            Enter your email — your PDF will download straight away.
          </p>

          <div className="tc-lead-field">
            <label>Email <span className="tc-lead-required">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoFocus
            />
          </div>

          {enableSendToYard && !showSendToYard && (
            <button
              type="button"
              className="tc-lead-expand"
              onClick={() => setShowSendToYard(true)}
            >
              <span>Want {tenantName} to get in touch?</span>
              <ChevronDown size={14} />
            </button>
          )}

          {showSendToYard && (
            <div className="tc-lead-sendyard">
              <p className="tc-lead-sendyard__intro">
                Fill in a few more details and we'll send your cutting plan to {tenantName} as an enquiry.
              </p>

              <div className="tc-lead-field">
                <label>Name <span className="tc-lead-required">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="tc-lead-field">
                <label>Phone <span className="tc-lead-optional">(optional)</span></label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 027 123 4567"
                />
              </div>

              <div className="tc-lead-field">
                <label>Message to {tenantName} <span className="tc-lead-optional">(optional)</span></label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Can you deliver to Rangiora?"
                  rows={3}
                />
              </div>

              <p className="tc-lead-consent">
                Your details will be shared with {tenantName} so they can follow up on your enquiry.
              </p>
            </div>
          )}

          {error && <div className="tc-lead-error">{error}</div>}
        </div>
        <div className="tc-modal-footer">
          <button onClick={onClose} className="tc-btn tc-btn--secondary">Cancel</button>
          {showSendToYard ? (
            <button
              onClick={() => handleSubmit('send_to_yard')}
              className="tc-btn tc-btn--primary"
              disabled={!canSend || submitting}
            >
              <Send size={16} />
              {submitting ? 'Sending…' : `Send & Download PDF`}
            </button>
          ) : (
            <button
              onClick={() => handleSubmit('pdf')}
              className="tc-btn tc-btn--primary"
              disabled={!canDownload || submitting}
            >
              <Download size={16} />
              {submitting ? 'Downloading…' : 'Download PDF'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
