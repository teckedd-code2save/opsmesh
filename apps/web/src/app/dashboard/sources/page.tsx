'use client';

import { useEffect, useState } from 'react';
import type { RadarSourceRecord } from '@opsmesh/radar-core';
import { PageShell } from '@/components/page-shell';

export default function SourcesPage() {
  const [sources, setSources] = useState<RadarSourceRecord[]>([]);
  const [polling, setPolling] = useState(false);

  async function loadSources() {
    const res = await fetch('/api/radar/sources');
    const payload = (await res.json()) as { results?: RadarSourceRecord[] };
    setSources(payload.results ?? []);
  }

  useEffect(() => {
    loadSources().catch(() => setSources([]));
  }, []);

  async function runPoll() {
    setPolling(true);
    try {
      await fetch('/api/radar/poll', { method: 'POST' });
      await loadSources();
    } finally {
      setPolling(false);
    }
  }

  return (
    <PageShell eyebrow="Sources" title="Source registry" description="Live source registry for Gig Radar. Right now it polls public RSS feeds biased toward technical, remote, and startup-style opportunities rather than generic employment spam.">
      <div style={{ marginBottom: 20 }}>
        <button onClick={runPoll} disabled={polling} style={{ background: '#38bdf8', color: '#020617', padding: '12px 18px', borderRadius: 9999, border: 'none', fontWeight: 700, cursor: 'pointer', opacity: polling ? 0.6 : 1 }}>
          {polling ? 'Polling...' : 'Poll all sources'}
        </button>
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
        {sources.map((source) => (
          <div key={source.id} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 20, background: 'rgba(15,23,42,0.65)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{source.name}</div>
                <div style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>{source.kind} · every {source.pollIntervalMin} min</div>
                <div style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>Last polled: {source.lastPolledAt ?? 'never'}</div>
              </div>
              <div style={{ color: source.active ? '#4ade80' : '#94a3b8' }}>{source.active ? 'active' : 'paused'}</div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
