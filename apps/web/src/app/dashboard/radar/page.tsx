'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { OpportunityRecord, RadarSourceRecord } from '@opsmesh/radar-core';
import { PageShell } from '@/components/page-shell';
import { ActionButton, EmptyState, InlineNotice, SkeletonBlock, StatusPill, tokens } from '@/components/ui';

function scoreTone(score: number): 'good' | 'warn' | 'bad' {
  if (score >= 80) return 'good';
  if (score >= 60) return 'warn';
  return 'bad';
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function RadarListSkeleton() {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} style={{ background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <SkeletonBlock height={16} width="55%" />
            <SkeletonBlock height={13} width="32%" />
          </div>
        </div>
      ))}
    </div>
  );
}

type FilterKey = 'all' | 'top10' | 'dev' | 'nondev' | 'high' | 'medium' | 'low';

const filterOptions: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All scores' },
  { key: 'top10', label: 'Top 10' },
  { key: 'dev', label: 'Dev work' },
  { key: 'nondev', label: 'Non-dev bucket' },
  { key: 'high', label: 'High 80+' },
  { key: 'medium', label: 'Medium 60-79' },
  { key: 'low', label: 'Low <60' },
];

function applyFilter(rows: OpportunityRecord[], filter: FilterKey, search: string) {
  let out = [...rows].sort((a, b) => (b.score?.fitScore ?? 0) - (a.score?.fitScore ?? 0));
  if (filter === 'top10') out = out.slice(0, 10);
  else if (filter === 'dev') out = out.filter((r) => (r.lane ?? 'dev') === 'dev');
  else if (filter === 'nondev') out = out.filter((r) => r.lane === 'nondev');
  else if (filter === 'high') out = out.filter((r) => (r.score?.fitScore ?? 0) >= 80);
  else if (filter === 'medium') out = out.filter((r) => { const s = r.score?.fitScore ?? 0; return s >= 60 && s < 80; });
  else if (filter === 'low') out = out.filter((r) => (r.score?.fitScore ?? 0) < 60);
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    out = out.filter((r) =>
      r.title.toLowerCase().includes(q) ||
      (r.company ?? '').toLowerCase().includes(q) ||
      (r.summary ?? '').toLowerCase().includes(q) ||
      r.sourceName.toLowerCase().includes(q) ||
      r.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  return out;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ fontSize: 12, color: tokens.muted }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: tokens.text }}>{value}</div>
    </div>
  );
}

function PollingDisplay({ sources }: { sources: RadarSourceRecord[] }) {
  const running = sources.filter((s) => s.lastPollStatus === 'running').length;
  const completed = sources.filter((s) => s.lastPollStatus === 'success' || s.lastPollStatus === 'error').length;
  const total = sources.filter((s) => s.active && s.feedUrl).length;
  const percent = total > 0 ? Math.max(8, Math.round((completed / total) * 100)) : 12;
  const funLines = [
    'Shaking the RSS tree…',
    'Peeking under remote-job rocks…',
    'Interrogating feeds politely…',
    'Looking for gigs that do not suck…',
  ];
  const line = funLines[(running + completed) % funLines.length];

  return (
    <div style={{
      background: `linear-gradient(135deg, ${tokens.surface}, ${tokens.bg})`,
      border: `1px solid ${tokens.border}`,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: tokens.text }}>Polling sources</div>
          <div style={{ fontSize: 12, color: tokens.muted, marginTop: 4 }}>{line}</div>
        </div>
        <div style={{ fontSize: 12, color: tokens.subtle }}>{completed}/{total || sources.length} done</div>
      </div>

      <div style={{ height: 10, background: tokens.bg, borderRadius: 999, border: `1px solid ${tokens.border}`, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          borderRadius: 999,
          background: 'linear-gradient(90deg, #38bdf8, #22c55e, #a78bfa)',
          backgroundSize: '200% 100%',
          animation: 'opsmesh-pulse-bar 1.6s linear infinite',
          transition: 'width 250ms ease',
        }} />
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {sources.map((source) => (
          <div key={source.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, color: tokens.text, fontWeight: 600 }}>{source.name}</div>
              <div style={{ fontSize: 12, color: tokens.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 480 }}>
                {source.lastPollMessage ?? 'Queued…'}
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <StatusPill
                text={source.lastPollStatus === 'running' ? 'fetching' : source.lastPollStatus === 'success' ? 'done' : source.lastPollStatus === 'error' ? 'error' : 'queued'}
                tone={source.lastPollStatus === 'running' ? 'warn' : source.lastPollStatus === 'success' ? 'good' : source.lastPollStatus === 'error' ? 'bad' : 'neutral'}
              />
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes opsmesh-pulse-bar {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </div>
  );
}

export default function RadarPage() {
  const [rows, setRows] = useState<OpportunityRecord[]>([]);
  const [polling, setPolling] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [pollSources, setPollSources] = useState<RadarSourceRecord[]>([]);

  async function loadRows() {
    setLoading(true);
    setErrorText(null);
    try {
      const [oppRes, srcRes] = await Promise.all([
        fetch('/api/radar/opportunities'),
        fetch('/api/radar/sources'),
      ]);
      const payload = (await oppRes.json()) as { results?: OpportunityRecord[] };
      const srcPayload = (await srcRes.json()) as { results?: RadarSourceRecord[] };
      setRows(payload.results ?? []);
      setPollSources(srcPayload.results ?? []);
    } catch {
      setRows([]);
      setPollSources([]);
      setErrorText('Could not load the inbox.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows().catch(() => undefined);
  }, []);

  async function runPoll() {
    setPolling(true);
    setStatusText(null);
    setErrorText(null);
    let stream: EventSource | null = null;
    try {
      const srcRes = await fetch('/api/radar/sources');
      const srcPayload = (await srcRes.json()) as { results?: RadarSourceRecord[] };
      const active = (srcPayload.results ?? []).filter((s) => s.active && s.feedUrl);
      setPollSources(active.map((s) => ({ ...s, lastPollStatus: 'running', lastPollMessage: 'Queued…' })));

      stream = new EventSource('/api/radar/poll/stream');
      stream.addEventListener('sources', (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as { sources?: RadarSourceRecord[] };
          setPollSources(payload.sources ?? []);
        } catch {}
      });

      const res = await fetch('/api/radar/poll', { method: 'POST' });
      const payload = (await res.json()) as { resultCount?: number; errorCount?: number; error?: string };
      if (!res.ok) throw new Error(payload.error ?? 'Could not poll sources.');
      await loadRows();
      setStatusText(`Fetched ${payload.resultCount ?? 0} leads${payload.errorCount ? ` · ${payload.errorCount} errors` : ''}`);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Could not poll sources.');
    } finally {
      if (stream) stream.close();
      setPolling(false);
    }
  }

  async function resetRadar() {
    setResetting(true);
    setStatusText(null);
    setErrorText(null);
    try {
      const res = await fetch('/api/radar/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Could not clear old state.');
      await loadRows();
      setStatusText('State cleared.');
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Could not clear old state.');
    } finally {
      setResetting(false);
    }
  }

  const filtered = applyFilter(rows, filter, search);
  const highCount = rows.filter((r) => (r.score?.fitScore ?? 0) >= 80).length;
  const newCount = rows.filter((r) => r.status === 'new').length;

  return (
    <PageShell
      eyebrow="Gig Radar"
      title={`${rows.length} opportunities waiting`}
      description="Scan, shortlist, and act on the best leads fast."
      action={
        <div style={{ display: 'flex', gap: 8 }}>
          <ActionButton onClick={runPoll} disabled={polling || resetting}>{polling ? 'Polling…' : `Poll sources (${pollSources.filter((s) => s.active && s.feedUrl).length || 0})`}</ActionButton>
          <ActionButton onClick={resetRadar} disabled={polling || resetting} variant="secondary">{resetting ? 'Clearing…' : 'Clear'}</ActionButton>
        </div>
      }
    >
      {statusText ? <InlineNotice text={statusText} tone="success" /> : null}
      {errorText ? <InlineNotice text={errorText} tone="error" /> : null}
      {polling && pollSources.length > 0 ? <PollingDisplay sources={pollSources} /> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 18 }}>
        <StatCard label="Total leads" value={String(rows.length)} />
        <StatCard label="New" value={String(newCount)} />
        <StatCard label="High score" value={String(highCount)} />
      </div>

      <div style={{ background: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: 16, padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: tokens.text }}>Filters</div>
          {(filter !== 'all' || search) ? <div style={{ fontSize: 12, color: tokens.muted }}>{filtered.length} of {rows.length}</div> : null}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {filterOptions.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: '7px 12px',
                borderRadius: 999,
                border: `1px solid ${filter === key ? 'rgba(56,189,248,0.3)' : tokens.border}`,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                background: filter === key ? tokens.accentDim : 'transparent',
                color: filter === key ? tokens.accent : tokens.subtle,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          type="search"
          placeholder="Search opportunities"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            background: tokens.bg,
            border: `1px solid ${tokens.border}`,
            borderRadius: 12,
            padding: '10px 12px',
            color: tokens.text,
            fontSize: 13,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {loading ? (
        <RadarListSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState title="Inbox empty" description="Poll your sources to load fresh leads." action={<ActionButton onClick={runPoll} disabled={polling || resetting}>{polling ? 'Polling…' : `Poll sources (${pollSources.filter((s) => s.active && s.feedUrl).length || 0})`}</ActionButton>} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matches" description="Try adjusting your filter or search query." action={<ActionButton onClick={() => { setFilter('all'); setSearch(''); }} variant="secondary">Clear filters</ActionButton>} />
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {filtered.map((row) => {
            const fitScore = row.score?.fitScore ?? 0;
            const tone = scoreTone(fitScore);
            const pay = row.payMin ? `${row.currency ?? '$'}${row.payMin}${row.payMax ? `–${row.payMax}` : ''}` : null;

            return (
              <Link key={row.id} href={`/dashboard/radar/${row.id}`} style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
                <div style={{
                  background: tokens.surface,
                  border: `1px solid ${tokens.border}`,
                  borderRadius: 14,
                  padding: '16px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  alignItems: 'flex-start',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: tokens.text }}>{row.title}</div>
                      <StatusPill text={`${fitScore}`} tone={tone} />
                    </div>
                    <div style={{ fontSize: 12, color: tokens.muted, marginBottom: 8 }}>
                      {row.sourceName}{row.company ? ` · ${row.company}` : ''}{pay ? ` · ${pay}` : ''} · {timeAgo(row.fetchedAt)}
                    </div>
                    {row.summary ? (
                      <div style={{
                        fontSize: 13,
                        color: tokens.subtle,
                        lineHeight: 1.55,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                      }}>
                        {row.summary}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    {row.score?.recommendation ? <StatusPill text={row.score.recommendation.replace('_', ' ')} tone={tone} /> : null}
                    <StatusPill text={row.status} tone="neutral" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
