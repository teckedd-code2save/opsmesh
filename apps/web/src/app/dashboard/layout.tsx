import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px', background: 'rgba(2,6,23,0.85)', position: 'sticky', top: 0 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#e2e8f0', textDecoration: 'none', fontWeight: 700 }}>OpsMesh</Link>
          <span style={{ color: '#94a3b8', fontSize: 14 }}>Gig Radar · OpenClaw-integrated</span>
        </div>
      </header>
      {children}
    </div>
  );
}
