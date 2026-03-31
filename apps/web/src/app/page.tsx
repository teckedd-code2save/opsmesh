import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px' }}>
      <p style={{ color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.3em', fontSize: 12, fontWeight: 700 }}>
        OpsMesh
      </p>
      <h1 style={{ fontSize: 48, lineHeight: 1.05, marginTop: 16, marginBottom: 16 }}>
        Gig Radar, built atop OpenClaw.
      </h1>
      <p style={{ maxWidth: 720, color: '#94a3b8', fontSize: 18, lineHeight: 1.7 }}>
        Find, score, and act on promising paid opportunities using OpenClaw-powered analysis,
        Telegram alerts, and a review workflow designed for one operator first.
      </p>
      <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
        <Link href="/dashboard/radar" style={{ background: '#38bdf8', color: '#020617', padding: '12px 20px', borderRadius: 9999, fontWeight: 700, textDecoration: 'none' }}>
          Open Radar
        </Link>
        <Link href="/dashboard/sources" style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0', padding: '12px 20px', borderRadius: 9999, textDecoration: 'none' }}>
          Manage Sources
        </Link>
      </div>
    </main>
  );
}
