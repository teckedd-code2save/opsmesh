'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { tokens } from './ui';

const InboxIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h14a1 1 0 001-1V5a1 1 0 00-1-1H3zm0 2h14v4.586l-2.293-2.293a1 1 0 00-1.414 0L11 10.586l-2.293-2.293a1 1 0 00-1.414 0L5 10.586 3 8.586V6zm0 8V9.414l1.293 1.293a1 1 0 001.414 0L8 8.414l2.293 2.293a1 1 0 001.414 0L14 7.414l2 2V14H3z"/>
  </svg>
);

const SourcesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
    <path d="M5 3a1 1 0 000 2c5.523 0 10 4.477 10 10a1 1 0 102 0C17 8.373 11.627 3 5 3z"/>
    <path d="M4 9a1 1 0 011-1 7 7 0 017 7 1 1 0 11-2 0 5 5 0 00-5-5 1 1 0 01-1-1zM3 15a2 2 0 114 0 2 2 0 01-4 0z"/>
  </svg>
);

const PrefsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
  </svg>
);

const navItems = [
  { href: '/dashboard/radar', label: 'Inbox', Icon: InboxIcon },
  { href: '/dashboard/sources', label: 'Sources', Icon: SourcesIcon },
  { href: '/dashboard/preferences', label: 'Preferences', Icon: PrefsIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const [stats, setStats] = useState({ leadsToday: 0, activeSources: 0 });

  useEffect(() => {
    fetch('/api/radar/stats').then((r) => r.json()).then((d: any) => {
      setStats({ leadsToday: d.leadsToday ?? 0, activeSources: d.activeSources ?? 0 });
    }).catch(() => {});
  }, [pathname]);

  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: tokens.sidebar,
      borderRight: `1px solid ${tokens.border}`,
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Brand */}
      <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${tokens.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>O</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: tokens.text, lineHeight: 1.2 }}>OpsMesh</div>
            <div style={{ fontSize: 11, color: tokens.muted, lineHeight: 1.2 }}>Gig Radar</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 10px', flex: 1 }}>
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 7,
              color: active ? tokens.text : tokens.muted,
              textDecoration: 'none', fontSize: 14,
              fontWeight: active ? 600 : 400,
              background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
              marginBottom: 2,
              transition: 'color 100ms, background 100ms',
            }}>
              <Icon />
              {label}
              {label === 'Inbox' && stats.leadsToday > 0 && (
                <span style={{
                  marginLeft: 'auto', background: tokens.accent,
                  color: '#020617', fontSize: 11, fontWeight: 700,
                  padding: '1px 6px', borderRadius: 99,
                }}>{stats.leadsToday}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer stats */}
      <div style={{
        padding: '14px 20px',
        borderTop: `1px solid ${tokens.border}`,
        display: 'grid', gap: 6,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: tokens.muted }}>Leads today</span>
          <span style={{ color: tokens.text, fontWeight: 600 }}>{stats.leadsToday}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: tokens.muted }}>Active sources</span>
          <span style={{ color: tokens.text, fontWeight: 600 }}>{stats.activeSources}</span>
        </div>
      </div>
    </aside>
  );
}
