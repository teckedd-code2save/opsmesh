import { DashboardNav } from './nav';

export function PageShell({ title, eyebrow, description, children }: { title: string; eyebrow: string; description?: string; children: React.ReactNode; }) {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
      <DashboardNav />
      <p style={{ color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.3em', fontSize: 12, fontWeight: 700 }}>{eyebrow}</p>
      <h1 style={{ fontSize: 36, margin: '12px 0 8px' }}>{title}</h1>
      {description ? <p style={{ color: '#94a3b8', maxWidth: 760, marginBottom: 24 }}>{description}</p> : null}
      {children}
    </main>
  );
}
