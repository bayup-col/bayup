"use client";

// Tracking de visitas del storefront — liviano, nunca bloquea ni rompe la
// carga de la tienda (todo falla en silencio). visitor_id vive en
// localStorage (persistente entre sesiones, para distinguir nuevos vs.
// recurrentes); session_id vive en sessionStorage (dura mientras la pestaña
// esté abierta, para agrupar páginas vistas y calcular rebote/duración).

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.bayup.com.co';

const VISITOR_KEY = 'bayup_vid';
const SESSION_KEY = 'bayup_sid';
const SESSION_START_KEY = 'bayup_sid_start';

function safeUuid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // Fallback para navegadores muy viejos sin crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = safeUuid();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return safeUuid();
  }
}

function getOrCreateSession(): { sessionId: string; isNew: boolean } {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return { sessionId: existing, isNew: false };
    const id = safeUuid();
    sessionStorage.setItem(SESSION_KEY, id);
    sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
    return { sessionId: id, isNew: true };
  } catch {
    return { sessionId: safeUuid(), isNew: true };
  }
}

let beaconRegistered = false;

function registerSessionEndBeacon() {
  if (beaconRegistered || typeof document === 'undefined' || !navigator.sendBeacon) return;
  beaconRegistered = true;

  const sendEnd = () => {
    try {
      const sessionId = sessionStorage.getItem(SESSION_KEY);
      const startedAt = Number(sessionStorage.getItem(SESSION_START_KEY) || 0);
      if (!sessionId || !startedAt) return;
      const duration = Math.round((Date.now() - startedAt) / 1000);
      const blob = new Blob([JSON.stringify({ session_id: sessionId, duration_seconds: duration })], { type: 'application/json' });
      navigator.sendBeacon(`${API}/public/track/session-end`, blob);
    } catch { /* nunca romper la salida de la página por esto */ }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sendEnd();
  });
  window.addEventListener('pagehide', sendEnd);
}

/** Registra una vista de página de la tienda pública. Fire-and-forget. */
export function trackPageview(slug: string, path: string) {
  if (typeof window === 'undefined' || !slug) return;
  try {
    const visitorId = getVisitorId();
    const { sessionId, isNew } = getOrCreateSession();
    registerSessionEndBeacon();

    fetch(`${API}/public/track/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug,
        visitor_id: visitorId,
        session_id: sessionId,
        path,
        is_new_session: isNew,
        referrer: isNew ? (document.referrer || null) : null,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* el tracking nunca debe afectar la experiencia de compra */ }
}
