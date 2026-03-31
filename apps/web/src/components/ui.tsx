import type { CSSProperties, ReactNode } from 'react';

const panelStyle: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 24,
  padding: 20,
  background: 'rgba(15,23,42,0.65)',
};

export function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <section style={{ ...panelStyle, ...style }}>{children}</section>;
}

export function ActionButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const variants: Record<string, CSSProperties> = {
    primary: {
      background: '#38bdf8',
      color: '#020617',
      border: 'none',
    },
    secondary: {
      background: 'transparent',
      color: '#e2e8f0',
      border: '1px solid rgba(255,255,255,0.15)',
    },
    danger: {
      background: 'transparent',
      color: '#fca5a5',
      border: '1px solid rgba(252,165,165,0.3)',
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 16px',
        borderRadius: 9999,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'opacity 120ms ease, transform 120ms ease',
        ...variants[variant],
      }}
    >
      {children}
    </button>
  );
}

export function StatusPill({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'info' }) {
  const tones: Record<string, CSSProperties> = {
    neutral: { background: 'rgba(148,163,184,0.12)', color: '#cbd5e1' },
    good: { background: 'rgba(74,222,128,0.14)', color: '#86efac' },
    warn: { background: 'rgba(250,204,21,0.14)', color: '#fde68a' },
    bad: { background: 'rgba(248,113,113,0.14)', color: '#fca5a5' },
    info: { background: 'rgba(56,189,248,0.14)', color: '#7dd3fc' },
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 9999, padding: '6px 10px', fontSize: 12, fontWeight: 700, ...tones[tone] }}>
      {text}
    </span>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <Panel style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
      <div style={{ color: '#94a3b8', marginTop: 8, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>{description}</div>
      {action ? <div style={{ marginTop: 20 }}>{action}</div> : null}
    </Panel>
  );
}

export function InlineNotice({ text, tone = 'info' }: { text: string; tone?: 'info' | 'success' | 'error' }) {
  const tones: Record<string, CSSProperties> = {
    info: { color: '#7dd3fc', borderColor: 'rgba(56,189,248,0.2)', background: 'rgba(56,189,248,0.08)' },
    success: { color: '#86efac', borderColor: 'rgba(74,222,128,0.2)', background: 'rgba(74,222,128,0.08)' },
    error: { color: '#fca5a5', borderColor: 'rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.08)' },
  };

  return <div style={{ border: '1px solid', borderRadius: 16, padding: '12px 14px', marginBottom: 16, ...tones[tone] }}>{text}</div>;
}

export function SkeletonBlock({ height = 16, width = '100%' }: { height?: number; width?: number | string }) {
  return <div style={{ height, width, borderRadius: 10, background: 'linear-gradient(90deg, rgba(30,41,59,0.9) 0%, rgba(51,65,85,0.9) 50%, rgba(30,41,59,0.9) 100%)' }} />;
}
