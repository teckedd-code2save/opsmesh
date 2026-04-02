'use client';

import { useEffect, useState } from 'react';
import type { OpportunityRecord, RadarSourceRecord } from '@opsmesh/radar-core';
import { PageShell } from '@/components/page-shell';
import { ActionButton, InlineNotice, Input, Panel, StatusPill, Toggle, tokens } from '@/components/ui';

function formatDate(iso?: string) {
  if (!iso) return 'Never';
  try {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

type SourceStats = { leadsToday: number; total: number; avgScore: number };

function computeStats(sourceId: string, opps: OpportunityRecord[]): SourceStats {
  const today = new Date().toDateString();
  const mine = opps.filter((o) => o.sourceId === sourceId);
  const leadsToday = mine.filter((o) => new Date(o.fetchedAt).toDateString() === today).length;
  const scores = mine.filter((o) => o.score?.fitScore !== undefined).map((o) => o.score!.fitScore);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  return { leadsToday, total: mine.length, avgScore };
}

type AddForm = {
  name: string;
  feedUrl: string;
  pollIntervalMin: string;
};

const defaultAddForm: AddForm = { name: '', feedUrl: '', pollIntervalMin: '30' };

export default function SourcesPage() {
  const [sources, setSources] = useState<RadarSourceRecord[]>([]);
  const [opps, setOpps] = useState<OpportunityRecord[]>([]);
  const [polling, setPolling] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>(defaultAddForm);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RadarSourceRecord>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadData() {
    const [srcRes, oppRes] = await Promise.all([
      fetch('/api/radar/sources'),
      fetch('/api/radar/opportunities'),
    ]);
    const srcPayload = await srcRes.json() as { results?: RadarSourceRecord[] };
    const oppPayload = await oppRes.json() as { results?: OpportunityRecord[] };
    setSources(srcPayload.results ?? []);
    setOpps(oppPayload.results ?? []);
  }

  useEffect(() => {
    loadData().catch(() => { setSources([]); setOpps([]); });
  }, []);

  async function runPoll() {
    setPolling(true);
    try {
      await fetch('/api/radar/poll', { method: 'POST' });
      await loadData();
      setNotice({ text: 'Poll complete.', tone: 'success' });
    } catch {
      setNotice({ text: 'Poll failed.', tone: 'error' });
    } finally {
      setPolling(false);
    }
  }

  async function toggleSource(source: RadarSourceRecord) {
    const res = await fetch(`/api/radar/sources/${source.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ active: !source.active }),
    });
    if (res.ok) await loadData();
  }

  async function deleteSource(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/radar/sources/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await loadData();
      setNotice({ text: 'Source deleted.', tone: 'success' });
    } else {
      setNotice({ text: 'Could not delete source.', tone: 'error' });
    }
    setDeletingId(null);
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/radar/sources/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      await loadData();
      setEditingId(null);
      setEditForm({});
      setNotice({ text: 'Source updated.', tone: 'success' });
    } else {
      setNotice({ text: 'Could not update source.', tone: 'error' });
    }
  }

  async function addSource() {
    if (!addForm.name.trim() || !addForm.feedUrl.trim()) {
      setNotice({ text: 'Name and Feed URL are required.', tone: 'error' });
      return;
    }
    setAdding(true);
    try {
      const res = await fetch('/api/radar/sources', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name.trim(),
          feedUrl: addForm.feedUrl.trim(),
          pollIntervalMin: parseInt(addForm.pollIntervalMin, 10) || 30,
        }),
      });
      if (res.ok) {
        await loadData();
        setShowAddForm(false);
        setAddForm(defaultAddForm);
        setNotice({ text: 'Source added.', tone: 'success' });
      } else {
        const body = await res.json() as { error?: string };
        setNotice({ text: body.error ?? 'Could not add source.', tone: 'error' });
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <PageShell
      eyebrow="Sources"
      title="Source Registry"
      description={`${sources.length} source${sources.length !== 1 ? 's' : ''} · ${sources.filter((s) => s.active).length} active`}
      action={
        <ActionButton onClick={() => { setShowAddForm((v) => !v); setNotice(null); }}>
          {showAddForm ? 'Cancel' : '+ Add Source'}
        </ActionButton>
      }
    >
      {notice && <InlineNotice text={notice.text} tone={notice.tone} />}

      {/* Add form */}
      {showAddForm && (
        <Panel style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: tokens.text }}>New Source</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: tokens.muted, fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Name</label>
              <Input value={addForm.name} onChange={(v) => setAddForm((f) => ({ ...f, name: v }))} placeholder="e.g. Upwork RSS" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: tokens.muted, fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Feed URL</label>
              <Input value={addForm.feedUrl} onChange={(v) => setAddForm((f) => ({ ...f, feedUrl: v }))} placeholder="https://…/feed.rss" type="url" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: tokens.muted, fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Poll interval (min)</label>
              <Input value={addForm.pollIntervalMin} onChange={(v) => setAddForm((f) => ({ ...f, pollIntervalMin: v }))} placeholder="30" type="number" style={{ maxWidth: 120 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <ActionButton onClick={addSource} disabled={adding}>{adding ? 'Adding…' : 'Add Source'}</ActionButton>
              <ActionButton onClick={() => { setShowAddForm(false); setAddForm(defaultAddForm); }} variant="secondary">Cancel</ActionButton>
            </div>
          </div>
        </Panel>
      )}

      {/* Source cards */}
      <div style={{ display: 'grid', gap: 10 }}>
        {sources.length === 0 && (
          <Panel style={{ textAlign: 'center', padding: '40px 24px', color: tokens.muted, fontSize: 14 }}>
            No sources configured. Add one to get started.
          </Panel>
        )}
        {sources.map((source) => {
          const stats = computeStats(source.id, opps);
          const isEditing = editingId === source.id;

          return (
            <Panel key={source.id}>
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditing ? (
                    <Input
                      value={editForm.name ?? source.name}
                      onChange={(v) => setEditForm((f) => ({ ...f, name: v }))}
                      placeholder="Source name"
                      style={{ fontWeight: 600, fontSize: 14 }}
                    />
                  ) : (
                    <div style={{ fontWeight: 600, fontSize: 14, color: tokens.text }}>{source.name}</div>
                  )}
                  <div style={{ fontSize: 12, color: tokens.muted, marginTop: 3 }}>
                    {source.kind.toUpperCase()} · every {source.pollIntervalMin}min
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <StatusPill text={source.active ? 'Active' : 'Paused'} tone={source.active ? 'good' : 'neutral'} />
                  <Toggle checked={source.active} onChange={() => toggleSource(source)} />
                </div>
              </div>

              {/* Feed URL */}
              {isEditing ? (
                <div style={{ marginBottom: 10 }}>
                  <Input
                    value={editForm.feedUrl ?? source.feedUrl ?? ''}
                    onChange={(v) => setEditForm((f) => ({ ...f, feedUrl: v }))}
                    placeholder="Feed URL"
                    type="url"
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                  />
                </div>
              ) : source.feedUrl ? (
                <div style={{ fontSize: 12, color: tokens.muted, fontFamily: 'monospace', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {source.feedUrl}
                </div>
              ) : null}

              {/* Stats row */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
                background: tokens.bg, borderRadius: tokens.radiusSm,
                padding: '10px 12px', marginBottom: 12,
                border: `1px solid ${tokens.border}`,
              }}>
                {[
                  { label: 'Last Poll', value: formatDate(source.lastPolledAt) },
                  { label: 'Leads Today', value: String(stats.leadsToday) },
                  { label: 'Avg Score', value: stats.total > 0 ? `${stats.avgScore}` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: tokens.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                    <div style={{ fontSize: 13, color: tokens.text, fontWeight: 600, marginTop: 2 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6 }}>
                {isEditing ? (
                  <>
                    <ActionButton onClick={() => saveEdit(source.id)} size="sm">Save</ActionButton>
                    <ActionButton onClick={() => { setEditingId(null); setEditForm({}); }} size="sm" variant="secondary">Cancel</ActionButton>
                  </>
                ) : (
                  <>
                    {source.active && (
                      <ActionButton
                        onClick={() => fetch(`/api/radar/sources/${source.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ active: false }) }).then(() => loadData())}
                        size="sm" variant="secondary"
                      >
                        Pause
                      </ActionButton>
                    )}
                    <ActionButton
                      onClick={() => { setEditingId(source.id); setEditForm({ name: source.name, feedUrl: source.feedUrl }); }}
                      size="sm" variant="secondary"
                    >
                      Edit
                    </ActionButton>
                    <ActionButton
                      onClick={() => {
                        if (window.confirm(`Delete "${source.name}"?`)) {
                          deleteSource(source.id);
                        }
                      }}
                      size="sm" variant="danger"
                      disabled={deletingId === source.id}
                    >
                      {deletingId === source.id ? 'Deleting…' : 'Delete'}
                    </ActionButton>
                  </>
                )}
              </div>
            </Panel>
          );
        })}
      </div>
    </PageShell>
  );
}
