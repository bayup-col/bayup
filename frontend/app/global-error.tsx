"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f5f7f7' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', padding: '3rem', borderRadius: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,.1)', textAlign: 'center', maxWidth: '480px', width: '100%' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0d1f1f', marginBottom: '1rem' }}>Error crítico</h1>
            <p style={{ color: '#4a6060', marginBottom: '2rem', lineHeight: 1.6 }}>
              Ocurrió un error grave. Intenta recargar la página.
            </p>
            <button
              onClick={reset}
              style={{ width: '100%', background: '#004d4d', color: '#fff', border: 'none', padding: '1rem', borderRadius: '1rem', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Recargar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
