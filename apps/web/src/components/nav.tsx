import Link from 'next/link';

const links = [
  { href: '/dashboard/radar', label: 'Radar' },
  { href: '/dashboard/sources', label: 'Sources' },
  { href: '/dashboard/preferences', label: 'Preferences' },
];

export function DashboardNav() {
  return (
    <nav style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          style={{
            padding: '10px 16px',
            borderRadius: 9999,
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#e2e8f0',
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
