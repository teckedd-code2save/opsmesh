'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { tokens } from './ui';

const links = [
  { href: '/dashboard/radar', label: 'Radar' },
  { href: '/dashboard/sources', label: 'Sources' },
  { href: '/dashboard/preferences', label: 'Preferences' },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        display: 'flex',
        gap: 4,
        marginBottom: 32,
        borderBottom: `1px solid ${tokens.border}`,
        paddingBottom: 16,
      }}
    >
      {links.map((link) => {
        const active = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              color: active ? tokens.accent : tokens.subtle,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: active ? 600 : 400,
              background: active ? tokens.accentDim : 'transparent',
              transition: 'color 120ms, background 120ms',
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
