// ============================================
// ANALYTICS SERVICE
// Fire-and-forget event tracking for shmakeCut.
// Never blocks UI, never throws visible errors.
// ============================================

import { supabasePublic } from './supabase';

let _sessionId = null;
let _tenantId = null;
let _initialized = false;

// ---- Helpers ----

function getSessionId() {
  if (_sessionId) return _sessionId;
  try {
    _sessionId = sessionStorage.getItem('shmakecut_session_id');
    if (!_sessionId) {
      _sessionId = crypto.randomUUID();
      sessionStorage.setItem('shmakecut_session_id', _sessionId);
    }
  } catch {
    // sessionStorage unavailable (iframe sandbox) — use in-memory
    _sessionId = crypto.randomUUID();
  }
  return _sessionId;
}

function getDeviceType() {
  const w = window.innerWidth;
  if (w <= 768) return 'mobile';
  if (w <= 1024) return 'tablet';
  return 'desktop';
}

async function trackEvent(eventType, extras = {}) {
  if (!_initialized || !supabasePublic) return;
  try {
    await supabasePublic.from('cut_analytics_events').insert({
      tenant_id: _tenantId,
      session_id: getSessionId(),
      event_type: eventType,
      mode: extras.mode || null,
      calc_summary: extras.calcSummary || null,
      funnel_step: extras.funnelStep || null,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent || null,
      device_type: getDeviceType(),
    });
  } catch {
    // Silently swallow — analytics must never break the app
  }
}

// ---- Public API ----

export function initAnalytics(tenantId) {
  if (!tenantId || tenantId === 'demo') return;
  if (!supabasePublic) return;
  _tenantId = tenantId;
  _initialized = true;
  trackEvent('session_started', { funnelStep: 1 });
}

export function trackModeSelected(mode) {
  trackEvent('mode_selected', { mode });
}

export function trackProductsSelected(mode) {
  trackEvent('products_selected', { mode, funnelStep: 2 });
}

export function trackCalculationCompleted(mode, calcSummary) {
  trackEvent('calculation_completed', { mode, calcSummary, funnelStep: 3 });
}

export function trackPdfRequested(mode) {
  trackEvent('pdf_requested', { mode, funnelStep: 4 });
}

export function trackLeadCaptured(mode, capturePoint) {
  trackEvent('lead_captured', { mode, funnelStep: 4 });
}

export function trackSendToYard(mode) {
  trackEvent('send_to_yard', { mode, funnelStep: 4 });
}

/** Expose session ID for linking leads to analytics */
export function getAnalyticsSessionId() {
  return _initialized ? getSessionId() : null;
}
