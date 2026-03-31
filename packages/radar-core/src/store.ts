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

export function listSources() {
  return loadRadarState().sources;
}

export function replaceSources(sources: RadarSourceRecord[]) {
  return updateRadarState((state) => {
    state.sources = sources;
  }).sources;
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

export function clearRadarData() {
  return resetRadarState();
}
