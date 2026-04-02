import { tokens } from './ui';

export function PageShell({ title, eyebrow, description, children, action }: {
  title: string; eyebrow?: string; description?: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div style={{ padding: '32px 36px', maxWidth: 960 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <div>
          {eyebrow && (
            <p style={{ color: tokens.accent, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, fontWeight: 700, margin: '0 0 6px' }}>
              {eyebrow}
            </p>
          )}
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: tokens.text }}>{title}</h1>
          {description && <p style={{ color: tokens.muted, margin: '4px 0 0', fontSize: 14, lineHeight: 1.5 }}>{description}</p>}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
      {children}
    </div>
  );
}
