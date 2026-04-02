import Link from 'next/link';

export default function HomePage() {
  return (
    <main
      style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '80px 24px',
      }}
    >
      <p
        style={{
          color: '#38bdf8',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          fontSize: 11,
          fontWeight: 700,
          margin: 0,
        }}
      >
        OpsMesh
      </p>
      <h1
        style={{
          fontSize: 44,
          fontWeight: 700,
          lineHeight: 1.1,
          marginTop: 14,
          marginBottom: 14,
          letterSpacing: '-0.03em',
          color: '#e2e8f0',
        }}
      >
        Gig Radar
      </h1>
      <p
        style={{
          maxWidth: 560,
          color: '#64748b',
          fontSize: 16,
          lineHeight: 1.7,
          margin: 0,
        }}
      >
        Find, score, and act on promising paid opportunities. OpenClaw-powered analysis, Telegram alerts, and a
        review workflow built for one operator.
      </p>
      <div style={{ display: 'flex', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
        <Link
          href="/dashboard/radar"
          style={{
            background: '#38bdf8',
            color: '#020617',
            padding: '10px 20px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          Open Radar
        </Link>
        <Link
          href="/dashboard/sources"
          style={{
            border: '1px solid rgba(255,255,255,0.14)',
            color: '#e2e8f0',
            padding: '10px 20px',
            borderRadius: 8,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          Sources
        </Link>
      </div>
    </main>
  );
}
