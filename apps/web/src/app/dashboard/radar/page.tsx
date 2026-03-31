'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { OpportunityRecord } from '@opsmesh/radar-core';
import { mockAccountProfile } from '@/lib/account';
import { PageShell } from '@/components/page-shell';
import { ActionButton, EmptyState, InlineNotice, Panel, SkeletonBlock, StatusPill } from '@/components/ui';

function recommendationTone(recommendation?: string) {
  if (recommendation === 'strong_match') return 'good' as const;
  if (recommendation === 'maybe') return 'info' as const;
  if (recommendation === 'weak') return 'warn' as const;
  if (recommendation === 'avoid') return 'bad' as const;
  return 'neutral' as const;
}

function RadarListSkeleton() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Panel key={index}>
          <div style={{ display: 'grid', gap: 10 }}>
            <SkeletonBlock height={18} width="42%" />
            <SkeletonBlock height={14} width="25%" />
            <SkeletonBlock height={14} width="60%" />
          </div>
        </Panel>
      ))}
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

  async function loadRows() {
    setLoading(true);
    setErrorText(null);
    try {
      const res = await fetch('/api/radar/opportunities');
      const payload = (await res.json()) as { results?: OpportunityRecord[] };
      setRows(payload.results ?? []);
    } catch {
      setRows([]);
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
    try {
      const res = await fetch('/api/radar/poll', { method: 'POST' });
      const payload = (await res.json()) as { resultCount?: number; errorCount?: number; error?: string };
      if (!res.ok) throw new Error(payload.error ?? 'Could not poll sources.');
      await loadRows();
      setStatusText(`Fetched ${payload.resultCount ?? 0} opportunities${payload.errorCount ? ` · ${payload.errorCount} source errors` : ''}`);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Could not poll sources.');
    } finally {
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
      setStatusText('Cleared old state.');
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Could not clear old state.');
    } finally {
      setResetting(false);
    }
  }

  return (
    <PageShell
      eyebrow="Radar"
      title="Opportunity inbox"
      description="Small, winnable technical work. Clean signal first."
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', flex: 1, minWidth: 280 }}>
          <Panel style={{ padding: 16 }}>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>Operator</div>
            <div style={{ marginTop: 8, fontWeight: 700 }}>{mockAccountProfile.displayName}</div>
          </Panel>
          <Panel style={{ padding: 16 }}>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>Telegram</div>
            <div style={{ marginTop: 8, fontWeight: 700 }}>{mockAccountProfile.telegramConnected ? 'Connected' : 'Not connected'}</div>
          </Panel>
          <Panel style={{ padding: 16 }}>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>Mode</div>
            <div style={{ marginTop: 8, fontWeight: 700 }}>{mockAccountProfile.openclawWorkspaceMode}</div>
          </Panel>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <ActionButton onClick={runPoll} disabled={polling || resetting}>
            {polling ? 'Polling…' : 'Poll sources'}
          </ActionButton>
          <ActionButton onClick={resetRadar} disabled={polling || resetting} variant="secondary">
            {resetting ? 'Clearing…' : 'Clear stale data'}
          </ActionButton>
        </div>
      </div>

      {statusText ? <InlineNotice text={statusText} tone="success" /> : null}
      {errorText ? <InlineNotice text={errorText} tone="error" /> : null}

      {loading ? (
        <RadarListSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState title="No opportunities yet" description="Poll your sources to load fresh leads into the inbox." action={<ActionButton onClick={runPoll} disabled={polling || resetting}>{polling ? 'Polling…' : 'Poll sources'}</ActionButton>} />
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {rows.map((row) => (
            <Link key={row.id} href={`/dashboard/radar/${row.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              <Panel style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{row.title}</div>
                    <div style={{ color: '#94a3b8', fontSize: 14, marginTop: 6 }}>{row.sourceName}</div>
                    {row.summary ? <div style={{ color: '#cbd5e1', marginTop: 10, lineHeight: 1.6 }}>{row.summary}</div> : null}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <StatusPill text={`${row.score?.fitScore ?? 0}/100`} tone={recommendationTone(row.score?.recommendation)} />
                    <StatusPill text={row.score?.recommendation ?? 'unscored'} tone={recommendationTone(row.score?.recommendation)} />
                    <StatusPill text={row.status} tone="neutral" />
                  </div>
                </div>
              </Panel>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
