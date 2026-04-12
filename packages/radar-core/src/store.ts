import type { OpportunityRecord, ProposalDraftRecord, RadarPreferenceRecord, RadarSourceRecord } from './types';
import { loadRadarState, resetRadarState, updateRadarState } from './persistence';

export function listOpportunities() {
  return loadRadarState().opportunities;
}

export function getOpportunity(id: string) {
  return loadRadarState().opportunities.find((item) => item.id === id) ?? null;
}

export function replaceOpportunities(opportunities: OpportunityRecord[]) {
  return updateRadarState((state) => {
    state.opportunities = opportunities;
  }).opportunities;
}

export function upsertOpportunities(opportunities: OpportunityRecord[]) {
  return updateRadarState((state) => {
    const byId = new Map(state.opportunities.map((item) => [item.id, item]));
    for (const item of opportunities) {
      byId.set(item.id, item);
    }
    state.opportunities = [...byId.values()].sort((a, b) => b.fetchedAt.localeCompare(a.fetchedAt));
  }).opportunities;
}

export function updateOpportunityStatus(id: string, status: OpportunityRecord['status']) {
  const next = updateRadarState((state) => {
    const item = state.opportunities.find((entry) => entry.id === id);
    if (!item) return;
    item.status = status;
  });

  return next.opportunities.find((item) => item.id === id) ?? null;
}

export function markOpportunityTelegramDelivery(id: string, input: { delivered: boolean; error?: string }) {
  const next = updateRadarState((state) => {
    const item = state.opportunities.find((entry) => entry.id === id);
    if (!item) return;
    item.telegramDeliveredAt = input.delivered ? new Date().toISOString() : undefined;
    item.telegramDeliveryError = input.delivered ? undefined : input.error;
  });

  return next.opportunities.find((item) => item.id === id) ?? null;
}

export function listSources() {
  return loadRadarState().sources;
}

export function replaceSources(sources: RadarSourceRecord[]) {
  return updateRadarState((state) => {
    state.sources = sources;
  }).sources;
}

export function addSource(input: Omit<RadarSourceRecord, 'id'>): RadarSourceRecord {
  const source: RadarSourceRecord = { ...input, id: `src_custom_${Date.now()}` };
  updateRadarState((state) => { state.sources.push(source); });
  return source;
}

export function updateSource(id: string, updates: Partial<Omit<RadarSourceRecord, 'id'>>): RadarSourceRecord | null {
  const next = updateRadarState((state) => {
    const idx = state.sources.findIndex((s) => s.id === id);
    if (idx < 0) return;
    state.sources[idx] = { ...state.sources[idx], ...updates };
  });
  return next.sources.find((s) => s.id === id) ?? null;
}

export function deleteSource(id: string): boolean {
  const before = loadRadarState().sources.length;
  updateRadarState((state) => { state.sources = state.sources.filter((s) => s.id !== id); });
  return loadRadarState().sources.length < before;
}

export function markSourcesPolled() {
  const now = new Date().toISOString();
  return updateRadarState((state) => {
    state.sources = state.sources.map((source) => ({ ...source, lastPolledAt: now }));
  }).sources;
}

export function getPreferences() {
  return loadRadarState().preferences;
}

export function savePreferences(input: Partial<RadarPreferenceRecord>) {
  return updateRadarState((state) => {
    state.preferences = {
      ...state.preferences,
      ...input,
      preferredKeywords: input.preferredKeywords ?? state.preferences.preferredKeywords,
      excludedKeywords: input.excludedKeywords ?? state.preferences.excludedKeywords,
      allowedCategories: input.allowedCategories ?? state.preferences.allowedCategories,
    };
  }).preferences;
}

export function listDraftsForOpportunity(opportunityId: string) {
  return loadRadarState().drafts.filter((draft) => draft.opportunityId === opportunityId);
}

export function getLatestDraftForOpportunity(opportunityId: string) {
  return listDraftsForOpportunity(opportunityId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export function createProposalDraft(input: Omit<ProposalDraftRecord, 'id' | 'createdAt'>) {
  const draft: ProposalDraftRecord = {
    id: `draft_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...input,
  };

  updateRadarState((state) => {
    state.drafts.unshift(draft);
    const item = state.opportunities.find((entry) => entry.id === input.opportunityId);
    if (item) item.status = 'drafted';
  });

  return draft;
}

export function getRadarRuntime() {
  return loadRadarState().runtime ?? null;
}

export function acquireWorkerLock(owner: string) {
  const now = new Date().toISOString();
  const nowMs = Date.now();
  const LOCK_TTL_MS = 5 * 60 * 1000;
  const next = updateRadarState((state) => {
    const existing = state.runtime?.workerLock;
    if (existing) {
      const lockedAtMs = new Date(existing.lockedAt).getTime();
      if (Number.isFinite(lockedAtMs) && nowMs - lockedAtMs < LOCK_TTL_MS) return;
    }
    state.runtime = state.runtime ?? {};
    state.runtime.workerLock = { lockedAt: now, owner };
  });

  return next.runtime?.workerLock?.owner === owner ? next.runtime?.workerLock : null;
}

export function releaseWorkerLock(owner: string) {
  const next = updateRadarState((state) => {
    if (state.runtime?.workerLock?.owner !== owner) return;
    state.runtime.workerLock = null;
  });

  return next.runtime?.workerLock ?? null;
}

export function recordWorkerRun(result: { sourceCount: number; resultCount: number; notifiedCount: number; errorCount: number; trigger?: 'manual' | 'scheduled' }) {
  const now = new Date().toISOString();
  const next = updateRadarState((state) => {
    state.runtime = state.runtime ?? {};
    state.runtime.lastWorkerRunAt = now;
    state.runtime.lastWorkerResult = result;
    state.runtime.recentRuns = [
      {
        ranAt: now,
        sourceCount: result.sourceCount,
        resultCount: result.resultCount,
        notifiedCount: result.notifiedCount,
        errorCount: result.errorCount,
        trigger: result.trigger ?? 'manual',
      },
      ...(state.runtime.recentRuns ?? []),
    ].slice(0, 10);
  });

  return next.runtime ?? null;
}

export function clearRadarData() {
  return resetRadarState();
}
