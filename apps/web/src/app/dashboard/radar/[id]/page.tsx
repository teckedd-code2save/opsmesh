'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { OpportunityRecord, ProposalDraftRecord } from '@opsmesh/radar-core';
import { PageShell } from '@/components/page-shell';
import { ActionButton, EmptyState, InlineNotice, Panel, SkeletonBlock, StatusPill } from '@/components/ui';

type OpportunityPayload = OpportunityRecord & {
  latestDraft?: ProposalDraftRecord | null;
};

function recommendationTone(recommendation?: string) {
  if (recommendation === 'strong_match') return 'good' as const;
  if (recommendation === 'maybe') return 'info' as const;
  if (recommendation === 'weak') return 'warn' as const;
  if (recommendation === 'avoid') return 'bad' as const;
  return 'neutral' as const;
}

function actionLabel(action: string | null) {
  if (!action) return null;
  if (action === 'saved') return 'Saved to shortlist.';
  if (action === 'rejected') return 'Marked as not worth pursuing.';
  if (action === 'drafted') return 'Proposal draft ready.';
  if (action === 'sent_to_telegram') return 'Sent to Telegram.';
  return action;
}

function LoadingDetail() {
  return (
    <PageShell eyebrow="Opportunity" title="Loading" description="Fetching the latest details.">
      <div style={{ display: 'grid', gap: 16 }}>
        <Panel>
          <SkeletonBlock height={24} width="48%" />
          <div style={{ marginTop: 12 }}>
            <SkeletonBlock height={14} width="72%" />
          </div>
        </Panel>
        <Panel>
          <div style={{ display: 'grid', gap: 12 }}>
            <SkeletonBlock height={16} width="28%" />
            <SkeletonBlock height={16} width="38%" />
            <SkeletonBlock height={16} width="22%" />
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}

export default function OpportunityDetailPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<OpportunityPayload | null>(null);
  const [draft, setDraft] = useState<ProposalDraftRecord | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'save' | 'reject' | 'draft' | 'telegram' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadOpportunity() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/radar/opportunities/${params.id}`);
      const payload: unknown = await res.json();
      if (!res.ok || !payload || typeof payload !== 'object' || 'error' in payload) {
        const message =
          payload && typeof payload === 'object' && 'error' in payload && typeof (payload as { error?: unknown }).error === 'string'
            ? (payload as { error: string }).error
            : 'Could not load this opportunity.';
        throw new Error(message);
      }
      const opportunity = payload as OpportunityPayload;
      setItem(opportunity);
      setDraft(opportunity.latestDraft ?? null);
    } catch (err) {
      setItem(null);
      setDraft(null);
      setError(err instanceof Error ? err.message : 'Could not load this opportunity.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOpportunity().catch(() => undefined);
  }, [params.id]);

  async function runAction(action: 'save' | 'reject' | 'draft' | 'telegram') {
    setBusyAction(action);
    setError(null);
    try {
      const res = await fetch(`/api/radar/opportunities/${params.id}/${action}`, { method: 'POST' });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error ?? `Could not ${action} this opportunity.`);
      }
      setLastAction(payload.action ?? action);
      if (payload.item) setItem(payload.item);
      if (payload.draft) setDraft(payload.draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not ${action} this opportunity.`);
    } finally {
      setBusyAction(null);
    }
  }

  if (loading) return <LoadingDetail />;

  if (!item) {
    return (
      <PageShell eyebrow="Opportunity" title="Unavailable" description="This item could not be loaded.">
        <EmptyState title="Opportunity not found" description={error ?? 'The item may have been cleared or replaced during a fresh poll.'} action={<Link href="/dashboard/radar" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 700 }}>Back to inbox</Link>} />
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="Opportunity" title={item.title} description="Review the fit, then decide whether to keep, reject, or draft.">
      <div style={{ marginBottom: 20 }}>
        <Link href="/dashboard/radar" style={{ color: '#38bdf8', textDecoration: 'none' }}>← Back to inbox</Link>
      </div>

      {lastAction ? <InlineNotice text={actionLabel(lastAction) ?? lastAction} tone="success" /> : null}
      {error ? <InlineNotice text={error} tone="error" /> : null}

      <div style={{ display: 'flex', gap: 12, marginTop: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <ActionButton onClick={() => runAction('save')} disabled={busyAction !== null}>
          {busyAction === 'save' ? 'Saving…' : 'Save'}
        </ActionButton>
        <ActionButton onClick={() => runAction('reject')} disabled={busyAction !== null} variant="danger">
          {busyAction === 'reject' ? 'Rejecting…' : 'Reject'}
        </ActionButton>
        <ActionButton onClick={() => runAction('draft')} disabled={busyAction !== null} variant="secondary">
          {busyAction === 'draft' ? 'Drafting…' : 'Draft proposal'}
        </ActionButton>
        <ActionButton onClick={() => runAction('telegram')} disabled={busyAction !== null} variant="secondary">
          {busyAction === 'telegram' ? 'Sending…' : 'Send to Telegram'}
        </ActionButton>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <Panel>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <StatusPill text={`Fit ${item.score?.fitScore ?? 0}/100`} tone={recommendationTone(item.score?.recommendation)} />
            <StatusPill text={item.score?.recommendation ?? 'unscored'} tone={recommendationTone(item.score?.recommendation)} />
            <StatusPill text={item.status} tone="neutral" />
          </div>
          <div style={{ color: '#e2e8f0', lineHeight: 1.7, marginBottom: 12 }}>{item.summary || 'No summary available.'}</div>
          <div style={{ color: '#94a3b8', lineHeight: 1.7 }}>{item.score?.reasoningSummary ?? 'No scoring notes yet.'}</div>
        </Panel>

        <Panel>
          <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>Full listing</h2>
          <div style={{ color: '#cbd5e1', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{item.rawText || 'No listing text available.'}</div>
        </Panel>

        {draft ? (
          <Panel>
            <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>Proposal draft</h2>
            {draft.subjectLine ? <div style={{ marginBottom: 12, color: '#e2e8f0' }}><strong>Subject:</strong> {draft.subjectLine}</div> : null}
            <div style={{ color: '#cbd5e1', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{draft.body}</div>
            {draft.talkingPoints.length ? (
              <div style={{ marginTop: 18 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Talking points</div>
                <ul style={{ margin: 0, paddingLeft: 20, color: '#cbd5e1', lineHeight: 1.8 }}>
                  {draft.talkingPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Panel>
        ) : (
          <EmptyState title="No draft yet" description="Generate a proposal once the opportunity looks worth pursuing." action={<ActionButton onClick={() => runAction('draft')} disabled={busyAction !== null} variant="secondary">{busyAction === 'draft' ? 'Drafting…' : 'Draft proposal'}</ActionButton>} />
        )}
      </div>
    </PageShell>
  );
}
