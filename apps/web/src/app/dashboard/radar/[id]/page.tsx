'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { OpportunityRecord, ProposalDraftRecord } from '@opsmesh/radar-core';
import { PageShell } from '@/components/page-shell';
import {
  ActionButton,
  Divider,
  EmptyState,
  InlineNotice,
  Panel,
  ScoreBar,
  SkeletonBlock,
  StatusPill,
  Textarea,
  tokens,
} from '@/components/ui';
import { TruncatedText } from '@/components/truncated-text';

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
    <PageShell eyebrow="Opportunity" title="Loading…">
      <div style={{ display: 'grid', gap: 10 }}>
        {[80, 50, 65].map((w, i) => (
          <Panel key={i}>
            <SkeletonBlock height={16} width={`${w}%`} />
          </Panel>
        ))}
      </div>
    </PageShell>
  );
}

export default function OpportunityDetailPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<OpportunityPayload | null>(null);
  const [draft, setDraft] = useState<ProposalDraftRecord | null>(null);
  const [draftBody, setDraftBody] = useState('');
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
      const latestDraft = opportunity.latestDraft ?? null;
      setDraft(latestDraft);
      setDraftBody(latestDraft?.body ?? '');
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
      if (payload.draft) {
        setDraft(payload.draft);
        setDraftBody(payload.draft.body ?? '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not ${action} this opportunity.`);
    } finally {
      setBusyAction(null);
    }
  }

  if (loading) return <LoadingDetail />;

  if (!item) {
    return (
      <PageShell eyebrow="Opportunity" title="Unavailable">
        <EmptyState
          title="Opportunity not found"
          description={error ?? 'The item may have been cleared or replaced during a fresh poll.'}
          action={
            <Link href="/dashboard/radar" style={{ color: tokens.accent, textDecoration: 'none', fontWeight: 600 }}>
              ← Back to inbox
            </Link>
          }
        />
      </PageShell>
    );
  }

  const tone = recommendationTone(item.score?.recommendation);
  const fitScore = item.score?.fitScore ?? 0;
  const pay = item.payMin
    ? `${item.currency ?? '$'}${item.payMin}${item.payMax ? `–${item.payMax}` : ''} ${item.payType}`
    : null;

  return (
    <PageShell eyebrow="Opportunity" title={item.title}>
      {/* Back + top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <Link href="/dashboard/radar" style={{ color: tokens.muted, textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Inbox
        </Link>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: fitScore >= 80 ? tokens.good : fitScore >= 60 ? tokens.warn : tokens.bad }}>
            {fitScore}
          </span>
          {item.score?.recommendation && (
            <StatusPill text={item.score.recommendation.replace('_', ' ')} tone={tone} />
          )}
          <StatusPill text={item.status} tone="neutral" />
          {item.telegramDeliveredAt && <StatusPill text="Sent to Telegram" tone="info" />}
          {pay && <StatusPill text={pay} tone="neutral" />}
        </div>
      </div>

      {lastAction ? <InlineNotice text={actionLabel(lastAction) ?? lastAction} tone="success" /> : null}
      {error ? <InlineNotice text={error} tone="error" /> : null}

      <div style={{ display: 'grid', gap: 12 }}>
        {/* Score bars */}
        {item.score && (
          <Panel>
            <div style={{ display: 'grid', gap: 10 }}>
              {([
                { label: 'Fit', value: item.score.fitScore, barTone: tone },
                { label: 'Pay', value: item.score.payScore, barTone: 'neutral' as const },
                { label: 'Quality', value: item.score.qualityScore, barTone: 'neutral' as const },
                { label: 'Effort', value: item.score.effortScore, barTone: 'neutral' as const },
              ] as { label: string; value: number; barTone: 'good' | 'warn' | 'bad' | 'neutral' }[]).map(({ label, value, barTone }) => (
                <div key={label} style={{ display: 'grid', gridTemplateColumns: '60px 1fr', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: tokens.muted }}>{label}</span>
                  <ScoreBar score={value} tone={barTone} />
                </div>
              ))}
            </div>

            {item.score.reasoningSummary && (
              <>
                <Divider />
                <p style={{ margin: 0, fontSize: 13, color: tokens.subtle, lineHeight: 1.6 }}>
                  {item.score.reasoningSummary}
                </p>
              </>
            )}

            {(item.score.strengths?.length > 0 || item.score.risks?.length > 0) && (
              <>
                <Divider />
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {item.score.strengths?.map((s) => (
                    <span key={s} style={{ fontSize: 12, color: tokens.good, background: tokens.goodDim, padding: '2px 8px', borderRadius: 5 }}>{s}</span>
                  ))}
                  {item.score.risks?.map((r) => (
                    <span key={r} style={{ fontSize: 12, color: tokens.bad, background: tokens.badDim, padding: '2px 8px', borderRadius: 5 }}>{r}</span>
                  ))}
                </div>
              </>
            )}
          </Panel>
        )}

        {/* Metadata */}
        <Panel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px 20px' }}>
            {[
              { label: 'Source', value: item.sourceName },
              { label: 'Company', value: item.company || '—' },
              { label: 'Location', value: item.location || (item.remote ? 'Remote' : '—') },
              { label: 'Pay', value: pay ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: tokens.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                <div style={{ fontSize: 14, color: tokens.text, marginTop: 3 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 14 }}>
              {item.tags.map((tag) => (
                <span key={tag} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: tokens.muted, border: `1px solid ${tokens.border}` }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {item.canonicalUrl && (
            <div style={{ marginTop: 14 }}>
              <a href={item.canonicalUrl} target="_blank" rel="noreferrer" style={{ color: tokens.accent, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Open Original ↗
              </a>
            </div>
          )}
        </Panel>

        {/* Full description */}
        {(item.summary || item.rawText) && (
          <Panel>
            <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: tokens.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</h2>
            <div style={{ color: tokens.text, lineHeight: 1.7, fontSize: 14 }}>
              {item.summary && <p style={{ margin: '0 0 12px' }}>{item.summary}</p>}
              {item.rawText && (
                <div style={{ color: tokens.subtle }}>
                  <TruncatedText text={item.rawText} limit={600} />
                </div>
              )}
            </div>
          </Panel>
        )}

        {/* Draft section */}
        <Panel>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: tokens.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Proposal Draft</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <ActionButton onClick={() => runAction('draft')} disabled={busyAction !== null} variant="secondary" size="sm">
                {busyAction === 'draft' ? 'Generating…' : draft ? 'Regenerate' : 'Generate with OpenClaw'}
              </ActionButton>
              {draft && (
                <ActionButton onClick={() => runAction('telegram')} disabled={busyAction !== null} variant="secondary" size="sm">
                  {busyAction === 'telegram' ? 'Sending…' : 'Send Draft'}
                </ActionButton>
              )}
            </div>
          </div>

          {draft ? (
            <>
              {draft.subjectLine && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: tokens.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Subject</div>
                  <div style={{ fontSize: 14, color: tokens.text, fontWeight: 600 }}>{draft.subjectLine}</div>
                </div>
              )}
              <Textarea
                value={draftBody}
                onChange={setDraftBody}
                rows={10}
                placeholder="Draft will appear here…"
              />
              {draft.talkingPoints.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, color: tokens.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Talking Points</div>
                  <ul style={{ margin: 0, paddingLeft: 18, color: tokens.subtle, lineHeight: 1.8, fontSize: 13 }}>
                    {draft.talkingPoints.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div style={{ color: tokens.muted, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
              No draft yet. Click "Generate with OpenClaw" to create a proposal.
            </div>
          )}
        </Panel>

        {/* Bottom actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 8 }}>
          <ActionButton onClick={() => runAction('save')} disabled={busyAction !== null}>
            {busyAction === 'save' ? 'Saving…' : 'Save for Later'}
          </ActionButton>
          <ActionButton onClick={() => runAction('reject')} disabled={busyAction !== null} variant="danger">
            {busyAction === 'reject' ? 'Rejecting…' : 'Reject'}
          </ActionButton>
          {item.canonicalUrl && (
            <a href={item.canonicalUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <ActionButton variant="ghost">Open Original ↗</ActionButton>
            </a>
          )}
        </div>
      </div>
    </PageShell>
  );
}
