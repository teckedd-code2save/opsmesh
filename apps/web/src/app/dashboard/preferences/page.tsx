'use client';

import { useEffect, useMemo, useState } from 'react';
import type { RadarPreferenceRecord, RadarSourceRecord } from '@opsmesh/radar-core';
import { PageShell } from '@/components/page-shell';
import { ActionButton, Divider, InlineNotice, Input, Panel, Textarea, Toggle, tokens } from '@/components/ui';

const INTERVAL_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
];

function cronFromInterval(min: number) {
  if (min < 60) return `*/${min} * * * *`;
  const hours = Math.floor(min / 60);
  return `0 */${hours} * * *`;
}

function timeAgo(iso?: string) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function nextRunLabel(intervalMin: number) {
  const next = new Date(Date.now() + intervalMin * 60_000);
  return next.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtDate(ms?: number | string) {
  if (!ms) return 'Never';
  const value = typeof ms === 'number' ? new Date(ms) : new Date(ms);
  if (Number.isNaN(value.getTime())) return 'Unknown';
  return value.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function schedulerHealth(runtime: any, intervalMin: number) {
  const lastRunAtMs = runtime?.scheduler?.lastRunAtMs;
  if (!lastRunAtMs) return { label: 'No scheduled runs yet', tone: 'warn' as const };
  const graceMs = intervalMin * 60_000 * 2.2;
  const stale = Date.now() - Number(lastRunAtMs) > graceMs;
  return stale ? { label: 'Missed-run risk', tone: 'bad' as const } : { label: 'Healthy', tone: 'good' as const };
}

function SectionHeader({ icon, title, description }: { icon: string; title: string; description?: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: description ? 4 : 0 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: tokens.text }}>{title}</span>
      </div>
      {description && <p style={{ margin: '0 0 0 24px', fontSize: 13, color: tokens.muted, lineHeight: 1.5 }}>{description}</p>}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: 12, color: tokens.muted, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {children}
    </label>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
      <div>
        <div style={{ fontSize: 14, color: tokens.text, fontWeight: 500 }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: tokens.muted, marginTop: 2 }}>{description}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState<RadarPreferenceRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [webhookBusy, setWebhookBusy] = useState(false);
  const [polling, setPolling] = useState(false);
  const [runtime, setRuntime] = useState<any>(null);
  const [schedulerBusy, setSchedulerBusy] = useState(false);
  const [qualityRows, setQualityRows] = useState<Array<Partial<RadarSourceRecord> & { name: string; active: boolean }>>([]);

  // Local form state
  const [minFitScore, setMinFitScore] = useState(0);
  const [preferredKeywords, setPreferredKeywords] = useState('');
  const [excludedKeywords, setExcludedKeywords] = useState('');
  const [minHourlyRate, setMinHourlyRate] = useState('');
  const [minFixedBudget, setMinFixedBudget] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramHighScoreOnly, setTelegramHighScoreOnly] = useState(false);
  const [telegramMinScore, setTelegramMinScore] = useState('70');
  const [autoPollingEnabled, setAutoPollingEnabled] = useState(false);
  const [autoPollingIntervalMin, setAutoPollingIntervalMin] = useState(30);
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    fetch('/api/radar/preferences')
      .then((res) => res.json())
      .then((payload: RadarPreferenceRecord) => {
        setPrefs(payload);
        setMinFitScore(payload.minFitScore ?? 0);
        setPreferredKeywords((payload.preferredKeywords ?? []).join(', '));
        setExcludedKeywords((payload.excludedKeywords ?? []).join(', '));
        setMinHourlyRate(payload.minHourlyRate ?? '');
        setMinFixedBudget(payload.minFixedBudget ?? '');
        setTelegramEnabled(payload.telegramEnabled ?? false);
        setTelegramHighScoreOnly(payload.telegramHighScoreOnly ?? false);
        setTelegramMinScore(String(payload.telegramMinScore ?? 70));
        setAutoPollingEnabled(payload.autoPollingEnabled ?? false);
        setAutoPollingIntervalMin(payload.autoPollingIntervalMin ?? 30);
        setWebhookUrl(payload.webhookUrl ?? '');
      })
      .catch(() => setPrefs(null));

    fetch('/api/radar/runtime').then((res) => res.json()).then(setRuntime).catch(() => setRuntime(null));
    fetch('/api/radar/scheduler/status').then((res) => res.json()).then((payload) => {
      if (payload?.job) setRuntime((prev: any) => ({ ...(prev ?? {}), scheduler: {
        installed: true,
        jobId: payload.job.id,
        jobName: payload.job.name,
        cronExpr: payload.job.schedule?.expr,
        nextRunAtMs: payload.job.state?.nextRunAtMs,
        lastRunAtMs: payload.job.state?.lastRunAtMs,
        lastRunStatus: payload.job.state?.lastRunStatus,
        lastDeliveryStatus: payload.job.state?.lastDeliveryStatus,
        consecutiveErrors: payload.job.state?.consecutiveErrors ?? 0,
      }}));
    }).catch(() => {});
    fetch('/api/radar/sources/quality').then((res) => res.json()).then((payload) => setQualityRows(payload.results ?? [])).catch(() => setQualityRows([]));
  }, []);

  function parseKeywords(raw: string): string[] {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }

  async function handleSave() {
    setSaving(true);
    setNotice(null);
    try {
      const updates: Partial<RadarPreferenceRecord> = {
        minFitScore,
        preferredKeywords: parseKeywords(preferredKeywords),
        excludedKeywords: parseKeywords(excludedKeywords),
        minHourlyRate: minHourlyRate || undefined,
        minFixedBudget: minFixedBudget || undefined,
        telegramEnabled,
        telegramHighScoreOnly,
        telegramMinScore: parseInt(telegramMinScore, 10) || 70,
        autoPollingEnabled,
        autoPollingIntervalMin,
        webhookUrl: webhookUrl || undefined,
      };
      const res = await fetch('/api/radar/preferences', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Save failed');
      const updated = await res.json() as RadarPreferenceRecord;
      setPrefs(updated);

      const syncRes = await fetch('/api/radar/scheduler/sync', { method: 'POST' });
      const syncPayload = await syncRes.json();
      if (!syncRes.ok) throw new Error(syncPayload.error ?? 'Scheduler sync failed');
      setRuntime((prev: any) => ({ ...(prev ?? {}), scheduler: syncPayload.scheduler ?? prev?.scheduler }));

      setNotice({ text: 'Preferences saved and OpenClaw cron synced.', tone: 'success' });
    } catch {
      setNotice({ text: 'Could not save preferences.', tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function registerWebhook() {
    if (!webhookUrl.trim()) {
      setWebhookStatus('App URL is required.');
      return;
    }
    setWebhookBusy(true);
    setWebhookStatus(null);
    try {
      const res = await fetch('/api/telegram/setup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ webhookUrl: webhookUrl.trim() }),
      });
      const data = await res.json() as { ok?: boolean; webhookUrl?: string; error?: string };
      if (data.ok) {
        setWebhookStatus(`Registered: ${data.webhookUrl}`);
      } else {
        setWebhookStatus(`Error: ${data.error ?? 'Unknown'}`);
      }
    } catch {
      setWebhookStatus('Request failed.');
    } finally {
      setWebhookBusy(false);
    }
  }

  async function removeWebhook() {
    setWebhookBusy(true);
    setWebhookStatus(null);
    try {
      await fetch('/api/telegram/setup', { method: 'DELETE' });
      setWebhookStatus('Webhook removed.');
    } catch {
      setWebhookStatus('Failed to remove webhook.');
    } finally {
      setWebhookBusy(false);
    }
  }

  async function runNow() {
    setPolling(true);
    try {
      const res = await fetch('/api/radar/scheduler/test', { method: 'POST' });
      if (!res.ok) throw new Error('Run failed');
      const data = await res.json();
      setNotice({ text: `Safer scheduled path tested — ${data.resultCount ?? 0} leads, ${data.errorCount ?? 0} errors`, tone: 'success' });
    } catch {
      setNotice({ text: 'Could not test safer scheduled path.', tone: 'error' });
    } finally {
      setPolling(false);
    }
  }

  async function disableScheduler() {
    setSchedulerBusy(true);
    try {
      const res = await fetch('/api/radar/scheduler/disable', { method: 'POST' });
      if (!res.ok) throw new Error('Disable failed');
      setRuntime((prev: any) => ({ ...(prev ?? {}), scheduler: { ...(prev?.scheduler ?? {}), installed: false } }));
      setNotice({ text: 'Scheduler disabled.', tone: 'success' });
    } catch {
      setNotice({ text: 'Could not disable scheduler.', tone: 'error' });
    } finally {
      setSchedulerBusy(false);
    }
  }

  async function deleteScheduler() {
    setSchedulerBusy(true);
    try {
      const res = await fetch('/api/radar/scheduler/delete', { method: 'POST' });
      if (!res.ok) throw new Error('Delete failed');
      setRuntime((prev: any) => ({ ...(prev ?? {}), scheduler: null }));
      setNotice({ text: 'Scheduler deleted.', tone: 'success' });
    } catch {
      setNotice({ text: 'Could not delete scheduler.', tone: 'error' });
    } finally {
      setSchedulerBusy(false);
    }
  }

  const cron = cronFromInterval(autoPollingIntervalMin);
  const topSources = useMemo(() => [...qualityRows].sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0)).slice(0, 6), [qualityRows]);
  const health = schedulerHealth(runtime, autoPollingIntervalMin);

  return (
    <PageShell
      eyebrow="Preferences"
      title="Settings"
      description="Targeting rules, notifications, and automation for Gig Radar."
      action={
        <ActionButton onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </ActionButton>
      }
    >
      {notice && <InlineNotice text={notice.text} tone={notice.tone} />}

      <div style={{ display: 'grid', gap: 14 }}>

        {/* Section 1: Scoring */}
        <Panel>
          <SectionHeader icon="⚡" title="Scoring Preferences" description="Set minimum thresholds and keyword signals for filtering opportunities." />
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <FieldLabel>Minimum Score Threshold: {minFitScore}</FieldLabel>
              <input
                type="range" min={0} max={100} step={5}
                value={minFitScore}
                onChange={(e) => setMinFitScore(Number(e.target.value))}
                style={{ width: '100%', accentColor: tokens.accent }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: tokens.muted, marginTop: 2 }}>
                <span>0 — all leads</span><span>50</span><span>100 — perfect only</span>
              </div>
            </div>
            <Divider />
            <div>
              <FieldLabel>Preferred Keywords</FieldLabel>
              <Textarea value={preferredKeywords} onChange={setPreferredKeywords} placeholder="api, automation, typescript, nextjs…" rows={2} />
              <div style={{ fontSize: 12, color: tokens.muted, marginTop: 4 }}>Comma-separated. Boosts score for matching leads.</div>
            </div>
            <div>
              <FieldLabel>Excluded Keywords</FieldLabel>
              <Textarea value={excludedKeywords} onChange={setExcludedKeywords} placeholder="php, wordpress, seo…" rows={2} />
              <div style={{ fontSize: 12, color: tokens.muted, marginTop: 4 }}>Comma-separated. Suppresses leads containing these terms.</div>
            </div>
          </div>
        </Panel>

        {/* Section 2: Budget */}
        <Panel>
          <SectionHeader icon="◆" title="Budget Filters" description="Only show leads above these pay thresholds." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <FieldLabel>Min Hourly Rate ($)</FieldLabel>
              <Input value={minHourlyRate} onChange={setMinHourlyRate} placeholder="e.g. 50" type="number" />
            </div>
            <div>
              <FieldLabel>Min Fixed Budget ($)</FieldLabel>
              <Input value={minFixedBudget} onChange={setMinFixedBudget} placeholder="e.g. 500" type="number" />
            </div>
          </div>
        </Panel>

        {/* Section 3: Telegram */}
        <Panel>
          <SectionHeader icon="🔔" title="Telegram Notifications" description="Push high-quality leads directly to your Telegram." />
          <div style={{ display: 'grid', gap: 14 }}>
            <ToggleRow
              label="Send to Telegram"
              description="Deliver new leads to your connected Telegram chat."
              checked={telegramEnabled}
              onChange={setTelegramEnabled}
            />
            <Divider />
            <ToggleRow
              label="High scores only"
              description="Only send leads above a score threshold."
              checked={telegramHighScoreOnly}
              onChange={setTelegramHighScoreOnly}
            />
            {telegramHighScoreOnly && (
              <div>
                <FieldLabel>Min Score for Telegram</FieldLabel>
                <Input value={telegramMinScore} onChange={setTelegramMinScore} placeholder="70" type="number" style={{ maxWidth: 120 }} />
              </div>
            )}
          </div>
        </Panel>

        {/* Section 4: Polling */}
        <Panel>
          <SectionHeader icon="⏱" title="Automation / Polling Schedule" description="Configure how often Gig Radar checks your sources." />
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
              <div style={{ background: tokens.bg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radiusSm, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: tokens.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Last run</div>
                <div style={{ marginTop: 4, color: tokens.text, fontSize: 14, fontWeight: 700 }}>{timeAgo(runtime?.lastWorkerRunAt)}</div>
              </div>
              <div style={{ background: tokens.bg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radiusSm, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: tokens.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Next run</div>
                <div style={{ marginTop: 4, color: tokens.text, fontSize: 14, fontWeight: 700 }}>{runtime?.scheduler?.nextRunAtMs ? fmtDate(runtime.scheduler.nextRunAtMs) : autoPollingEnabled ? nextRunLabel(autoPollingIntervalMin) : 'Disabled'}</div>
              </div>
              <div style={{ background: tokens.bg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radiusSm, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: tokens.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Last delivery</div>
                <div style={{ marginTop: 4, color: tokens.text, fontSize: 14, fontWeight: 700 }}>{runtime?.scheduler?.lastDeliveryStatus ?? 'Unknown'}</div>
              </div>
              <div style={{ background: tokens.bg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radiusSm, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: tokens.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Scheduler health</div>
                <div style={{ marginTop: 4, color: health.tone === 'good' ? tokens.good : health.tone === 'bad' ? tokens.bad : tokens.warn, fontSize: 14, fontWeight: 700 }}>{health.label}</div>
              </div>
            </div>
            <ToggleRow
              label="Auto-poll"
              description="Automatically fetch new leads on a schedule."
              checked={autoPollingEnabled}
              onChange={setAutoPollingEnabled}
            />
            <div>
              <FieldLabel>Poll Interval</FieldLabel>
              <select
                value={autoPollingIntervalMin}
                onChange={(e) => setAutoPollingIntervalMin(Number(e.target.value))}
                style={{
                  background: tokens.bg, border: `1px solid ${tokens.border}`,
                  borderRadius: tokens.radiusSm, padding: '9px 12px',
                  color: tokens.text, fontSize: 14, outline: 'none', cursor: 'pointer',
                }}
              >
                {INTERVAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {autoPollingEnabled && (
              <div style={{ background: tokens.bg, borderRadius: tokens.radiusSm, padding: '10px 14px', border: `1px solid ${tokens.border}` }}>
                <div style={{ fontSize: 11, color: tokens.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Cron expression</div>
                <code style={{ fontSize: 13, color: tokens.accent, fontFamily: 'monospace' }}>{runtime?.scheduler?.cronExpr ?? cron}</code>
                <div style={{ fontSize: 12, color: tokens.muted, marginTop: 4 }}>
                  OpsMesh now syncs this schedule to an OpenClaw cron job when you save. Job: {runtime?.scheduler?.jobName ?? 'opsmesh_radar_poll'} {runtime?.scheduler?.jobId ? `(${runtime.scheduler.jobId})` : ''} · last run {fmtDate(runtime?.scheduler?.lastRunAtMs)} · status {runtime?.scheduler?.lastRunStatus ?? 'unknown'}.
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <ActionButton onClick={runNow} disabled={polling} variant="secondary">
                {polling ? 'Testing…' : 'Test Safer Path'}
              </ActionButton>
              <ActionButton onClick={disableScheduler} disabled={schedulerBusy} variant="ghost">
                {schedulerBusy ? 'Disabling…' : 'Disable Scheduler'}
              </ActionButton>
              <ActionButton onClick={deleteScheduler} disabled={schedulerBusy} variant="ghost">
                {schedulerBusy ? 'Deleting…' : 'Delete Scheduler'}
              </ActionButton>
            </div>

            {runtime?.recentRuns?.length ? (
              <div style={{ background: tokens.bg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radiusSm, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: tokens.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Recent runs</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {runtime.recentRuns.slice(0, 5).map((run: any, idx: number) => (
                    <div key={`${run.ranAt}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
                      <div style={{ color: tokens.text }}>{timeAgo(run.ranAt)} · {run.trigger}</div>
                      <div style={{ color: tokens.muted }}>{run.resultCount} leads · {run.errorCount} errors</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel>
          <SectionHeader icon="📡" title="Source Quality" description="See which feeds are earning their keep and which ones are turning into sludge." />
          <div style={{ display: 'grid', gap: 8 }}>
            {topSources.length === 0 ? (
              <div style={{ fontSize: 13, color: tokens.muted }}>No source quality data yet. Run a poll first.</div>
            ) : topSources.map((source) => (
              <div key={source.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto auto', gap: 10, alignItems: 'center', background: tokens.bg, border: `1px solid ${tokens.border}`, borderRadius: tokens.radiusSm, padding: '10px 12px' }}>
                <div>
                  <div style={{ fontSize: 13, color: tokens.text, fontWeight: 700 }}>{source.name}</div>
                  <div style={{ fontSize: 12, color: tokens.muted }}>{source.lastPollMessage ?? 'No poll message yet'}</div>
                </div>
                <div style={{ fontSize: 12, color: tokens.subtle }}>Q {source.qualityScore ?? 0}</div>
                <div style={{ fontSize: 12, color: tokens.subtle }}>{source.totalRelevantSeen ?? 0}/{source.totalOpportunitiesSeen ?? 0}</div>
                <div style={{ fontSize: 12, color: source.active ? tokens.good : tokens.bad }}>{source.active ? 'active' : 'disabled'}</div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Section 5: Webhook */}
        <Panel>
          <SectionHeader icon="🔗" title="Telegram Webhook" description="Register your app URL with Telegram to receive button callbacks." />
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <FieldLabel>App URL</FieldLabel>
              <Input
                value={webhookUrl}
                onChange={setWebhookUrl}
                placeholder="https://your-app.vercel.app"
                type="url"
              />
              <div style={{ fontSize: 12, color: tokens.muted, marginTop: 4 }}>
                Your deployed app URL (must be HTTPS). Telegram will POST callbacks to <code style={{ color: tokens.subtle }}>/api/telegram/webhook</code>.
              </div>
            </div>
            {webhookStatus && (
              <div style={{
                fontSize: 13, padding: '8px 12px', borderRadius: tokens.radiusSm,
                background: webhookStatus.startsWith('Error') ? tokens.badDim : tokens.goodDim,
                color: webhookStatus.startsWith('Error') ? tokens.bad : tokens.good,
                border: `1px solid ${webhookStatus.startsWith('Error') ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
              }}>
                {webhookStatus}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <ActionButton onClick={registerWebhook} disabled={webhookBusy} variant="secondary">
                {webhookBusy ? 'Registering…' : 'Register Webhook'}
              </ActionButton>
              <ActionButton onClick={removeWebhook} disabled={webhookBusy} variant="danger">
                Remove Webhook
              </ActionButton>
            </div>
          </div>
        </Panel>

        {/* Save at bottom too */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 8 }}>
          <ActionButton onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </ActionButton>
        </div>

      </div>
    </PageShell>
  );
}
