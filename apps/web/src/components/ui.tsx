import type { CSSProperties, ReactNode } from 'react';

// ─── Design tokens ────────────────────────────────────────────────────────────
export const tokens = {
  bg: '#0a0a0b',
  sidebar: '#111113',
  surface: '#161618',
  surfaceHover: '#1e1e21',
  border: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.12)',
  text: '#f0f0f0',
  muted: '#6b7280',
  subtle: '#9ca3af',
  accent: '#38bdf8',
  accentDim: 'rgba(56,189,248,0.1)',
  good: '#22c55e',
  goodDim: 'rgba(34,197,94,0.1)',
  warn: '#f59e0b',
  warnDim: 'rgba(245,158,11,0.1)',
  bad: '#ef4444',
  badDim: 'rgba(239,68,68,0.1)',
  radius: 10,
  radiusSm: 6,
};

// ─── Panel ────────────────────────────────────────────────────────────────────
export function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <section
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: tokens.radius,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

// ─── ActionButton ─────────────────────────────────────────────────────────────
export function ActionButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
  size = 'md',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: tokens.radiusSm,
    fontWeight: 600,
    fontSize: size === 'sm' ? 13 : 14,
    padding: size === 'sm' ? '6px 12px' : '9px 16px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'opacity 100ms, background 100ms',
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap' as const,
  };

  const styles: Record<string, CSSProperties> = {
    primary: {
      background: tokens.accent,
      color: '#020617',
      border: 'none',
    },
    secondary: {
      background: 'transparent',
      color: tokens.text,
      border: `1px solid ${tokens.borderStrong}`,
    },
    danger: {
      background: 'transparent',
      color: tokens.bad,
      border: `1px solid rgba(239,68,68,0.25)`,
    },
    ghost: {
      background: 'transparent',
      color: tokens.subtle,
      border: 'none',
    },
  };

  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...styles[variant] }}>
      {children}
    </button>
  );
}

// ─── StatusPill ───────────────────────────────────────────────────────────────
export function StatusPill({
  text,
  tone = 'neutral',
}: {
  text: string;
  tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'info';
}) {
  const tones: Record<string, CSSProperties> = {
    neutral: { background: 'rgba(107,114,128,0.15)', color: tokens.subtle },
    good: { background: tokens.goodDim, color: tokens.good },
    warn: { background: tokens.warnDim, color: tokens.warn },
    bad: { background: tokens.badDim, color: tokens.bad },
    info: { background: tokens.accentDim, color: tokens.accent },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: tokens.radiusSm,
        padding: '3px 9px',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.02em',
        ...tones[tone],
      }}
    >
      {text}
    </span>
  );
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────
export function ScoreBar({ score, tone = 'neutral' }: { score: number; tone?: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const colors: Record<string, string> = {
    good: tokens.good,
    warn: tokens.warn,
    bad: tokens.bad,
    neutral: tokens.subtle,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 4,
          background: tokens.border,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.max(0, Math.min(100, score))}%`,
            background: colors[tone],
            borderRadius: 4,
            transition: 'width 400ms ease',
          }}
        />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: colors[tone], minWidth: 32, textAlign: 'right' }}>
        {score}
      </span>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Panel style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: tokens.accentDim,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: 18,
        }}
      >
        ◈
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: tokens.text }}>{title}</div>
      <div
        style={{
          color: tokens.muted,
          marginTop: 6,
          maxWidth: 440,
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.6,
          fontSize: 14,
        }}
      >
        {description}
      </div>
      {action ? <div style={{ marginTop: 20 }}>{action}</div> : null}
    </Panel>
  );
}

// ─── InlineNotice ─────────────────────────────────────────────────────────────
export function InlineNotice({
  text,
  tone = 'info',
}: {
  text: string;
  tone?: 'info' | 'success' | 'error';
}) {
  const tones: Record<string, CSSProperties> = {
    info: { color: tokens.accent, borderColor: 'rgba(56,189,248,0.2)', background: tokens.accentDim },
    success: { color: tokens.good, borderColor: 'rgba(34,197,94,0.2)', background: tokens.goodDim },
    error: { color: tokens.bad, borderColor: 'rgba(239,68,68,0.2)', background: tokens.badDim },
  };

  return (
    <div
      style={{
        border: '1px solid',
        borderRadius: tokens.radiusSm,
        padding: '10px 14px',
        marginBottom: 14,
        fontSize: 14,
        lineHeight: 1.5,
        ...tones[tone],
      }}
    >
      {text}
    </div>
  );
}

// ─── SkeletonBlock ────────────────────────────────────────────────────────────
export function SkeletonBlock({
  height = 16,
  width = '100%',
}: {
  height?: number;
  width?: number | string;
}) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius: tokens.radiusSm,
        background: `linear-gradient(90deg, ${tokens.surface} 0%, rgba(30,30,33,0.8) 50%, ${tokens.surface} 100%)`,
      }}
    />
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider() {
  return <div style={{ height: 1, background: tokens.border, margin: '16px 0' }} />;
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: checked ? tokens.good : 'rgba(255,255,255,0.12)',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative', transition: 'background 150ms', flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff', transition: 'left 150ms',
        display: 'block',
      }} />
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ value, onChange, placeholder, type = 'text', style }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; style?: CSSProperties }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: tokens.bg, border: `1px solid ${tokens.border}`,
        borderRadius: tokens.radiusSm, padding: '9px 12px',
        color: tokens.text, fontSize: 14, outline: 'none',
        width: '100%', boxSizing: 'border-box' as const,
        ...style,
      }}
    />
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
export function Textarea({ value, onChange, placeholder, rows = 3, style }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; style?: CSSProperties }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        background: tokens.bg, border: `1px solid ${tokens.border}`,
        borderRadius: tokens.radiusSm, padding: '9px 12px',
        color: tokens.text, fontSize: 14, outline: 'none',
        width: '100%', boxSizing: 'border-box' as const,
        resize: 'vertical' as const, fontFamily: 'inherit',
        ...style,
      }}
    />
  );
}
